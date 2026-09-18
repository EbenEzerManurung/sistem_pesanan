package repositories

import (
	"backend/database"
	"backend/models"
)

type UserRepository struct{}

func NewUserRepository() *UserRepository { return &UserRepository{} }

// ═══════════════════════════════════════════════════════════════
// FIND — Get single user
// ═══════════════════════════════════════════════════════════════

func (r *UserRepository) FindByID(id uint) (*models.User, error) {
	var u models.User
	if err := database.Gorm.Preload("Role").First(&u, id).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepository) FindByEmail(email string) (*models.User, error) {
	var u models.User
	if err := database.Gorm.Preload("Role").Where("email = ?", email).First(&u).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

// ═══════════════════════════════════════════════════════════════
// LIST — dengan search + pagination
// ═══════════════════════════════════════════════════════════════

func (r *UserRepository) List(search string, offset, limit int) ([]models.User, int64, error) {
	var users []models.User
	var total int64

	q := database.Gorm.Model(&models.User{}).Preload("Role")

	if search != "" {
		s := "%" + search + "%"
		q = q.Where("name LIKE ? OR email LIKE ? OR phone LIKE ?", s, s, s)
	}

	// Hitung total dulu (sebelum offset/limit)
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := q.Order("id DESC").Offset(offset).Limit(limit).Find(&users).Error
	return users, total, err
}

// ═══════════════════════════════════════════════════════════════
// CREATE
// ═══════════════════════════════════════════════════════════════

func (r *UserRepository) Create(u *models.User) error {
	return database.Gorm.Create(u).Error
}

// ═══════════════════════════════════════════════════════════════
// UPDATE — FIX: gunakan Updates() dengan map, bukan Save()
//
// Masalah sebelumnya:
//   Save() pada struct dengan Role yang di-Preload bisa mengabaikan
//   perubahan role_id karena GORM mencoba menyimpan asosiasi Role.
//
// Solusi:
//   Pakai Model().Where().Updates(map) — hanya update kolom di map,
//   termasuk role_id, tanpa menyentuh tabel roles.
// ═══════════════════════════════════════════════════════════════

func (r *UserRepository) Update(u *models.User) error {
	updates := map[string]any{
		"role_id":   u.RoleID,
		"name":      u.Name,
		"email":     u.Email,
		"phone":     u.Phone,
		"avatar":    u.Avatar,
		"is_active": u.IsActive,
	}

	// Password hanya diupdate kalau berubah (tidak kosong)
	if u.Password != "" {
		updates["password"] = u.Password
	}

	return database.Gorm.
		Model(&models.User{}).
		Where("id = ?", u.ID).
		Updates(updates).Error
}

// ═══════════════════════════════════════════════════════════════
// DELETE — soft delete via GORM (default)
// ═══════════════════════════════════════════════════════════════

func (r *UserRepository) Delete(id uint) error {
	return database.Gorm.Delete(&models.User{}, id).Error
}

// ═══════════════════════════════════════════════════════════════
// COUNT BY ROLE — untuk guard "tidak bisa hapus superadmin terakhir"
// ═══════════════════════════════════════════════════════════════

func (r *UserRepository) CountByRole(role string) (int64, error) {
	var c int64
	err := database.Gorm.Model(&models.User{}).
		Joins("JOIN roles ON roles.id = users.role_id").
		Where("roles.name = ?", role).
		Count(&c).Error
	return c, err
}

// ═══════════════════════════════════════════════════════════════
// ROLES — daftar semua role untuk dropdown
// ═══════════════════════════════════════════════════════════════

func (r *UserRepository) Roles() ([]models.Role, error) {
	var rs []models.Role
	err := database.Gorm.Order("id ASC").Find(&rs).Error
	return rs, err
}