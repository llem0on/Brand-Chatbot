package handler

import (
	"net/http"
	"strconv"
	"wa-ai-bot/models"
	"wa-ai-bot/service"

	"github.com/gin-gonic/gin"
)

// GetAdminMessages lets the web widget poll for admin replies, since it has
// no other push channel. Only admin-authored messages are returned - the
// customer already sees their own messages and bot replies via /chat itself.
func GetAdminMessages(c *gin.Context) {
	sessionID := c.Param("sessionId")
	afterID, _ := strconv.Atoi(c.DefaultQuery("after", "0"))

	chatSvc := service.NewChatService()
	messages, err := chatSvc.GetMessagesAfter(sessionID, models.SenderAdmin, uint(afterID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, messages)
}
