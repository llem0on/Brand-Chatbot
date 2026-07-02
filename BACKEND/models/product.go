package models

import "time"

type Product struct {
	ID          uint            `gorm:"primaryKey" json:"id"`
	CategoryID  uint            `gorm:"not null;index" json:"category_id"`
	Category    ProductCategory `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Code        string          `gorm:"not null;uniqueIndex;size:191" json:"code"`
	Name        string          `gorm:"not null" json:"name"`
	Description string          `gorm:"type:text" json:"description"`
	Price       int             `json:"price"`
	Sizes       string          `gorm:"type:text" json:"sizes"`    // comma separated, e.g. "S,M,L,XL"
	Colors      string          `gorm:"type:text" json:"colors"`   // comma separated, e.g. "Hitam,Putih,Navy"
	Material    string          `gorm:"size:100;index" json:"material"` // e.g. "Cotton Combed 30s"
	Gender      string          `gorm:"size:30;index" json:"gender"`    // Pria, Wanita, Unisex
	Stock       int             `gorm:"default:0" json:"stock"`
	DiscountPct int             `gorm:"default:0" json:"discount_pct"`
	ImageURL    string          `gorm:"type:text" json:"image_url"`
	Active      bool            `gorm:"default:true" json:"active"`
	Variants    []ProductVariant `gorm:"foreignKey:ProductID" json:"variants,omitempty"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
}
