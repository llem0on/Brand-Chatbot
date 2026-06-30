package cloudinary

import (
	"bytes"
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"strconv"
	"time"
)

type uploadResponse struct {
	SecureURL string `json:"secure_url"`
	Error     struct {
		Message string `json:"message"`
	} `json:"error"`
}

// UploadImage uploads a file to Cloudinary using a signed server-side
// request, placing it under the given folder (e.g. "products"), and
// returns its public HTTPS URL.
func UploadImage(file io.Reader, filename string, folder string) (string, error) {
	cloudName := os.Getenv("CLOUDINARY_CLOUD_NAME")
	apiKey := os.Getenv("CLOUDINARY_API_KEY")
	apiSecret := os.Getenv("CLOUDINARY_API_SECRET")
	if cloudName == "" || apiKey == "" || apiSecret == "" {
		return "", fmt.Errorf("Cloudinary belum dikonfigurasi - isi CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET di .env")
	}

	timestamp := strconv.FormatInt(time.Now().Unix(), 10)
	// Signed params must be sorted alphabetically by key before hashing.
	signature := sha1Hex("folder=" + folder + "&timestamp=" + timestamp + apiSecret)

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("file", filename)
	if err != nil {
		return "", err
	}
	if _, err := io.Copy(part, file); err != nil {
		return "", err
	}
	_ = writer.WriteField("api_key", apiKey)
	_ = writer.WriteField("timestamp", timestamp)
	_ = writer.WriteField("folder", folder)
	_ = writer.WriteField("signature", signature)
	if err := writer.Close(); err != nil {
		return "", err
	}

	uploadURL := fmt.Sprintf("https://api.cloudinary.com/v1_1/%s/image/upload", cloudName)
	req, err := http.NewRequest("POST", uploadURL, body)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("cloudinary error: %w", err)
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	var result uploadResponse
	if err := json.Unmarshal(raw, &result); err != nil {
		return "", fmt.Errorf("cloudinary returned unexpected response: %s", string(raw))
	}
	if resp.StatusCode >= 300 || result.SecureURL == "" {
		return "", fmt.Errorf("cloudinary upload failed: %s", result.Error.Message)
	}

	return result.SecureURL, nil
}

func sha1Hex(s string) string {
	h := sha1.Sum([]byte(s))
	return hex.EncodeToString(h[:])
}
