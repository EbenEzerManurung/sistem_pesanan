package controllers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"backend/middleware"
	"backend/repositories"
	"backend/services"
	"backend/utils"

	"github.com/gin-gonic/gin"
)

// ═══════════════════════════════════════════════════════════════
// CONTROLLER
// ═══════════════════════════════════════════════════════════════

type OrderController struct {
	svc *services.OrderService
	hub *services.Hub
}

func NewOrderController(s *services.OrderService, h *services.Hub) *OrderController {
	return &OrderController{svc: s, hub: h}
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

func safeParseID(c *gin.Context, name string) (uint, bool) {
	raw := c.Param(name)
	id, err := strconv.Atoi(raw)
	if err != nil || id <= 0 {
		utils.Fail(c, http.StatusBadRequest, "ID tidak valid")
		return 0, false
	}
	return uint(id), true
}

func buildOrderFilter(c *gin.Context) repositories.OrderFilter {
	p := utils.GetPagination(c)

	f := repositories.OrderFilter{
		Search: p.Search,
		Status: c.Query("status"),
		Offset: p.Offset,
		Limit:  p.Limit,
	}

	if from := c.Query("from"); from != "" {
		if t, err := time.Parse("2006-01-02", from); err == nil {
			f.From = &t
		}
	}
	if to := c.Query("to"); to != "" {
		if t, err := time.Parse("2006-01-02", to); err == nil {
			end := t.Add(23*time.Hour + 59*time.Minute + 59*time.Second)
			f.To = &end
		}
	}

	return f
}

// ═══════════════════════════════════════════════════════════════
// CREATE — POST /api/orders
// ═══════════════════════════════════════════════════════════════

func (h *OrderController) Create(c *gin.Context) {
	var in services.CreateOrderInput
	if err := c.ShouldBindJSON(&in); err != nil {
		utils.Fail(c, http.StatusBadRequest, "Data tidak valid: "+err.Error())
		return
	}

	userID := middleware.CurrentUserID(c)
	if userID == 0 {
		utils.Fail(c, http.StatusUnauthorized, "User tidak terautentikasi")
		return
	}

	o, err := h.svc.Create(userID, in)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Created(c, "Order berhasil dibuat", o)
}

// ═══════════════════════════════════════════════════════════════
// LIST — GET /api/orders
// ═══════════════════════════════════════════════════════════════

func (h *OrderController) List(c *gin.Context) {
	f := buildOrderFilter(c)
	p := utils.GetPagination(c)

	items, total, err := h.svc.List(f)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal memuat data: "+err.Error())
		return
	}

	utils.Paginated(c, items, p.Page, p.Limit, total)
}

// ═══════════════════════════════════════════════════════════════
// GET — GET /api/orders/:id
// ═══════════════════════════════════════════════════════════════

func (h *OrderController) Get(c *gin.Context) {
	id, ok := safeParseID(c, "id")
	if !ok {
		return
	}

	o, err := h.svc.Get(id)
	if err != nil {
		utils.Fail(c, http.StatusNotFound, "Order tidak ditemukan")
		return
	}

	utils.OK(c, o)
}

// ═══════════════════════════════════════════════════════════════
// PAY — POST /api/orders/:id/pay
// ═══════════════════════════════════════════════════════════════

func (h *OrderController) Pay(c *gin.Context) {
	id, ok := safeParseID(c, "id")
	if !ok {
		return
	}

	o, err := h.svc.MarkPaid(id)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.OKMsg(c, "Pembayaran berhasil dikonfirmasi", o)
}

// ═══════════════════════════════════════════════════════════════
// UPDATE STATUS — PATCH /api/orders/:id/status
// ═══════════════════════════════════════════════════════════════

type statusRequest struct {
	Status string `json:"status" binding:"required"`
}

func (h *OrderController) UpdateStatus(c *gin.Context) {
	id, ok := safeParseID(c, "id")
	if !ok {
		return
	}

	var req statusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Fail(c, http.StatusBadRequest, "Data tidak valid: "+err.Error())
		return
	}

	o, err := h.svc.UpdateStatus(id, req.Status)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.OKMsg(c, "Status order berhasil diperbarui", o)
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD QUEUES — PUBLIC
// ═══════════════════════════════════════════════════════════════

// WaitingQueue — GET /api/dashboard/waiting
func (h *OrderController) WaitingQueue(c *gin.Context) {
	items, err := h.svc.WaitingQueue()
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.OK(c, items)
}

// ProcessingQueue — GET /api/dashboard/processing
func (h *OrderController) ProcessingQueue(c *gin.Context) {
	items, err := h.svc.ProcessingQueue()
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.OK(c, items)
}

// DoneQueue — GET /api/dashboard/done
func (h *OrderController) DoneQueue(c *gin.Context) {
	items, err := h.svc.DoneQueue()
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.OK(c, items)
}

// Queue — GET /api/dashboard/queue  (backward-compat: waiting + processing)
func (h *OrderController) Queue(c *gin.Context) {
	items, err := h.svc.Queue()
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.OK(c, items)
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD STATS — GET /api/dashboard/stats
// ═══════════════════════════════════════════════════════════════

func (h *OrderController) DashboardStats(c *gin.Context) {
	stats, err := h.svc.DashboardStats()
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.OK(c, stats)
}

// ═══════════════════════════════════════════════════════════════
// STREAM — GET /api/stream/orders (SSE, PUBLIC)
//
// Client akan menerima event:
//   1. waiting.init       → snapshot awal 5 waiting
//   2. processing.init    → snapshot awal 5 processing
//   3. done.init          → snapshot awal 5 done
//   4. waiting.update     → saat waiting queue berubah
//   5. processing.update  → saat processing queue berubah
//   6. done.update        → saat done queue berubah
//   7. order.created      → saat order baru dibuat
//   8. order.paid         → saat pembayaran dikonfirmasi
//   9. order.updated      → saat status order diubah
// ═══════════════════════════════════════════════════════════════

func (h *OrderController) Stream(c *gin.Context) {
	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Header().Set("X-Accel-Buffering", "no")
	c.Writer.WriteHeader(http.StatusOK)

	ch := h.hub.Subscribe()
	defer h.hub.Unsubscribe(ch)

	clientIP := c.ClientIP()
	log.Printf("📡 SSE connect: %s | total: %d", clientIP, h.hub.ClientCount())

	// ── Snapshot 1: waiting ──
	if q, err := h.svc.WaitingQueue(); err == nil {
		b, _ := json.Marshal(services.Event{Type: "waiting.init", Data: q})
		fmt.Fprintf(c.Writer, "data: %s\n\n", b)
		c.Writer.Flush()
	}

	// ── Snapshot 2: processing ──
	if q, err := h.svc.ProcessingQueue(); err == nil {
		b, _ := json.Marshal(services.Event{Type: "processing.init", Data: q})
		fmt.Fprintf(c.Writer, "data: %s\n\n", b)
		c.Writer.Flush()
	}

	// ── Snapshot 3: done ──
	if q, err := h.svc.DoneQueue(); err == nil {
		b, _ := json.Marshal(services.Event{Type: "done.init", Data: q})
		fmt.Fprintf(c.Writer, "data: %s\n\n", b)
		c.Writer.Flush()
	}

	// ── Heartbeat tiap 20 detik ──
	ticker := time.NewTicker(20 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-c.Request.Context().Done():
			log.Printf("📡 SSE disconnect: %s", clientIP)
			return

		case msg, ok := <-ch:
			if !ok {
				return
			}
			fmt.Fprintf(c.Writer, "data: %s\n\n", msg)
			c.Writer.Flush()

		case <-ticker.C:
			fmt.Fprint(c.Writer, ": ping\n\n")
			c.Writer.Flush()
		}
	}
}

// ═══════════════════════════════════════════════════════════════
// EXPORT PDF — GET /api/orders/:id/pdf
// ═══════════════════════════════════════════════════════════════

func (h *OrderController) ExportPDF(c *gin.Context) {
	id, ok := safeParseID(c, "id")
	if !ok {
		return
	}

	o, err := h.svc.Get(id)
	if err != nil {
		utils.Fail(c, http.StatusNotFound, "Order tidak ditemukan")
		return
	}

	buf, err := utils.OrderReceiptPDF(o)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal generate PDF: "+err.Error())
		return
	}

	disposition := "inline"
	if c.Query("download") == "1" || c.Query("download") == "true" {
		disposition = "attachment"
	}

	c.Header("Content-Disposition",
		fmt.Sprintf(`%s; filename="%s.pdf"`, disposition, o.OrderCode))
	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Length", strconv.Itoa(len(buf)))
	c.Data(http.StatusOK, "application/pdf", buf)
}