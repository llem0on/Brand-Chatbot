package handler

import (
	"log"
	"net/http"
	"os"
	"wa-ai-bot/database"
	"wa-ai-bot/models"

	"github.com/gin-gonic/gin"
)

type biteshipWebhookPayload struct {
	Event string `json:"event"`
	Order struct {
		ID        string `json:"id"`
		WaybillID string `json:"waybill_id"`
		Status    string `json:"status"`
	} `json:"order"`
}

// HandleBiteshipWebhook receives shipment status updates from Biteship and
// syncs them to the corresponding Order row. Register your server's
// /webhook/biteship URL in the Biteship dashboard.
func HandleBiteshipWebhook(c *gin.Context) {
	// Verify signature header if BITESHIP_WEBHOOK_SECRET is configured
	if secret := os.Getenv("BITESHIP_WEBHOOK_SECRET"); secret != "" {
		headerKey := os.Getenv("BITESHIP_WEBHOOK_HEADER")
		if headerKey == "" {
			headerKey = "X-Webhook-Secret"
		}
		if c.GetHeader(headerKey) != secret {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid webhook secret"})
			return
		}
	}

	var payload biteshipWebhookPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("biteship webhook: event=%s order=%s status=%s", payload.Event, payload.Order.ID, payload.Order.Status)

	if payload.Order.ID == "" {
		c.JSON(http.StatusOK, gin.H{"ok": true})
		return
	}

	updates := map[string]interface{}{
		"shipping_status": payload.Order.Status,
	}
	if payload.Order.WaybillID != "" {
		updates["waybill_id"] = payload.Order.WaybillID
	}

	// Map Biteship shipment status → order status
	switch payload.Order.Status {
	case "delivered":
		updates["status"] = models.OrderStatusCompleted
	case "cancelled", "rejected":
		updates["status"] = models.OrderStatusCancelled
	case "confirmed", "allocated", "picking_up", "picked", "dropping_off", "return_in_transit":
		updates["status"] = models.OrderStatusShipped
	}

	if err := database.DB.Model(&models.Order{}).
		Where("biteship_order_id = ?", payload.Order.ID).
		Updates(updates).Error; err != nil {
		log.Printf("biteship webhook: DB update failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}
