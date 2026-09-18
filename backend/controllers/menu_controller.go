package controllers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"backend/services"
	"backend/utils"

	"github.com/gin-gonic/gin"
)

type MenuController struct{ svc *services.MenuService }

func NewMenuController(s *services.MenuService) *MenuController { return &MenuController{svc: s} }

func (h *MenuController) List(c *gin.Context) {
	p := utils.GetPagination(c)
	categoryID, _ := strconv.Atoi(c.Query("category_id"))
	items, total, err := h.svc.List(p.Search, uint(categoryID), p.Offset, p.Limit)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.Paginated(c, items, p.Page, p.Limit, total)
}

func (h *MenuController) Get(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	m, err := h.svc.Get(uint(id))
	if err != nil {
		utils.Fail(c, http.StatusNotFound, "Menu tidak ditemukan")
		return
	}
	utils.OK(c, m)
}

func (h *MenuController) Create(c *gin.Context) {
	var in services.MenuInput
	if err := c.ShouldBindJSON(&in); err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	m, err := h.svc.Create(in)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.Created(c, "Menu berhasil dibuat", m)
}

func (h *MenuController) Update(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var in services.MenuInput
	if err := c.ShouldBindJSON(&in); err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	m, err := h.svc.Update(uint(id), in)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.OKMsg(c, "Menu berhasil diperbarui", m)
}

func (h *MenuController) Delete(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := h.svc.Delete(uint(id)); err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.OKMsg(c, "Menu berhasil dihapus", nil)
}

func (h *MenuController) Categories(c *gin.Context) {
	items, err := h.svc.Categories()
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.OK(c, items)
}

// ═══════════════════════════════════════════════════════════════
// EXPORT EXCEL — GET /api/menus/export/excel
// ═══════════════════════════════════════════════════════════════
func (h *MenuController) ExportExcel(c *gin.Context) {
	search := c.Query("search")
	categoryID, _ := strconv.Atoi(c.Query("category_id"))

	items, err := h.svc.MenusForExport(search, uint(categoryID))
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}

	buf, err := utils.MenusExcel(items)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}

	filename := fmt.Sprintf("daftar-menu-%s.xlsx",
		time.Now().Format("20060102-150405"))
	c.Header("Content-Disposition",
		fmt.Sprintf(`attachment; filename="%s"`, filename))
	c.Data(http.StatusOK,
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf)
}

func (h *MenuController) CreateCategory(c *gin.Context) {
	var in services.CategoryInput
	if err := c.ShouldBindJSON(&in); err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	cat, err := h.svc.CreateCategory(in)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.Created(c, "Kategori berhasil dibuat", cat)
}

func (h *MenuController) UpdateCategory(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var in services.CategoryInput
	if err := c.ShouldBindJSON(&in); err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	cat, err := h.svc.UpdateCategory(uint(id), in)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.OKMsg(c, "Kategori berhasil diperbarui", cat)
}

func (h *MenuController) DeleteCategory(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := h.svc.DeleteCategory(uint(id)); err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.OKMsg(c, "Kategori berhasil dihapus", nil)
}