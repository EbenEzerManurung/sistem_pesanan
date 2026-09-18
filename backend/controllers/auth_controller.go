package controllers

import (
	"net/http"

	"backend/middleware"
	"backend/services"
	"backend/utils"

	"github.com/gin-gonic/gin"
)

type AuthController struct{ svc *services.AuthService }

func NewAuthController(s *services.AuthService) *AuthController { return &AuthController{svc: s} }

type loginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func (h *AuthController) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	res, err := h.svc.Login(req.Email, req.Password)
	if err != nil {
		utils.Fail(c, http.StatusUnauthorized, err.Error())
		return
	}
	utils.OKMsg(c, "Login berhasil", res)
}

func (h *AuthController) Me(c *gin.Context) {
	u, err := h.svc.Me(middleware.CurrentUserID(c))
	if err != nil {
		utils.Fail(c, http.StatusNotFound, "User tidak ditemukan")
		return
	}
	utils.OK(c, u)
}