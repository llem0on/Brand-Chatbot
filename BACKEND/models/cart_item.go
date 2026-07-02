package models

import "time"

// CartItem is a pre-checkout cart line. Identified by UserID (anonymous
// session_id) until the visitor logs in, at which point AccountID gets
// populated so the cart survives across devices/sessions.
type CartItem struct {
	ID               uint           `gorm:"primaryKey" json:"id"`
	UserID           string         `gorm:"index;size:191" json:"user_id"`
	AccountID        *uint          `gorm:"index" json:"account_id,omitempty"`
	ProductID        uint           `gorm:"not null" json:"product_id"`
	Product          Product        `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	ProductVariantID uint           `gorm:"not null" json:"product_variant_id"`
	ProductVariant   ProductVariant `gorm:"foreignKey:ProductVariantID" json:"product_variant,omitempty"`
	Quantity         int            `gorm:"default:1" json:"quantity"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
}
