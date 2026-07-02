package service

import (
	"crypto/rand"
	"encoding/hex"
	"strings"
	"wa-ai-bot/database"
	"wa-ai-bot/models"
)

type CustomerService struct{}

func NewCustomerService() *CustomerService {
	return &CustomerService{}
}

// GetOrCreate finds the customer record for a conversation's user_id, or
// creates one with a freshly generated customer_code if it doesn't exist yet.
func (s *CustomerService) GetOrCreate(userID, name, phone, address string) (*models.Customer, error) {
	var customer models.Customer
	err := database.DB.Where("user_id = ?", userID).First(&customer).Error
	if err == nil {
		// Existing customer - keep their record up to date with the latest order info
		customer.Name = name
		customer.Phone = phone
		customer.Address = address
		if err := database.DB.Save(&customer).Error; err != nil {
			return nil, err
		}
		return &customer, nil
	}

	customer = models.Customer{
		CustomerCode: generateCustomerCode(),
		UserID:       userID,
		Name:         name,
		Phone:        phone,
		Address:      address,
	}
	if err := database.DB.Create(&customer).Error; err != nil {
		return nil, err
	}
	return &customer, nil
}

func generateCustomerCode() string {
	b := make([]byte, 4)
	rand.Read(b)
	return "CUST-" + strings.ToUpper(hex.EncodeToString(b))
}
