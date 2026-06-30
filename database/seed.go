package database

import (
	"wa-ai-bot/models"
)

var initialFAQs = []models.FAQ{
	{
		Question:     "Kapan barang dikirim?",
		Answer:       "Barang akan dikirim dalam 1-3 hari kerja setelah live selesai. Kamu akan dapat nomor resi via WhatsApp ya! 📦",
		Keywords:     "kirim,pengiriman,barang,kapan,resi,estimasi",
		Category:     "shipping",
		DisplayOrder: 1,
		Active:       true,
	},
	{
		Question:     "Jadwal live kapan?",
		Answer:       "Live diadakan setiap hari Sabtu! Kalau mau diingatkan sebelum live, tinggal bilang 'ingatkan saya' ya 😊",
		Keywords:     "live,jadwal,kapan live,streaming,siaran",
		Category:     "schedule",
		DisplayOrder: 2,
		Active:       true,
	},
	{
		Question:     "Ongkir berapa? Bisa COD?",
		Answer:       "Kami support COD (Cash on Delivery) dengan biaya 11 ribu untuk paket parcel. Atau bisa transfer dulu sebelum dikirim! 💰",
		Keywords:     "ongkir,cod,bayar,pembayaran,biaya kirim,cash on delivery",
		Category:     "payment",
		DisplayOrder: 3,
		Active:       true,
	},
	{
		Question:     "Stok ready warna apa aja?",
		Answer:       "Stok warna bisa berubah tiap minggu. Untuk info terbaru, tanya saat live atau chat admin langsung ya. Biasanya ready: hitam, putih, navy, maroon 🎨",
		Keywords:     "stok,warna,ready,tersedia,available,color",
		Category:     "product",
		DisplayOrder: 4,
		Active:       true,
	},
	{
		Question:     "Ukuran tersedia apa saja?",
		Answer:       "Kami punya ukuran S, M, L, XL, dan XXL. Kalau mau size chart detail, bilang aja 'size chart' ya! 👕",
		Keywords:     "ukuran,size,besar,kecil,s,m,l,xl,xxl",
		Category:     "product",
		DisplayOrder: 5,
		Active:       true,
	},
	{
		Question:     "Bahan apa yang dipakai?",
		Answer:       "Kami pakai bahan cotton combed 30s, adem dan nyaman dipakai. Anti gerah! 🧵",
		Keywords:     "bahan,material,kain,cotton,combed",
		Category:     "product",
		DisplayOrder: 6,
		Active:       true,
	},
	{
		Question:     "Bisa retur/tukar barang?",
		Answer:       "Bisa! Selama barang belum dicuci dan masih ada label. Hubungi admin maksimal 3 hari setelah terima barang ya 🔄",
		Keywords:     "retur,tukar,return,ganti,rusak,salah",
		Category:     "policy",
		DisplayOrder: 7,
		Active:       true,
	},
	{
		Question:     "Ada promo hari ini?",
		Answer:       "Promo biasanya diumumkan saat live! Follow terus live kita setiap Sabtu biar gak ketinggalan diskon 🎉",
		Keywords:     "promo,diskon,sale,potongan harga,murah",
		Category:     "promo",
		DisplayOrder: 8,
		Active:       true,
	},
}

func SeedFAQs() error {
	// Check if FAQs already exist
	var count int64
	DB.Model(&models.FAQ{}).Count(&count)
	if count > 0 {
		return nil // Already seeded
	}

	// Insert initial FAQs
	for _, faq := range initialFAQs {
		if err := DB.Create(&faq).Error; err != nil {
			return err
		}
	}

	return nil
}
