package whatsapp

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
)

type textBody struct {
	Body string `json:"body"`
}

type message struct {
	MessagingProduct string   `json:"messaging_product"`
	To               string   `json:"to"`
	Type             string   `json:"type"`
	Text             textBody `json:"text"`
}

// MediaMessage represents WhatsApp media message structure
type MediaMessage struct {
	ID       string `json:"id"`
	MimeType string `json:"mime_type"`
	Sha256   string `json:"sha256"`
	Caption  string `json:"caption,omitempty"`
}

func SendText(to, text string) error {
	phoneID := os.Getenv("PHONE_NUMBER_ID")
	token := os.Getenv("ACCESS_TOKEN")
	url := fmt.Sprintf("https://graph.facebook.com/v18.0/%s/messages", phoneID)

	body, _ := json.Marshal(message{
		MessagingProduct: "whatsapp",
		To:               to,
		Type:             "text",
		Text:             textBody{Body: text},
	})

	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("send error: %w", err)
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	log.Printf("WA API status=%d body=%s", resp.StatusCode, string(raw))

	if resp.StatusCode != 200 {
		return fmt.Errorf("WA API returned status %d: %s", resp.StatusCode, string(raw))
	}
	return nil
}

// GetMediaURL retrieves the download URL for a media file
func GetMediaURL(mediaID string) (string, error) {
	token := os.Getenv("ACCESS_TOKEN")
	url := fmt.Sprintf("https://graph.facebook.com/v18.0/%s", mediaID)

	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("get media error: %w", err)
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)

	var result struct {
		URL      string `json:"url"`
		MimeType string `json:"mime_type"`
	}

	if err := json.Unmarshal(raw, &result); err != nil {
		return "", fmt.Errorf("parse error: %w", err)
	}

	return result.URL, nil
}

// DownloadMedia downloads media file from WhatsApp
func DownloadMedia(mediaURL string) ([]byte, error) {
	token := os.Getenv("ACCESS_TOKEN")

	req, _ := http.NewRequest("GET", mediaURL, nil)
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("download error: %w", err)
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read error: %w", err)
	}

	return data, nil
}
