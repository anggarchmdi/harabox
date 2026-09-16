import api from '../lib/api'
import type { ApiResponse } from '../types/api'
import type { CapacityOverride, CapacitySettings, CapacitySummary } from '../types/capacity'

export const settingsService = {
  /**
   * Get capacity settings including default capacity and upcoming overrides (Admin).
   */
  async getCapacitySettings(): Promise<CapacitySettings> {
    const res = await api.get<ApiResponse<CapacitySettings>>('/admin/settings/capacity')
    return res.data.data!
  },

  /**
   * Update default daily box capacity (Admin).
   */
  async updateDailyCapacity(dailyBoxCapacity: number): Promise<number> {
    const res = await api.put<ApiResponse<{ daily_box_capacity: number }>>('/admin/settings/capacity', {
      daily_box_capacity: dailyBoxCapacity,
    })
    return res.data.data!.daily_box_capacity
  },

  /**
   * Store or update a capacity override for a specific date (Admin).
   */
  async saveOverride(payload: {
    date: string
    max_capacity: number
    is_closed?: boolean
    note?: string
  }): Promise<CapacityOverride> {
    const res = await api.post<ApiResponse<CapacityOverride>>('/admin/settings/capacity/overrides', payload)
    return res.data.data!
  },

  /**
   * Delete an override for a specific date (Admin).
   */
  async deleteOverride(date: string): Promise<void> {
    await api.delete(`/admin/settings/capacity/overrides/${date}`)
  },

  /**
   * Get 14-day upcoming capacity overview (Admin).
   */
  async getCapacityOverview(startDate?: string, days: number = 14): Promise<CapacitySummary[]> {
    const res = await api.get<ApiResponse<CapacitySummary[]>>('/admin/capacity/overview', {
      params: {
        start_date: startDate,
        days,
      },
    })
    return res.data.data!
  },

  /**
   * Check capacity for a specific date (Public customer checkout).
   */
  async checkCapacity(date: string): Promise<CapacitySummary> {
    const res = await api.get<ApiResponse<CapacitySummary>>('/capacity-check', {
      params: { date },
    })
    return res.data.data!
  },
}
