package models

import "time"

type FAQ struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Question     string    `gorm:"not null" json:"question"`
	Answer       string    `gorm:"not null;type:text" json:"answer"`
	Keywords     string    `gorm:"type:text" json:"keywords"`
	Category     string    `gorm:"default:'general'" json:"category"`
	DisplayOrder int       `gorm:"default:0" json:"display_order"`
	Active       bool      `gorm:"default:true" json:"active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
