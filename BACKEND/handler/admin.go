package handler

import (
	"net/http"
	"os"
	"wa-ai-bot/database"
	"wa-ai-bot/models"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware checks for admin token
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.GetHeader("Authorization")
		expectedToken := "Bearer " + os.Getenv("ADMIN_TOKEN")

		if token != expectedToken {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			c.Abort()
			return
		}
		c.Next()
	}
}

// GetFAQs returns all FAQs
func GetFAQs(c *gin.Context) {
	var faqs []models.FAQ
	if err := database.DB.Order("display_order ASC").Find(&faqs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, faqs)
}

// CreateFAQ creates a new FAQ
func CreateFAQ(c *gin.Context) {
	var faq models.FAQ
	if err := c.ShouldBindJSON(&faq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Create(&faq).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, faq)
}

// UpdateFAQ updates an existing FAQ
func UpdateFAQ(c *gin.Context) {
	id := c.Param("id")
	var faq models.FAQ

	if err := database.DB.First(&faq, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "FAQ not found"})
		return
	}

	if err := c.ShouldBindJSON(&faq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Save(&faq).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, faq)
}

// DeleteFAQ deletes a FAQ
func DeleteFAQ(c *gin.Context) {
	id := c.Param("id")
	if err := database.DB.Delete(&models.FAQ{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "FAQ deleted"})
}
