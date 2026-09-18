package utils

import (
	"fmt"
	"strings"

	"backend/models"
)

func ValidateOrderStatus(s string) error {
	for _, v := range models.ListOrderStatus() {
		if v == s {
			return nil
		}
	}
	return fmt.Errorf("status tidak valid. Pilihan: %s", strings.Join(models.ListOrderStatus(), ", "))
}