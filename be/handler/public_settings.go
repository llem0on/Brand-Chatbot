package handler

import (
	"net/http"
	"wa-ai-bot/service"

	"github.com/gin-gonic/gin"
)

// GetPublicCheckoutSettings exposes only what the cart page needs to render
// (shipping cost, which payment methods are enabled) - never the bank
// account number / QRIS image / closing message, which only come back in
// the checkout response after an order is actually placed.
func GetPublicCheckoutSettings(c *gin.Context) {
	settings, err := service.NewSettingsService().GetSettings()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"shipping_cost":        settings.ShippingCost,
		"enable_bank_transfer": settings.EnableBankTransfer,
		"enable_qris":          settings.EnableQRIS,
	})
}
