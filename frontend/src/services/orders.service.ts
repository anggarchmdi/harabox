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
  ): Promise<Order> {
    const response =
      await api.patch<UpdateOrderStatusResponse>(
        `/admin/orders/${id}/status`,
        {
          status,
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
}
