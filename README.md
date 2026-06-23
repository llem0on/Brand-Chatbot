# WA AI Bot — Go + Ollama + Meta Cloud API

## Setup

1. Isi `.env` dengan nilai dari Meta Developer Dashboard
2. Jalankan Ollama: `ollama serve`
3. Pull model: `ollama pull llama3.2`
4. Install deps: `go mod tidy`
5. Jalankan server: `go run main.go`
6. Expose via ngrok: `ngrok http 8080`
7. Daftarkan webhook URL di Meta Dashboard

## Struktur
```
wa-ai-bot/
├── main.go
├── handler/webhook.go
├── whatsapp/client.go
├── ollama/client.go
└── .env
```

## Environment Variables
- `PHONE_NUMBER_ID` — dari Meta Dashboard
- `ACCESS_TOKEN` — dari Meta Dashboard (temporary 24 jam)
- `VERIFY_TOKEN` — bebas, asal sama dengan yang di Meta Dashboard
- `OLLAMA_MODEL` — nama model Ollama (default: llama3.2)
- `OLLAMA_URL` — URL Ollama (default: http://localhost:11434)
