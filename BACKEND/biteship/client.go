package biteship

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

const baseURL = "https://api.biteship.com"

type Client struct {
	apiKey string
	http   *http.Client
}

func NewClient() *Client {
	return &Client{
		apiKey: os.Getenv("BITESHIP_API_KEY"),
		http:   &http.Client{Timeout: 15 * time.Second},
	}
}

func (c *Client) Enabled() bool {
	return c.apiKey != ""
}

// ─── Rate API ──────────────────────────────────────────────────────────────

type RateItem struct {
	Name     string `json:"name"`
	Value    int    `json:"value"`
	Weight   int    `json:"weight"` // grams
	Quantity int    `json:"quantity"`
}

type RateRequest struct {
	OriginPostalCode      string     `json:"origin_postal_code"`
	DestinationPostalCode string     `json:"destination_postal_code"`
	Couriers              string     `json:"couriers"`
	Items                 []RateItem `json:"items"`
}

type CourierRate struct {
	CompanyName        string `json:"company_name"`
	CourierName        string `json:"courier_name"`
	CourierCode        string `json:"courier_code"`
	CourierServiceCode string `json:"courier_service_code"`
	Price              int    `json:"price"`
	Duration           string `json:"duration"`
}

type RateResponse struct {
	Success bool          `json:"success"`
	Message string        `json:"message"`
	Pricing []CourierRate `json:"pricing"`
}

func (c *Client) GetRates(req RateRequest) (*RateResponse, error) {
	return doPost[RateResponse](c, "/v1/rates/couriers", req)
}

// ─── Order API ─────────────────────────────────────────────────────────────

type OrderItem struct {
	Name     string `json:"name"`
	Value    int    `json:"value"`
	Weight   int    `json:"weight"`
	Quantity int    `json:"quantity"`
}

type CreateOrderRequest struct {
	ShipperContactName      string      `json:"shipper_contact_name"`
	ShipperContactPhone     string      `json:"shipper_contact_phone"`
	ShipperOrganization     string      `json:"shipper_organization"`
	OriginContactName       string      `json:"origin_contact_name"`
	OriginContactPhone      string      `json:"origin_contact_phone"`
	OriginAddress           string      `json:"origin_address"`
	OriginPostalCode        string      `json:"origin_postal_code"`
	DestinationContactName  string      `json:"destination_contact_name"`
	DestinationContactPhone string      `json:"destination_contact_phone"`
	DestinationAddress      string      `json:"destination_address"`
	DestinationPostalCode   string      `json:"destination_postal_code"`
	CourierCompany          string      `json:"courier_company"`
	CourierType             string      `json:"courier_type"`
	DeliveryType            string      `json:"delivery_type"`
	OrderNote               string      `json:"order_note"`
	Items                   []OrderItem `json:"items"`
}

type CreateOrderResponse struct {
	Success   bool   `json:"success"`
	Message   string `json:"message"`
	ID        string `json:"id"`
	WaybillID string `json:"waybill_id"`
}

func (c *Client) CreateOrder(req CreateOrderRequest) (*CreateOrderResponse, error) {
	return doPost[CreateOrderResponse](c, "/v1/orders", req)
}

// ─── internal helper ───────────────────────────────────────────────────────

func doPost[T any](c *Client, path string, body any) (*T, error) {
	b, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequest(http.MethodPost, baseURL+path, bytes.NewReader(b))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("biteship: request failed: %w", err)
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("biteship: HTTP %d on %s: %s", resp.StatusCode, path, string(raw))
	}
	var result T
	if err := json.Unmarshal(raw, &result); err != nil {
		return nil, fmt.Errorf("biteship: parse error on %s: %s", path, string(raw))
	}
	return &result, nil
}
