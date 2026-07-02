package service

import (
	"wa-ai-bot/database"
	"wa-ai-bot/groq"
	"wa-ai-bot/models"
)

type ChatService struct{}

func NewChatService() *ChatService {
	return &ChatService{}
}

// SaveMessage persists a single chat message for a conversation
func (s *ChatService) SaveMessage(userID, sender, content string) error {
	if content == "" {
		return nil
	}
	msg := models.ChatMessage{UserID: userID, Sender: sender, Content: content}
	return database.DB.Create(&msg).Error
}

// GetHistory returns a conversation's messages in chronological order.
// limit <= 0 means no limit.
func (s *ChatService) GetHistory(userID string, limit int) ([]models.ChatMessage, error) {
	var messages []models.ChatMessage
	query := database.DB.Where("user_id = ?", userID).Order("created_at DESC")
	if limit > 0 {
		query = query.Limit(limit)
	}
	if err := query.Find(&messages).Error; err != nil {
		return nil, err
	}

	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}
	return messages, nil
}

// GetMessagesAfter returns messages from a given sender added after a message ID
func (s *ChatService) GetMessagesAfter(userID, sender string, afterID uint) ([]models.ChatMessage, error) {
	var messages []models.ChatMessage
	err := database.DB.Where("user_id = ? AND sender = ? AND id > ?", userID, sender, afterID).
		Order("id ASC").Find(&messages).Error
	return messages, err
}

// BuildLLMHistory converts a conversation's recent messages into groq.Message
// history. Admin replies are treated as assistant turns too, for continuity.
func (s *ChatService) BuildLLMHistory(userID string, limit int) ([]groq.Message, error) {
	messages, err := s.GetHistory(userID, limit)
	if err != nil {
		return nil, err
	}

	history := make([]groq.Message, 0, len(messages))
	for _, m := range messages {
		role := "user"
		if m.Sender == models.SenderBot || m.Sender == models.SenderAdmin {
			role = "assistant"
		}
		history = append(history, groq.Message{Role: role, Content: m.Content})
	}
	return history, nil
}
