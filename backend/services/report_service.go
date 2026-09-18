package services

import (
	"backend/models"
	"backend/repositories"
)

type ReportService struct {
	orders *repositories.OrderRepository
}

func NewReportService(o *repositories.OrderRepository) *ReportService {
	return &ReportService{orders: o}
}

// OrdersForExport — ambil semua order untuk export Excel/PDF
func (s *ReportService) OrdersForExport(f repositories.OrderFilter) ([]models.Order, error) {
	f.Offset = 0
	if f.Limit < 1000 {
		f.Limit = 10000
	}
	orders, _, err := s.orders.List(f)
	return orders, err
}

// Summary — aggregation untuk halaman Reports
func (s *ReportService) Summary(f repositories.OrderFilter) (map[string]any, error) {
	return s.orders.ReportSummary(f)
}