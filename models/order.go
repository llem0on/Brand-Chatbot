package models

import "time"

type Order struct {
	ID               uint           `gorm:"primaryKey" json:"id"`
	OrderNumber      string         `gorm:"uniqueIndex;size:30" json:"order_number"`
	UserID           string         `gorm:"index;size:191" json:"user_id"`
	CustomerID       uint           `gorm:"not null" json:"customer_id"`
	Customer         Customer       `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
	ProductID        uint           `gorm:"not null" json:"product_id"`
	Product          Product        `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	ProductVariantID uint           `gorm:"not null" json:"product_variant_id"`
	ProductVariant   ProductVariant `gorm:"foreignKey:ProductVariantID" json:"product_variant,omitempty"`
	Quantity         int            `gorm:"default:1" json:"quantity"`
	UnitPrice        int            `json:"unit_price"`
	ShippingCost     int            `json:"shipping_cost"`
	TotalAmount      int            `json:"total_amount"`
	PaymentMethod    string         `gorm:"size:30" json:"payment_method"` // transfer_bank, qris
	Address          string         `gorm:"type:text" json:"address"`
	Status           string         `gorm:"default:'menunggu_pembayaran';size:30" json:"status"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
}

// Order status constants
const (
	OrderStatusAwaitingPayment = "menunggu_pembayaran"
	OrderStatusPaid            = "sudah_bayar"
	OrderStatusShipped         = "dikirim"
	OrderStatusCompleted       = "selesai"
	OrderStatusCancelled       = "dibatalkan"
)

// Payment method constants
const (
	PaymentMethodTransferBank = "transfer_bank"
	PaymentMethodQRIS         = "qris"
)
