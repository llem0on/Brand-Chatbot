package service

import (
	"wa-ai-bot/database"
	"wa-ai-bot/models"
)

type SettingsService struct{}

func NewSettingsService() *SettingsService {
	return &SettingsService{}
}

// GetSettings returns the singleton purchase settings row, creating a blank
// default one if it somehow doesn't exist yet.
func (s *SettingsService) GetSettings() (*models.PurchaseSettings, error) {
	var settings models.PurchaseSettings
	err := database.DB.First(&settings).Error
	if err == nil {
		return &settings, nil
	}

	settings = models.PurchaseSettings{EnableBankTransfer: true, EnableQRIS: true, PaymentDeadlineHours: 24}
	if err := database.DB.Create(&settings).Error; err != nil {
		return nil, err
	}
	return &settings, nil
}
