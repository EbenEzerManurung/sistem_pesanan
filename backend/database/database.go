package database

import (
	"database/sql"
	"log"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var Gorm *gorm.DB

// NewGormFromSQL membungkus *sql.DB yang sama dengan config.DB
// jadi tidak buka koneksi baru. Semua repo pakai database.Gorm.
func NewGormFromSQL(db *sql.DB, isProduction bool) error {
	level := logger.Info
	if isProduction {
		level = logger.Warn
	}

	g, err := gorm.Open(mysql.New(mysql.Config{
		Conn: db,
	}), &gorm.Config{
		Logger: logger.Default.LogMode(level),
		NowFunc: func() time.Time { return time.Now().Local() },
	})
	if err != nil {
		return err
	}
	Gorm = g
	log.Println("✅ GORM siap")
	return nil
}