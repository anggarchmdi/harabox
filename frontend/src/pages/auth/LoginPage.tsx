import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AxiosError } from 'axios'

import { authService } from '../../services/auth.service'
import { useAuthStore } from '../../stores/auth.store'
import type { ApiErrorResponse } from '../../types/api'

export default function LoginPage() {
  const navigate = useNavigate()

  const login = useAuthStore((state) => state.login)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (!email.trim() || !password) {
      toast.error('Email dan password wajib diisi.')
      return
    }

    try {
      setLoading(true)

      const response = await authService.login({
        email: email.trim(),
        password,
      })

      login(
        response.data.user,
        response.data.token,
      )

      toast.success('Login berhasil.')

      navigate('/admin', {
        replace: true,
      })
    } catch (error) {
      const axiosError =
        error as AxiosError<ApiErrorResponse>

      const message =
        axiosError.response?.data?.message ??
        'Login gagal. Silakan coba lagi.'

      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      {/* Decorative background */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-red-50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-orange-50 blur-3xl" />

      <div className="relative">
        {/* Header */}
        <div className="mb-7 text-center">
         <div className="">
        <div className="bg-linear-to-r from-red-500 to-yellow-500 bg-clip-text">
          <h1 className="text-4xl font-extrabold text-center tracking-tight text-transparent font-sans">
            Welcome back
          </h1>
         </div>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-center text-gray-500">
            Masuk ke dashboard untuk mengelola pesanan dan kebutuhan HaraBox.
          </p>
        </div>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.06)] sm:p-7">
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700"
              >
                Email
              </label>

              <div className="relative">
                {/* Mail Icon */}
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-.98 1.85l-7.5 5.25a2.25 2.25 0 01-2.58 0l-7.5-5.25a2.25 2.25 0 01-.98-1.85V6.75"
                    />
                  </svg>
                </div>

                <input
                  id="email"
                  type="email"
                  placeholder="admin@harabox.test"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 hover:border-gray-300 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700"
              >
                Password
              </label>

              <div className="relative">
                {/* Lock Icon */}
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V7.75a4.5 4.5 0 10-9 0v2.75m-1.5 0h12a1.5 1.5 0 011.5 1.5v7.5a1.5 1.5 0 01-1.5 1.5H6a1.5 1.5 0 01-1.5-1.5V12a1.5 1.5 0 011.5-1.5z"
                    />
                  </svg>
                </div>

                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-12 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 hover:border-gray-300 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  autoComplete="current-password"
                  disabled={loading}
                />

                {/* Show Password */}
                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((value) => !value)
                  }
                  disabled={loading}
                  className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 transition hover:text-gray-600 disabled:cursor-not-allowed"
                  aria-label={
                    showPassword
                      ? 'Sembunyikan password'
                      : 'Tampilkan password'
                  }
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 3l18 18M10.58 10.58a2 2 0 002.84 2.84M9.88 4.24A10.94 10.94 0 0112 4c5.25 0 9.27 3.32 10.5 8a11.2 11.2 0 01-2.14 3.94M6.61 6.61C4.93 7.73 3.7 9.38 3 12c1.23 4.68 5.25 8 10.5 8 1.31 0 2.56-.23 3.7-.65"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 12s3.5-6 9.75-6 9.75 6 9.75 6-3.5 6-9.75 6-9.75-6-9.75-6z"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="2.75"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) =>
                    setRememberMe(event.target.checked)
                  }
                  disabled={loading}
                  className="h-4 w-4 rounded border-gray-300 text-red-600 accent-red-600 focus:ring-red-500"
                />

                <span className="text-sm text-gray-500">
                  Ingat saya
                </span>
              </label>

              <button
                type="button"
                className="text-sm font-medium text-red-600 transition hover:text-red-700"
              >
                Lupa password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-all hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-xl hover:shadow-red-600/25 focus:outline-none focus:ring-4 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg
                    className="h-5 w-5 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />

                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>

                  Memproses...
                </>
              ) : (
                <>
                  Login

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Security Info */}
          <div className="mt-6 flex items-center justify-center gap-2 border-t border-gray-100 pt-5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4 text-gray-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3l7.5 3v5.25c0 4.62-3.15 8.55-7.5 9.75-4.35-1.2-7.5-5.13-7.5-9.75V6L12 3z"
              />
            </svg>

            <span className="text-xs text-gray-400">
              Secure admin access
            </span>
          </div>
        </div>

        {/* Footer */}
        {/* <p className="mt-6 text-center text-xs text-gray-400">
          HaraBox Admin Dashboard
          <span className="mx-2">•</span>
          © 2026 HaraBox
        </p> */}
      </div>
    </div>
  )
}
