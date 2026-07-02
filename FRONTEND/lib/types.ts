export type FilterValue = {
  id: number;
  type: string;   // color | gender | category | material | size
  value: string;  // "English,Indonesian,Mandarin"
};

export type FAQ = {
  id: number;
  question: string;
  answer: string;
  keywords: string;
  category: string;
  display_order: number;
  active: boolean;
};

export type ProductCategory = {
  id: number;
  name: string;
  description: string;
};

export type ProductVariant = {
  id: number;
  product_id: number;
  size: string;
  color: string;
  stock: number;
};

export type Product = {
  id: number;
  category_id: number;
  category?: ProductCategory;
  code: string;
  name: string;
  description: string;
  price: number;
  sizes: string;
  colors: string;
  material: string;
  gender: string;
  stock: number;
  image_url: string;
  active: boolean;
  discount_pct?: number;
  variants?: ProductVariant[];
};

export type Promotion = {
  id: number;
  title: string;
  description: string;
  type: "promo" | "event";
  start_date: string | null;
  end_date: string | null;
  active: boolean;
};

export type Customer = {
  id: number;
  customer_code: string;
  user_id: string;
  name: string;
  phone: string;
  address: string;
};

export type OrderItem = {
  id: number;
  product_id: number;
  product?: Product;
  product_variant_id: number;
  product_variant?: ProductVariant;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

export type Order = {
  id: number;
  order_number: string;
  user_id: string;
  customer_id: number;
  customer?: Customer;
  items: OrderItem[];
  shipping_cost: number;
  total_amount: number;
  payment_method: string;
  address: string;
  postal_code: string;
  courier_code: string;
  courier_service: string;
  courier_name: string;
  biteship_order_id: string;
  waybill_id: string;
  shipping_status: string;
  status: string;
  payment_proof_url: string;
  rejection_reason: string;
  created_at: string;
};

export type PurchaseSettings = {
  id: number;
  bank_name: string;
  bank_account_number: string;
  bank_account_holder: string;
  enable_bank_transfer: boolean;
  qris_image_url: string;
  enable_qris: boolean;
  shipping_cost: number;
  payment_deadline_hours: number;
  closing_message: string;
  // Biteship shipping configuration
  origin_postal_code: string;
  origin_address: string;
  origin_contact_name: string;
  origin_contact_phone: string;
  default_item_weight_gram: number;
  biteship_couriers: string;
};


export type ConversationState = {
  id: number;
  user_id: string;
  channel: string;
  is_escalated: boolean;
  escalation_summary: string;
  escalated_at: string | null;
};

export type ChatMessage = {
  id: number;
  user_id: string;
  sender: string;
  content: string;
  created_at: string;
};
