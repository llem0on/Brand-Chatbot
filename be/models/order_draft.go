package models

// OrderDraft is the in-progress order state for a conversation, serialized as
// JSON into ConversationState.Context while CurrentFlow == FlowOrdering.
type OrderDraft struct {
	ProductID     uint   `json:"product_id,omitempty"`
	ProductCode   string `json:"product_code,omitempty"`
	ProductName   string `json:"product_name,omitempty"`
	Size          string `json:"size,omitempty"`
	Color         string `json:"color,omitempty"`
	Quantity      int    `json:"quantity,omitempty"`
	Name          string `json:"name,omitempty"`
	Phone         string `json:"phone,omitempty"`
	Address       string `json:"address,omitempty"`
	PaymentMethod string `json:"payment_method,omitempty"`
	PreOrder      bool   `json:"pre_order,omitempty"`
}
