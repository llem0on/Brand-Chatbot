package service

import (
	"fmt"
	"strings"
	"wa-ai-bot/database"
	"wa-ai-bot/models"
)

type FAQService struct{}

func NewFAQService() *FAQService {
	return &FAQService{}
}

// GetAllActive returns all active FAQs ordered by DisplayOrder
func (s *FAQService) GetAllActive() ([]models.FAQ, error) {
	var faqs []models.FAQ
	err := database.DB.Where("active = ?", true).Order("display_order ASC").Find(&faqs).Error
	return faqs, err
}

// FormatFAQContext builds a compact text block of active FAQs, meant to be fed
// into the LLM as grounding context so it can draw on admin-managed answers
// during normal conversation instead of hallucinating.
func (s *FAQService) FormatFAQContext() string {
	faqs, err := s.GetAllActive()
	if err != nil || len(faqs) == 0 {
		return ""
	}

	var sb strings.Builder
	sb.WriteString("FAQ yang sering ditanyakan:\n")
	for _, faq := range faqs {
		sb.WriteString(fmt.Sprintf("- Q: %s\n  A: %s\n", faq.Question, faq.Answer))
	}
	return sb.String()
}
