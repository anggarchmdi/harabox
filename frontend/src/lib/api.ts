import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,

  headers: {
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('auth_token') ||
    sessionStorage.getItem('auth_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_remember')
      sessionStorage.removeItem('auth_token')
      sessionStorage.removeItem('auth_user')
      sessionStorage.removeItem('auth_remember')

      window.dispatchEvent(
        new Event('admin:logout'),
      )
    }

    return Promise.reject(error)
  },
)

export default api
