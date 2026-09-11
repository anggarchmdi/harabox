export interface Testimonial {
  id: number
  name: string
  institution: string | null
  rating: number
  order_quantity: string
  message: string
  is_displayed: boolean
  order_code: string | null
  created_at?: string
  updated_at?: string
}

export interface CreateTestimonialPayload {
  name: string
  institution?: string
  rating: number
  order_quantity: string
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
