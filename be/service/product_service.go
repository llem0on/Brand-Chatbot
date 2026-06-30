package service

import (
	"fmt"
	"strings"
	"wa-ai-bot/database"
	"wa-ai-bot/models"
)

type ProductService struct{}

func NewProductService() *ProductService {
	return &ProductService{}
}

// GetAllActive returns all active products with their category preloaded
func (s *ProductService) GetAllActive() ([]models.Product, error) {
	var products []models.Product
	err := database.DB.Preload("Category").Where("active = ?", true).Find(&products).Error
	return products, err
}

// FindByCodeOrName resolves a free-text product reference (code or name,
// case-insensitive, partial match on name) against the active catalog.
func (s *ProductService) FindByCodeOrName(query string) (*models.Product, error) {
	query = strings.TrimSpace(query)
	if query == "" {
		return nil, fmt.Errorf("empty product query")
	}

	var product models.Product
	err := database.DB.Preload("Category").Where("active = ?", true).
		Where("code = ? OR name LIKE ?", query, "%"+query+"%").
		First(&product).Error
	if err != nil {
		return nil, err
	}
	return &product, nil
}

// GetVariants returns all variants for a product
func (s *ProductService) GetVariants(productID uint) ([]models.ProductVariant, error) {
	var variants []models.ProductVariant
	err := database.DB.Where("product_id = ?", productID).Find(&variants).Error
	return variants, err
}

// FindVariant resolves a size+color combination to its variant record (case-insensitive)
func (s *ProductService) FindVariant(productID uint, size, color string) (*models.ProductVariant, error) {
	var variant models.ProductVariant
	err := database.DB.Where("product_id = ? AND LOWER(size) = LOWER(?) AND LOWER(color) = LOWER(?)", productID, size, color).
		First(&variant).Error
	if err != nil {
		return nil, err
	}
	return &variant, nil
}

// FormatProductContext builds a compact text block describing the active
// catalog and its per-variant stock, meant to be fed into the LLM as
// grounding context so answers stay accurate.
func (s *ProductService) FormatProductContext() string {
	products, err := s.GetAllActive()
	if err != nil || len(products) == 0 {
		return ""
	}

	var sb strings.Builder
	sb.WriteString("Katalog produk yang tersedia saat ini:\n")
	for _, p := range products {
		variants, _ := s.GetVariants(p.ID)

		variantInfo := "stok belum diatur"
		if len(variants) > 0 {
			parts := make([]string, 0, len(variants))
			for _, v := range variants {
				parts = append(parts, fmt.Sprintf("%s/%s: %d", v.Size, v.Color, v.Stock))
			}
			variantInfo = strings.Join(parts, ", ")
		}

		sb.WriteString(fmt.Sprintf(
			"- [%s] %s (%s) | Harga: Rp%d | Stok per ukuran/warna: %s\n",
			p.Code, p.Name, p.Category.Name, p.Price, variantInfo,
		))
	}
	return sb.String()
}
