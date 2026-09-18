package config

import (
	"database/sql"
	"fmt"
	"os"
	"strconv"
	"strings"

	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
)

type Config struct {
	AppName       string
	AppEnv        string
	AppPort       string
	AppURL        string
	DBHost        string
	DBPort        string
	DBUser        string
	DBPass        string
	DBName        string
	JWTSecret     string
	JWTExpireHour int
	CORSOrigins   []string
}

// C = config global, DB = *sql.DB global (dipakai migration & seeder)
var (
	C  *Config
	DB *sql.DB
)

func Load() *Config {
	_ = godotenv.Load()

	cfg := &Config{
		AppName:       getEnv("APP_NAME", "FoodOrder"),
		AppEnv:        getEnv("APP_ENV", "development"),
		AppPort:       getEnv("APP_PORT", "8080"),
		AppURL:        getEnv("APP_URL", "http://localhost:8080"),
		DBHost:        getEnv("DB_HOST", "127.0.0.1"),
		DBPort:        getEnv("DB_PORT", "3306"),
		DBUser:        getEnv("DB_USER", "root"),
		DBPass:        getEnv("DB_PASS", ""),
		DBName:        getEnv("DB_NAME", "food_order"),
		JWTSecret:     getEnv("JWT_SECRET", "supersecret"),
		JWTExpireHour: getEnvInt("JWT_EXPIRE_HOURS", 24),
		CORSOrigins:   strings.Split(getEnv("CORS_ORIGINS", "http://localhost:3000"), ","),
	}

	C = cfg
	return cfg
}

func (c *Config) DSNNoDB() string {
	return fmt.Sprintf("%s:%s@tcp(%s:%s)/?charset=utf8mb4&parseTime=true&loc=Local",
		c.DBUser, c.DBPass, c.DBHost, c.DBPort)
}

func (c *Config) DSN() string {
	return fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=true&loc=Local",
		c.DBUser, c.DBPass, c.DBHost, c.DBPort, c.DBName)
}

func ConnectDB(cfg *Config) error {
	bootstrap, err := sql.Open("mysql", cfg.DSNNoDB())
	if err == nil {
		_, _ = bootstrap.Exec(fmt.Sprintf(
			"CREATE DATABASE IF NOT EXISTS %s CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
			cfg.DBName,
		))
		bootstrap.Close()
	}

	db, err := sql.Open("mysql", cfg.DSN())
	if err != nil {
		return err
	}
	db.SetMaxIdleConns(10)
	db.SetMaxOpenConns(100)
	if err := db.Ping(); err != nil {
		return err
	}
	DB = db
	return nil
}

func (c *Config) IsProduction() bool { return c.AppEnv == "production" }

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func getEnvInt(key string, def int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return def
}