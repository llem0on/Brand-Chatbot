package handler

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

// CORSMiddleware allows the separately-deployed Next.js admin/storefront
// frontend to call this API cross-origin using a Bearer token (not
// cookies, so no SameSite/credentials complexity).
func CORSMiddleware() gin.HandlerFunc {
	allowedOrigin := os.Getenv("ADMIN_ORIGIN")
	if allowedOrigin == "" {
		allowedOrigin = "http://localhost:3000"
	}

	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", allowedOrigin)
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Authorization, Content-Type")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
