package database

import (
	"math/rand"
	"time"
	"wa-ai-bot/models"
)

var seedProductImages = []string{
	"https://res.cloudinary.com/dgufnfnvv/image/upload/v1782788497/products/md9fwiryktvszgprbmsj.png",
	"https://res.cloudinary.com/dgufnfnvv/image/upload/v1782788510/products/swipjrn90ue33a2z2u0e.png",
}

var initialCategories = []models.ProductCategory{
	{Name: "Kaos", Description: "Kaos lengan pendek berbagai motif"},
	{Name: "Hoodie", Description: "Hoodie dan sweater berbahan tebal"},
	{Name: "Jaket", Description: "Jaket outerwear untuk berbagai aktivitas"},
	{Name: "Celana", Description: "Celana panjang dan pendek"},
}

type seedProduct struct {
	CategoryName string
	Code         string
	Name         string
	Description  string
	Price        int
	Sizes        string
	Colors       string
	Material     string
	Gender       string
	Stock        int
}

var initialProducts = []seedProduct{
	{"Kaos", "KS-001", "Kaos Basic Tee", "Kaos cotton combed 30s, adem dan nyaman dipakai harian.", 89000, "S,M,L,XL", "Hitam,Putih,Navy", "Cotton Combed", "Unisex", 50},
	{"Kaos", "KS-002", "Kaos Graphic Tee", "Kaos dengan sablon grafis eksklusif brand.", 109000, "S,M,L,XL,XXL", "Hitam,Maroon", "Cotton Combed", "Unisex", 30},
	{"Hoodie", "HD-001", "Hoodie Basic", "Hoodie fleece tebal dengan kantung depan.", 219000, "M,L,XL", "Hitam,Abu-abu", "Fleece", "Unisex", 25},
	{"Hoodie", "HD-002", "Hoodie Zipper", "Hoodie zipper dengan lining hangat di bagian dalam.", 259000, "M,L,XL", "Navy,Hitam", "Fleece", "Pria", 20},
	{"Jaket", "JK-001", "Jaket Bomber", "Jaket bomber water-resistant untuk dipakai outdoor.", 329000, "M,L,XL", "Hitam,Olive", "Polyester", "Pria", 15},
	{"Jaket", "JK-002", "Jaket Denim", "Jaket denim klasik dengan kancing logam.", 289000, "S,M,L", "Biru", "Denim", "Unisex", 12},
	{"Celana", "CL-001", "Celana Cargo", "Celana cargo dengan banyak kantung fungsional.", 199000, "S,M,L,XL", "Hitam,Khaki", "Polyester", "Pria", 18},
	{"Celana", "CL-002", "Celana Jogger", "Celana jogger nyaman untuk santai maupun olahraga.", 159000, "S,M,L,XL", "Hitam,Abu-abu,Navy", "Cotton Combed", "Wanita", 22},
}

var initialPromotions = []struct {
	Title       string
	Description string
	Type        string
	DaysFromNow int
	DurationDay int
}{
	{
		Title:       "Diskon Member Baru 10%",
		Description: "Dapatkan diskon 10% untuk pembelian pertama. Pakai kode WELCOME10 saat checkout.",
		Type:        models.PromotionTypePromo,
		DaysFromNow: 0,
		DurationDay: 30,
	},
	{
		Title:       "Flash Sale Akhir Bulan",
		Description: "Flash sale diskon hingga 30% untuk produk-produk pilihan, terbatas selama event berlangsung.",
		Type:        models.PromotionTypeEvent,
		DaysFromNow: 0,
		DurationDay: 7,
	},
}

// SeedProducts seeds initial categories and products if none exist yet
func SeedProducts() error {
	var categoryCount int64
	DB.Model(&models.ProductCategory{}).Count(&categoryCount)
	if categoryCount == 0 {
		for _, cat := range initialCategories {
			if err := DB.Create(&cat).Error; err != nil {
				return err
			}
		}
	}

	var productCount int64
	DB.Model(&models.Product{}).Count(&productCount)
	if productCount > 0 {
		return nil // Already seeded
	}

	var categories []models.ProductCategory
	if err := DB.Find(&categories).Error; err != nil {
		return err
	}
	categoryIDByName := make(map[string]uint, len(categories))
	for _, cat := range categories {
		categoryIDByName[cat.Name] = cat.ID
	}

	for _, p := range initialProducts {
		product := models.Product{
			CategoryID:  categoryIDByName[p.CategoryName],
			Code:        p.Code,
			Name:        p.Name,
			Description: p.Description,
			Price:       p.Price,
			Sizes:       p.Sizes,
			Colors:      p.Colors,
			Material:    p.Material,
			Gender:      p.Gender,
			Stock:       p.Stock,
			Active:      true,
		}
		if err := DB.Create(&product).Error; err != nil {
			return err
		}
	}

	return nil
}

// BackfillProductAttributes fills in Material/Gender for already-seeded
// products that predate those columns, matched by Code. Never overwrites a
// value an admin has already set.
func BackfillProductAttributes() error {
	infoByCode := make(map[string]seedProduct, len(initialProducts))
	for _, p := range initialProducts {
		infoByCode[p.Code] = p
	}

	var products []models.Product
	if err := DB.Where("material IS NULL OR material = '' OR gender IS NULL OR gender = ''").Find(&products).Error; err != nil {
		return err
	}

	for _, product := range products {
		info, ok := infoByCode[product.Code]
		if !ok {
			continue
		}
		updates := map[string]interface{}{}
		if product.Material == "" {
			updates["material"] = info.Material
		}
		if product.Gender == "" {
			updates["gender"] = info.Gender
		}
		if len(updates) > 0 {
			if err := DB.Model(&models.Product{}).Where("id = ?", product.ID).Updates(updates).Error; err != nil {
				return err
			}
		}
	}

	return nil
}

// BackfillProductImages assigns one of the seed product images randomly to any
// product that currently has no image_url set. Safe to call on every startup.
func BackfillProductImages() error {
	var products []models.Product
	if err := DB.Where("image_url IS NULL OR image_url = ''").Find(&products).Error; err != nil {
		return err
	}
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	for _, p := range products {
		url := seedProductImages[rng.Intn(len(seedProductImages))]
		if err := DB.Model(&models.Product{}).Where("id = ?", p.ID).Update("image_url", url).Error; err != nil {
			return err
		}
	}
	return nil
}

// SeedPromotions seeds initial promo/event entries if none exist yet
func SeedPromotions() error {
	var count int64
	DB.Model(&models.Promotion{}).Count(&count)
	if count > 0 {
		return nil // Already seeded
	}

	now := time.Now()
	for _, p := range initialPromotions {
		start := now.AddDate(0, 0, p.DaysFromNow)
		end := start.AddDate(0, 0, p.DurationDay)
		promo := models.Promotion{
			Title:       p.Title,
			Description: p.Description,
			Type:        p.Type,
			StartDate:   &start,
			EndDate:     &end,
			Active:      true,
		}
		if err := DB.Create(&promo).Error; err != nil {
			return err
		}
	}

	return nil
}
