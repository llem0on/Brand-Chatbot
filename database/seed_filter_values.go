package database

import "wa-ai-bot/models"

// seedFilterValuesData holds the canonical filter values as en,id,zh triples.
var seedFilterValuesData = []struct{ typ, en, id, zh string }{
	// gender
	{"gender", "Male", "Pria", "男款"},
	{"gender", "Female", "Wanita", "女款"},
	{"gender", "Unisex", "Unisex", "中性"},
	// color
	{"color", "Black", "Hitam", "黑色"},
	{"color", "White", "Putih", "白色"},
	{"color", "Navy", "Navy", "藏青色"},
	{"color", "Maroon", "Maroon", "栗色"},
	{"color", "Cream", "Krem", "米色"},
	{"color", "Brown", "Coklat", "棕色"},
	{"color", "Lavender", "Lavender", "薰衣草色"},
	{"color", "Charcoal", "Charcoal", "炭灰色"},
	{"color", "Olive", "Olive", "橄榄色"},
	{"color", "Grey", "Abu-abu", "灰色"},
	{"color", "Blue", "Biru", "蓝色"},
	{"color", "Yellow", "Kuning", "黄色"},
	{"color", "Red", "Merah", "红色"},
	{"color", "Green", "Hijau", "绿色"},
	{"color", "Khaki", "Khaki", "卡其色"},
	// category
	{"category", "T-Shirt", "Kaos", "T恤"},
	{"category", "Hoodie", "Hoodie", "卫衣"},
	{"category", "Jacket", "Jaket", "外套"},
	{"category", "Pants", "Celana", "裤子"},
	// material
	{"material", "Cotton Combed", "Cotton Combed", "精梳棉"},
	{"material", "Fleece", "Fleece", "抓绒"},
	{"material", "Polyester", "Polyester", "聚酯纤维"},
	{"material", "Denim", "Denim", "牛仔"},
	{"material", "Cotton Twill", "Cotton Twill", "棉斜纹"},
	{"material", "Linen", "Linen", "亚麻"},
	{"material", "Cotton Ripstop", "Cotton Ripstop", "防撕裂棉"},
	{"material", "Flannel", "Flannel", "法兰绒"},
	{"material", "Cotton Pique", "Cotton Pique", "珠地棉"},
	// size
	{"size", "XS", "XS", "XS"},
	{"size", "S", "S", "S"},
	{"size", "M", "M", "M"},
	{"size", "L", "L", "L"},
	{"size", "XL", "XL", "XL"},
	{"size", "XXL", "XXL", "XXL"},
	{"size", "28", "28", "28"},
	{"size", "30", "30", "30"},
	{"size", "32", "32", "32"},
	{"size", "34", "34", "34"},
}

// SeedFilterValues inserts the default filter values if the table is empty.
func SeedFilterValues() error {
	var count int64
	DB.Model(&models.FilterValue{}).Count(&count)
	if count > 0 {
		return nil
	}
	for _, d := range seedFilterValuesData {
		fv := models.FilterValue{
			Type:  d.typ,
			Value: d.en + "," + d.id + "," + d.zh,
		}
		if err := DB.Create(&fv).Error; err != nil {
			return err
		}
	}
	return nil
}
