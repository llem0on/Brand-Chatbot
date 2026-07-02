package models

import "time"

type ConversationState struct {
	ID                uint       `gorm:"primaryKey" json:"id"`
	UserID            string     `gorm:"uniqueIndex;not null;size:191" json:"user_id"`
	AccountID         *uint      `gorm:"index" json:"account_id,omitempty"` // linked once the web visitor logs in
	Channel           string     `gorm:"default:'web';size:20" json:"channel"`  // web, whatsapp
	CurrentFlow       string     `gorm:"default:'new'" json:"current_flow"`     // new, chat, ordering
	OrderStep         string     `gorm:"size:30" json:"order_step"`             // pilih_produk, pilih_varian, data_pembeli, pilih_bayar, konfirmasi, konfirmasi_batal
	IsEscalated       bool       `gorm:"default:false" json:"is_escalated"`
	EscalationSummary string     `gorm:"type:text" json:"escalation_summary"`
	EscalatedAt       *time.Time `json:"escalated_at"`
	Context           string     `gorm:"type:text" json:"context"` // JSON-serialized order draft while ordering
	UpdatedAt         time.Time  `json:"updated_at"`
}

// Flow constants
const (
	FlowNew      = "new"
	FlowChat     = "chat"
	FlowOrdering = "ordering"
)

// Order step constants
const (
	OrderStepPilihProduk    = "pilih_produk"
	OrderStepPilihVarian    = "pilih_varian"
	OrderStepDataPembeli    = "data_pembeli"
	OrderStepPilihBayar     = "pilih_bayar"
	OrderStepKonfirmasi     = "konfirmasi"
	OrderStepKonfirmasiBatal = "konfirmasi_batal"
)

// Channel constants
const (
	ChannelWeb      = "web"
	ChannelWhatsApp = "whatsapp"
)
