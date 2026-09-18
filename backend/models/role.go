package models

import "time"

type Role struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"uniqueIndex;size:50;not null" json:"name"`
	Description string    `gorm:"size:255" json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (Role) TableName() string { return "roles" }

const (
	RoleSuperAdmin = "superadmin"
	RoleAdmin      = "admin"
	RoleCashier    = "cashier"
	RoleUser       = "user"
)

func ListRoleNames() []string {
	return []string{RoleSuperAdmin, RoleAdmin, RoleCashier, RoleUser}
}