package models

import "time"

// Customer is the dedicated customer record, separate from ConversationState.
// CustomerCode is a unique internal identifier (not a government ID) generated
// the first time someone places an order.
type Customer struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	CustomerCode string    `gorm:"uniqueIndex;size:30" json:"customer_code"`
	UserID       string    `gorm:"uniqueIndex;size:191" json:"user_id"` // session_id or WhatsApp phone number
	AccountID    *uint     `gorm:"index" json:"account_id,omitempty"`   // linked once the web visitor logs in
	Name         string    `gorm:"not null" json:"name"`
	Email        string    `gorm:"index;size:191" json:"email"`
	Phone        string    `json:"phone"`
	Address      string    `gorm:"type:text" json:"address"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
