package seeders

import (
	"backend/config"
	"fmt"
	"log"
	"math/rand"
	"time"

	"golang.org/x/crypto/bcrypt"
)

// Run — entry point seeder
func Run() error {
	rand.Seed(time.Now().UnixNano())

	if err := seedRoles(); err != nil {
		return err
	}
	if err := seedUsers(); err != nil {
		return err
	}
	if err := seedCategories(); err != nil {
		return err
	}
	if err := seedMenus(); err != nil {
		return err
	}
	if err := seedOrders(200); err != nil {
		return err
	}
	return nil
}

// ==================== ROLES ====================

func seedRoles() error {
	roles := []struct{ name, desc string }{
		{"superadmin", "Akses semua menu & fitur"},
		{"admin", "Konfirmasi & update status order"},
		{"cashier", "Membuat order & cetak struk"},
		{"user", "Melihat dashboard & status order"},
	}
	for _, r := range roles {
		_, err := config.DB.Exec(
			"INSERT IGNORE INTO roles (name, description) VALUES (?, ?)",
			r.name, r.desc,
		)
		if err != nil {
			return fmt.Errorf("insert role %s: %w", r.name, err)
		}
		fmt.Printf("   📝 Role: %s\n", r.name)
	}
	fmt.Println("✓ Roles berhasil")
	return nil
}

// ==================== USERS ====================

func seedUsers() error {
	roleIDs := map[string]int64{}
	rows, err := config.DB.Query("SELECT id, name FROM roles")
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var id int64
		var name string
		_ = rows.Scan(&id, &name)
		roleIDs[name] = id
	}

	users := []struct{ roleName, name, email, phone string }{
		{"superadmin", "Super Admin", "superadmin@mail.com", "0811000001"},
		{"admin", "Admin", "admin@mail.com", "0811000002"},
		{"cashier", "Kasir 1", "cashier@mail.com", "0811000003"},
		{"cashier", "Kasir 2", "cashier2@mail.com", "0811000005"},
		{"user", "Viewer", "user@mail.com", "0811000004"},
	}

	hashed, _ := bcrypt.GenerateFromPassword([]byte("password"), bcrypt.DefaultCost)

	for _, u := range users {
		var count int
		_ = config.DB.QueryRow("SELECT COUNT(*) FROM users WHERE email = ?", u.email).Scan(&count)
		if count > 0 {
			continue
		}
		_, err := config.DB.Exec(
			"INSERT INTO users (role_id, name, email, password, phone, is_active) VALUES (?, ?, ?, ?, ?, 1)",
			roleIDs[u.roleName], u.name, u.email, string(hashed), u.phone,
		)
		if err != nil {
			log.Printf("Gagal insert user %s: %v", u.email, err)
			continue
		}
		fmt.Printf("   📝 User: %s | %s | password: password\n", u.email, u.roleName)
	}
	fmt.Println("✓ Users berhasil")
	return nil
}

// ==================== CATEGORIES ====================

func seedCategories() error {
	categories := []struct{ name, desc string }{
		{"Makanan", "Menu makanan utama"},
		{"Minuman", "Aneka minuman segar"},
		{"Snack", "Camilan & makanan ringan"},
	}
	for _, c := range categories {
		var count int
		_ = config.DB.QueryRow("SELECT COUNT(*) FROM categories WHERE name = ?", c.name).Scan(&count)
		if count > 0 {
			continue
		}
		if _, err := config.DB.Exec(
			"INSERT INTO categories (name, description) VALUES (?, ?)",
			c.name, c.desc,
		); err != nil {
			log.Printf("Gagal insert category %s: %v", c.name, err)
			continue
		}
		fmt.Printf("   📝 Kategori: %s\n", c.name)
	}
	fmt.Println("✓ Categories berhasil")
	return nil
}

// ==================== MENUS ====================

func seedMenus() error {
	catIDs := map[string]int64{}
	rows, err := config.DB.Query("SELECT id, name FROM categories")
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var id int64
		var name string
		_ = rows.Scan(&id, &name)
		catIDs[name] = id
	}

	menus := []struct {
		cat   string
		name  string
		desc  string
		price float64
	}{
		{"Makanan", "Nasi Goreng Spesial", "Nasi goreng dengan telur & ayam", 25000},
		{"Makanan", "Mie Goreng Jawa", "Mie goreng bumbu jawa", 22000},
		{"Makanan", "Ayam Bakar Madu", "Ayam bakar dengan saus madu", 35000},
		{"Makanan", "Sate Ayam", "10 tusuk sate + lontong", 30000},
		{"Makanan", "Nasi Uduk Komplit", "Nasi uduk + lauk pauk", 28000},
		{"Minuman", "Es Teh Manis", "Teh manis dingin", 8000},
		{"Minuman", "Es Jeruk", "Jeruk peras dingin", 10000},
		{"Minuman", "Kopi Susu", "Kopi dengan susu segar", 15000},
		{"Minuman", "Air Mineral", "Air mineral 600ml", 5000},
		{"Minuman", "Jus Alpukat", "Jus alpukat segar", 18000},
		{"Snack", "Kentang Goreng", "Kentang goreng crispy", 15000},
		{"Snack", "Pisang Goreng", "Pisang goreng manis", 12000},
		{"Snack", "Tahu Crispy", "Tahu goreng crispy", 10000},
		{"Snack", "Roti Bakar", "Roti bakar coklat keju", 15000},
	}

	for _, m := range menus {
		var count int
		_ = config.DB.QueryRow("SELECT COUNT(*) FROM menus WHERE name = ?", m.name).Scan(&count)
		if count > 0 {
			continue
		}
		if _, err := config.DB.Exec(
			"INSERT INTO menus (category_id, name, description, price, is_available) VALUES (?, ?, ?, ?, 1)",
			catIDs[m.cat], m.name, m.desc, m.price,
		); err != nil {
			log.Printf("Gagal insert menu %s: %v", m.name, err)
		}
	}
	fmt.Printf("✓ Menus: %d\n", len(menus))
	return nil
}

// ==================== ORDERS ====================

func seedOrders(total int) error {
	fmt.Printf("Mulai seeding %d order...\n", total)

	// Ambil cashier id
	var cashierIDs []int64
	rows, _ := config.DB.Query(`
		SELECT u.id FROM users u
		JOIN roles r ON r.id = u.role_id
		WHERE r.name IN ('cashier', 'superadmin')`)
	if rows != nil {
		for rows.Next() {
			var id int64
			_ = rows.Scan(&id)
			cashierIDs = append(cashierIDs, id)
		}
		rows.Close()
	}
	if len(cashierIDs) == 0 {
		return fmt.Errorf("tidak ada user cashier")
	}

	// Ambil menu
	type Menu struct {
		ID    int64
		Name  string
		Price float64
	}
	var menuList []Menu
	mrows, _ := config.DB.Query("SELECT id, name, price FROM menus")
	if mrows != nil {
		for mrows.Next() {
			var m Menu
			_ = mrows.Scan(&m.ID, &m.Name, &m.Price)
			menuList = append(menuList, m)
		}
		mrows.Close()
	}
	if len(menuList) == 0 {
		return fmt.Errorf("tidak ada menu")
	}

	firstNames := []string{"Budi", "Ani", "Citra", "Dedi", "Eka", "Fajar", "Gina", "Hadi", "Indah", "Joko"}
	lastNames := []string{"Santoso", "Wijaya", "Pratama", "Kurniawan", "Saputra", "Nugroho", "Hidayat"}
	statuses := []string{"waiting", "processing", "done"}

	for i := 0; i < total; i++ {
		custName := firstNames[rand.Intn(len(firstNames))] + " " + lastNames[rand.Intn(len(lastNames))]
		tableNo := fmt.Sprintf("A%d", rand.Intn(20)+1)
		status := statuses[rand.Intn(len(statuses))]
		createdAt := time.Now().Add(-time.Duration(rand.Intn(30*24)) * time.Hour)

		itemCount := rand.Intn(4) + 1
		type line struct {
			menuID   int64
			menuName string
			qty      int
			price    float64
			sub      float64
		}
		var lines []line
		var subtotal float64
		for k := 0; k < itemCount; k++ {
			m := menuList[rand.Intn(len(menuList))]
			qty := rand.Intn(3) + 1
			sub := m.Price * float64(qty)
			subtotal += sub
			lines = append(lines, line{m.ID, m.Name, qty, m.Price, sub})
		}
		totalHarga := subtotal

		var paidAt, doneAt interface{}
		if status != "waiting" || rand.Intn(2) == 0 {
			paidAt = createdAt.Add(time.Duration(rand.Intn(60)+1) * time.Minute)
		}
		if status == "done" {
			doneAt = createdAt.Add(time.Duration(rand.Intn(120)+30) * time.Minute)
		}

		orderCode := fmt.Sprintf("ORD-%s-%05d", createdAt.Format("20060102"), i+1)

		tx, err := config.DB.Begin()
		if err != nil {
			log.Printf("Begin tx: %v", err)
			continue
		}

		res, err := tx.Exec(`
			INSERT INTO orders
				(order_code, cashier_id, customer_name, table_number, status,
				 subtotal, tax, discount, total, paid_at, done_at, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?)`,
			orderCode, cashierIDs[rand.Intn(len(cashierIDs))], custName, tableNo, status,
			subtotal, totalHarga, paidAt, doneAt, createdAt, createdAt)
		if err != nil {
			log.Printf("Insert order: %v", err)
			tx.Rollback()
			continue
		}

		orderID, _ := res.LastInsertId()
		stmt, _ := tx.Prepare(`
			INSERT INTO order_items (order_id, menu_id, menu_name, qty, price, subtotal)
			VALUES (?, ?, ?, ?, ?, ?)`)
		for _, l := range lines {
			_, _ = stmt.Exec(orderID, l.menuID, l.menuName, l.qty, l.price, l.sub)
		}
		stmt.Close()
		tx.Commit()

		if (i+1)%50 == 0 {
			fmt.Printf("   ... %d/%d\n", i+1, total)
		}
	}
	fmt.Printf("✓ Orders: %d\n", total)
	return nil
}