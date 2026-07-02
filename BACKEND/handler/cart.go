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

type bulkSyncRequest struct {
	Email string `json:"email" binding:"required"`
	Items []struct {
		ProductVariantID uint `json:"product_variant_id"`
		Quantity         int  `json:"quantity"`
	} `json:"items"`
}

// BulkSyncCart replaces the backend cart for a Google-authenticated user (keyed
// by email as session_id). Called on login (merge) and logout (save-then-clear).
func BulkSyncCart(c *gin.Context) {
	var req bulkSyncRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email wajib diisi"})
		return
	}

	database.DB.Where("user_id = ? AND account_id IS NULL", req.Email).Delete(&models.CartItem{})
	for _, it := range req.Items {
		if it.Quantity <= 0 {
			continue
		}
		var variant models.ProductVariant
		if err := database.DB.First(&variant, it.ProductVariantID).Error; err != nil {
			continue
		}
		database.DB.Create(&models.CartItem{
			UserID:           req.Email,
			ProductID:        variant.ProductID,
			ProductVariantID: variant.ID,
			Quantity:         it.Quantity,
		})
	}

	items, _ := service.NewCartService().GetCart(req.Email, nil)
	c.JSON(http.StatusOK, gin.H{"ok": true, "items": items})
}

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

type checkoutLineReq struct {
	ProductVariantID uint `json:"product_variant_id" binding:"required"`
	Quantity         int  `json:"quantity" binding:"required,min=1"`
}

type checkoutRequest struct {
	Name           string            `json:"name" binding:"required"`
	Phone          string            `json:"phone" binding:"required"`
	Address        string            `json:"address" binding:"required"`
	PostalCode     string            `json:"postal_code"`
	CourierCode    string            `json:"courier_code"`
	CourierService string            `json:"courier_service"`
	CourierName    string            `json:"courier_name"`
	ShippingCost   *int              `json:"shipping_cost"` // pointer: nil = use settings default
	PaymentMethod  string            `json:"payment_method" binding:"required"`
	Items          []checkoutLineReq `json:"items" binding:"required,min=1"`
	Email          string            `json:"email"`
}

// Checkout accepts cart items from the request body (stored client-side in localStorage),
// validates stock, and creates an Order. No login required — identified by phone number.
func Checkout(c *gin.Context) {
	var req checkoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nama, no HP, alamat, metode pembayaran, dan items wajib diisi"})
		return
	}

	// Resolve each variant, validate stock, and build order lines in one pass
	type resolvedLine struct {
		service.OrderLineInput
	}
	lines := make([]service.OrderLineInput, 0, len(req.Items))
	for _, line := range req.Items {
		var variant models.ProductVariant
		if err := database.DB.Preload("Product").First(&variant, line.ProductVariantID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("Varian produk ID %d tidak ditemukan", line.ProductVariantID)})
			return
		}
		if variant.Stock < line.Quantity {
			c.JSON(http.StatusConflict, gin.H{"error": fmt.Sprintf("Stok %s (%s/%s) tidak cukup, tersisa %d",
				variant.Product.Name, variant.Size, variant.Color, variant.Stock)})
			return
		}
		lines = append(lines, service.OrderLineInput{
			ProductID:        variant.ProductID,
			ProductVariantID: variant.ID,
			Quantity:         line.Quantity,
			UnitPrice:        variant.Product.Price,
		})
	}

	settingsSvc := service.NewSettingsService()
	settings, err := settingsSvc.GetSettings()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// For Google OAuth users, identify by email so each account gets its own
	// customer record regardless of the dummy phone value.
	customerUserID := req.Phone
	if req.Email != "" {
		customerUserID = req.Email
	}

	customerSvc := service.NewCustomerService()
	customer, err := customerSvc.GetOrCreate(customerUserID, req.Name, req.Phone, req.Address)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if req.Email != "" && customer.Email != req.Email {
		database.DB.Model(customer).Update("email", req.Email)
	}

	shippingCost := settings.ShippingCost
	if req.ShippingCost != nil {
		shippingCost = *req.ShippingCost
	}

	orderSvc := service.NewOrderService()
	order, err := orderSvc.CreateOrder(service.CreateOrderInput{
		UserID:         customerUserID,
		CustomerID:     customer.ID,
		Items:          lines,
		ShippingCost:   shippingCost,
		PaymentMethod:  req.PaymentMethod,
		Address:        req.Address,
		PostalCode:     req.PostalCode,
		CourierCode:    req.CourierCode,
		CourierService: req.CourierService,
		CourierName:    req.CourierName,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"order_number":           order.OrderNumber,
		"total_amount":           order.TotalAmount,
		"shipping_cost":          settings.ShippingCost,
		"payment_instructions":   buildPaymentInstructions(req.PaymentMethod, *settings),
		"payment_deadline_hours": settings.PaymentDeadlineHours,
	})
}

// GetOrdersByEmail returns all orders for a customer identified by email.
// Called only from the Next.js /api/my-orders server route (session-gated).
func GetOrdersByEmail(c *gin.Context) {
	email := c.Query("email")
	if email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email wajib diisi"})
		return
	}

	var customer models.Customer
	if err := database.DB.Where("email = ?", email).First(&customer).Error; err != nil {
		c.JSON(http.StatusOK, []models.Order{})
		return
	}

	var orders []models.Order
	database.DB.Where("customer_id = ?", customer.ID).
		Preload("Items.Product").
		Preload("Items.ProductVariant").
		Order("created_at DESC").
		Find(&orders)

	c.JSON(http.StatusOK, orders)
}

// GetOrdersByPhone returns all orders for a customer identified by phone number.
func GetOrdersByPhone(c *gin.Context) {
	phone := c.Query("phone")
	if phone == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "phone wajib diisi"})
		return
	}

	var customer models.Customer
	if err := database.DB.Where("phone = ?", phone).First(&customer).Error; err != nil {
		c.JSON(http.StatusOK, []models.Order{})
		return
	}

	var orders []models.Order
	database.DB.Where("customer_id = ?", customer.ID).
		Preload("Items.Product").
		Preload("Items.ProductVariant").
		Order("created_at DESC").
		Find(&orders)

	c.JSON(http.StatusOK, orders)
}
