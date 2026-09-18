package main

import (
	"log"
	"os"
	"strings"

	"backend/config"
	"backend/controllers"
	"backend/database"
	"backend/migration"
	"backend/repositories"
	"backend/routes"
	"backend/services"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	// Connect database/sql (dipakai migration & seeder)
	if err := config.ConnectDB(cfg); err != nil {
		log.Fatalf("❌ Gagal koneksi database: %v", err)
	}
	log.Println("✅ Database connected")

	// Init GORM dari *sql.DB yang sama
	if err := database.NewGormFromSQL(config.DB, cfg.IsProduction()); err != nil {
		log.Fatalf("❌ Gagal init GORM: %v", err)
	}

	// CLI commands
	args := os.Args[1:]
	if len(args) > 0 && isCommand(args[0]) {
		runCommand(args)
		return
	}

	// Server
	userRepo := repositories.NewUserRepository()
	categoryRepo := repositories.NewCategoryRepository()
	menuRepo := repositories.NewMenuRepository()
	orderRepo := repositories.NewOrderRepository()

	hub := services.NewHub()
	authSvc := services.NewAuthService(userRepo, cfg)
	userSvc := services.NewUserService(userRepo)
	menuSvc := services.NewMenuService(menuRepo, categoryRepo)
	orderSvc := services.NewOrderService(orderRepo, menuRepo, hub)
	reportSvc := services.NewReportService(orderRepo)

	deps := &routes.Deps{
		Auth:   controllers.NewAuthController(authSvc),
		User:   controllers.NewUserController(userSvc),
		Menu:   controllers.NewMenuController(menuSvc),
		Order:  controllers.NewOrderController(orderSvc, hub),
		Report: controllers.NewReportController(reportSvc),
	}

	if cfg.IsProduction() {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.Default()
	routes.Register(r, cfg, deps)

	log.Printf("🚀 %s berjalan di http://localhost:%s", cfg.AppName, cfg.AppPort)
	if err := r.Run(":" + cfg.AppPort); err != nil {
		log.Fatal(err)
	}
}

// ==================== CLI PARSER ====================

// isCommand cek apakah arg pertama adalah command yang dikenal
func isCommand(arg string) bool {
	known := []string{
		"migrate", "fresh", "seed", "fresh-seed", "freshseed",
		"migration:migrate", "migration:fresh", "migration:seed",
		"migration:reset", "db:migrate", "db:fresh", "db:seed",
		"serve", "help", "-h", "--help",
	}
	for _, k := range known {
		if arg == k {
			return true
		}
	}
	// juga terima format "namespace:action"
	if strings.Contains(arg, ":") {
		parts := strings.SplitN(arg, ":", 2)
		switch parts[0] {
		case "migration", "db":
			return true
		}
	}
	return false
}

// runCommand — parse flag & action
func runCommand(args []string) {
	action := ""
	flags := map[string]bool{}

	// Parse args
	for _, a := range args {
		if strings.HasPrefix(a, "--") {
			flags[strings.TrimPrefix(a, "--")] = true
			continue
		}
		if a == "-h" || a == "help" {
			printHelp()
			return
		}
		if action == "" {
			action = a
		}
	}

	// Normalisasi action
	switch action {
	// Format baru: namespace:action
	case "migration:migrate", "db:migrate":
		action = "migrate"
	case "migration:fresh", "db:fresh", "migration:reset":
		action = "fresh"
	case "migration:seed", "db:seed":
		action = "seed"
	case "fresh-seed", "freshseed":
		action = "fresh-seed"
	case "serve":
		action = "" // lanjut ke server
	case "help", "-h", "--help":
		printHelp()
		return
	}

	// Kalau tidak ada action, tampilkan help
	if action == "" {
		printHelp()
		return
	}

	// Handle flag --seed pada fresh
	if action == "fresh" {
		migration.Fresh()
		if flags["seed"] {
			migration.Seed()
		}
		return
	}

	// Handle flag --fresh pada seed
	if action == "seed" {
		if flags["fresh"] {
			migration.Fresh()
		}
		migration.Seed()
		return
	}

	// Aksi biasa
	switch action {
	case "migrate":
		migration.Migrate()
		if flags["seed"] {
			migration.Seed()
		}
	case "fresh-seed":
		migration.Fresh()
		migration.Seed()
	default:
		log.Printf("❌ Perintah tidak dikenal: %s", action)
		printHelp()
	}
}

// printHelp menampilkan daftar perintah yang tersedia
func printHelp() {
	help := `
🍽️  FoodOrder CLI

USAGE:
  go run main.go                        → jalankan server
  go run main.go <command> [flags]

COMMANDS:
  migrate              Buat tabel jika belum ada (idempotent)
  fresh                Drop + create ulang semua tabel
  seed                 Jalankan seeder saja
  fresh-seed           Drop + create + seed (alias)

  migration:migrate    Alias migrate
  migration:fresh      Alias fresh
  migration:seed       Alias seed
  migration:reset      Alias fresh
  db:migrate           Alias migrate
  db:fresh             Alias fresh
  db:seed              Alias seed

FLAGS:
  --seed               Setelah migrate/fresh, jalankan seeder
  --fresh              Sebelum seed, drop + create ulang tabel

EXAMPLES:
  go run main.go migration:fresh --seed     → 🔥 FRESH + SEED (paling umum)
  go run main.go migration:migrate          → buat tabel
  go run main.go migration:migrate --seed   → buat tabel + seed
  go run main.go migration:seed             → seed saja
  go run main.go fresh --seed               → sama dengan di atas
  go run main.go                            → jalankan server
`
	println(help)
}