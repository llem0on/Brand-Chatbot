package models

import "time"

// PurchaseSettings is a singleton row holding business config for the
// purchase flow, editable by the admin without touching code.
type PurchaseSettings struct {
	ID                   uint      `gorm:"primaryKey" json:"id"`
	BankName             string    `json:"bank_name"`
	BankAccountNumber    string    `json:"bank_account_number"`
	BankAccountHolder    string    `json:"bank_account_holder"`
	EnableBankTransfer   bool      `gorm:"default:true" json:"enable_bank_transfer"`
	QRISImageURL         string    `gorm:"type:text" json:"qris_image_url"`
	EnableQRIS           bool      `gorm:"default:true" json:"enable_qris"`
	ShippingCost         int       `gorm:"default:0" json:"shipping_cost"`
	PaymentDeadlineHours int       `gorm:"default:24" json:"payment_deadline_hours"`
	ClosingMessage       string    `gorm:"type:text" json:"closing_message"`
	UpdatedAt            time.Time `json:"updated_at"`
}
