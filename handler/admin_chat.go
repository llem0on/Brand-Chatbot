package handler

import (
	"net/http"
	"wa-ai-bot/database"
	"wa-ai-bot/models"
	"wa-ai-bot/service"
	"wa-ai-bot/whatsapp"

	"github.com/gin-gonic/gin"
)

// GetEscalatedConversations returns all conversations currently escalated to a human admin
func GetEscalatedConversations(c *gin.Context) {
	var states []models.ConversationState
	if err := database.DB.Where("is_escalated = ?", true).Order("escalated_at DESC").Find(&states).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, states)
}

// GetConversationMessages returns the full message history for one conversation
func GetConversationMessages(c *gin.Context) {
	userID := c.Param("userId")
	chatSvc := service.NewChatService()
	messages, err := chatSvc.GetHistory(userID, 0)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, messages)
}

// ReplyToConversation lets an admin send a message to a customer. It's
// persisted either way, and delivered immediately via WhatsApp if that's
// the customer's channel (web customers pick it up via polling).
func ReplyToConversation(c *gin.Context) {
	userID := c.Param("userId")

	var req struct {
		Message string `json:"message" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var state models.ConversationState
	if err := database.DB.Where("user_id = ?", userID).First(&state).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "conversation not found"})
		return
	}

	chatSvc := service.NewChatService()
	if err := chatSvc.SaveMessage(userID, models.SenderAdmin, req.Message); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if state.Channel == models.ChannelWhatsApp {
		if err := whatsapp.SendText(userID, req.Message); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "pesan disimpan tapi gagal dikirim via WhatsApp: " + err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "sent"})
}

// ResolveConversation hands a conversation back to the bot
func ResolveConversation(c *gin.Context) {
	userID := c.Param("userId")

	result := database.DB.Model(&models.ConversationState{}).Where("user_id = ?", userID).Updates(map[string]interface{}{
		"is_escalated":       false,
		"current_flow":       models.FlowChat,
		"escalation_summary": "",
	})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "conversation not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "resolved"})
}
