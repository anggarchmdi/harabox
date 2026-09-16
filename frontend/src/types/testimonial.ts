export interface TestimonialOrderedItem {
  name: string
  quantity: number
  price?: number
  image?: string | null
}

export interface Testimonial {
  id: number
  name: string
  institution: string | null
  rating: number
  order_quantity: string
  message: string
  is_displayed: boolean
  order_code: string | null
  ordered_items?: TestimonialOrderedItem[]
  created_at?: string
  updated_at?: string
}

export interface CreateTestimonialPayload {
  name?: string
  institution?: string
  rating: number
  order_quantity?: string
  message: string
  order_code?: string
  is_displayed?: boolean
}

export interface TestimonialSummary {
  total: number
  displayed: number
  hidden: number
  average_rating: number
}

export interface TestimonialPaginationData {
  data: Testimonial[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export interface OrderReviewItem {
  id: number
  item_name: string
  quantity: number
  price: number
  product_image?: string | null
  product_name: string
}

export interface OrderReviewDetail {
  order_code: string
  customers_name: string
  status: string
  total_quantity: number
  items: OrderReviewItem[]
}

export interface CheckOrderTestimonialResponse {
  success: boolean
  has_reviewed: boolean
  data: Testimonial | null
  order?: OrderReviewDetail | null
}
