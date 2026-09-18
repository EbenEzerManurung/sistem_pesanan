package repositories

import (
	"backend/database"
	"backend/models"
)

type CategoryRepository struct{}

func NewCategoryRepository() *CategoryRepository { return &CategoryRepository{} }

func (r *CategoryRepository) FindByID(id uint) (*models.Category, error) {
	var c models.Category
	if err := database.Gorm.First(&c, id).Error; err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *CategoryRepository) List(search string, offset, limit int) ([]models.Category, int64, error) {
	var cats []models.Category
	var total int64
	q := database.Gorm.Model(&models.Category{})
	if search != "" {
		s := "%" + search + "%"
		q = q.Where("name LIKE ? OR description LIKE ?", s, s)
	}
	q.Count(&total)
	err := q.Order("id DESC").Offset(offset).Limit(limit).Find(&cats).Error
	return cats, total, err
}

func (r *CategoryRepository) All() ([]models.Category, error) {
	var cats []models.Category
	err := database.Gorm.Order("name ASC").Find(&cats).Error
	return cats, err
}

func (r *CategoryRepository) Create(c *models.Category) error { return database.Gorm.Create(c).Error }
func (r *CategoryRepository) Update(c *models.Category) error { return database.Gorm.Save(c).Error }
func (r *CategoryRepository) Delete(id uint) error            { return database.Gorm.Delete(&models.Category{}, id).Error }