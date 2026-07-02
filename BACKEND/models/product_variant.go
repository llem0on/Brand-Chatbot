package models

import "time"

// ProductVariant tracks stock per size+color combination of a Product.
// Product.Sizes/Colors remain the "master list" of options; variants are the
// actual sellable combinations with their own stock count.
type ProductVariant struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	ProductID uint      `gorm:"not null;uniqueIndex:idx_product_variant" json:"product_id"`
	Product   Product   `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	Size      string    `gorm:"not null;size:50;uniqueIndex:idx_product_variant" json:"size"`
	Color     string    `gorm:"not null;size:50;uniqueIndex:idx_product_variant" json:"color"`
	Stock     int       `gorm:"default:0" json:"stock"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
