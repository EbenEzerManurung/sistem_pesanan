package routes

import (
	"net/http"

	"backend/config"
	"backend/controllers"
	"backend/handlers"
	"backend/middleware"
	"backend/models"

	"github.com/gin-gonic/gin"
)

type Deps struct {
	Auth   *controllers.AuthController
	User   *controllers.UserController
	Menu   *controllers.MenuController
	Order  *controllers.OrderController
	Report *controllers.ReportController
}

func Register(r *gin.Engine, cfg *config.Config, d *Deps) {
	r.Use(middleware.CORS(cfg))
	r.Use(handlers.Recovery())
	r.NoRoute(handlers.NoRoute)
	r.NoMethod(handlers.NoMethod)

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true, "service": cfg.AppName})
	})

	api := r.Group("/api")

	// ═══════════════════════════════════════════════════════════
	//  PUBLIC ROUTES — tanpa login
	// ═══════════════════════════════════════════════════════════
	api.POST("/auth/login", d.Auth.Login)

	// ─── Dashboard publik ───
	api.GET("/dashboard/stats", d.Order.DashboardStats)
	api.GET("/dashboard/waiting", d.Order.WaitingQueue)
	api.GET("/dashboard/processing", d.Order.ProcessingQueue)
	api.GET("/dashboard/done", d.Order.DoneQueue)
	api.GET("/dashboard/queue", d.Order.Queue)
	api.GET("/stream/orders", d.Order.Stream)

	// ─── Menu publik ───
	api.GET("/menus", d.Menu.List)
	api.GET("/menus/:id", d.Menu.Get)
	api.GET("/categories", d.Menu.Categories)

	// ═══════════════════════════════════════════════════════════
	//  PROTECTED ROUTES — wajib login
	// ═══════════════════════════════════════════════════════════
	protected := api.Group("")
	protected.Use(middleware.Auth(cfg))
	{
		protected.GET("/auth/me", d.Auth.Me)

		// ─── Menu management (superadmin & admin) ───
		menuMgmt := protected.Group("")
		menuMgmt.Use(middleware.RequireRole(models.RoleSuperAdmin, models.RoleAdmin))
		{
			// Menu CRUD
			menuMgmt.POST("/menus", d.Menu.Create)
			menuMgmt.PUT("/menus/:id", d.Menu.Update)
			menuMgmt.DELETE("/menus/:id", d.Menu.Delete)

			// Category CRUD
			menuMgmt.POST("/categories", d.Menu.CreateCategory)
			menuMgmt.PUT("/categories/:id", d.Menu.UpdateCategory)
			menuMgmt.DELETE("/categories/:id", d.Menu.DeleteCategory)
		}

		// ─── Export (path terpisah, tidak konflik dengan :id) ───
		exports := protected.Group("/export")
		exports.Use(middleware.RequireRole(models.RoleSuperAdmin, models.RoleAdmin))
		{
			exports.GET("/menus/excel", d.Menu.ExportExcel)   // 🆕 path baru
		}

		// ─── Orders ───
		orders := protected.Group("/orders")
		{
			orders.GET("", d.Order.List)
			orders.GET("/:id", d.Order.Get)
			orders.GET("/:id/pdf", d.Order.ExportPDF)

			orders.POST("",
				middleware.RequireRole(models.RoleCashier, models.RoleSuperAdmin),
				d.Order.Create)

			orders.POST("/:id/pay",
				middleware.RequireRole(models.RoleCashier, models.RoleAdmin, models.RoleSuperAdmin),
				d.Order.Pay)

			orders.PATCH("/:id/status",
				middleware.RequireRole(models.RoleAdmin, models.RoleSuperAdmin),
				d.Order.UpdateStatus)
		}

		// ─── Users (superadmin only) ───
		users := protected.Group("/users")
		users.Use(middleware.RequireRole(models.RoleSuperAdmin))
		{
			users.GET("", d.User.List)
			users.GET("/roles", d.User.Roles)
			users.POST("", d.User.Create)
			users.PUT("/:id", d.User.Update)
			users.DELETE("/:id", d.User.Delete)
		}

		// ─── Reports (admin & superadmin) ───
		reports := protected.Group("/reports")
		reports.Use(middleware.RequireRole(models.RoleAdmin, models.RoleSuperAdmin))
		{
			reports.GET("/orders/excel", d.Report.OrdersExcel)
			reports.GET("/orders/pdf", d.Report.OrdersPDF)
			reports.GET("/orders/summary", d.Report.Summary)
		}
	}
}