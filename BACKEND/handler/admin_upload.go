package handler

import (
	"net/http"

	"wa-ai-bot/cloudinary"

	"github.com/gin-gonic/gin"
)

// UploadImage proxies an admin-uploaded file (e.g. a product photo) to
// Cloudinary and returns its public URL for the caller to save.
func UploadImage(c *gin.Context) {
	fileHeader, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File gambar tidak ditemukan"})
		return
	}

	file, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuka file"})
		return
	}
	defer file.Close()

	url, err := cloudinary.UploadImage(file, fileHeader.Filename, "Brand Baju")
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"url": url})
}
