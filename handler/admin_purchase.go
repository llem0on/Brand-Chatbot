package handler

import (
	"net/http"
	"strconv"
	"wa-ai-bot/database"
	"wa-ai-bot/models"

	"github.com/gin-gonic/gin"
)

// GetOrders returns all orders with customer/product/variant preloaded
func GetOrders(c *gin.Context) {
	var orders []models.Order
	query := database.DB.Preload("Customer").Preload("Items.Product").Preload("Items.ProductVariant").Order("created_at DESC")

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Find(&orders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, orders)
}

// UpdateOrderStatus updates an order's fulfillment status
func UpdateOrderStatus(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result := database.DB.Model(&models.Order{}).Where("id = ?", id).Update("status", req.Status)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "status updated"})
}

// GetCustomers returns all customers
func GetCustomers(c *gin.Context) {
	var customers []models.Customer
	if err := database.DB.Order("created_at DESC").Find(&customers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, customers)
}

// GetSettings returns the purchase settings (bank/QRIS/ongkir/etc.)
func GetSettings(c *gin.Context) {
	var settings models.PurchaseSettings
	if err := database.DB.First(&settings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, settings)
}

// UpdateSettings updates the singleton purchase settings row
func UpdateSettings(c *gin.Context) {
	var settings models.PurchaseSettings
	if err := database.DB.First(&settings).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "settings not found"})
		return
	}

	if err := c.ShouldBindJSON(&settings); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Save(&settings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, settings)
}

// GetProductVariants returns all variants for a product
func GetProductVariants(c *gin.Context) {
	productID := c.Param("id")
	var variants []models.ProductVariant
	if err := database.DB.Where("product_id = ?", productID).Order("size ASC, color ASC").Find(&variants).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, variants)
}

// CreateProductVariant adds a new size+color combination for a product
func CreateProductVariant(c *gin.Context) {
	productID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid product id"})
		return
	}

	var variant models.ProductVariant
	if err := c.ShouldBindJSON(&variant); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	variant.ProductID = uint(productID)

	if err := database.DB.Create(&variant).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, variant)
}

// UpdateProductVariant updates a variant's stock/size/color
func UpdateProductVariant(c *gin.Context) {
	id := c.Param("variantId")

	var variant models.ProductVariant
	if err := database.DB.First(&variant, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "variant not found"})
		return
	}

	if err := c.ShouldBindJSON(&variant); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Save(&variant).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, variant)
}

// DeleteProductVariant removes a size+color combination
func DeleteProductVariant(c *gin.Context) {
	id := c.Param("variantId")
	if err := database.DB.Delete(&models.ProductVariant{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "variant deleted"})
}
