package middleware

import (
	"net/http"
	"strings"

	"backend/utils"

	"github.com/gin-gonic/gin"
)

func RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role := CurrentRole(c)
		for _, r := range roles {
			if r == role {
				c.Next()
				return
			}
		}
		utils.Fail(c, http.StatusForbidden,
			"Akses ditolak. Role diizinkan: "+strings.Join(roles, ", "))
	}
}