export interface DashboardSummary {
  orders_today: number
  orders_this_month: number

  revenue_today: number
  revenue_this_month: number

  orders_growth: number
  revenue_growth: number

  total_products: number
  active_products: number

  total_categories: number
  active_categories: number

  pending_orders: number
  processing_orders?: number
  completed_orders?: number
}

export interface DashboardDay {
  date: string
  label: string
  orders: number
  revenue: number
}

export interface DashboardOrderStatus {
  status: string
  total: number
}

export interface DashboardRecentOrder {
  id: number
  order_code: string
  customers_name: string
  customers_phone: string
  event_date: string
  event_time: string | null
  delivery_address?: string
  notes?: string | null
  subtotal?: string | number
  delivery_fee?: string | number
  total: string | number
  status: string
  created_at: string
  items?: {
    id: number
    product_id: number
    item_name: string
    price: string | number
    quantity: number
    subtotal: string | number
  }[]
}

export interface DashboardData {
  summary: DashboardSummary
  last_seven_days: DashboardDay[]
  order_statuses: DashboardOrderStatus[]
  recent_orders: DashboardRecentOrder[]
}

export interface DashboardResponse {
  success: boolean
  message: string
  data: DashboardData
}
