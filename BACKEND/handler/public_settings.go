package handler

import (
	"net/http"
	"wa-ai-bot/biteship"
	"wa-ai-bot/service"

	"github.com/gin-gonic/gin"
)

// GetPublicCheckoutSettings exposes what the cart/checkout page needs:
// payment methods, bank details for display, and whether Biteship dynamic
// shipping is active (so the frontend can show the courier-selection flow).
func GetPublicCheckoutSettings(c *gin.Context) {
	settings, err := service.NewSettingsService().GetSettings()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	client := biteship.NewClient()
	biteshipEnabled := client.Enabled() && settings.OriginPostalCode != ""

	c.JSON(http.StatusOK, gin.H{
		"shipping_cost":        settings.ShippingCost,
		"enable_bank_transfer": settings.EnableBankTransfer,
		"enable_qris":          settings.EnableQRIS,
		"bank_name":            settings.BankName,
		"bank_account_number":  settings.BankAccountNumber,
		"bank_account_holder":  settings.BankAccountHolder,
		"qris_image_url":       settings.QRISImageURL,
		"biteship_enabled":     biteshipEnabled,
	})
}
