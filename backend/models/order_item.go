package models

type OrderItem struct {
	ID       uint    `gorm:"primaryKey" json:"id"`
	OrderID  uint    `gorm:"not null;index" json:"order_id"`
	MenuID   uint    `gorm:"not null;index" json:"menu_id"`
	Menu     Menu    `gorm:"foreignKey:MenuID" json:"menu,omitempty"`
	MenuName string  `gorm:"size:150" json:"menu_name"`
	Qty      int     `gorm:"not null" json:"qty"`
	Price    float64 `gorm:"type:decimal(12,2);not null" json:"price"`
	Subtotal float64 `gorm:"type:decimal(12,2);not null" json:"subtotal"`
	Notes    string  `gorm:"size:255" json:"notes"`
}

func (OrderItem) TableName() string { return "order_items" }