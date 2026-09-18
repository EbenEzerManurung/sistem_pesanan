package services

import (
	"errors"
	"fmt"
	"math/rand"
	"time"

	"backend/models"
	"backend/repositories"
)

// ═══════════════════════════════════════════════════════════════
// SERVICE STRUCT
// ═══════════════════════════════════════════════════════════════

type OrderService struct {
	orders *repositories.OrderRepository
	menus  *repositories.MenuRepository
	hub    *Hub
}

func NewOrderService(
	o *repositories.OrderRepository,
	m *repositories.MenuRepository,
	h *Hub,
) *OrderService {
	return &OrderService{orders: o, menus: m, hub: h}
}

// ═══════════════════════════════════════════════════════════════
// INPUT DTO
// ═══════════════════════════════════════════════════════════════

type OrderItemInput struct {
	MenuID uint   `json:"menu_id" binding:"required"`
	Qty    int    `json:"qty" binding:"required,min=1"`
	Notes  string `json:"notes"`
}

type CreateOrderInput struct {
	CustomerName string           `json:"customer_name" binding:"required"`
	TableNumber  string           `json:"table_number"`
	Notes        string           `json:"notes"`
	Items        []OrderItemInput `json:"items" binding:"required,min=1,dive"`
	Discount     float64          `json:"discount"`
	Paid         bool             `json:"paid"`
}

// ═══════════════════════════════════════════════════════════════
// CREATE
// ═══════════════════════════════════════════════════════════════

func (s *OrderService) Create(cashierID uint, in CreateOrderInput) (*models.Order, error) {
	order := &models.Order{
		OrderCode:    generateOrderCode(),
		CashierID:    cashierID,
		CustomerName: in.CustomerName,
		TableNumber:  in.TableNumber,
		Notes:        in.Notes,
		Status:       models.OrderWaiting,
		Discount:     in.Discount,
	}

	var subtotal float64
	for _, it := range in.Items {
		menu, err := s.menus.FindByID(it.MenuID)
		if err != nil {
			return nil, fmt.Errorf("menu id %d tidak ditemukan", it.MenuID)
		}
		if !menu.IsAvailable {
			return nil, fmt.Errorf("menu %s sedang tidak tersedia", menu.Name)
		}

		line := menu.Price * float64(it.Qty)
		subtotal += line

		order.Items = append(order.Items, models.OrderItem{
			MenuID:   it.MenuID,
			MenuName: menu.Name,
			Qty:      it.Qty,
			Price:    menu.Price,
			Subtotal: line,
			Notes:    it.Notes,
		})
	}

	order.Subtotal = subtotal

	total := subtotal - in.Discount
	if total < 0 {
		total = 0
	}
	order.Total = total

	if in.Paid {
		now := time.Now()
		order.PaidAt = &now
	}

	if err := s.orders.Create(order); err != nil {
		return nil, fmt.Errorf("gagal menyimpan order: %w", err)
	}

	created, _ := s.orders.FindByID(order.ID)
	if created != nil {
		s.hub.Broadcast("order.created", created)
		if in.Paid {
			s.broadcastAll()
		}
	}

	return created, nil
}

// ═══════════════════════════════════════════════════════════════
// MARK PAID
// ═══════════════════════════════════════════════════════════════

func (s *OrderService) MarkPaid(id uint) (*models.Order, error) {
	o, err := s.orders.FindByID(id)
	if err != nil {
		return nil, errors.New("order tidak ditemukan")
	}

	if o.Status == models.OrderCancelled {
		return nil, errors.New("order sudah dibatalkan, tidak bisa dibayar")
	}

	if o.PaidAt != nil {
		return o, nil
	}

	now := time.Now()
	o.PaidAt = &now
	if err := s.orders.Update(o); err != nil {
		return nil, fmt.Errorf("gagal update pembayaran: %w", err)
	}

	updated, _ := s.orders.FindByID(id)
	s.hub.Broadcast("order.paid", updated)
	s.broadcastAll()

	return updated, nil
}

// ═══════════════════════════════════════════════════════════════
// UPDATE STATUS
// ═══════════════════════════════════════════════════════════════

func (s *OrderService) UpdateStatus(id uint, status string) (*models.Order, error) {
	if err := validateStatus(status); err != nil {
		return nil, err
	}

	current, err := s.orders.FindByID(id)
	if err != nil {
		return nil, errors.New("order tidak ditemukan")
	}

	if err := validateStatusTransition(current.Status, status); err != nil {
		return nil, err
	}

	if err := s.orders.UpdateStatus(id, status); err != nil {
		return nil, fmt.Errorf("gagal update status: %w", err)
	}

	updated, _ := s.orders.FindByID(id)

	s.hub.Broadcast("order.updated", updated)
	s.broadcastAll()

	return updated, nil
}

// ═══════════════════════════════════════════════════════════════
// GET & LIST
// ═══════════════════════════════════════════════════════════════

func (s *OrderService) Get(id uint) (*models.Order, error) {
	return s.orders.FindByID(id)
}

func (s *OrderService) List(f repositories.OrderFilter) ([]models.Order, int64, error) {
	return s.orders.List(f)
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD QUEUE — 3 STATUS TERPISAH
// ═══════════════════════════════════════════════════════════════

// WaitingQueue — 5 order waiting HARI INI, paid_at ASC
func (s *OrderService) WaitingQueue() ([]models.Order, error) {
	return s.orders.TopWaitingOrders(5)
}

// ProcessingQueue — 5 order processing HARI INI, paid_at ASC
func (s *OrderService) ProcessingQueue() ([]models.Order, error) {
	return s.orders.TopProcessingOrders(5)
}

// DoneQueue — 5 order done HARI INI, done_at ASC
func (s *OrderService) DoneQueue() ([]models.Order, error) {
	return s.orders.TopDoneOrders(5)
}

// Queue — 5 order aktif gabungan (waiting + processing), paid_at ASC
// Dipakai sebagai fallback / backward-compat
func (s *OrderService) Queue() ([]models.Order, error) {
	return s.orders.TopPaidQueue(5)
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD STATS
// ═══════════════════════════════════════════════════════════════

func (s *OrderService) DashboardStats() (map[string]any, error) {
	counts, err := s.orders.CountByStatus()
	if err != nil {
		return nil, err
	}

	daily, _ := s.orders.DailySales(7)

	return map[string]any{
		"waiting":    counts[models.OrderWaiting],
		"processing": counts[models.OrderProcessing],
		"done":       counts[models.OrderDone],
		"cancelled":  counts[models.OrderCancelled],
		"daily":      daily,
	}, nil
}

// ═══════════════════════════════════════════════════════════════
// BROADCAST HELPERS
// ═══════════════════════════════════════════════════════════════

func (s *OrderService) broadcastWaitingQueue() {
	if q, err := s.orders.TopWaitingOrders(5); err == nil {
		s.hub.Broadcast("waiting.update", q)
	}
}

func (s *OrderService) broadcastProcessingQueue() {
	if q, err := s.orders.TopProcessingOrders(5); err == nil {
		s.hub.Broadcast("processing.update", q)
	}
}

func (s *OrderService) broadcastDoneQueue() {
	if q, err := s.orders.TopDoneOrders(5); err == nil {
		s.hub.Broadcast("done.update", q)
	}
}

// broadcastAll — broadcast semua queue sekaligus (waiting, processing, done)
func (s *OrderService) broadcastAll() {
	s.broadcastWaitingQueue()
	s.broadcastProcessingQueue()
	s.broadcastDoneQueue()
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

// generateOrderCode — ORD-YYYYMMDD-HHMMSS-RRRR
func generateOrderCode() string {
	now := time.Now()
	randSuffix := rand.Intn(9000) + 1000
	return fmt.Sprintf("ORD-%s-%04d", now.Format("20060102-150405"), randSuffix)
}

// validateStatus — cek status valid
func validateStatus(s string) error {
	for _, v := range models.ListOrderStatus() {
		if v == s {
			return nil
		}
	}
	return fmt.Errorf("status tidak valid: %s", s)
}

// validateStatusTransition — FLEKSIBEL (admin bebas ubah status)
func validateStatusTransition(from, to string) error {
	if from == to {
		return nil
	}
	return nil // semua transisi diizinkan
}