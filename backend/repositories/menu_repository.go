package repositories

import (
	"backend/database"
	"backend/models"
)

type MenuRepository struct{}

func NewMenuRepository() *MenuRepository { return &MenuRepository{} }

func (r *MenuRepository) FindByID(id uint) (*models.Menu, error) {
	var m models.Menu
	if err := database.Gorm.Preload("Category").First(&m, id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *MenuRepository) List(search string, categoryID uint, offset, limit int) ([]models.Menu, int64, error) {
	var items []models.Menu
	var total int64
	q := database.Gorm.Model(&models.Menu{}).Preload("Category")
	if search != "" {
		s := "%" + search + "%"
		q = q.Where("name LIKE ? OR description LIKE ?", s, s)
	}
	if categoryID > 0 {
		q = q.Where("category_id = ?", categoryID)
	}
	q.Count(&total)
	err := q.Order("id DESC").Offset(offset).Limit(limit).Find(&items).Error
	return items, total, err
}

func (r *MenuRepository) All() ([]models.Menu, error) {
	var items []models.Menu
	err := database.Gorm.Preload("Category").Where("is_available = ?", true).Order("name ASC").Find(&items).Error
	return items, err
}

func (r *MenuRepository) Create(m *models.Menu) error { return database.Gorm.Create(m).Error }
func (r *MenuRepository) Update(m *models.Menu) error { return database.Gorm.Save(m).Error }
func (r *MenuRepository) Delete(id uint) error        { return database.Gorm.Delete(&models.Menu{}, id).Error }