package migration

import (
	"backend/config"
	"backend/seeders"
	"fmt"
	"log"
)

// ==================== MIGRATE ====================
func Migrate() {
	fmt.Println("🚀 Menjalankan migration...")

	createRolesTable()
	createUsersTable()
	createCategoriesTable()
	createMenusTable()
	createOrdersTable()
	createOrderItemsTable()

	fmt.Println("✅ Migration selesai")
}

// ==================== FRESH ====================
func Fresh() {
	fmt.Println("🗑️  Dropping semua tabel...")

	// Child dulu, baru parent (ada FK)
	tables := []string{"order_items", "orders", "menus", "categories", "users", "roles"}

	for _, table := range tables {
		_, err := config.DB.Exec(fmt.Sprintf("DROP TABLE IF EXISTS %s", table))
		if err != nil {
			log.Printf("Gagal drop tabel %s: %v", table, err)
		} else {
			fmt.Printf("   ✓ Drop tabel %s\n", table)
		}
	}

	fmt.Println("\n🔄 Membuat ulang tabel...")
	Migrate()
}

// ==================== SEED ====================
// Seed delegasi ke package seeders — biar file migration tetap ringkas
func Seed() {
	fmt.Println("\n🌱 Menjalankan seeder...")
	if err := seeders.Run(); err != nil {
		log.Fatalf("❌ Seeder gagal: %v", err)
	}
	fmt.Println("✅ Seeding selesai")
}

// ==================== CREATE TABLES ====================

func createRolesTable() {
	query := `
	CREATE TABLE IF NOT EXISTS roles (
		id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
		name VARCHAR(50) NOT NULL UNIQUE,
		description VARCHAR(255),
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
	) ENGINE=InnoDB;`
	mustExec(query, "roles")
}

func createUsersTable() {
	query := `
	CREATE TABLE IF NOT EXISTS users (
		id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
		role_id BIGINT UNSIGNED NOT NULL,
		name VARCHAR(100) NOT NULL,
		email VARCHAR(100) NOT NULL UNIQUE,
		password VARCHAR(255) NOT NULL,
		phone VARCHAR(20),
		avatar VARCHAR(255),
		is_active TINYINT(1) DEFAULT 1,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		INDEX idx_users_role (role_id),
		CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
			ON UPDATE CASCADE ON DELETE RESTRICT
	) ENGINE=InnoDB;`
	mustExec(query, "users")
}

func createCategoriesTable() {
	query := `
	CREATE TABLE IF NOT EXISTS categories (
		id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
		name VARCHAR(100) NOT NULL,
		description VARCHAR(255),
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
	) ENGINE=InnoDB;`
	mustExec(query, "categories")
}

func createMenusTable() {
	query := `
	CREATE TABLE IF NOT EXISTS menus (
		id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
		category_id BIGINT UNSIGNED NOT NULL,
		name VARCHAR(150) NOT NULL,
		description TEXT,
		price DECIMAL(12,2) NOT NULL DEFAULT 0,
		image VARCHAR(255),
		is_available TINYINT(1) DEFAULT 1,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		INDEX idx_menus_category (category_id),
		CONSTRAINT fk_menus_category FOREIGN KEY (category_id) REFERENCES categories(id)
			ON UPDATE CASCADE ON DELETE RESTRICT
	) ENGINE=InnoDB;`
	mustExec(query, "menus")
}

func createOrdersTable() {
	query := `
	CREATE TABLE IF NOT EXISTS orders (
		id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
		order_code VARCHAR(30) NOT NULL UNIQUE,
		cashier_id BIGINT UNSIGNED NULL,
		customer_name VARCHAR(100) NOT NULL,
		table_number VARCHAR(20),
		status VARCHAR(20) NOT NULL DEFAULT 'waiting',
		subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
		tax DECIMAL(12,2) NOT NULL DEFAULT 0,
		discount DECIMAL(12,2) NOT NULL DEFAULT 0,
		total DECIMAL(12,2) NOT NULL DEFAULT 0,
		notes TEXT,
		paid_at DATETIME NULL,
		done_at DATETIME NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		INDEX idx_orders_status (status),
		INDEX idx_orders_paid (paid_at),
		INDEX idx_orders_cashier (cashier_id),
		CONSTRAINT fk_orders_cashier FOREIGN KEY (cashier_id) REFERENCES users(id)
			ON UPDATE CASCADE ON DELETE SET NULL
	) ENGINE=InnoDB;`
	mustExec(query, "orders")
}

func createOrderItemsTable() {
	query := `
	CREATE TABLE IF NOT EXISTS order_items (
		id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
		order_id BIGINT UNSIGNED NOT NULL,
		menu_id BIGINT UNSIGNED NOT NULL,
		menu_name VARCHAR(150),
		qty INT NOT NULL DEFAULT 1,
		price DECIMAL(12,2) NOT NULL DEFAULT 0,
		subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
		notes VARCHAR(255),
		INDEX idx_items_order (order_id),
		INDEX idx_items_menu (menu_id),
		CONSTRAINT fk_items_order FOREIGN KEY (order_id) REFERENCES orders(id)
			ON UPDATE CASCADE ON DELETE CASCADE,
		CONSTRAINT fk_items_menu FOREIGN KEY (menu_id) REFERENCES menus(id)
			ON UPDATE CASCADE ON DELETE RESTRICT
	) ENGINE=InnoDB;`
	mustExec(query, "order_items")
}

func mustExec(query, tableName string) {
	if _, err := config.DB.Exec(query); err != nil {
		log.Fatalf("Gagal membuat tabel %s: %v", tableName, err)
	}
	fmt.Printf("   ✓ Tabel %s\n", tableName)
}