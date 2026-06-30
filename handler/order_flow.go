package handler

import (
	"encoding/json"
	"fmt"
	"log"
	"regexp"
	"strings"
	"wa-ai-bot/database"
	"wa-ai-bot/groq"
	"wa-ai-bot/models"
	"wa-ai-bot/service"
)

// purchaseIntentPattern triggers entry into the ordering flow. Bare "pesan"
// is deliberately excluded since "pesan saya belum sampai" (complaint about
// an existing order) would false-positive on a purchase trigger.
var purchaseIntentPattern = regexp.MustCompile(`\b(beli|order|checkout)\b|\bpesan (barang|produk)\b`)

var (
	cancelPattern    = regexp.MustCompile(`\b(batal|cancel)\b`)
	confirmPattern   = regexp.MustCompile(`\bkonfirmasi\b`)
	affirmPattern    = regexp.MustCompile(`\b(ya|iya|yakin|betul|benar)\b`)
	preorderPattern  = regexp.MustCompile(`\bpre-?order\b`)
)

// DetectPurchaseIntent checks if the user wants to start a new purchase
func DetectPurchaseIntent(text string) bool {
	return purchaseIntentPattern.MatchString(strings.ToLower(text))
}

// extractedDraft mirrors models.OrderDraft for parsing the LLM's JSON response
type extractedDraft struct {
	ProductCode   string `json:"product_code"`
	ProductName   string `json:"product_name"`
	Size          string `json:"size"`
	Color         string `json:"color"`
	Quantity      int    `json:"quantity"`
	Name          string `json:"name"`
	Phone         string `json:"phone"`
	Address       string `json:"address"`
	PaymentMethod string `json:"payment_method"`
}

// startOrderingFlow switches a conversation into the purchase flow and
// immediately processes the triggering message (which may already contain
// product/variant info, e.g. "mau beli kaos hitam ukuran M").
func startOrderingFlow(state *models.ConversationState, text string) (string, error) {
	state.CurrentFlow = models.FlowOrdering
	state.OrderStep = ""
	state.Context = ""
	database.DB.Save(state)
	return handleOrderingFlow(state, text)
}

func handleOrderingFlow(state *models.ConversationState, text string) (string, error) {
	draft := loadDraft(state)
	lowered := strings.ToLower(strings.TrimSpace(text))

	settingsSvc := service.NewSettingsService()
	settings, err := settingsSvc.GetSettings()
	if err != nil {
		return "", err
	}

	productSvc := service.NewProductService()

	// Pending cancel confirmation takes priority over everything else
	if state.OrderStep == models.OrderStepKonfirmasiBatal {
		if affirmPattern.MatchString(lowered) {
			resetOrderState(state)
			return "Oke, pesanan dibatalkan. Ada lagi yang bisa saya bantu? 😊", nil
		}

		step, prompt := nextStepAndPrompt(draft, settings)
		state.OrderStep = step
		database.DB.Save(state)
		if step == models.OrderStepKonfirmasi {
			return buildOrderSummaryForDraft(draft, settings), nil
		}
		return "Oke, lanjut order ya. " + prompt, nil
	}

	// Explicit cancel request, anywhere in the flow
	if cancelPattern.MatchString(lowered) {
		state.OrderStep = models.OrderStepKonfirmasiBatal
		database.DB.Save(state)
		return `Yakin mau batalkan pesanan ini? Balas "ya" untuk batalkan, atau lanjut kirim pesan untuk terus order.`, nil
	}

	// Explicit confirmation finalizes the order
	if state.OrderStep == models.OrderStepKonfirmasi && confirmPattern.MatchString(lowered) {
		return finalizeOrder(state, draft, settings)
	}

	if preorderPattern.MatchString(lowered) {
		draft.PreOrder = true
	}

	// Merge whatever the user just said into the draft, then re-validate
	catalogContext := productSvc.FormatProductContext()
	draftJSON, _ := json.Marshal(draft)
	rawJSON, err := groq.ExtractOrderUpdate(string(draftJSON), catalogContext, text)
	if err != nil {
		log.Printf("Error extracting order update: %v", err)
	}

	if issue := mergeExtraction(&draft, rawJSON, productSvc); issue != "" {
		saveDraft(state, draft)
		return issue, nil
	}

	step, prompt := nextStepAndPrompt(draft, settings)
	state.OrderStep = step
	saveDraft(state, draft)

	if step == models.OrderStepKonfirmasi {
		return buildOrderSummaryForDraft(draft, settings), nil
	}
	return prompt, nil
}

// mergeExtraction merges the LLM's extracted fields into draft, resolving
// product/variant references against the real catalog. It returns a non-empty
// issue message if something needs to be surfaced to the customer instead of
// silently advancing (product not found, invalid variant, out of stock, etc).
func mergeExtraction(draft *models.OrderDraft, rawJSON string, productSvc *service.ProductService) string {
	rawJSON = cleanJSONResponse(rawJSON)
	if rawJSON == "" {
		return ""
	}

	var extracted extractedDraft
	if err := json.Unmarshal([]byte(rawJSON), &extracted); err != nil {
		log.Printf("Warning: partial order extraction parse error: %v (raw=%s)", err, rawJSON)
	}

	productQuery := extracted.ProductCode
	if productQuery == "" {
		productQuery = extracted.ProductName
	}
	if productQuery != "" {
		product, err := productSvc.FindByCodeOrName(productQuery)
		if err != nil {
			return fmt.Sprintf(`Maaf, produk "%s" tidak ketemu di katalog kami. Coba sebutkan nama produk lain ya.`, productQuery)
		}
		if draft.ProductID != product.ID {
			// switching products invalidates the old variant/quantity choice
			draft.ProductID = product.ID
			draft.ProductCode = product.Code
			draft.ProductName = product.Name
			draft.Size = ""
			draft.Color = ""
			draft.Quantity = 0
			draft.PreOrder = false
		}
	}

	if extracted.Size != "" {
		draft.Size = extracted.Size
	}
	if extracted.Color != "" {
		draft.Color = extracted.Color
	}
	if extracted.Quantity > 0 {
		draft.Quantity = extracted.Quantity
	}
	if extracted.Name != "" {
		draft.Name = extracted.Name
	}
	if extracted.Phone != "" {
		draft.Phone = extracted.Phone
	}
	if extracted.Address != "" {
		draft.Address = extracted.Address
	}
	if extracted.PaymentMethod != "" {
		draft.PaymentMethod = extracted.PaymentMethod
	}

	if draft.ProductID == 0 || draft.Size == "" || draft.Color == "" {
		return ""
	}

	variant, err := productSvc.FindVariant(draft.ProductID, draft.Size, draft.Color)
	if err != nil {
		variants, _ := productSvc.GetVariants(draft.ProductID)
		size, color := draft.Size, draft.Color
		draft.Size = ""
		draft.Color = ""
		return fmt.Sprintf("Maaf, kombinasi ukuran %s warna %s tidak tersedia untuk %s. %s",
			size, color, draft.ProductName, describeAvailableVariants(variants))
	}

	if variant.Stock <= 0 && !draft.PreOrder {
		variants, _ := productSvc.GetVariants(draft.ProductID)
		return fmt.Sprintf("Maaf, stok %s ukuran %s warna %s sedang kosong. %s\n\nMau pre-order varian ini? Balas \"pre-order\" untuk lanjut, atau pilih varian lain.",
			draft.ProductName, draft.Size, draft.Color, describeAvailableVariants(variants))
	}

	if draft.Quantity > 0 && variant.Stock > 0 && draft.Quantity > variant.Stock && !draft.PreOrder {
		return fmt.Sprintf(`Stok %s ukuran %s warna %s cuma tersisa %d. Mau kurangi jumlah jadi %d, atau pre-order untuk sisanya (balas "pre-order")?`,
			draft.ProductName, draft.Size, draft.Color, variant.Stock, variant.Stock)
	}

	return ""
}

func describeAvailableVariants(variants []models.ProductVariant) string {
	if len(variants) == 0 {
		return "Belum ada data varian untuk produk ini."
	}
	parts := make([]string, 0, len(variants))
	for _, v := range variants {
		stockNote := fmt.Sprintf("stok %d", v.Stock)
		if v.Stock <= 0 {
			stockNote = "kosong"
		}
		parts = append(parts, fmt.Sprintf("%s/%s (%s)", v.Size, v.Color, stockNote))
	}
	return "Pilihan yang ada: " + strings.Join(parts, ", ")
}

// nextStepAndPrompt figures out what's still missing from the draft and what
// to ask next. State is derived from draft completeness rather than a strict
// linear counter, so users can fill multiple slots per message or revisit one.
func nextStepAndPrompt(draft models.OrderDraft, settings *models.PurchaseSettings) (step, prompt string) {
	if draft.ProductID == 0 {
		return models.OrderStepPilihProduk, "Mau beli produk apa? Sebutkan nama atau kode produknya ya."
	}
	if draft.Size == "" || draft.Color == "" {
		return models.OrderStepPilihVarian, fmt.Sprintf("Untuk %s, mau ukuran & warna apa?", draft.ProductName)
	}
	if draft.Quantity <= 0 {
		return models.OrderStepPilihVarian, "Mau pesan berapa banyak?"
	}
	if draft.Name == "" || draft.Phone == "" || draft.Address == "" {
		return models.OrderStepDataPembeli, "Boleh kasih nama lengkap, no HP, dan alamat lengkap pengiriman ya?"
	}
	if draft.PaymentMethod == "" {
		return models.OrderStepPilihBayar, buildPaymentMethodPrompt(settings)
	}
	return models.OrderStepKonfirmasi, ""
}

func buildPaymentMethodPrompt(settings *models.PurchaseSettings) string {
	var methods []string
	if settings.EnableBankTransfer {
		methods = append(methods, "Transfer Bank")
	}
	if settings.EnableQRIS {
		methods = append(methods, "QRIS")
	}
	if len(methods) == 0 {
		return "Mau bayar pakai apa?"
	}
	return "Mau bayar pakai apa? Pilihan: " + strings.Join(methods, " / ")
}

func buildOrderSummaryForDraft(draft models.OrderDraft, settings *models.PurchaseSettings) string {
	var product models.Product
	database.DB.First(&product, draft.ProductID)
	return buildOrderSummary(draft, product.Price, *settings)
}

func buildOrderSummary(draft models.OrderDraft, unitPrice int, settings models.PurchaseSettings) string {
	total := unitPrice*draft.Quantity + settings.ShippingCost
	return fmt.Sprintf(`🛒 Ringkasan Pesanan
Produk: %s - %s/%s
Jumlah: %d
Total: Rp%s

Pengiriman ke: %s
Pembayaran: %s

Ketik "konfirmasi" untuk lanjut atau "ubah" untuk edit`,
		draft.ProductName, draft.Size, draft.Color, draft.Quantity,
		formatRupiah(total), draft.Address, paymentMethodLabel(draft.PaymentMethod))
}

func finalizeOrder(state *models.ConversationState, draft models.OrderDraft, settings *models.PurchaseSettings) (string, error) {
	customerSvc := service.NewCustomerService()
	customer, err := customerSvc.GetOrCreate(state.UserID, draft.Name, draft.Phone, draft.Address)
	if err != nil {
		return "", err
	}

	productSvc := service.NewProductService()
	variant, err := productSvc.FindVariant(draft.ProductID, draft.Size, draft.Color)
	if err != nil {
		return "", err
	}

	var product models.Product
	if err := database.DB.First(&product, draft.ProductID).Error; err != nil {
		return "", err
	}

	orderSvc := service.NewOrderService()
	order, err := orderSvc.CreateOrder(service.CreateOrderInput{
		UserID:     state.UserID,
		CustomerID: customer.ID,
		Items: []service.OrderLineInput{
			{
				ProductID:        draft.ProductID,
				ProductVariantID: variant.ID,
				Quantity:         draft.Quantity,
				UnitPrice:        product.Price,
			},
		},
		ShippingCost:  settings.ShippingCost,
		PaymentMethod: draft.PaymentMethod,
		Address:       draft.Address,
	})
	if err != nil {
		return "", err
	}

	paymentInstructions := buildPaymentInstructions(draft.PaymentMethod, *settings)
	resetOrderState(state)

	return fmt.Sprintf("✅ Pesanan dikonfirmasi!\n\nNomor Order: %s\n\n%s\n\nBatas waktu pembayaran: %d jam dari sekarang.\n\n%s",
		order.OrderNumber, paymentInstructions, settings.PaymentDeadlineHours, settings.ClosingMessage), nil
}

func buildPaymentInstructions(method string, settings models.PurchaseSettings) string {
	switch method {
	case models.PaymentMethodTransferBank:
		return fmt.Sprintf("Silakan transfer ke:\n%s\n%s\na.n. %s", settings.BankName, settings.BankAccountNumber, settings.BankAccountHolder)
	case models.PaymentMethodQRIS:
		if settings.QRISImageURL != "" {
			return "Silakan scan QRIS berikut untuk bayar:\n" + settings.QRISImageURL
		}
		return "Silakan tunggu kode QRIS dari admin (belum diatur di sistem)."
	}
	return ""
}

func paymentMethodLabel(method string) string {
	switch method {
	case models.PaymentMethodTransferBank:
		return "Transfer Bank"
	case models.PaymentMethodQRIS:
		return "QRIS"
	}
	return method
}

func formatRupiah(amount int) string {
	s := fmt.Sprintf("%d", amount)
	n := len(s)
	if n <= 3 {
		return s
	}
	var parts []string
	for n > 3 {
		parts = append([]string{s[n-3:]}, parts...)
		s = s[:n-3]
		n = len(s)
	}
	parts = append([]string{s}, parts...)
	return strings.Join(parts, ".")
}

func resetOrderState(state *models.ConversationState) {
	state.CurrentFlow = models.FlowChat
	state.OrderStep = ""
	state.Context = ""
	database.DB.Save(state)
}

func loadDraft(state *models.ConversationState) models.OrderDraft {
	var draft models.OrderDraft
	if state.Context != "" {
		_ = json.Unmarshal([]byte(state.Context), &draft)
	}
	return draft
}

func saveDraft(state *models.ConversationState, draft models.OrderDraft) {
	b, _ := json.Marshal(draft)
	state.Context = string(b)
	database.DB.Save(state)
}

func cleanJSONResponse(s string) string {
	s = strings.TrimSpace(s)
	s = strings.TrimPrefix(s, "```json")
	s = strings.TrimPrefix(s, "```")
	s = strings.TrimSuffix(s, "```")
	return strings.TrimSpace(s)
}
