package handler

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"
	"wa-ai-bot/database"
	"wa-ai-bot/groq"
	"wa-ai-bot/models"
	"wa-ai-bot/service"
	"wa-ai-bot/whatsapp"

	"github.com/gin-gonic/gin"
)

const (
	maxHistory = 20
)

type waPayload struct {
	Object string `json:"object"`
	Entry  []struct {
		Changes []struct {
			Value struct {
				Messages []struct {
					From  string `json:"from"`
					Type  string `json:"type"`
					Text  struct {
						Body string `json:"body"`
					} `json:"text"`
					Image *struct {
						ID       string `json:"id"`
						MimeType string `json:"mime_type"`
						Caption  string `json:"caption"`
					} `json:"image"`
				} `json:"messages"`
			} `json:"value"`
		} `json:"changes"`
	} `json:"entry"`
}

type chatRequest struct {
	SessionID string `json:"session_id"`
	Message   string `json:"message"`
}

type chatResponse struct {
	Reply      string `json:"reply"`
	IsGreeting bool   `json:"is_greeting"`
}

// ProcessMessage handles an incoming chat message through the FAQ/LLM flow
func ProcessMessage(sessionID, text, channel string) (reply string, isNew bool, err error) {
	return processTextMessage(sessionID, text, channel)
}

// escalationIntentPattern uses word boundaries since plain substring matching
// is unsafe for short Indonesian words (e.g. "cs" would match inside other words).
var escalationIntentPattern = regexp.MustCompile(`\b(admin|customer service|cs|manusia|operator|hubungkan|bicara dengan orang)\b`)

// DetectEscalationIntent checks if the user is explicitly asking to talk to a human admin
func DetectEscalationIntent(text string) bool {
	return escalationIntentPattern.MatchString(strings.ToLower(text))
}

func processTextMessage(sessionID, text, channel string) (reply string, isNew bool, err error) {
	chatSvc := service.NewChatService()

	// 1. Load or create conversation state
	var state models.ConversationState
	if err := database.DB.Where("user_id = ?", sessionID).First(&state).Error; err != nil {
		// New user
		state = models.ConversationState{
			UserID:      sessionID,
			Channel:     channel,
			CurrentFlow: models.FlowNew,
		}
		database.DB.Create(&state)
		isNew = true
	}

	// 2. Persist the incoming message so an admin can see it even while escalated
	if err := chatSvc.SaveMessage(sessionID, models.SenderUser, text); err != nil {
		log.Printf("Error saving user message: %v", err)
	}

	// 3. Bot stops auto-replying once escalated to a human admin
	if state.IsEscalated {
		return "", false, nil
	}

	// 4. User can ask for a human admin at any point
	if DetectEscalationIntent(text) {
		return escalateToAdmin(&state, chatSvc), false, nil
	}

	// 5. First contact - plain welcome, nothing else
	if state.CurrentFlow == models.FlowNew {
		state.CurrentFlow = models.FlowChat
		database.DB.Save(&state)

		brandName := os.Getenv("BRAND_NAME")
		if brandName == "" {
			brandName = "brand"
		}
		welcome := fmt.Sprintf("Halo! Selamat datang di %s 👋 Ada yang bisa saya bantu seputar produk atau pertanyaan lainnya?", brandName)
		if err := chatSvc.SaveMessage(sessionID, models.SenderBot, welcome); err != nil {
			log.Printf("Error saving bot message: %v", err)
		}

		return welcome, true, nil
	}

	// 6. Continue an in-progress purchase
	if state.CurrentFlow == models.FlowOrdering {
		reply, err = handleOrderingFlow(&state, text)
		saveBotReply(chatSvc, sessionID, reply)
		return reply, false, err
	}

	// 7. Start a new purchase if the user just asked to buy something
	if DetectPurchaseIntent(text) {
		reply, err = startOrderingFlow(&state, text)
		saveBotReply(chatSvc, sessionID, reply)
		return reply, false, err
	}

	// 8. Normal conversation
	reply, err = processWithLLM(sessionID)
	return reply, false, err
}

func saveBotReply(chatSvc *service.ChatService, sessionID, reply string) {
	if reply == "" {
		return
	}
	if err := chatSvc.SaveMessage(sessionID, models.SenderBot, reply); err != nil {
		log.Printf("Error saving bot message: %v", err)
	}
}

// escalateToAdmin marks a conversation as escalated, asks the LLM for a short
// summary of the customer's problem so far (to brief the human admin), and
// returns the canned hand-off reply.
func escalateToAdmin(state *models.ConversationState, chatSvc *service.ChatService) string {
	history, err := chatSvc.BuildLLMHistory(state.UserID, 0)
	if err != nil {
		log.Printf("Error loading history for escalation summary: %v", err)
	}

	summary, err := groq.Summarize(history)
	if err != nil {
		log.Printf("Error summarizing conversation: %v", err)
	}

	now := time.Now()
	state.IsEscalated = true
	state.CurrentFlow = models.FlowChat
	state.EscalationSummary = summary
	state.EscalatedAt = &now
	database.DB.Save(state)

	reply := "Baik, pesan Anda telah diteruskan ke admin manusia. Mohon tunggu sebentar ya! 🙏"
	if err := chatSvc.SaveMessage(state.UserID, models.SenderBot, reply); err != nil {
		log.Printf("Error saving bot message: %v", err)
	}
	return reply
}

func processWithLLM(sessionID string) (string, error) {
	chatSvc := service.NewChatService()
	history, err := chatSvc.BuildLLMHistory(sessionID, maxHistory)
	if err != nil {
		return "", err
	}

	faqSvc := service.NewFAQService()
	productSvc := service.NewProductService()
	promoSvc := service.NewPromotionService()
	knowledgeContext := faqSvc.FormatFAQContext() + productSvc.FormatProductContext() + promoSvc.FormatActiveContext()

	reply, err := groq.Ask(history, knowledgeContext)
	if err != nil {
		return "", err
	}

	if err := chatSvc.SaveMessage(sessionID, models.SenderBot, reply); err != nil {
		log.Printf("Error saving bot message: %v", err)
	}

	return reply, nil
}

func Verify(c *gin.Context) {
	mode := c.Query("hub.mode")
	token := c.Query("hub.verify_token")
	challenge := c.Query("hub.challenge")

	if mode == "subscribe" && token == os.Getenv("VERIFY_TOKEN") {
		c.String(http.StatusOK, challenge)
		return
	}
	c.Status(http.StatusForbidden)
}

func Handle(c *gin.Context) {
	var payload waPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.Status(http.StatusBadRequest)
		return
	}

	c.Status(http.StatusOK)

	if payload.Object != "whatsapp_business_account" {
		return
	}

	for _, entry := range payload.Entry {
		for _, change := range entry.Changes {
			for _, msg := range change.Value.Messages {
				from := msg.From

				// Handle text message
				if msg.Type == "text" {
					text := msg.Text.Body
					log.Printf("Pesan dari %s: %s\n", from, text)

					go func(from, text string) {
						reply, _, err := ProcessMessage(from, text, models.ChannelWhatsApp)
						if err != nil {
							log.Printf("Error: %v", err)
							_ = whatsapp.SendText(from, "Maaf, ada error di server.")
							return
						}

						if reply != "" {
							if err := whatsapp.SendText(from, reply); err != nil {
								log.Printf("WA send error: %v", err)
							}
							log.Printf("Replied to %s\n", from)
						}
					}(from, text)
				}

				// Handle image message (treat caption as the chat message)
				if msg.Type == "image" && msg.Image != nil {
					caption := msg.Image.Caption
					log.Printf("Foto dari %s: caption=%s\n", from, caption)

					go func(from, caption string) {
						reply, _, err := ProcessMessage(from, caption, models.ChannelWhatsApp)
						if err != nil {
							log.Printf("Error: %v", err)
							_ = whatsapp.SendText(from, "Maaf, ada error di server.")
							return
						}

						if reply != "" {
							if err := whatsapp.SendText(from, reply); err != nil {
								log.Printf("WA send error: %v", err)
							}
							log.Printf("Replied to %s\n", from)
						}
					}(from, caption)
				}
			}
		}
	}
}

func HandleChat(c *gin.Context) {
	var req chatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	if req.SessionID == "" || req.Message == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "session_id and message required"})
		return
	}

	reply, isNew, err := ProcessMessage(req.SessionID, req.Message, models.ChannelWeb)
	if err != nil {
		log.Printf("Chat error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	c.JSON(http.StatusOK, chatResponse{Reply: reply, IsGreeting: isNew})
}

func HealthCheck(c *gin.Context) {
	if os.Getenv("GROQ_API_KEY") == "" {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "unhealthy",
			"reason": "GROQ_API_KEY not configured",
		})
		return
	}

	sqlDB, err := database.DB.DB()
	if err != nil || sqlDB.Ping() != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":   "unhealthy",
			"reason":   "database connection failed",
			"database": "disconnected",
		})
		return
	}

	var faqCount, productCount int64
	database.DB.Model(&models.FAQ{}).Where("active = ?", true).Count(&faqCount)
	database.DB.Model(&models.Product{}).Where("active = ?", true).Count(&productCount)

	c.JSON(http.StatusOK, gin.H{
		"status":         "healthy",
		"service":        "wa-ai-bot",
		"database":       "connected",
		"faqs_count":     faqCount,
		"products_count": productCount,
	})
}
