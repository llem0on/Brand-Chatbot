package models

import "time"

type ChatMessage struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    string    `gorm:"not null;index;size:191" json:"user_id"`
	Sender    string    `gorm:"not null;size:20" json:"sender"` // user, bot, admin
	Content   string    `gorm:"type:text" json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

// Sender constants
const (
	SenderUser  = "user"
	SenderBot   = "bot"
	SenderAdmin = "admin"
)
