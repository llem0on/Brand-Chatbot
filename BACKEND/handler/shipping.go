package handler

import (
	"net/http"
	"wa-ai-bot/biteship"
	"wa-ai-bot/database"
	"wa-ai-bot/models"
	"wa-ai-bot/service"

	"github.com/gin-gonic/gin"
)

type shippingRateItem struct {
	VariantID uint `json:"variant_id" binding:"required"`
	Quantity  int  `json:"quantity" binding:"required,min=1"`
}

type shippingRateRequest struct {
	PostalCode string             `json:"postal_code" binding:"required"`
	Items      []shippingRateItem `json:"items" binding:"required,min=1"`
}

// GetShippingRates proxies to Biteship rate API. Returns available couriers
// with price and ETA for the destination postal code.
func GetShippingRates(c *gin.Context) {
	var req shippingRateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	settings, err := service.NewSettingsService().GetSettings()
	if err != nil || settings.OriginPostalCode == "" {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Layanan pengiriman belum dikonfigurasi"})
		return
	}

	client := biteship.NewClient()
	if !client.Enabled() {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Biteship belum dikonfigurasi"})
		return
	}

	weightGram := settings.DefaultItemWeightGram
	if weightGram <= 0 {
		weightGram = 300
	}
	couriers := settings.BiteshipCouriers
	if couriers == "" {
		couriers = "jne,sicepat,j&t,anteraja"
	}

	var rateItems []biteship.RateItem
	for _, it := range req.Items {
		var variant models.ProductVariant
		if err := database.DB.Preload("Product").First(&variant, it.VariantID).Error; err != nil {
			continue
		}
		rateItems = append(rateItems, biteship.RateItem{
			Name:     variant.Product.Name,
			Value:    variant.Product.Price,
			Weight:   weightGram,
			Quantity: it.Quantity,
		})
	}
	if len(rateItems) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tidak ada item valid"})
		return
	}

	resp, err := client.GetRates(biteship.RateRequest{
		OriginPostalCode:      settings.OriginPostalCode,
		DestinationPostalCode: req.PostalCode,
		Couriers:              couriers,
		Items:                 rateItems,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil tarif: " + err.Error()})
		return
	}
	if !resp.Success {
		c.JSON(http.StatusBadRequest, gin.H{"error": resp.Message})
		return
	}

	c.JSON(http.StatusOK, gin.H{"pricing": resp.Pricing})
}
