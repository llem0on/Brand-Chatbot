package models

import "time"

// User is a web storefront login account (separate from the anonymous
// session/WhatsApp-phone identity used by the chatbot).
type User struct {
	ID                  uint       `gorm:"primaryKey" json:"id"`
	Email               string     `gorm:"uniqueIndex;size:191;not null" json:"email"`
	PasswordHash        string     `gorm:"not null" json:"-"`
	EmailVerified       bool       `gorm:"default:false" json:"email_verified"`
	VerificationToken   string     `gorm:"size:191;index" json:"-"`
	VerificationSentAt  *time.Time `json:"-"`
	CreatedAt           time.Time  `json:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at"`
}

// UserSession is a server-side login session referenced by an opaque cookie token.
type UserSession struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Token     string    `gorm:"uniqueIndex;size:191;not null" json:"-"`
	UserID    uint      `gorm:"not null;index" json:"user_id"`
	User      User      `gorm:"foreignKey:UserID" json:"-"`
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}
