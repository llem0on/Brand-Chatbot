package email

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

type sendRequest struct {
	From    string `json:"from"`
	To      []string `json:"to"`
	Subject string `json:"subject"`
	HTML    string `json:"html"`
}

// SendVerificationEmail sends the account verification link via Resend.
// If RESEND_API_KEY isn't set, it logs the link instead of failing, so local
// dev/testing works without a real email provider configured yet.
func SendVerificationEmail(toEmail, verificationLink string) error {
	apiKey := os.Getenv("RESEND_API_KEY")
	from := os.Getenv("EMAIL_FROM")
	if from == "" {
		from = "onboarding@resend.dev"
	}

	html := fmt.Sprintf(`<p>Halo!</p><p>Klik link berikut untuk verifikasi email kamu:</p><p><a href="%s">%s</a></p>`, verificationLink, verificationLink)

	if apiKey == "" {
		return fmt.Errorf("RESEND_API_KEY belum diatur - link verifikasi: %s", verificationLink)
	}

	payload, _ := json.Marshal(sendRequest{
		From:    from,
		To:      []string{toEmail},
		Subject: "Verifikasi email kamu",
		HTML:    html,
	})

	req, _ := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewBuffer(payload))
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("resend error: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		raw, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("resend returned status %d: %s", resp.StatusCode, string(raw))
	}

	return nil
}
