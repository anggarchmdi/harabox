import api from '../lib/api'
import type {
  Testimonial,
  CreateTestimonialPayload,
  TestimonialSummary,
  TestimonialPaginationData,
  CheckOrderTestimonialResponse,
} from '../types/testimonial'

export interface TestimonialFilters {
  page?: number
  per_page?: number
  search?: string
  is_displayed?: boolean | ''
  rating?: number | ''
}

export const testimonialService = {
  /**
   * Ambil semua testimoni aktif untuk ditampilkan di homepage slider
   */
  async getPublic(): Promise<Testimonial[]> {
    const response = await api.get<{
      success: boolean
      message: string
      data: Testimonial[]
    }>('/testimonials')

    return response.data.data
  },

  /**
   * Cek apakah pesanan tertentu sudah pernah diberi ulasan dan ambil data produk pesanan
   */
  async checkByOrder(orderCode: string): Promise<CheckOrderTestimonialResponse> {
    const response = await api.get<CheckOrderTestimonialResponse>(
      `/testimonials/check/${encodeURIComponent(orderCode)}`,
    )

    return response.data
  },

  /**
   * Kirim ulasan/testimoni baru dari halaman publik (/testimoni)
   */
  async submit(data: CreateTestimonialPayload): Promise<{
    success: boolean
    message: string
    data: Testimonial
  }> {
    const response = await api.post<{
      success: boolean
      message: string
      data: Testimonial
    }>('/testimonials', data)

    return response.data
  },

  /**
   * Ambil semua ulasan untuk admin panel dengan filter dan ringkasan
   */
  async getAdminAll(filters: TestimonialFilters = {}): Promise<{
    data: TestimonialPaginationData
    summary: TestimonialSummary
  }> {
    const params = new URLSearchParams()

    if (filters.page) {
      params.set('page', String(filters.page))
    }
    if (filters.per_page) {
      params.set('per_page', String(filters.per_page))
    }
    if (filters.search) {
      params.set('search', filters.search)
    }
    if (filters.is_displayed !== undefined && filters.is_displayed !== '') {
      params.set('is_displayed', String(filters.is_displayed))
    }
    if (filters.rating !== undefined && filters.rating !== '') {
      params.set('rating', String(filters.rating))
    }

    const response = await api.get<{
      success: boolean
      message: string
      data: TestimonialPaginationData
      summary: TestimonialSummary
    }>(`/admin/testimonials?${params.toString()}`)

    return {
      data: response.data.data,
      summary: response.data.summary,
    }
  },

  /**
   * Toggle status tampil/sembunyi di homepage
   */
  async toggleDisplay(id: number): Promise<Testimonial> {
    const response = await api.patch<{
      success: boolean
      message: string
      data: Testimonial
    }>(`/admin/testimonials/${id}/toggle`)

    return response.data.data
  },

  /**
   * Tambah ulasan manual dari admin
   */
  async createAdmin(data: CreateTestimonialPayload): Promise<Testimonial> {
    const response = await api.post<{
      success: boolean
      message: string
      data: Testimonial
    }>('/admin/testimonials', data)

    return response.data.data
  },

  /**
   * Hapus ulasan oleh admin
   */
  async delete(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<{
      success: boolean
      message: string
    }>(`/admin/testimonials/${id}`)

    return response.data
  },
}
