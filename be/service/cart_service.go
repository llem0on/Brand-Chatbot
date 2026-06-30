package service

import (
	"wa-ai-bot/database"
	"wa-ai-bot/models"

	"gorm.io/gorm"
)

type CartService struct{}

func NewCartService() *CartService {
	return &CartService{}
}

// cartScope resolves the right ownership filter: logged-in carts are looked
// up by AccountID, anonymous carts by the session UserID.
func cartScope(userID string, accountID *uint) *gorm.DB {
	if accountID != nil {
		return database.DB.Where("account_id = ?", *accountID)
	}
	return database.DB.Where("user_id = ? AND account_id IS NULL", userID)
}

// AddItem adds a product variant to the cart, or increments quantity if it's already there.
func (s *CartService) AddItem(userID string, accountID *uint, productID, variantID uint, quantity int) (*models.CartItem, error) {
	var item models.CartItem
	err := cartScope(userID, accountID).Where("product_variant_id = ?", variantID).First(&item).Error
	if err == nil {
		item.Quantity += quantity
		if err := database.DB.Save(&item).Error; err != nil {
			return nil, err
		}
	} else {
		item = models.CartItem{
			UserID:           userID,
			AccountID:        accountID,
			ProductID:        productID,
			ProductVariantID: variantID,
			Quantity:         quantity,
		}
		if err := database.DB.Create(&item).Error; err != nil {
			return nil, err
		}
	}

	database.DB.Preload("Product").Preload("ProductVariant").First(&item, item.ID)
	return &item, nil
}

// GetCart returns the cart items with product/variant preloaded.
func (s *CartService) GetCart(userID string, accountID *uint) ([]models.CartItem, error) {
	var items []models.CartItem
	err := cartScope(userID, accountID).Preload("Product").Preload("ProductVariant").Order("created_at ASC").Find(&items).Error
	return items, err
}

// UpdateQuantity sets a cart item's quantity, removing it if <= 0.
func (s *CartService) UpdateQuantity(itemID uint, quantity int) error {
	if quantity <= 0 {
		return database.DB.Delete(&models.CartItem{}, itemID).Error
	}
	return database.DB.Model(&models.CartItem{}).Where("id = ?", itemID).Update("quantity", quantity).Error
}

// RemoveItem deletes a single cart item.
func (s *CartService) RemoveItem(itemID uint) error {
	return database.DB.Delete(&models.CartItem{}, itemID).Error
}

// ClearCart removes all items for the given identity (called after checkout).
func (s *CartService) ClearCart(userID string, accountID *uint) error {
	return cartScope(userID, accountID).Delete(&models.CartItem{}).Error
}
