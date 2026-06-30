package database

import (
	"strings"
	"wa-ai-bot/models"
)

// SeedProductVariants auto-generates size+color variant rows (with a
// placeholder stock) for any product that doesn't have variants yet, based
// on its Sizes/Colors master lists. Admin edits the real stock afterward.
func SeedProductVariants() error {
	var products []models.Product
	if err := DB.Find(&products).Error; err != nil {
		return err
	}

	for _, p := range products {
		if err := EnsureProductVariants(p.ID, p.Sizes, p.Colors, 10); err != nil {
			return err
		}
	}

	return nil
}

// EnsureProductVariants makes sure a variant row exists for every
// size+color combination in the given master lists, creating any missing
// ones with defaultStock. Existing variants (and their real stock) are
// never touched, so this is safe to call every time a product is saved.
func EnsureProductVariants(productID uint, sizesCSV, colorsCSV string, defaultStock int) error {
	sizes := splitNonEmpty(sizesCSV)
	colors := splitNonEmpty(colorsCSV)
	if len(sizes) == 0 {
		sizes = []string{"-"}
	}
	if len(colors) == 0 {
		colors = []string{"-"}
	}

	for _, size := range sizes {
		for _, color := range colors {
			var count int64
			DB.Model(&models.ProductVariant{}).Where("product_id = ? AND size = ? AND color = ?", productID, size, color).Count(&count)
			if count > 0 {
				continue
			}
			variant := models.ProductVariant{ProductID: productID, Size: size, Color: color, Stock: defaultStock}
			if err := DB.Create(&variant).Error; err != nil {
				return err
			}
		}
	}

	return nil
}

func splitNonEmpty(s string) []string {
	var result []string
	for _, part := range strings.Split(s, ",") {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}

// SeedPurchaseSettings creates one default settings row if none exists yet
func SeedPurchaseSettings() error {
	var count int64
	DB.Model(&models.PurchaseSettings{}).Count(&count)
	if count > 0 {
		return nil
	}

	settings := models.PurchaseSettings{
		BankName:             "Bank Contoh",
		BankAccountNumber:    "1234567890",
		BankAccountHolder:    "Nama Pemilik Toko",
		EnableBankTransfer:   true,
		QRISImageURL:         "",
		EnableQRIS:           true,
		ShippingCost:         15000,
		PaymentDeadlineHours: 24,
		ClosingMessage:       "Terima kasih sudah order! Pesananmu akan segera kami proses setelah pembayaran dikonfirmasi 🙏",
	}

	return DB.Create(&settings).Error
}
