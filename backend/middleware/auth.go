package middleware

import (
	"net/http"
	"strings"

	"backend/config"
	"backend/utils"

	"github.com/gin-gonic/gin"
)

func Auth(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := ""
		if h := c.GetHeader("Authorization"); strings.HasPrefix(h, "Bearer ") {
			token = strings.TrimPrefix(h, "Bearer ")
		}
		if token == "" {
			token = c.Query("token")
		}
		if token == "" {
			utils.Fail(c, http.StatusUnauthorized, "Token tidak ditemukan")
			return
		}
		claims, err := utils.ParseToken(cfg.JWTSecret, token)
		if err != nil {
			utils.Fail(c, http.StatusUnauthorized, "Token tidak valid / kadaluarsa")
			return
		}
		c.Set("user_id", claims.UserID)
		c.Set("role", claims.Role)
		c.Set("email", claims.Email)
		c.Next()
	}
}

func CurrentUserID(c *gin.Context) uint {
	v, _ := c.Get("user_id")
	id, _ := v.(uint)
	return id
}

func CurrentRole(c *gin.Context) string {
	v, _ := c.Get("role")
	r, _ := v.(string)
	return r
}