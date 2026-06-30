package models

import "time"

type Promotion struct {
	ID          uint       `gorm:"primaryKey" json:"id"`
	Title       string     `gorm:"not null" json:"title"`
	Description string     `gorm:"type:text" json:"description"`
	Type        string     `gorm:"default:'promo'" json:"type"` // promo, event
	StartDate   *time.Time `json:"start_date"`
	EndDate     *time.Time `json:"end_date"`
	Active      bool       `gorm:"default:true" json:"active"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// Promotion type constants
const (
	PromotionTypePromo = "promo"
	PromotionTypeEvent = "event"
)
