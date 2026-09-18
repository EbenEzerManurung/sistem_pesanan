package services

import (
	"errors"

	"backend/config"
	"backend/models"
	"backend/repositories"
	"backend/utils"
)

type AuthService struct {
	users *repositories.UserRepository
	cfg   *config.Config
}

func NewAuthService(u *repositories.UserRepository, c *config.Config) *AuthService {
	return &AuthService{users: u, cfg: c}
}

type LoginResult struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
}

func (s *AuthService) Login(email, password string) (*LoginResult, error) {
	u, err := s.users.FindByEmail(email)
	if err != nil {
		return nil, errors.New("email atau password salah")
	}
	if !u.IsActive {
		return nil, errors.New("akun Anda tidak aktif")
	}
	if !utils.CheckPassword(u.Password, password) {
		return nil, errors.New("email atau password salah")
	}
	token, err := utils.GenerateToken(s.cfg.JWTSecret, u.ID, u.Role.Name, u.Email, s.cfg.JWTExpireHour)
	if err != nil {
		return nil, err
	}
	return &LoginResult{Token: token, User: *u}, nil
}

func (s *AuthService) Me(id uint) (*models.User, error) { return s.users.FindByID(id) }