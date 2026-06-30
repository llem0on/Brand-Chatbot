package handler

import (
	"net/http"
	"os"
	"wa-ai-bot/database"
	"wa-ai-bot/models"
	"wa-ai-bot/service"

	"github.com/gin-gonic/gin"
)

const sessionCookieName = "auth_session"
const sessionMaxAgeSeconds = 30 * 24 * 3600

func cookieSecure() bool {
	return os.Getenv("COOKIE_SECURE") == "true"
}

func setSessionCookie(c *gin.Context, token string) {
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(sessionCookieName, token, sessionMaxAgeSeconds, "/", "", cookieSecure(), true)
}

func clearSessionCookie(c *gin.Context) {
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(sessionCookieName, "", -1, "/", "", cookieSecure(), true)
}

// CurrentUser resolves the logged-in user (if any) from the session cookie.
// Returns nil if not logged in - callers decide whether that's acceptable.
func CurrentUser(c *gin.Context) *models.User {
	token, err := c.Cookie(sessionCookieName)
	if err != nil || token == "" {
		return nil
	}
	user, err := service.NewAuthService().GetUserByToken(token)
	if err != nil {
		return nil
	}
	return user
}

type registerRequest struct {
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=8"`
	SessionID string `json:"session_id"`
}

func Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email valid dan password (min 8 karakter) wajib diisi"})
		return
	}

	authSvc := service.NewAuthService()
	user, err := authSvc.Register(req.Email, req.Password)
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		return
	}

	session, err := authSvc.CreateSession(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	setSessionCookie(c, session.Token)
	linkSessionToAccount(req.SessionID, user.ID)

	c.JSON(http.StatusCreated, gin.H{"email": user.Email, "email_verified": user.EmailVerified})
}

type loginRequest struct {
	Email     string `json:"email" binding:"required"`
	Password  string `json:"password" binding:"required"`
	SessionID string `json:"session_id"`
}

func Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email dan password wajib diisi"})
		return
	}

	authSvc := service.NewAuthService()
	user, err := authSvc.Login(req.Email, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email atau password salah"})
		return
	}

	session, err := authSvc.CreateSession(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	setSessionCookie(c, session.Token)
	linkSessionToAccount(req.SessionID, user.ID)

	c.JSON(http.StatusOK, gin.H{"email": user.Email, "email_verified": user.EmailVerified})
}

func Logout(c *gin.Context) {
	if token, err := c.Cookie(sessionCookieName); err == nil && token != "" {
		service.NewAuthService().Logout(token)
	}
	clearSessionCookie(c)
	c.JSON(http.StatusOK, gin.H{"message": "logged out"})
}

func Me(c *gin.Context) {
	user := CurrentUser(c)
	if user == nil {
		c.JSON(http.StatusOK, gin.H{"logged_in": false})
		return
	}
	c.JSON(http.StatusOK, gin.H{"logged_in": true, "email": user.Email, "email_verified": user.EmailVerified})
}

func VerifyEmail(c *gin.Context) {
	token := c.Query("token")
	if err := service.NewAuthService().VerifyEmail(token); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Email berhasil diverifikasi"})
}

func ResendVerification(c *gin.Context) {
	user := CurrentUser(c)
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Silakan login dulu"})
		return
	}
	if err := service.NewAuthService().ResendVerification(user.ID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Email verifikasi terkirim ulang"})
}

// linkSessionToAccount links a visitor's existing anonymous web session_id
// (chat conversation, customer record, cart items) to their newly
// authenticated account, so prior activity carries over after login.
func linkSessionToAccount(sessionID string, accountID uint) {
	if sessionID == "" {
		return
	}
	database.DB.Model(&models.ConversationState{}).Where("user_id = ?", sessionID).Update("account_id", accountID)
	database.DB.Model(&models.Customer{}).Where("user_id = ?", sessionID).Update("account_id", accountID)
	database.DB.Model(&models.CartItem{}).Where("user_id = ? AND account_id IS NULL", sessionID).Update("account_id", accountID)
}
