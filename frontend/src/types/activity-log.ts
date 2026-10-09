export type ActivityAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'status_change'
  | 'payment_update'
  | 'auth'
  | string

export type ActivitySubjectType =
  | 'product'
  | 'category'
  | 'order'
  | 'user'
  | 'setting'
  | 'addon'
  | 'addon_group'
  | 'payment_proof'
  | string

export interface ActivityLog {
  id: number
  user_id: number | null
  user_name: string
  user_role: string
  action: ActivityAction
  subject_type: ActivitySubjectType
  subject_id: string | null
  subject_name: string | null
  description: string
  properties: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  updated_at: string
}

export interface ActivityLogStats {
  total_logs: number
  today_logs: number
  delete_actions: number
  unique_admins: number
  retention_days: number
  oldest_log_date: string | null
}

export interface ActivityLogFilterParams {
  page?: number
  per_page?: number
  search?: string
  action?: string
  subject_type?: string
  user_id?: number
  start_date?: string
  end_date?: string
}

export interface ActivityLogListResponse {
  success: boolean
  message: string
  data: ActivityLog[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}
