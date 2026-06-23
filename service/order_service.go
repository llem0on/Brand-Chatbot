package service

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"
	"time"
	"wa-ai-bot/database"
	"wa-ai-bot/models"

	"gorm.io/gorm"
)

type OrderService struct{}

func NewOrderService() *OrderService {
	return &OrderService{}
}

type CreateOrderInput struct {
	UserID           string
	CustomerID       uint
	ProductID        uint
	ProductVariantID uint
	Quantity         int
	UnitPrice        int
	ShippingCost     int
	PaymentMethod    string
	Address          string
}

// CreateOrder persists a confirmed order and decrements the purchased
// variant's stock atomically.
func (s *OrderService) CreateOrder(input CreateOrderInput) (*models.Order, error) {
	order := models.Order{
		OrderNumber:      generateOrderNumber(),
		UserID:           input.UserID,
		CustomerID:       input.CustomerID,
		ProductID:        input.ProductID,
		ProductVariantID: input.ProductVariantID,
		Quantity:         input.Quantity,
		UnitPrice:        input.UnitPrice,
		ShippingCost:     input.ShippingCost,
		TotalAmount:      input.UnitPrice*input.Quantity + input.ShippingCost,
		PaymentMethod:    input.PaymentMethod,
		Address:          input.Address,
		Status:           models.OrderStatusAwaitingPayment,
	}

	if err := database.DB.Create(&order).Error; err != nil {
		return nil, err
	}

	if err := database.DB.Model(&models.ProductVariant{}).
		Where("id = ?", input.ProductVariantID).
		Update("stock", gorm.Expr("stock - ?", input.Quantity)).Error; err != nil {
		return nil, err
	}

	return &order, nil
}

func generateOrderNumber() string {
	b := make([]byte, 2)
	rand.Read(b)
	return fmt.Sprintf("ORD-%s-%s", time.Now().Format("20060102"), strings.ToUpper(hex.EncodeToString(b)))
}
