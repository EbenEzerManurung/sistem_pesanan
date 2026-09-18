package controllers

import (
	"log"
	"net/http"
	"time"

	"backend/repositories"
	"backend/services"
	"backend/utils"

	"github.com/gin-gonic/gin"
)

type ReportController struct {
	svc *services.ReportService
}

func NewReportController(s *services.ReportService) *ReportController {
	return &ReportController{svc: s}
}

// buildFilter — parse query params menjadi OrderFilter
func (h *ReportController) buildFilter(c *gin.Context) repositories.OrderFilter {
	f := repositories.OrderFilter{
		Search: c.Query("search"),
		Status: c.Query("status"),
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
// GET /api/reports/orders/summary
// Akses: admin, superadmin
// ═══════════════════════════════════════════════════════════════
func (h *ReportController) Summary(c *gin.Context) {
	log.Printf("📊 [REPORT] Summary dipanggil | from=%q to=%q status=%q search=%q",
		c.Query("from"), c.Query("to"), c.Query("status"), c.Query("search"))

	data, err := h.svc.Summary(h.buildFilter(c))
	if err != nil {
		log.Printf("❌ [REPORT] Summary error: %v", err)
		utils.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}

	log.Printf("✅ [REPORT] Summary OK | total_order=%v total_revenue=%v",
		data["total_order"], data["total_revenue"])

	utils.OK(c, data)
}

// ═══════════════════════════════════════════════════════════════
// GET /api/reports/orders/excel
// ═══════════════════════════════════════════════════════════════
func (h *ReportController) OrdersExcel(c *gin.Context) {
	orders, err := h.svc.OrdersForExport(h.buildFilter(c))
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}

	buf, err := utils.OrdersExcel(orders)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.Header("Content-Disposition", "attachment; filename=laporan-order.xlsx")
	c.Data(http.StatusOK,
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf)
}

// ═══════════════════════════════════════════════════════════════
// GET /api/reports/orders/pdf
// ═══════════════════════════════════════════════════════════════
func (h *ReportController) OrdersPDF(c *gin.Context) {
	orders, err := h.svc.OrdersForExport(h.buildFilter(c))
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}

	buf, err := utils.OrdersReportPDF(orders, c.Query("from"), c.Query("to"))
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.Header("Content-Disposition", "attachment; filename=laporan-order.pdf")
	c.Data(http.StatusOK, "application/pdf", buf)
}