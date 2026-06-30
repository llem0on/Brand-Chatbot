package service

import (
	"fmt"
	"strings"
	"time"
	"wa-ai-bot/database"
	"wa-ai-bot/models"
)

type PromotionService struct{}

func NewPromotionService() *PromotionService {
	return &PromotionService{}
}

// GetCurrentlyActive returns active promotions/events whose date range covers now
func (s *PromotionService) GetCurrentlyActive() ([]models.Promotion, error) {
	now := time.Now()
	var promos []models.Promotion
	err := database.DB.Where("active = ? AND (start_date IS NULL OR start_date <= ?) AND (end_date IS NULL OR end_date >= ?)", true, now, now).
		Find(&promos).Error
	return promos, err
}

// FormatActiveContext builds a compact text block describing live promos/events,
// meant to be fed into the LLM as grounding context.
func (s *PromotionService) FormatActiveContext() string {
	promos, err := s.GetCurrentlyActive()
	if err != nil || len(promos) == 0 {
		return ""
	}

	var sb strings.Builder
	sb.WriteString("Promo/event yang sedang berlangsung:\n")
	for _, p := range promos {
		label := "Promo"
		if p.Type == models.PromotionTypeEvent {
			label = "Event"
		}
		sb.WriteString(fmt.Sprintf("- [%s] %s: %s\n", label, p.Title, p.Description))
	}
	return sb.String()
}
