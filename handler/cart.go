package handler

import (
	"fmt"
	"net/http"
	"strconv"
	"wa-ai-bot/database"
	"wa-ai-bot/models"
	"wa-ai-bot/service"

	"github.com/gin-gonic/gin"
)

// resolveCartIdentity returns the account ID to scope the cart by, if logged in.
func resolveCartIdentity(c *gin.Context) *uint {
	if user := CurrentUser(c); user != nil {
		return &user.ID
	}
	return nil
}

func GetCart(c *gin.Context) {
	sessionID := c.Query("session_id")
	accountID := resolveCartIdentity(c)

	items, err := service.NewCartService().GetCart(sessionID, accountID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	total := 0
	for _, item := range items {
		total += item.Product.Price * item.Quantity
	}

	c.JSON(http.StatusOK, gin.H{"items": items, "total": total})
}

type addCartItemRequest struct {
	SessionID        string `json:"session_id" binding:"required"`
	ProductVariantID uint   `json:"product_variant_id" binding:"required"`
	Quantity         int    `json:"quantity"`
}

func AddCartItem(c *gin.Context) {
	var req addCartItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "session_id dan product_variant_id wajib diisi"})
		return
	}
	if req.Quantity <= 0 {
		req.Quantity = 1
	}

	var variant models.ProductVariant
	if err := database.DB.First(&variant, req.ProductVariantID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Varian produk tidak ditemukan"})
		return
	}

	accountID := resolveCartIdentity(c)
	item, err := service.NewCartService().AddItem(req.SessionID, accountID, variant.ProductID, variant.ID, req.Quantity)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, item)
}

func UpdateCartItem(c *gin.Context) {
	itemID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req struct {
		Quantity int `json:"quantity"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := service.NewCartService().UpdateQuantity(uint(itemID), req.Quantity); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

func RemoveCartItem(c *gin.Context) {
	itemID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := service.NewCartService().RemoveItem(uint(itemID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "removed"})
}

type checkoutRequest struct {
	SessionID     string `json:"session_id" binding:"required"`
	Name          string `json:"name" binding:"required"`
	Phone         string `json:"phone" binding:"required"`
	Address       string `json:"address" binding:"required"`
	PaymentMethod string `json:"payment_method" binding:"required"`
}

// Checkout requires a logged-in, email-verified account and converts the
// caller's cart into a multi-item Order, validating stock per line first.
func Checkout(c *gin.Context) {
	user := CurrentUser(c)
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Silakan login dulu untuk checkout"})
		return
	}
	if !user.EmailVerified {
		c.JSON(http.StatusForbidden, gin.H{"error": "Verifikasi email kamu dulu sebelum checkout"})
		return
	}

	var req checkoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nama, no HP, alamat, dan metode pembayaran wajib diisi"})
		return
	}

	cartSvc := service.NewCartService()
	items, err := cartSvc.GetCart(req.SessionID, &user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if len(items) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cart kamu kosong"})
		return
	}

	for _, item := range items {
		if item.ProductVariant.Stock < item.Quantity {
			c.JSON(http.StatusConflict, gin.H{"error": fmt.Sprintf("Stok %s (%s/%s) tidak cukup, tersisa %d",
				item.Product.Name, item.ProductVariant.Size, item.ProductVariant.Color, item.ProductVariant.Stock)})
			return
		}
	}

	settingsSvc := service.NewSettingsService()
	settings, err := settingsSvc.GetSettings()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	customerSvc := service.NewCustomerService()
	customer, err := customerSvc.GetOrCreate(req.SessionID, req.Name, req.Phone, req.Address)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	database.DB.Model(&models.Customer{}).Where("id = ?", customer.ID).Update("account_id", user.ID)

	lines := make([]service.OrderLineInput, 0, len(items))
	for _, item := range items {
		lines = append(lines, service.OrderLineInput{
			ProductID:        item.ProductID,
			ProductVariantID: item.ProductVariantID,
			Quantity:         item.Quantity,
			UnitPrice:        item.Product.Price,
		})
	}

	orderSvc := service.NewOrderService()
	order, err := orderSvc.CreateOrder(service.CreateOrderInput{
		UserID:        req.SessionID,
		CustomerID:    customer.ID,
		Items:         lines,
		ShippingCost:  settings.ShippingCost,
		PaymentMethod: req.PaymentMethod,
		Address:       req.Address,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	cartSvc.ClearCart(req.SessionID, &user.ID)

	c.JSON(http.StatusCreated, gin.H{
		"order_number":         order.OrderNumber,
		"total_amount":         order.TotalAmount,
		"payment_instructions": buildPaymentInstructions(req.PaymentMethod, *settings),
		"payment_deadline_hours": settings.PaymentDeadlineHours,
	})
}
