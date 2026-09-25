import api from '../lib/api'

import type {
  Order,
  OrderListResponse,
  OrderDetailResponse,
  UpdateOrderStatusResponse,
  OrderStatus,
  PaymentStatus,
  UpdateOrderPaymentPayload,
  CreateOrderPayload,
  CreateAdminOrderPayload,
  OrderRecapResponse,
  OrderRecapParams,
} from '../types/orders'

export interface OrderFilters {
  page?: number
  per_page?: number
  search?: string
  status?: OrderStatus | ''
  payment_status?: PaymentStatus | ''
  date_from?: string
  date_to?: string
}

export const ordersService = {
  async getAll(
    filters: OrderFilters = {},
  ): Promise<{
    orders: Order[]
    pagination: OrderListResponse['data']
  }> {
    const params = new URLSearchParams()

    if (filters.page) {
      params.set('page', String(filters.page))
    }

    if (filters.per_page) {
      params.set(
        'per_page',
        String(filters.per_page),
      )
    }

    if (filters.search) {
      params.set('search', filters.search)
    }

    if (filters.status) {
      params.set('status', filters.status)
    }

    if (filters.payment_status) {
      params.set('payment_status', filters.payment_status)
    }

    if (filters.date_from) {
      params.set('date_from', filters.date_from)
    }

    if (filters.date_to) {
      params.set('date_to', filters.date_to)
    }

    const queryString = params.toString()

    const url = queryString
      ? `/admin/orders?${queryString}`
      : '/admin/orders'

    const response =
      await api.get<OrderListResponse>(url)

    return {
      orders: response.data.data.data,
      pagination: response.data.data,
    }
  },

  async getById(id: number): Promise<Order> {
    const response =
      await api.get<OrderDetailResponse>(
        `/admin/orders/${id}`,
      )

    return response.data.data
  },

  async updateStatus(
    id: number,
    status: OrderStatus,
    force?: boolean,
  ): Promise<Order> {
    const response =
      await api.patch<UpdateOrderStatusResponse>(
        `/admin/orders/${id}/status`,
        {
          status,
          force,
        },
      )

    return response.data.data
  },

  async updatePayment(
    id: number,
    payload: UpdateOrderPaymentPayload,
  ): Promise<Order> {
    const response = await api.patch<{
      success: boolean
      message: string
      data: Order
    }>(`/admin/orders/${id}/payment`, payload)

    return response.data.data
  },

  async create(
    data: CreateOrderPayload,
  ): Promise<{ order_code: string }> {
    const response =
      await api.post<{
        success: boolean
        message: string
        data: { order_code: string }
      }>('/orders', data)

    return response.data.data
  },

  async createManualOrder(
    data: CreateAdminOrderPayload,
  ): Promise<Order> {
    const response = await api.post<{
      success: boolean
      message: string
      data: Order
    }>('/admin/orders', data)

    return response.data.data
  },

  async trackOrder(
    orderCode: string,
    phone?: string,
  ): Promise<Order> {
    const params = new URLSearchParams()
    if (phone?.trim()) {
      params.set('phone', phone.trim())
    }

    const query = params.toString() ? `?${params.toString()}` : ''
    const response = await api.get<{
      success: boolean
      message: string
      data: Order
    }>(`/orders/${encodeURIComponent(orderCode.trim())}${query}`)

    return response.data.data
  },

  async getRecap(
    params: OrderRecapParams = {},
  ): Promise<OrderRecapResponse['data']> {
    const searchParams = new URLSearchParams()
    if (params.start_date) searchParams.set('start_date', params.start_date)
    if (params.end_date) searchParams.set('end_date', params.end_date)
    if (params.date_from) searchParams.set('date_from', params.date_from)
    if (params.date_to) searchParams.set('date_to', params.date_to)
    if (params.year) searchParams.set('year', String(params.year))
    if (params.month !== undefined) searchParams.set('month', String(params.month))
    if (params.date_type) searchParams.set('date_type', params.date_type)
    if (params.status && params.status !== 'all') searchParams.set('status', params.status)
    if (params.payment_status && params.payment_status !== 'all') searchParams.set('payment_status', params.payment_status)
    if (params.search) searchParams.set('search', params.search)
    if (params.page) searchParams.set('page', String(params.page))
    if (params.per_page) searchParams.set('per_page', String(params.per_page))

    const query = searchParams.toString() ? `?${searchParams.toString()}` : ''
    const response = await api.get<OrderRecapResponse>(`/admin/orders/recap${query}`)
    return response.data.data
  },

  async exportRecap(params: OrderRecapParams = {}): Promise<void> {
    const searchParams = new URLSearchParams()
    if (params.start_date) searchParams.set('start_date', params.start_date)
    if (params.end_date) searchParams.set('end_date', params.end_date)
    if (params.date_from) searchParams.set('date_from', params.date_from)
    if (params.date_to) searchParams.set('date_to', params.date_to)
    if (params.year) searchParams.set('year', String(params.year))
    if (params.month !== undefined) searchParams.set('month', String(params.month))
    if (params.date_type) searchParams.set('date_type', params.date_type)
    if (params.status && params.status !== 'all') searchParams.set('status', params.status)
    if (params.payment_status && params.payment_status !== 'all') searchParams.set('payment_status', params.payment_status)
    if (params.search) searchParams.set('search', params.search)

    const query = searchParams.toString() ? `?${searchParams.toString()}` : ''
    const response = await api.get(`/admin/orders/recap/export${query}`, {
      responseType: 'blob',
    })

    const periodSlug =
      params.start_date && params.end_date
        ? `${params.start_date.replace(/-/g, '')}-sd-${params.end_date.replace(/-/g, '')}`
        : params.month === 'all'
          ? `tahun-${params.year || new Date().getFullYear()}`
          : `${params.year || new Date().getFullYear()}-${String(params.month || new Date().getMonth() + 1).padStart(2, '0')}`
    const defaultFileName = `rekap-pesanan-harabox-${periodSlug}.csv`

    const disposition = response.headers['content-disposition']
    let fileName = defaultFileName
    if (disposition && disposition.indexOf('filename=') !== -1) {
      const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition)
      if (matches != null && matches[1]) {
        fileName = matches[1].replace(/['"]/g, '')
      }
    }

    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  },
}
