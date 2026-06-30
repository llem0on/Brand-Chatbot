package handler

import (
	"net/http"
	"sort"
	"strings"
	"wa-ai-bot/database"
	"wa-ai-bot/models"

	"github.com/gin-gonic/gin"
)

// GetPublicProducts returns active products for the storefront, with
// optional ?category=&material=&gender=&size= filters. Unauthenticated -
// this is the customer-facing catalog, distinct from the admin-token
// protected /admin/products endpoint.
func GetPublicProducts(c *gin.Context) {
	var products []models.Product
	query := database.DB.Preload("Category").Preload("Variants").Where("products.active = ?", true)

	if category := c.Query("category"); category != "" {
		query = query.Joins("JOIN product_categories ON product_categories.id = products.category_id").
			Where("product_categories.name = ?", category)
	}
	if material := c.Query("material"); material != "" {
		query = query.Where("products.material = ?", material)
	}
	if gender := c.Query("gender"); gender != "" {
		query = query.Where("products.gender = ?", gender)
	}
	if size := c.Query("size"); size != "" {
		query = query.Where("CONCAT(',', products.sizes, ',') LIKE ?", "%,"+size+",%")
	}

	if err := query.Order("products.created_at DESC").Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, products)
}

// GetProductFilterOptions returns the available filter values derived from
// the current active catalog, so the Home page filter UI stays in sync with
// whatever the admin has actually configured.
func GetProductFilterOptions(c *gin.Context) {
	var categories []models.ProductCategory
	database.DB.Order("name ASC").Find(&categories)

	var materials []string
	database.DB.Model(&models.Product{}).
		Where("active = ? AND material IS NOT NULL AND material != ''", true).
		Distinct().Order("material ASC").Pluck("material", &materials)

	var genders []string
	database.DB.Model(&models.Product{}).
		Where("active = ? AND gender IS NOT NULL AND gender != ''", true).
		Distinct().Order("gender ASC").Pluck("gender", &genders)

	var sizeLists []string
	database.DB.Model(&models.Product{}).Where("active = ?", true).Pluck("sizes", &sizeLists)
	sizeSet := make(map[string]bool)
	for _, csv := range sizeLists {
		for _, s := range strings.Split(csv, ",") {
			s = strings.TrimSpace(s)
			if s != "" {
				sizeSet[s] = true
			}
		}
	}
	sizes := make([]string, 0, len(sizeSet))
	for s := range sizeSet {
		sizes = append(sizes, s)
	}
	sort.Strings(sizes)

	c.JSON(http.StatusOK, gin.H{
		"categories": categories,
		"materials":  materials,
		"genders":    genders,
		"sizes":      sizes,
	})
}
