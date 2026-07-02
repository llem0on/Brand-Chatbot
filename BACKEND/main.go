package main

import (
	"log"
	"os"
	"wa-ai-bot/database"
	"wa-ai-bot/handler"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Initialize database
	if err := database.Init(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	r := gin.Default()
	r.Use(handler.CORSMiddleware())

	// WhatsApp webhook
	r.GET("/webhook", handler.Verify)
	r.POST("/webhook", handler.Handle)

	// Biteship shipment status webhook
	r.POST("/webhook/biteship", handler.HandleBiteshipWebhook)

	// Web chat endpoint
	r.POST("/chat", handler.HandleChat)
	r.GET("/chat/:sessionId/admin-messages", handler.GetAdminMessages)

	// Health check endpoint
	r.GET("/health", handler.HealthCheck)

	// Public storefront catalog (unauthenticated)
	r.GET("/api/products", handler.GetPublicProducts)
	r.GET("/api/products/filters", handler.GetProductFilterOptions)
	r.GET("/api/filter-values", handler.GetFilterValues)
	r.GET("/api/settings/public", handler.GetPublicCheckoutSettings)

	// Cart (anonymous via session_id, or account-scoped once logged in)
	r.GET("/api/cart", handler.GetCart)
	r.POST("/api/cart/items", handler.AddCartItem)
	r.PUT("/api/cart/items/:id", handler.UpdateCartItem)
	r.DELETE("/api/cart/items/:id", handler.RemoveCartItem)
	r.POST("/api/cart/checkout", handler.Checkout)
	r.POST("/api/shipping/rates", handler.GetShippingRates)
	r.POST("/api/cart/bulk-sync", handler.BulkSyncCart)
	r.GET("/api/orders/by-phone", handler.GetOrdersByPhone)
	r.GET("/api/orders/by-email", handler.GetOrdersByEmail)
	r.POST("/api/orders/:orderNumber/payment-proof", handler.UploadPaymentProof)

	// Storefront account auth
	r.POST("/auth/register", handler.Register)
	r.POST("/auth/login", handler.Login)
	r.POST("/auth/logout", handler.Logout)
	r.GET("/auth/me", handler.Me)
	r.GET("/auth/verify-email", handler.VerifyEmail)
	r.POST("/auth/resend-verification", handler.ResendVerification)

	// Admin endpoints (protected)
	admin := r.Group("/admin")
	admin.Use(handler.AuthMiddleware())
	{
		// FAQ management
		admin.GET("/faqs", handler.GetFAQs)
		admin.POST("/faqs", handler.CreateFAQ)
		admin.PUT("/faqs/:id", handler.UpdateFAQ)
		admin.DELETE("/faqs/:id", handler.DeleteFAQ)

		// Product category management
		admin.GET("/categories", handler.GetCategories)
		admin.POST("/categories", handler.CreateCategory)
		admin.PUT("/categories/:id", handler.UpdateCategory)
		admin.DELETE("/categories/:id", handler.DeleteCategory)

		// Image upload (e.g. product photos), proxied to Cloudinary
		admin.POST("/upload-image", handler.UploadImage)

		// Product management
		admin.GET("/products", handler.GetProducts)
		admin.POST("/products", handler.CreateProduct)
		admin.PUT("/products/:id", handler.UpdateProduct)
		admin.DELETE("/products/:id", handler.DeleteProduct)

		// Product variant (size+color stock) management
		admin.GET("/products/:id/variants", handler.GetProductVariants)
		admin.POST("/products/:id/variants", handler.CreateProductVariant)
		admin.PUT("/variants/:variantId", handler.UpdateProductVariant)
		admin.DELETE("/variants/:variantId", handler.DeleteProductVariant)

		// Promotion / event management
		admin.GET("/promotions", handler.GetPromotions)
		admin.POST("/promotions", handler.CreatePromotion)
		admin.PUT("/promotions/:id", handler.UpdatePromotion)
		admin.DELETE("/promotions/:id", handler.DeletePromotion)

		// Escalated conversations - live chat with customers
		admin.GET("/conversations", handler.GetEscalatedConversations)
		admin.GET("/conversations/:userId/messages", handler.GetConversationMessages)
		admin.POST("/conversations/:userId/reply", handler.ReplyToConversation)
		admin.POST("/conversations/:userId/resolve", handler.ResolveConversation)

		// Purchase flow: orders, customers, settings
		admin.GET("/orders", handler.GetOrders)
		admin.PUT("/orders/:id/status", handler.UpdateOrderStatus)
		admin.POST("/orders/:id/verify-payment", handler.VerifyPayment)
		admin.GET("/customers", handler.GetCustomers)
		admin.GET("/settings", handler.GetSettings)
		admin.PUT("/settings", handler.UpdateSettings)

		// Filter value management (localized filter options)
		admin.GET("/filter-values", handler.AdminListFilterValues)
		admin.POST("/filter-values", handler.AdminCreateFilterValue)
		admin.PUT("/filter-values/:id", handler.AdminUpdateFilterValue)
		admin.DELETE("/filter-values/:id", handler.AdminDeleteFilterValue)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Server jalan di :%s\n", port)
	log.Printf("API: http://localhost:%s | Admin UI: http://localhost:3000/admin\n", port)
	r.Run(":" + port)
}

