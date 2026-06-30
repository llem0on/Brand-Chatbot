package service

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"os"
	"time"
	"wa-ai-bot/database"
	"wa-ai-bot/email"
	"wa-ai-bot/models"

	"golang.org/x/crypto/bcrypt"
)

type AuthService struct{}

func NewAuthService() *AuthService {
	return &AuthService{}
}

var (
	ErrEmailTaken         = errors.New("email sudah terdaftar")
	ErrInvalidCredentials = errors.New("email atau password salah")
)

const sessionDuration = 30 * 24 * time.Hour

// Register creates a new account and sends a verification email.
func (s *AuthService) Register(emailAddr, password string) (*models.User, error) {
	var existing models.User
	if err := database.DB.Where("email = ?", emailAddr).First(&existing).Error; err == nil {
		return nil, ErrEmailTaken
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	user := models.User{
		Email:              emailAddr,
		PasswordHash:       string(hash),
		VerificationToken:  generateToken(),
		VerificationSentAt: &now,
	}
	if err := database.DB.Create(&user).Error; err != nil {
		return nil, err
	}

	s.sendVerification(&user)
	return &user, nil
}

// Login verifies credentials. Verification is NOT required to log in - only
// to check out - so unverified users can still browse/access their account.
func (s *AuthService) Login(emailAddr, password string) (*models.User, error) {
	var user models.User
	if err := database.DB.Where("email = ?", emailAddr).First(&user).Error; err != nil {
		return nil, ErrInvalidCredentials
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, ErrInvalidCredentials
	}
	return &user, nil
}

// CreateSession issues a new opaque session token for the user.
func (s *AuthService) CreateSession(userID uint) (*models.UserSession, error) {
	session := models.UserSession{
		Token:     generateToken(),
		UserID:    userID,
		ExpiresAt: time.Now().Add(sessionDuration),
	}
	if err := database.DB.Create(&session).Error; err != nil {
		return nil, err
	}
	return &session, nil
}

// GetUserByToken resolves a session cookie token to its user, if valid.
func (s *AuthService) GetUserByToken(token string) (*models.User, error) {
	if token == "" {
		return nil, errors.New("no session")
	}
	var session models.UserSession
	if err := database.DB.Where("token = ? AND expires_at > ?", token, time.Now()).First(&session).Error; err != nil {
		return nil, err
	}
	var user models.User
	if err := database.DB.First(&user, session.UserID).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

// Logout deletes the session row for the given token.
func (s *AuthService) Logout(token string) error {
	return database.DB.Where("token = ?", token).Delete(&models.UserSession{}).Error
}

// VerifyEmail marks the account verified if the token matches.
func (s *AuthService) VerifyEmail(token string) error {
	if token == "" {
		return errors.New("token tidak valid")
	}
	var user models.User
	if err := database.DB.Where("verification_token = ?", token).First(&user).Error; err != nil {
		return errors.New("token tidak valid")
	}
	return database.DB.Model(&user).Updates(map[string]interface{}{
		"email_verified":     true,
		"verification_token": "",
	}).Error
}

// ResendVerification regenerates the token and re-sends the email.
func (s *AuthService) ResendVerification(userID uint) error {
	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		return err
	}
	if user.EmailVerified {
		return nil
	}
	user.VerificationToken = generateToken()
	now := time.Now()
	user.VerificationSentAt = &now
	if err := database.DB.Save(&user).Error; err != nil {
		return err
	}
	s.sendVerification(&user)
	return nil
}

func (s *AuthService) sendVerification(user *models.User) {
	link := fmt.Sprintf("%s/verify-email.html?token=%s", baseURL(), user.VerificationToken)
	if err := email.SendVerificationEmail(user.Email, link); err != nil {
		log.Printf("Warning: failed to send verification email to %s: %v", user.Email, err)
	}
}

func baseURL() string {
	if v := os.Getenv("PUBLIC_BASE_URL"); v != "" {
		return v
	}
	return "http://localhost:8080"
}

func generateToken() string {
	b := make([]byte, 24)
	rand.Read(b)
	return hex.EncodeToString(b)
}
