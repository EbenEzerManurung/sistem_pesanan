package utils

import (
	"bytes"
	"fmt"
	"time"

	"backend/models"

	"github.com/go-pdf/fpdf"
)

func OrderReceiptPDF(o *models.Order) ([]byte, error) {
	pdf := fpdf.New("P", "mm", "A6", "")
	pdf.SetMargins(6, 6, 6)
	pdf.AddPage()

	pdf.SetFont("Arial", "B", 14)
	pdf.SetTextColor(14, 165, 233)
	pdf.CellFormat(0, 8, "FOODORDER", "", 1, "C", false, 0, "")
	pdf.SetFont("Arial", "", 8)
	pdf.SetTextColor(100, 100, 100)
	pdf.CellFormat(0, 4, "Sistem Pemesanan Makanan", "", 1, "C", false, 0, "")
	pdf.Ln(2)

	pdf.SetTextColor(0, 0, 0)
	pdf.SetFont("Arial", "", 8)
	pdf.CellFormat(25, 5, "Kode", "", 0, "L", false, 0, "")
	pdf.CellFormat(0, 5, ": "+o.OrderCode, "", 1, "L", false, 0, "")
	pdf.CellFormat(25, 5, "Pelanggan", "", 0, "L", false, 0, "")
	pdf.CellFormat(0, 5, ": "+o.CustomerName, "", 1, "L", false, 0, "")
	pdf.CellFormat(25, 5, "Meja", "", 0, "L", false, 0, "")
	pdf.CellFormat(0, 5, ": "+o.TableNumber, "", 1, "L", false, 0, "")
	pdf.CellFormat(25, 5, "Kasir", "", 0, "L", false, 0, "")
	pdf.CellFormat(0, 5, ": "+o.Cashier.Name, "", 1, "L", false, 0, "")
	pdf.Ln(3)

	pdf.SetFont("Arial", "B", 8)
	pdf.CellFormat(50, 5, "Item", "", 0, "L", false, 0, "")
	pdf.CellFormat(12, 5, "Qty", "", 0, "C", false, 0, "")
	pdf.CellFormat(31, 5, "Subtotal", "", 1, "R", false, 0, "")
	pdf.SetFont("Arial", "", 8)
	for _, it := range o.Items {
		name := it.MenuName
		if name == "" {
			name = it.Menu.Name
		}
		pdf.CellFormat(50, 5, name, "", 0, "L", false, 0, "")
		pdf.CellFormat(12, 5, fmt.Sprintf("%d", it.Qty), "", 0, "C", false, 0, "")
		pdf.CellFormat(31, 5, fmt.Sprintf("%.0f", it.Subtotal), "", 1, "R", false, 0, "")
	}
	pdf.Ln(2)
	pdf.SetFont("Arial", "B", 10)
	pdf.SetTextColor(5, 150, 105)
	pdf.CellFormat(50, 7, "TOTAL", "", 0, "L", false, 0, "")
	pdf.CellFormat(43, 7, fmt.Sprintf("Rp %.0f", o.Total), "", 1, "R", false, 0, "")
	pdf.Ln(3)
	pdf.SetFont("Arial", "I", 7)
	pdf.SetTextColor(120, 120, 120)
	pdf.CellFormat(0, 4, "Terima kasih", "", 1, "C", false, 0, "")

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func OrdersReportPDF(orders []models.Order, from, to string) ([]byte, error) {
	pdf := fpdf.New("L", "mm", "A4", "")
	pdf.SetMargins(10, 10, 10)
	pdf.AddPage()

	pdf.SetFont("Arial", "B", 16)
	pdf.SetTextColor(14, 165, 233)
	pdf.CellFormat(0, 10, "LAPORAN ORDER", "", 1, "C", false, 0, "")
	pdf.SetFont("Arial", "", 10)
	pdf.SetTextColor(80, 80, 80)
	period := "Semua Periode"
	if from != "" || to != "" {
		period = fmt.Sprintf("Periode: %s s/d %s", from, to)
	}
	pdf.CellFormat(0, 6, period, "", 1, "C", false, 0, "")
	pdf.Ln(3)

	pdf.SetFont("Arial", "B", 9)
	pdf.SetFillColor(14, 165, 233)
	pdf.SetTextColor(255, 255, 255)
	pdf.CellFormat(10, 8, "No", "1", 0, "C", true, 0, "")
	pdf.CellFormat(35, 8, "Kode", "1", 0, "C", true, 0, "")
	pdf.CellFormat(30, 8, "Kasir", "1", 0, "C", true, 0, "")
	pdf.CellFormat(45, 8, "Pelanggan", "1", 0, "C", true, 0, "")
	pdf.CellFormat(20, 8, "Meja", "1", 0, "C", true, 0, "")
	pdf.CellFormat(25, 8, "Status", "1", 0, "C", true, 0, "")
	pdf.CellFormat(35, 8, "Total", "1", 0, "C", true, 0, "")
	pdf.CellFormat(30, 8, "Tanggal", "1", 1, "C", true, 0, "")

	pdf.SetTextColor(0, 0, 0)
	pdf.SetFont("Arial", "", 8)
	var grand float64
	for i, o := range orders {
		grand += o.Total
		pdf.CellFormat(10, 7, fmt.Sprintf("%d", i+1), "1", 0, "C", false, 0, "")
		pdf.CellFormat(35, 7, o.OrderCode, "1", 0, "L", false, 0, "")
		pdf.CellFormat(30, 7, o.Cashier.Name, "1", 0, "L", false, 0, "")
		pdf.CellFormat(45, 7, o.CustomerName, "1", 0, "L", false, 0, "")
		pdf.CellFormat(20, 7, o.TableNumber, "1", 0, "C", false, 0, "")
		pdf.CellFormat(25, 7, o.Status, "1", 0, "C", false, 0, "")
		pdf.CellFormat(35, 7, fmt.Sprintf("Rp %.0f", o.Total), "1", 0, "R", false, 0, "")
		pdf.CellFormat(30, 7, o.CreatedAt.Format("02/01/2006"), "1", 1, "C", false, 0, "")
	}

	pdf.SetFont("Arial", "B", 10)
	pdf.SetFillColor(236, 253, 245)
	pdf.CellFormat(180, 8, "GRAND TOTAL", "1", 0, "R", true, 0, "")
	pdf.CellFormat(60, 8, fmt.Sprintf("Rp %.0f", grand), "1", 1, "R", true, 0, "")

	pdf.Ln(4)
	pdf.SetFont("Arial", "I", 8)
	pdf.SetTextColor(120, 120, 120)
	pdf.CellFormat(0, 5, "Dicetak: "+time.Now().Format("02/01/2006 15:04"), "", 1, "L", false, 0, "")

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}