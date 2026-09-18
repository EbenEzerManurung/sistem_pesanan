package services

import (
	"errors"

	"backend/models"
	"backend/repositories"
)

type MenuService struct {
	menus      *repositories.MenuRepository
	categories *repositories.CategoryRepository
}

func NewMenuService(m *repositories.MenuRepository, c *repositories.CategoryRepository) *MenuService {
	return &MenuService{menus: m, categories: c}
}

type MenuInput struct {
	CategoryID  uint    `json:"category_id" binding:"required"`
	Name        string  `json:"name" binding:"required"`
	Description string  `json:"description"`
	Price       float64 `json:"price" binding:"required,gt=0"`
	Image       string  `json:"image"`
	IsAvailable *bool   `json:"is_available"`
}

func (s *MenuService) List(search string, categoryID uint, offset, limit int) ([]models.Menu, int64, error) {
	return s.menus.List(search, categoryID, offset, limit)
}

func (s *MenuService) Get(id uint) (*models.Menu, error) { return s.menus.FindByID(id) }

func (s *MenuService) Create(in MenuInput) (*models.Menu, error) {
	available := true
	if in.IsAvailable != nil {
		available = *in.IsAvailable
	}
	m := &models.Menu{
		CategoryID: in.CategoryID, Name: in.Name, Description: in.Description,
		Price: in.Price, Image: in.Image, IsAvailable: available,
	}
	if err := s.menus.Create(m); err != nil {
		return nil, err
	}
	return s.menus.FindByID(m.ID)
}

func (s *MenuService) Update(id uint, in MenuInput) (*models.Menu, error) {
	m, err := s.menus.FindByID(id)
	if err != nil {
		return nil, errors.New("menu tidak ditemukan")
	}
	m.CategoryID = in.CategoryID
	m.Name = in.Name
	m.Description = in.Description
	m.Price = in.Price
	if in.Image != "" {
		m.Image = in.Image
	}
	if in.IsAvailable != nil {
		m.IsAvailable = *in.IsAvailable
	}
	if err := s.menus.Update(m); err != nil {
		return nil, err
	}
	return s.menus.FindByID(id)
}

func (s *MenuService) MenusForExport(search string, categoryID uint) ([]models.Menu, error) {
	items, _, err := s.menus.List(search, categoryID, 0, 10000)
	return items, err
}

func (s *MenuService) Delete(id uint) error { return s.menus.Delete(id) }

func (s *MenuService) Categories() ([]models.Category, error) { return s.categories.All() }

type CategoryInput struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
}

func (s *MenuService) CreateCategory(in CategoryInput) (*models.Category, error) {
	c := &models.Category{Name: in.Name, Description: in.Description}
	if err := s.categories.Create(c); err != nil {
		return nil, err
	}
	return c, nil
}

func (s *MenuService) UpdateCategory(id uint, in CategoryInput) (*models.Category, error) {
	c, err := s.categories.FindByID(id)
	if err != nil {
		return nil, errors.New("kategori tidak ditemukan")
	}
	c.Name = in.Name
	c.Description = in.Description
	if err := s.categories.Update(c); err != nil {
		return nil, err
	}
	return c, nil
}

func (s *MenuService) DeleteCategory(id uint) error { return s.categories.Delete(id) }