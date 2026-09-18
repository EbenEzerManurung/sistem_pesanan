package repositories

import (
	"time"

	"backend/database"
	"backend/models"
)

type OrderRepository struct{}

func NewOrderRepository() *OrderRepository { return &OrderRepository{} }

type OrderFilter struct {
	Search string
	Status string
	From   *time.Time
	To     *time.Time
	Offset int
	Limit  int
}

// ═══════════════════════════════════════════════════════════════
// CRUD DASAR
// ═══════════════════════════════════════════════════════════════

func (r *OrderRepository) Create(o *models.Order) error {
	return database.Gorm.Create(o).Error
}

func (r *OrderRepository) FindByID(id uint) (*models.Order, error) {
	var o models.Order
	if err := database.Gorm.Preload("Items.Menu").Preload("Cashier.Role").
		First(&o, id).Error; err != nil {
		return nil, err
	}
	return &o, nil
}

func (r *OrderRepository) FindByCode(code string) (*models.Order, error) {
	var o models.Order
	if err := database.Gorm.Preload("Items.Menu").Preload("Cashier").
		Where("order_code = ?", code).First(&o).Error; err != nil {
		return nil, err
	}
	return &o, nil
}

func (r *OrderRepository) Update(o *models.Order) error {
	return database.Gorm.Save(o).Error
}

func (r *OrderRepository) UpdateStatus(id uint, status string) error {
	updates := map[string]any{"status": status}
	if status == models.OrderDone {
		now := time.Now()
		updates["done_at"] = &now
	}
	return database.Gorm.Model(&models.Order{}).
		Where("id = ?", id).
		Updates(updates).Error
}

// ═══════════════════════════════════════════════════════════════
// LIST dengan filter (search, status, from, to, pagination)
// ═══════════════════════════════════════════════════════════════

func (r *OrderRepository) List(f OrderFilter) ([]models.Order, int64, error) {
	var orders []models.Order
	var total int64

	q := database.Gorm.Model(&models.Order{}).
		Preload("Items.Menu").
		Preload("Cashier")

	if f.Search != "" {
		s := "%" + f.Search + "%"
		q = q.Where("order_code LIKE ? OR customer_name LIKE ? OR table_number LIKE ?", s, s, s)
	}
	if f.Status != "" {
		q = q.Where("status = ?", f.Status)
	}
	if f.From != nil {
		q = q.Where("created_at >= ?", *f.From)
	}
	if f.To != nil {
		q = q.Where("created_at <= ?", *f.To)
	}

	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := q.Order("id DESC").Offset(f.Offset).Limit(f.Limit).Find(&orders).Error
	return orders, total, err
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD — 3 QUEUE (WAITING / PROCESSING / DONE)
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────
// TopWaitingOrders — 5 order waiting HARI INI, paid_at ASC
// Hanya order yang sudah dibayar (paid_at IS NOT NULL)
// ─────────────────────────────────────────────────────────────
func (r *OrderRepository) TopWaitingOrders(limit int) ([]models.Order, error) {
	var orders []models.Order
	err := database.Gorm.Preload("Items.Menu").Preload("Cashier").
		Where("status = ?", models.OrderWaiting).
		Where("paid_at IS NOT NULL").
		Where("DATE(created_at) = CURDATE()").
		Order("paid_at ASC").
		Limit(limit).
		Find(&orders).Error
	return orders, err
}

// ─────────────────────────────────────────────────────────────
// TopProcessingOrders — 5 order processing HARI INI, paid_at ASC
// ─────────────────────────────────────────────────────────────
func (r *OrderRepository) TopProcessingOrders(limit int) ([]models.Order, error) {
	var orders []models.Order
	err := database.Gorm.Preload("Items.Menu").Preload("Cashier").
		Where("status = ?", models.OrderProcessing).
		Where("paid_at IS NOT NULL").
		Where("DATE(created_at) = CURDATE()").
		Order("paid_at ASC").
		Limit(limit).
		Find(&orders).Error
	return orders, err
}

// ─────────────────────────────────────────────────────────────
// TopDoneOrders — 5 order done HARI INI, done_at ASC
// ─────────────────────────────────────────────────────────────
func (r *OrderRepository) TopDoneOrders(limit int) ([]models.Order, error) {
	var orders []models.Order
	err := database.Gorm.Preload("Items.Menu").Preload("Cashier").
		Where("status = ?", models.OrderDone).
		Where("DATE(created_at) = CURDATE()").
		Order("done_at ASC").
		Limit(limit).
		Find(&orders).Error
	return orders, err
}

// ─────────────────────────────────────────────────────────────
// TopPaidQueue — 5 order aktif (waiting + processing) HARI INI
// Dipakai kalau butuh queue gabungan (fallback)
// ─────────────────────────────────────────────────────────────
func (r *OrderRepository) TopPaidQueue(limit int) ([]models.Order, error) {
	var orders []models.Order
	err := database.Gorm.Preload("Items.Menu").Preload("Cashier").
		Where("paid_at IS NOT NULL").
		Where("status NOT IN ?", []string{models.OrderDone, models.OrderCancelled}).
		Where("DATE(created_at) = CURDATE()").
		Order("paid_at ASC").
		Limit(limit).
		Find(&orders).Error
	return orders, err
}

// ═══════════════════════════════════════════════════════════════
// STATISTIK
// ═══════════════════════════════════════════════════════════════

// CountByStatus — hitung order HARI INI saja
func (r *OrderRepository) CountByStatus() (map[string]int64, error) {
	type row struct {
		Status string
		Total  int64
	}
	var rows []row
	err := database.Gorm.Model(&models.Order{}).
		Select("status, COUNT(*) as total").
		Where("DATE(created_at) = CURDATE()").
		Group("status").
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	out := map[string]int64{}
	for _, x := range rows {
		out[x.Status] = x.Total
	}
	return out, nil
}

// DailySales — penjualan harian N hari terakhir
func (r *OrderRepository) DailySales(days int) ([]map[string]any, error) {
	type row struct {
		Date  string
		Total float64
		Count int64
	}
	var rows []row
	err := database.Gorm.Model(&models.Order{}).
		Select("DATE(created_at) as date, COALESCE(SUM(total),0) as total, COUNT(*) as count").
		Where("created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)", days).
		Group("DATE(created_at)").
		Order("date ASC").
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	out := make([]map[string]any, 0, len(rows))
	for _, x := range rows {
		out = append(out, map[string]any{
			"date":  x.Date,
			"total": x.Total,
			"count": x.Count,
		})
	}
	return out, nil
}

// ═══════════════════════════════════════════════════════════════
// REPORT SUMMARY — untuk halaman Reports
// ═══════════════════════════════════════════════════════════════

func (r *OrderRepository) ReportSummary(f OrderFilter) (map[string]any, error) {
	// ── 1. Total order, revenue, avg ──
	type agg struct {
		TotalOrder   int64   `gorm:"column:total_order"`
		TotalRevenue float64 `gorm:"column:total_revenue"`
		AvgOrder     float64 `gorm:"column:avg_order"`
	}

	var a agg
	q1 := database.Gorm.Model(&models.Order{}).
		Select("COUNT(*) as total_order, COALESCE(SUM(total),0) as total_revenue, COALESCE(AVG(total),0) as avg_order")

	if f.Search != "" {
		s := "%" + f.Search + "%"
		q1 = q1.Where("order_code LIKE ? OR customer_name LIKE ? OR table_number LIKE ?", s, s, s)
	}
	if f.Status != "" {
		q1 = q1.Where("status = ?", f.Status)
	}
	if f.From != nil {
		q1 = q1.Where("created_at >= ?", *f.From)
	}
	if f.To != nil {
		q1 = q1.Where("created_at <= ?", *f.To)
	}
	if err := q1.Scan(&a).Error; err != nil {
		return nil, err
	}

	// ── 2. Total item ──
	var totalItems int64
	q2 := database.Gorm.Model(&models.OrderItem{}).
		Joins("JOIN orders ON orders.id = order_items.order_id")

	if f.From != nil {
		q2 = q2.Where("orders.created_at >= ?", *f.From)
	}
	if f.To != nil {
		q2 = q2.Where("orders.created_at <= ?", *f.To)
	}
	if f.Status != "" {
		q2 = q2.Where("orders.status = ?", f.Status)
	}
	if f.Search != "" {
		s := "%" + f.Search + "%"
		q2 = q2.Where(
			"orders.order_code LIKE ? OR orders.customer_name LIKE ? OR orders.table_number LIKE ?",
			s, s, s,
		)
	}
	if err := q2.Select("COALESCE(SUM(qty),0)").Scan(&totalItems).Error; err != nil {
		return nil, err
	}

	// ── 3. Breakdown per status ──
	type statusRow struct {
		Status string  `gorm:"column:status" json:"status"`
		Total  int64   `gorm:"column:total" json:"total"`
		Sum    float64 `gorm:"column:sum" json:"sum"`
	}
	var statusRows []statusRow
	q3 := database.Gorm.Model(&models.Order{}).
		Select("status, COUNT(*) as total, COALESCE(SUM(total),0) as sum")

	if f.From != nil {
		q3 = q3.Where("created_at >= ?", *f.From)
	}
	if f.To != nil {
		q3 = q3.Where("created_at <= ?", *f.To)
	}
	if f.Search != "" {
		s := "%" + f.Search + "%"
		q3 = q3.Where("order_code LIKE ? OR customer_name LIKE ? OR table_number LIKE ?", s, s, s)
	}
	if err := q3.Group("status").Scan(&statusRows).Error; err != nil {
		return nil, err
	}

	// ── 4. Daily sales ──
	type dailyRow struct {
		Date  string  `gorm:"column:date" json:"date"`
		Total float64 `gorm:"column:total" json:"total"`
		Count int64   `gorm:"column:count" json:"count"`
	}
	var dailyRows []dailyRow
	q4 := database.Gorm.Model(&models.Order{}).
		Select("DATE(created_at) as date, COALESCE(SUM(total),0) as total, COUNT(*) as count")

	if f.From != nil {
		q4 = q4.Where("created_at >= ?", *f.From)
	} else {
		q4 = q4.Where("created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)")
	}
	if f.To != nil {
		q4 = q4.Where("created_at <= ?", *f.To)
	}
	if f.Status != "" {
		q4 = q4.Where("status = ?", f.Status)
	}
	if f.Search != "" {
		s := "%" + f.Search + "%"
		q4 = q4.Where("order_code LIKE ? OR customer_name LIKE ? OR table_number LIKE ?", s, s, s)
	}
	if err := q4.Group("DATE(created_at)").Order("date ASC").Scan(&dailyRows).Error; err != nil {
		return nil, err
	}

	return map[string]any{
		"total_order":   a.TotalOrder,
		"total_revenue": a.TotalRevenue,
		"avg_order":     a.AvgOrder,
		"total_items":   totalItems,
		"by_status":     statusRows,
		"daily":         dailyRows,
	}, nil
}