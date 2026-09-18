package services

import (
	"errors"

	"backend/models"
	"backend/repositories"
	"backend/utils"
)

type UserService struct{ users *repositories.UserRepository }

func NewUserService(u *repositories.UserRepository) *UserService { return &UserService{users: u} }

type UserInput struct {
	RoleID   uint   `json:"role_id" binding:"required"`
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password"`
	Phone    string `json:"phone"`
	IsActive *bool  `json:"is_active"`
}

func (s *UserService) List(search string, offset, limit int) ([]models.User, int64, error) {
	return s.users.List(search, offset, limit)
}

func (s *UserService) Get(id uint) (*models.User, error) { return s.users.FindByID(id) }

func (s *UserService) Create(in UserInput) (*models.User, error) {
	if in.Password == "" {
		return nil, errors.New("password wajib diisi")
	}
	if len(in.Password) < 6 {
		return nil, errors.New("password minimal 6 karakter")
	}
	if _, err := s.users.FindByEmail(in.Email); err == nil {
		return nil, errors.New("email sudah terdaftar")
	}
	hash, err := utils.HashPassword(in.Password)
	if err != nil {
		return nil, err
	}
	active := true
	if in.IsActive != nil {
		active = *in.IsActive
	}
	u := &models.User{
		RoleID: in.RoleID, Name: in.Name, Email: in.Email,
		Password: hash, Phone: in.Phone, IsActive: active,
	}
	if err := s.users.Create(u); err != nil {
		return nil, err
	}
	return s.users.FindByID(u.ID)
}

func (s *UserService) Update(id uint, in UserInput) (*models.User, error) {
	u, err := s.users.FindByID(id)
	if err != nil {
		return nil, errors.New("user tidak ditemukan")
	}
	u.RoleID = in.RoleID
	u.Name = in.Name
	u.Email = in.Email
	u.Phone = in.Phone
	if in.IsActive != nil {
		u.IsActive = *in.IsActive
	}
	if in.Password != "" {
		if len(in.Password) < 6 {
			return nil, errors.New("password minimal 6 karakter")
		}
		hash, _ := utils.HashPassword(in.Password)
		u.Password = hash
	}
	if err := s.users.Update(u); err != nil {
		return nil, err
	}
	return s.users.FindByID(id)
}

func (s *UserService) Delete(id uint) error {
	u, err := s.users.FindByID(id)
	if err != nil {
		return errors.New("user tidak ditemukan")
	}
	if u.Role.Name == models.RoleSuperAdmin {
		c, _ := s.users.CountByRole(models.RoleSuperAdmin)
		if c <= 1 {
			return errors.New("tidak dapat menghapus superadmin terakhir")
		}
	}
	return s.users.Delete(id)
}

func (s *UserService) Roles() ([]models.Role, error) { return s.users.Roles() }