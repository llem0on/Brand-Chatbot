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
	// Biteship shipping configuration
	OriginPostalCode      string `gorm:"size:10" json:"origin_postal_code"`
	OriginAddress         string `gorm:"type:text" json:"origin_address"`
	OriginContactName     string `gorm:"size:100" json:"origin_contact_name"`
	OriginContactPhone    string `gorm:"size:30" json:"origin_contact_phone"`
	DefaultItemWeightGram int    `gorm:"default:300" json:"default_item_weight_gram"`
	BiteshipCouriers      string `gorm:"default:'jne,sicepat,j&t,anteraja'" json:"biteship_couriers"`
	UpdatedAt             time.Time `json:"updated_at"`
}
