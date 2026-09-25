export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'completed'
  | 'cancelled'

export interface CreateOrderItemAddonPayload {
  addon_id: number
}

export interface CreateOrderItemPayload {
  product_id: number
  quantity: number
  addons?: CreateOrderItemAddonPayload[]
}

export interface CreateOrderPayload {
  customers_name: string
  customers_phone: string
  event_date: string
  event_time?: string
  delivery_address: string
  notes?: string
  items: CreateOrderItemPayload[]
  addons?: {
    addon_id: number
    quantity: number
  }[]
}

export interface CreateAdminOrderPayload extends CreateOrderPayload {
  delivery_fee?: number
  status?: OrderStatus
  payment_status?: PaymentStatus
  paid_amount?: number
  payment_method?: string
  payment_note?: string
}

export interface OrderItemAddon {
  id?: number
  addon_id?: number | null
  addon_group_name?: string
  addon_name?: string
  price: string
  quantity: number
  subtotal: string
}

export interface OrderItem {
  id?: number
  order_id?: number
  product_id: number | null
  item_name: string
  price: string
  quantity: number
  subtotal: string
  product?: {
    id: number
    name: string
    slug: string
    price: string
  } | null
  addons?: OrderItemAddon[]
}

export interface OrderAddon {
  id: number
  order_id: number
  addon_id: number | null
  addon_name: string
  price: string
  quantity: number
  subtotal: string
  addon?: {
    id: number
    name: string
    price: string
  } | null
}

export type PaymentStatus = 'unpaid' | 'dp' | 'paid'

export interface UpdateOrderPaymentPayload {
  payment_status: PaymentStatus
  paid_amount?: number
  payment_method?: string
  payment_note?: string
}

export interface Order {
  id: number
  order_code: string

  customers_name: string
  customers_phone: string

  event_date: string
  event_time: string | null

  delivery_address: string
  notes: string | null

  subtotal: string
  delivery_fee: string
  total: string

  status: OrderStatus
  payment_status: PaymentStatus
  paid_amount: string | number
  payment_method: string | null
  payment_note: string | null
  paid_at: string | null

  created_at: string
  updated_at: string

  items?: OrderItem[]
  addons?: OrderAddon[]
}

export interface OrderPagination {
  current_page: number
  data: Order[]
  first_page_url: string
  from: number | null
  last_page: number
  last_page_url: string
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number | null
  total: number
}

export interface OrderListResponse {
  success: boolean
  message: string
  data: OrderPagination
}

export interface OrderDetailResponse {
  success: boolean
  message: string
  data: Order
}

export interface UpdateOrderStatusResponse {
  success: boolean
  message: string
  data: Order
}

export interface OrderRecapSummary {
  total_orders: number
  total_portions: number
  total_revenue: number
  total_paid: number
  total_unpaid: number
  status_counts: Record<string, number>
  payment_status_counts: Record<string, number>
}

export interface OrderRecapFilterInfo {
  start_date?: string | null
  end_date?: string | null
  period_label?: string
  year?: number
  month?: number | 'all'
  month_name?: string
  date_type: 'event_date' | 'created_at'
  date_type_label: string
}

export interface OrderRecapResponse {
  success: boolean
  message: string
  data: {
    summary: OrderRecapSummary
    filter_info: OrderRecapFilterInfo
    orders: OrderPagination
  }
}

export interface OrderRecapParams {
  start_date?: string
  end_date?: string
  date_from?: string
  date_to?: string
  year?: number
  month?: number | 'all'
  date_type?: 'event_date' | 'created_at'
  status?: OrderStatus | 'all' | ''
  payment_status?: PaymentStatus | 'all' | ''
  search?: string
  page?: number
  per_page?: number
}

