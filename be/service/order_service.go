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

// OrderLineInput is one product+variant line of a multi-item order.
type OrderLineInput struct {
	ProductID        uint
	ProductVariantID uint
	Quantity         int
	UnitPrice        int
}

type CreateOrderInput struct {
	UserID         string
	CustomerID     uint
	Items          []OrderLineInput
	ShippingCost   int
	PaymentMethod  string
	Address        string
	PostalCode     string
	CourierCode    string
	CourierService string
	CourierName    string
}

// CreateOrder persists a confirmed multi-item order and decrements the
// purchased variants' stock atomically per line. Order and OrderItem rows
// are created as separate flat inserts (not via GORM's nested-association
// Create) - letting GORM auto-save Product/ProductVariant associations on a
// populated-by-FK-only struct makes it try to upsert those as new zero-value
// rows, which fails on their NOT NULL columns.
func (s *OrderService) CreateOrder(input CreateOrderInput) (*models.Order, error) {
	var itemsTotal int
	for _, line := range input.Items {
		itemsTotal += line.UnitPrice * line.Quantity
	}

	order := models.Order{
		OrderNumber:    generateOrderNumber(),
		UserID:         input.UserID,
		CustomerID:     input.CustomerID,
		ShippingCost:   input.ShippingCost,
		TotalAmount:    itemsTotal + input.ShippingCost,
		PaymentMethod:  input.PaymentMethod,
		Address:        input.Address,
		PostalCode:     input.PostalCode,
		CourierCode:    input.CourierCode,
		CourierService: input.CourierService,
		CourierName:    input.CourierName,
		Status:         models.OrderStatusAwaitingPayment,
	}

	if err := database.DB.Omit("Customer").Create(&order).Error; err != nil {
		return nil, err
	}

	for _, line := range input.Items {
		item := models.OrderItem{
			OrderID:          order.ID,
			ProductID:        line.ProductID,
			ProductVariantID: line.ProductVariantID,
			Quantity:         line.Quantity,
			UnitPrice:        line.UnitPrice,
			Subtotal:         line.UnitPrice * line.Quantity,
		}
		if err := database.DB.Omit("Product", "ProductVariant").Create(&item).Error; err != nil {
			return nil, err
		}

		if err := database.DB.Model(&models.ProductVariant{}).
			Where("id = ?", line.ProductVariantID).
			Update("stock", gorm.Expr("stock - ?", line.Quantity)).Error; err != nil {
			return nil, err
		}
	}

	return &order, nil
}

func generateOrderNumber() string {
	b := make([]byte, 2)
	rand.Read(b)
	return fmt.Sprintf("ORD-%s-%s", time.Now().Format("20060102"), strings.ToUpper(hex.EncodeToString(b)))
}
