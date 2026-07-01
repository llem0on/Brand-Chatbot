package groq

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type responseFormat struct {
	Type string `json:"type"`
}

type request struct {
	Model          string          `json:"model"`
	Messages       []Message       `json:"messages"`
	ResponseFormat *responseFormat `json:"response_format,omitempty"`
}

type response struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

const summarizePrompt = `Kamu adalah asisten yang meringkas percakapan customer service.
Baca riwayat percakapan berikut dan tulis ringkasan singkat (maksimal 3 kalimat)
tentang masalah atau kebutuhan utama pelanggan, plus konteks penting lainnya yang
perlu diketahui admin sebelum melanjutkan percakapan. Jawab langsung dengan
ringkasannya saja dalam Bahasa Indonesia, tanpa basa-basi atau pembuka.`

const orderExtractionPrompt = `Kamu adalah parser slot-filling untuk flow pemesanan produk.
Tugasmu HANYA membaca pesan customer dan memperbarui data pesanan (order draft)
dalam format JSON. Jangan membalas customer secara percakapan.

Field yang harus ada di JSON output (gunakan null kalau belum diketahui):
- product_code: kode produk dari katalog yang paling cocok (string atau null)
- product_name: nama produk dari katalog yang paling cocok (string atau null)
- size: ukuran yang diminta, dicocokkan ke opsi yang ada di katalog (string atau null)
- color: warna yang diminta, dicocokkan ke opsi yang ada di katalog (string atau null)
- quantity: jumlah yang dipesan, default 1 kalau produk sudah jelas tapi jumlah tidak disebut (number atau null)
- name: nama pembeli (string atau null)
- phone: nomor HP pembeli (string atau null)
- address: alamat lengkap pengiriman (string atau null)
- payment_method: "transfer_bank" atau "qris" sesuai pilihan customer (string atau null)

Aturan:
- Mulai dari draft saat ini yang diberikan, HANYA ubah field yang disebutkan
  secara baru di pesan customer ini. Field yang tidak disebutkan ulang TETAP
  pakai nilai dari draft saat ini, jangan dihapus/dikosongkan.
- Kalau customer minta ganti pilihan sebelumnya, update field itu saja.
- Kalau customer menyebut produk yang TIDAK ada di katalog, biarkan product_code
  dan product_name null.
- Balas HANYA dengan JSON valid satu object, tanpa teks lain, tanpa markdown code block.`

func buildSystemPrompt() string {
	brandName := envDefault("BRAND_NAME", "brand")
	brandTagline := envDefault("BRAND_TAGLINE", "tagline")

	return fmt.Sprintf(`Kamu adalah chatbot asisten virtual untuk brand baju "%s" (tagline: "%s"), ramah dan helpful.
Sapaan pembuka ke pengguna sudah ditangani di luar percakapan ini, jadi jangan
menyapa ulang dengan "selamat datang" atau semacamnya - langsung jawab pertanyaan
penggunanya. Bantu pelanggan menemukan produk yang sesuai, jawab pertanyaan
tentang ukuran, stok, harga, dan promo berdasarkan katalog yang diberikan. Gunakan
bahasa yang santai dan friendly. Jawab dalam Bahasa Indonesia.

Kalau pertanyaan pengguna di luar topik brand/produk, jangan langsung menolak.
Akui dengan ringan bahwa itu agak di luar topik kami, lalu tetap coba bantu
sebisanya sebelum mengarahkan kembali ke topik produk/order.

Kalau pengguna menanyakan data spesifik yang tidak ada di katalog/FAQ yang
diberikan (misalnya tingkat popularitas, jumlah terjual, atau stok real-time
yang tidak disebutkan), jangan mengarang angka. Katakan dengan jujur bahwa
data itu belum tersedia.`, brandName, brandTagline)
}

func envDefault(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

// chatCompletion sends a fully-built message list to the Groq chat completions API
func chatCompletion(messages []Message, jsonMode bool) (string, error) {
	apiKey := os.Getenv("GROQ_API_KEY")
	model := os.Getenv("GROQ_MODEL")

	req := request{
		Model:    model,
		Messages: messages,
	}
	if jsonMode {
		req.ResponseFormat = &responseFormat{Type: "json_object"}
	}

	payload, _ := json.Marshal(req)

	httpReq, _ := http.NewRequest("POST", "https://api.groq.com/openai/v1/chat/completions", bytes.NewBuffer(payload))
	httpReq.Header.Set("Authorization", "Bearer "+apiKey)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		return "", fmt.Errorf("groq error: %w", err)
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	var result response
	if err := json.Unmarshal(raw, &result); err != nil {
		return "", fmt.Errorf("parse error: %w", err)
	}

	if len(result.Choices) == 0 {
		return "", fmt.Errorf("no response from groq")
	}

	return result.Choices[0].Message.Content, nil
}

// Ask sends the conversation history to the LLM. knowledgeContext is optional
// grounding data (e.g. current product catalog, active promotions) injected as
// an extra system message so answers stay accurate instead of hallucinated.
func Ask(history []Message, knowledgeContext string) (string, error) {
	messages := make([]Message, 0, len(history)+2)
	messages = append(messages, Message{Role: "system", Content: buildSystemPrompt()})
	if knowledgeContext != "" {
		messages = append(messages, Message{Role: "system", Content: knowledgeContext})
	}
	messages = append(messages, history...)

	return chatCompletion(messages, false)
}

// Summarize asks the LLM for a short summary of a conversation, used to brief
// a human admin when a conversation gets escalated.
func Summarize(history []Message) (string, error) {
	if len(history) == 0 {
		return "", nil
	}

	messages := make([]Message, 0, len(history)+1)
	messages = append(messages, Message{Role: "system", Content: summarizePrompt})
	messages = append(messages, history...)

	return chatCompletion(messages, false)
}

// TranslateFilterValue uses the LLM to translate an English clothing filter value
// to Indonesian and Mandarin. Returns (id, zh, error).
func TranslateFilterValue(english, filterType string) (string, string, error) {
	prompt := fmt.Sprintf(`Translate this clothing/apparel filter value to Indonesian and Mandarin Chinese.

Filter type: %s
English value: %s

Rules:
- Well-known international terms (Navy, Olive, Charcoal, Khaki, Fleece, Denim, Polyester, Flannel, Linen, Unisex, etc.) stay the same in Indonesian.
- Reply ONLY with valid JSON, no markdown, no explanation: {"id": "...", "zh": "..."}`, filterType, english)

	messages := []Message{
		{Role: "system", Content: "You are a precise translator for fashion filter values. Output only valid JSON."},
		{Role: "user", Content: prompt},
	}

	raw, err := chatCompletion(messages, true)
	if err != nil {
		return "", "", err
	}

	var out struct {
		ID string `json:"id"`
		ZH string `json:"zh"`
	}
	if err := json.Unmarshal([]byte(raw), &out); err != nil {
		return "", "", fmt.Errorf("parse translation: %w", err)
	}
	if out.ID == "" || out.ZH == "" {
		return "", "", fmt.Errorf("empty translation result")
	}
	return out.ID, out.ZH, nil
}

// ExtractOrderUpdate asks the LLM to merge a customer's latest message into
// the current order draft, returning the updated draft as a raw JSON string.
// Callers must validate the result (product/size/color) against the real
// catalog before trusting it - the LLM can still get this wrong.
func ExtractOrderUpdate(currentDraftJSON, catalogContext, userMessage string) (string, error) {
	prompt := fmt.Sprintf("%s\n\nKatalog produk:\n%s\n\nDraft saat ini:\n%s", orderExtractionPrompt, catalogContext, currentDraftJSON)

	messages := []Message{
		{Role: "system", Content: prompt},
		{Role: "user", Content: userMessage},
	}

	return chatCompletion(messages, true)
}
