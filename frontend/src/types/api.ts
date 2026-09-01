export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
}

export interface ApiErrorResponse {
  success: false
  message: string
  errors?: Record<string, string[]>
}
