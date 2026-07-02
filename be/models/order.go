package models

import "time"

// Order is a checkout header that can contain multiple line items (OrderItem).
type Order struct {
	ID            uint        `gorm:"primaryKey" json:"id"`
	OrderNumber   string      `gorm:"uniqueIndex;size:30" json:"order_number"`
	UserID        string      `gorm:"index;size:191" json:"user_id"` // session_id or WhatsApp phone number
	CustomerID    uint        `gorm:"not null" json:"customer_id"`
	Customer      Customer    `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
	Items         []OrderItem `gorm:"foreignKey:OrderID" json:"items,omitempty"`
	ShippingCost  int         `json:"shipping_cost"`
	TotalAmount   int         `json:"total_amount"`
	PaymentMethod string      `gorm:"size:30" json:"payment_method"` // transfer_bank, qris
	Address       string      `gorm:"type:text" json:"address"`
	Status          string    `gorm:"default:'menunggu_pembayaran';size:30" json:"status"`
	PaymentProofURL string    `gorm:"type:text" json:"payment_proof_url"`
	RejectionReason string    `gorm:"type:text" json:"rejection_reason"`
	// Biteship shipping fields
	PostalCode      string    `gorm:"size:10" json:"postal_code"`
	CourierCode     string    `gorm:"size:50" json:"courier_code"`
	CourierService  string    `gorm:"size:50" json:"courier_service"`
	CourierName     string    `gorm:"size:150" json:"courier_name"`
	BiteshipOrderID string    `gorm:"size:100" json:"biteship_order_id"`
	WaybillID       string    `gorm:"size:100" json:"waybill_id"`
	ShippingStatus  string    `gorm:"size:50" json:"shipping_status"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// OrderItem is a single product+variant line within an Order.
type OrderItem struct {
	ID               uint           `gorm:"primaryKey" json:"id"`
	OrderID          uint           `gorm:"not null;index" json:"order_id"`
	ProductID        uint           `gorm:"not null" json:"product_id"`
	Product          Product        `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	ProductVariantID uint           `gorm:"not null" json:"product_variant_id"`
	ProductVariant   ProductVariant `gorm:"foreignKey:ProductVariantID" json:"product_variant,omitempty"`
	Quantity         int            `gorm:"default:1" json:"quantity"`
	UnitPrice        int            `json:"unit_price"`
	Subtotal         int            `json:"subtotal"`
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
