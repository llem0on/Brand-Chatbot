package handler

import (
	"net/http"
	"wa-ai-bot/cloudinary"
	"wa-ai-bot/database"
	"wa-ai-bot/models"

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
// approve → status = sudah_bayar
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
	if err := database.DB.First(&order, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order tidak ditemukan"})
		return
	}
	if order.PaymentProofURL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Order belum ada bukti pembayaran"})
		return
	}

	switch req.Action {
	case "approve":
		database.DB.Model(&order).Updates(map[string]interface{}{
			"status":           models.OrderStatusPaid,
			"rejection_reason": "",
		})
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
