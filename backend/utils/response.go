package utils

import "github.com/gin-gonic/gin"

func OK(c *gin.Context, data any) {
	c.JSON(200, gin.H{"success": true, "data": data})
}

func OKMsg(c *gin.Context, msg string, data any) {
	c.JSON(200, gin.H{"success": true, "message": msg, "data": data})
}

func Created(c *gin.Context, msg string, data any) {
	c.JSON(201, gin.H{"success": true, "message": msg, "data": data})
}

func Fail(c *gin.Context, code int, msg string) {
	c.AbortWithStatusJSON(code, gin.H{"success": false, "message": msg})
}

func Paginated(c *gin.Context, data any, page, limit int, total int64) {
	totalPage := int64(0)
	if limit > 0 {
		totalPage = (total + int64(limit) - 1) / int64(limit)
	}
	c.JSON(200, gin.H{
		"success": true,
		"data":    data,
		"meta": gin.H{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"total_page": totalPage,
		},
	})
}