package models

import "time"

const (
	OrderWaiting    = "waiting"
	OrderProcessing = "processing"
	OrderDone       = "done"
	OrderCancelled  = "cancelled"
)

func ListOrderStatus() []string {
	return []string{OrderWaiting, OrderProcessing, OrderDone, OrderCancelled}
}

type Order struct {
	ID           uint        `gorm:"primaryKey" json:"id"`
	OrderCode    string      `gorm:"uniqueIndex;size:30;not null" json:"order_code"`
	CashierID    uint        `gorm:"index" json:"cashier_id"`
	Cashier      User        `gorm:"foreignKey:CashierID" json:"cashier,omitempty"`
	CustomerName string      `gorm:"size:100;not null" json:"customer_name"`
	TableNumber  string      `gorm:"size:20" json:"table_number"`
	Status       string      `gorm:"size:20;index;default:waiting" json:"status"`
	Subtotal     float64     `gorm:"type:decimal(12,2)" json:"subtotal"`
	Tax          float64     `gorm:"type:decimal(12,2);default:0" json:"tax"`
	Discount     float64     `gorm:"type:decimal(12,2);default:0" json:"discount"`
	Total        float64     `gorm:"type:decimal(12,2);not null" json:"total"`
	Notes        string      `gorm:"type:text" json:"notes"`
	PaidAt       *time.Time  `gorm:"index" json:"paid_at"`
	DoneAt       *time.Time  `json:"done_at"`
	Items        []OrderItem `gorm:"foreignKey:OrderID" json:"items,omitempty"`
	CreatedAt    time.Time   `json:"created_at"`
	UpdatedAt    time.Time   `json:"updated_at"`
}

func (Order) TableName() string { return "orders" }