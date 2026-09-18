package utils

import (
	"fmt"

	"backend/models"

	"github.com/xuri/excelize/v2"
)

// ═══════════════════════════════════════════════════════════════
// OrdersExcel — export daftar order ke Excel
// ═══════════════════════════════════════════════════════════════
func OrdersExcel(orders []models.Order) ([]byte, error) {
	f := excelize.NewFile()
	sheet := "Laporan Order"
	idx, _ := f.NewSheet(sheet)
	f.SetActiveSheet(idx)
	_ = f.DeleteSheet("Sheet1")

	headers := []string{
		"No", "Kode Order", "Kasir", "Pelanggan", "Meja",
		"Status", "Subtotal", "Diskon", "Total", "Paid At", "Dibuat",
	}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		_ = f.SetCellValue(sheet, cell, h)
	}

	for i, o := range orders {
		row := i + 2
		paidAt := "-"
		if o.PaidAt != nil {
			paidAt = o.PaidAt.Format("2006-01-02 15:04")
		}
		vals := []any{
			i + 1, o.OrderCode, o.Cashier.Name, o.CustomerName, o.TableNumber,
			o.Status, o.Subtotal, o.Discount, o.Total,
			paidAt, o.CreatedAt.Format("2006-01-02 15:04"),
		}
		for j, v := range vals {
			cell, _ := excelize.CoordinatesToCellName(j+1, row)
			_ = f.SetCellValue(sheet, cell, v)
		}
	}

	style, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Color: "FFFFFF"},
		Fill: excelize.Fill{Type: "pattern", Pattern: 1, Color: []string{"0EA5E9"}},
	})
	lastCol, _ := excelize.CoordinatesToCellName(len(headers), 1)
	_ = f.SetCellStyle(sheet, "A1", lastCol, style)

	buf, err := f.WriteToBuffer()
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// ═══════════════════════════════════════════════════════════════
// UsersExcel — export daftar user ke Excel
// ═══════════════════════════════════════════════════════════════
func UsersExcel(users []models.User) ([]byte, error) {
	f := excelize.NewFile()
	sheet := "Users"
	idx, _ := f.NewSheet(sheet)
	f.SetActiveSheet(idx)
	_ = f.DeleteSheet("Sheet1")

	headers := []string{
		"No", "Nama", "Email", "Role", "Phone", "Aktif", "Dibuat",
	}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		_ = f.SetCellValue(sheet, cell, h)
	}
	for i, u := range users {
		row := i + 2
		aktif := "Tidak"
		if u.IsActive {
			aktif = "Ya"
		}
		vals := []any{
			i + 1, u.Name, u.Email, u.Role.Name, u.Phone, aktif,
			u.CreatedAt.Format("2006-01-02 15:04"),
		}
		for j, v := range vals {
			cell, _ := excelize.CoordinatesToCellName(j+1, row)
			_ = f.SetCellValue(sheet, cell, v)
		}
	}

	style, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Color: "FFFFFF"},
		Fill: excelize.Fill{Type: "pattern", Pattern: 1, Color: []string{"0EA5E9"}},
	})
	lastCol, _ := excelize.CoordinatesToCellName(len(headers), 1)
	_ = f.SetCellStyle(sheet, "A1", lastCol, style)

	buf, err := f.WriteToBuffer()
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// ═══════════════════════════════════════════════════════════════
// MenusExcel — export daftar menu ke Excel
// ═══════════════════════════════════════════════════════════════
func MenusExcel(menus []models.Menu) ([]byte, error) {
	f := excelize.NewFile()
	sheet := "Daftar Menu"
	idx, _ := f.NewSheet(sheet)
	f.SetActiveSheet(idx)
	_ = f.DeleteSheet("Sheet1")

	// Header
	headers := []string{
		"No",
		"Nama Menu",
		"Kategori",
		"Deskripsi",
		"Harga",
		"Status",
		"Dibuat",
	}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		_ = f.SetCellValue(sheet, cell, h)
	}

	// Rows
	for i, m := range menus {
		row := i + 2
		status := "Tersedia"
		if !m.IsAvailable {
			status = "Habis"
		}
		kategori := ""
		if m.Category.ID > 0 {
			kategori = m.Category.Name
		}

		vals := []any{
			i + 1,
			m.Name,
			kategori,
			m.Description,
			m.Price,
			status,
			m.CreatedAt.Format("2006-01-02 15:04"),
		}
		for j, v := range vals {
			cell, _ := excelize.CoordinatesToCellName(j+1, row)
			_ = f.SetCellValue(sheet, cell, v)
		}
	}

	// Style header
	style, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Color: "FFFFFF"},
		Fill:      excelize.Fill{Type: "pattern", Pattern: 1, Color: []string{"0EA5E9"}},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
	})
	lastCol, _ := excelize.CoordinatesToCellName(len(headers), 1)
	_ = f.SetCellStyle(sheet, "A1", lastCol, style)

	// Column widths
	widths := []float64{6, 30, 15, 40, 15, 12, 20}
	for i, w := range widths {
		col, _ := excelize.ColumnNumberToName(i + 1)
		_ = f.SetColWidth(sheet, col, col, w)
	}

	// Format harga kolom E
	priceStyle, _ := f.NewStyle(&excelize.Style{
		NumFmt:    4, // #,##0
		Alignment: &excelize.Alignment{Horizontal: "right"},
	})
	_ = f.SetCellStyle(sheet, "E2", fmt.Sprintf("E%d", len(menus)+1), priceStyle)

	buf, err := f.WriteToBuffer()
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}