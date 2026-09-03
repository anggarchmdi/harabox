import api from '../lib/api'

import type {
  DashboardData,
  DashboardResponse,
} from '../types/dashboard'

export const dashboardService = {
  async get(): Promise<DashboardData> {
    const response =
      await api.get<DashboardResponse>(
        '/admin/dashboard',
      )

    return response.data.data
  },
}
