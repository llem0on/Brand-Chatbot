package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"wa-ai-bot/models"

	_ "github.com/go-sql-driver/mysql"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Init() error {
	host := envDefault("DB_HOST", "127.0.0.1")
	port := envDefault("DB_PORT", "3307")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	name := envDefault("DB_NAME", "wa_ai_bot")

	if err := ensureDatabaseExists(user, password, host, port, name); err != nil {
		return fmt.Errorf("failed to ensure database exists: %w", err)
	}

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local", user, password, host, port, name)

	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		return err
	}

	// Auto migrate
	err = DB.AutoMigrate(
		&models.FAQ{},
		&models.User{},
		&models.UserSession{},
		&models.ConversationState{},
		&models.ChatMessage{},
		&models.ProductCategory{},
		&models.Product{},
		&models.ProductVariant{},
		&models.Promotion{},
		&models.Customer{},
		&models.Order{},
		&models.OrderItem{},
		&models.CartItem{},
		&models.PurchaseSettings{},
		&models.FilterValue{},
	)
	if err != nil {
		return err
	}

	// Seed initial data
	if err := SeedFAQs(); err != nil {
		log.Printf("Warning: Failed to seed FAQs: %v", err)
	}
	if err := SeedProducts(); err != nil {
		log.Printf("Warning: Failed to seed products: %v", err)
	}
	if err := BackfillProductAttributes(); err != nil {
		log.Printf("Warning: Failed to backfill product attributes: %v", err)
	}
	if err := BackfillProductImages(); err != nil {
		log.Printf("Warning: Failed to backfill product images: %v", err)
	}
	if err := SeedMoreProducts(); err != nil {
		log.Printf("Warning: Failed to seed more products: %v", err)
	}
	if err := SeedPromotions(); err != nil {
		log.Printf("Warning: Failed to seed promotions: %v", err)
	}
	if err := SeedProductVariants(); err != nil {
		log.Printf("Warning: Failed to seed product variants: %v", err)
	}
	if err := SeedPurchaseSettings(); err != nil {
		log.Printf("Warning: Failed to seed purchase settings: %v", err)
	}
	if err := SeedProductDiscounts(); err != nil {
		log.Printf("Warning: Failed to seed product discounts: %v", err)
	}
	if err := SeedFilterValues(); err != nil {
		log.Printf("Warning: Failed to seed filter values: %v", err)
	}

	log.Println("Database initialized successfully")
	return nil
}

// ensureDatabaseExists creates the target schema if it doesn't exist yet
func ensureDatabaseExists(user, password, host, port, name string) error {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/", user, password, host, port)
	sqlDB, err := sql.Open("mysql", dsn)
	if err != nil {
		return err
	}
	defer sqlDB.Close()

	_, err = sqlDB.Exec(fmt.Sprintf("CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET utf8mb4", name))
	return err
}

func envDefault(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func GetDB() *gorm.DB {
	return DB
}
