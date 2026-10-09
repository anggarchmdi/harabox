import api from '../lib/api'
import type {
  ActivityLogFilterParams,
  ActivityLogListResponse,
  ActivityLogStats,
} from '../types/activity-log'

export const activityLogService = {
  async list(params?: ActivityLogFilterParams): Promise<ActivityLogListResponse> {
    const response = await api.get<ActivityLogListResponse>('/admin/activity-logs', {
      params,
    })
    return response.data
  },

  async getStats(): Promise<ActivityLogStats> {
    const response = await api.get<{
      success: boolean
      data: ActivityLogStats
    }>('/admin/activity-logs/stats')
    return response.data.data
  },

  async prune(days = 60): Promise<{ message: string; deleted_count: number }> {
    const response = await api.post<{
      success: boolean
      message: string
      deleted_count: number
    }>('/admin/activity-logs/prune', { days })
    return response.data
  },
}
