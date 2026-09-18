package controllers

import (
	"net/http"
	"strconv"

	"backend/services"
	"backend/utils"

	"github.com/gin-gonic/gin"
)

type UserController struct{ svc *services.UserService }

func NewUserController(s *services.UserService) *UserController { return &UserController{svc: s} }

func (h *UserController) List(c *gin.Context) {
	p := utils.GetPagination(c)
	items, total, err := h.svc.List(p.Search, p.Offset, p.Limit)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.Paginated(c, items, p.Page, p.Limit, total)
}

func (h *UserController) Create(c *gin.Context) {
	var in services.UserInput
	if err := c.ShouldBindJSON(&in); err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	u, err := h.svc.Create(in)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.Created(c, "User berhasil dibuat", u)
}

func (h *UserController) Update(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var in services.UserInput
	if err := c.ShouldBindJSON(&in); err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	u, err := h.svc.Update(uint(id), in)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.OKMsg(c, "User berhasil diperbarui", u)
}

func (h *UserController) Delete(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := h.svc.Delete(uint(id)); err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.OKMsg(c, "User berhasil dihapus", nil)
}

func (h *UserController) Roles(c *gin.Context) {
	rs, err := h.svc.Roles()
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.OK(c, rs)
}