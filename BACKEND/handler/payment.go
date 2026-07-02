package handler

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"wa-ai-bot/biteship"
	"wa-ai-bot/cloudinary"
	"wa-ai-bot/database"
	"wa-ai-bot/models"
	"wa-ai-bot/service"

	"github.com/gin-gonic/gin"
)

// UploadPaymentProof accepts a multipart image upload for an order's payment proof.
// Public endpoint — authenticated by order number (only the person who placed the order
// knows their order number).
func UploadPaymentProof(c *gin.Context) {
	orderNumber := c.Param("orderNumber")

	var order models.Order
	if err := database.DB.Where("order_number = ?", orderNumber).First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order tidak ditemukan"})
		return
	}
	if order.Status != models.OrderStatusAwaitingPayment {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bukti pembayaran sudah tidak bisa diubah untuk pesanan ini"})
		return
	}

	file, header, err := c.Request.FormFile("proof")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File bukti pembayaran wajib diupload"})
		return
	}
	defer file.Close()

	url, err := cloudinary.UploadImage(file, header.Filename, "payment_proofs")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Upload gagal: " + err.Error()})
		return
	}

	if err := database.DB.Model(&order).Updates(map[string]interface{}{
		"payment_proof_url": url,
		"rejection_reason":  "",
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"url": url})
}

// VerifyPayment is the admin action to approve or reject an uploaded payment proof.
// approve → status = sudah_bayar (or dikirim if Biteship shipment created)
// reject  → status = menunggu_pembayaran, proof cleared, rejection_reason set
func VerifyPayment(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Action string `json:"action" binding:"required"` // "approve" | "reject"
		Reason string `json:"reason"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var order models.Order
	if err := database.DB.Preload("Customer").Preload("Items.Product").First(&order, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order tidak ditemukan"})
		return
	}
	if order.PaymentProofURL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Order belum ada bukti pembayaran"})
		return
	}

	switch req.Action {
	case "approve":
		updates := map[string]interface{}{
			"status":           models.OrderStatusPaid,
			"rejection_reason": "",
		}

		// Auto-create Biteship shipment when courier was selected at checkout
		if order.CourierCode != "" {
			settings, _ := service.NewSettingsService().GetSettings()
			if settings != nil {
				biteshipID, waybillID, err := submitBiteshipOrder(&order, settings)
				if err != nil {
					log.Printf("biteship: create order failed for %s: %v", order.OrderNumber, err)
				} else if biteshipID != "" {
					updates["biteship_order_id"] = biteshipID
					updates["waybill_id"] = waybillID
					updates["status"] = models.OrderStatusShipped
				}
			}
		}

		database.DB.Model(&order).Updates(updates)
	case "reject":
		if req.Reason == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Alasan penolakan wajib diisi"})
			return
		}
		database.DB.Model(&order).Updates(map[string]interface{}{
			"payment_proof_url": "",
			"rejection_reason":  req.Reason,
			"status":            models.OrderStatusAwaitingPayment,
		})
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "action harus 'approve' atau 'reject'"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "ok"})
}

// submitBiteshipOrder creates a Biteship shipment order after payment is approved.
// Returns ("", "", nil) when Biteship is not configured — caller treats that as a no-op.
func submitBiteshipOrder(order *models.Order, settings *models.PurchaseSettings) (string, string, error) {
	client := biteship.NewClient()
	if !client.Enabled() || settings.OriginPostalCode == "" {
		return "", "", nil
	}

	weightGram := settings.DefaultItemWeightGram
	if weightGram <= 0 {
		weightGram = 300
	}

	var items []biteship.OrderItem
	for _, item := range order.Items {
		items = append(items, biteship.OrderItem{
			Name:     item.Product.Name,
			Value:    item.UnitPrice,
			Weight:   weightGram,
			Quantity: item.Quantity,
		})
	}

	brandName := os.Getenv("BRAND_NAME")
	if brandName == "" {
		brandName = "Toko"
	}

	resp, err := client.CreateOrder(biteship.CreateOrderRequest{
		ShipperContactName:      settings.OriginContactName,
		ShipperContactPhone:     settings.OriginContactPhone,
		ShipperOrganization:     brandName,
		OriginContactName:       settings.OriginContactName,
		OriginContactPhone:      settings.OriginContactPhone,
		OriginAddress:           settings.OriginAddress,
		OriginPostalCode:        settings.OriginPostalCode,
		DestinationContactName:  order.Customer.Name,
		DestinationContactPhone: order.Customer.Phone,
		DestinationAddress:      order.Address,
		DestinationPostalCode:   order.PostalCode,
		CourierCompany:          order.CourierCode,
		CourierType:             order.CourierService,
		DeliveryType:            "now",
		OrderNote:               order.OrderNumber,
		Items:                   items,
	})
	if err != nil {
		return "", "", err
	}
	if !resp.Success {
		return "", "", fmt.Errorf("%s", resp.Message)
	}
	return resp.ID, resp.WaybillID, nil
}
