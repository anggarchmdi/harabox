import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AxiosError } from 'axios'
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  HelpCircle,
  Lock,
  Mail,
  MessageCircle,
  ShieldCheck,
  X,
} from 'lucide-react'

import { authService } from '../../services/auth.service'
import { useAuthStore } from '../../stores/auth.store'
import type { ApiErrorResponse } from '../../types/api'
import LogoImg from '../../assets/Logo.webp'

const REMEMBERED_EMAIL_KEY = 'harabox_remember_email'

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isSavedEmail, setIsSavedEmail] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)

  // Inisialisasi fitur 'Ingat Saya' saat halaman dimuat
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY)
      if (savedEmail) {
        setEmail(savedEmail)
        setRememberMe(true)
        setIsSavedEmail(true)
      }
    } catch {
      // Abaikan jika storage tidak dapat diakses
    }
  }, [])

  // Bersihkan email tersimpan jika admin ingin mereset
  const handleClearSavedEmail = () => {
    try {
      localStorage.removeItem(REMEMBERED_EMAIL_KEY)
    } catch {
      // no-op
    }
    setEmail('')
    setRememberMe(false)
    setIsSavedEmail(false)
    toast.info('Email tersimpan telah dibersihkan.')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const cleanEmail = email.trim()

    if (!cleanEmail || !password) {
      toast.error('Email dan password wajib diisi.')
      return
    }

    try {
      setLoading(true)

      const response = await authService.login({
        email: cleanEmail,
        password,
      })

      // Proses logika 'Ingat Saya'
      try {
        if (rememberMe) {
          localStorage.setItem(REMEMBERED_EMAIL_KEY, cleanEmail)
        } else {
          localStorage.removeItem(REMEMBERED_EMAIL_KEY)
        }
      } catch {
        // no-op
      }

      // Simpan session sesuai opsi rememberMe (persistent vs browser session)
      login(response.data.user, response.data.token, rememberMe)

      toast.success('Login berhasil. Mengalihkan ke dashboard...')

      navigate('/admin', {
        replace: true,
      })
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>

      const message =
        axiosError.response?.data?.message ??
        'Login gagal. Periksa kembali email dan password Anda.'

      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full z-10">
      {/* Login Card */}
      <div className="relative overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] sm:rounded-3xl">
        {/* Subtle Top Accent (Merah & Amber HaraBox) */}
        <div className="h-1 w-full bg-linear-to-r from-red-600 via-amber-400 to-amber-500" />

        <div className="p-6 sm:p-8">
          {/* Card Header with Logo */}
          <div className="mb-6 text-center sm:mb-8">
            <Link
              to="/"
              className="inline-block transition-opacity hover:opacity-90 mb-4"
              title="HaraBox Beranda"
            >
              <img
                src={LogoImg}
                alt="HaraBox"
                className="h-9 w-auto object-contain mx-auto drop-shadow-xs sm:h-10"
              />
            </Link>

            <h1 className="text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
              Masuk ke Dashboard
            </h1>

            <p className="mt-1 text-xs text-stone-500 sm:text-sm">
              Gunakan akun administrator untuk mengakses panel kontrol.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Email Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-stone-700"
                >
                  Alamat Email
                </label>

                {isSavedEmail && (
                  <span className="inline-flex items-center gap-1 rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-600">
                    <span>Tersimpan</span>
                    <button
                      type="button"
                      onClick={handleClearSavedEmail}
                      className="text-stone-400 hover:text-red-600 transition-colors"
                      title="Hapus email tersimpan"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                )}
              </div>

              <div className="group relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400 transition-colors group-focus-within:text-red-600">
                  <Mail className="h-4.5 w-4.5" />
                </div>

                <input
                  id="email"
                  type="email"
                  placeholder="admin@harabox.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    if (isSavedEmail) {
                      setIsSavedEmail(false)
                    }
                  }}
                  className="h-11 sm:h-12 w-full rounded-xl border border-stone-200 bg-stone-50/50 pl-10.5 pr-4 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition duration-150 hover:border-stone-300 focus:border-red-600 focus:bg-white focus:ring-2 focus:ring-red-600/10 disabled:cursor-not-allowed disabled:opacity-60"
                  autoComplete="email"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-stone-700"
                >
                  Kata Sandi
                </label>
              </div>

              <div className="group relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400 transition-colors group-focus-within:text-red-600">
                  <Lock className="h-4.5 w-4.5" />
                </div>

                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-11 sm:h-12 w-full rounded-xl border border-stone-200 bg-stone-50/50 pl-10.5 pr-11 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition duration-150 hover:border-stone-300 focus:border-red-600 focus:bg-white focus:ring-2 focus:ring-red-600/10 disabled:cursor-not-allowed disabled:opacity-60"
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />

                {/* Toggle Password Visibility */}
                <button
                  type="button"
                  onClick={() => setShowPassword((val) => !val)}
                  disabled={loading}
                  className="absolute inset-y-0 right-0 flex items-center px-3.5 text-stone-400 transition hover:text-stone-700 focus:outline-none"
                  aria-label={
                    showPassword
                      ? 'Sembunyikan kata sandi'
                      : 'Lihat kata sandi'
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4.5 w-4.5" />
                  ) : (
                    <Eye className="h-4.5 w-4.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Options: Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <label className="group flex cursor-pointer select-none items-center gap-2">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) =>
                      setRememberMe(event.target.checked)
                    }
                    disabled={loading}
                    className="sr-only peer"
                  />
                  {/* Custom Styled Checkbox */}
                  <div className="flex h-4 w-4 items-center justify-center rounded border border-stone-300 bg-white transition duration-150 peer-checked:border-red-600 peer-checked:bg-red-600 peer-focus-visible:ring-2 peer-focus-visible:ring-red-500/30 group-hover:border-stone-400">
                    <Check
                      className={`h-3 w-3 text-white transition-transform duration-150 ${
                        rememberMe ? 'scale-100' : 'scale-0'
                      }`}
                      strokeWidth={3}
                    />
                  </div>
                </div>

                <span className="text-xs sm:text-sm font-medium text-stone-600 group-hover:text-stone-900 transition-colors">
                  Ingat saya
                </span>
              </label>

              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs sm:text-sm font-medium text-stone-600 transition-colors hover:text-red-600"
              >
                Lupa kata sandi?
              </button>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="group flex h-11 sm:h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white shadow-xs transition duration-150 hover:bg-red-700 active:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin text-white"
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
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Akun</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Security Information Footer */}
          <div className="mt-6 flex items-center justify-center gap-1.5 border-t border-stone-100 pt-4 text-center">
            <ShieldCheck className="h-3.5 w-3.5 text-stone-400" />
            <span className="text-[11px] text-stone-400">
              Sesi terenkripsi & diawasi sistem keamanan
            </span>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal Dialog */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-xs transition-opacity">
          <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <HelpCircle className="h-5 w-5" />
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3.5">
              <h3 className="text-base font-bold text-stone-900">
                Pemulihan Kata Sandi
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-stone-600 leading-relaxed">
                Untuk keamanan operasional, pemulihan akun dan reset kata sandi dikonfirmasi langsung oleh Super Administrator HaraBox.
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-stone-100 bg-stone-50 p-3 text-xs text-stone-600 space-y-1">
              <p className="font-semibold text-stone-800">
                Hubungi IT Support:
              </p>
              <p className="text-stone-500">
                Kirimkan nama lengkap dan email admin Anda melalui WhatsApp resmi untuk verifikasi identitas.
              </p>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="flex-1 rounded-xl border border-stone-200 py-2.5 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-50"
              >
                Tutup
              </button>

              <a
                href="https://wa.me/6281234567890?text=Halo%20Admin%20HaraBox,%20saya%20membutuhkan%20bantuan%20reset%20kata%20sandi%20portal%20admin."
                target="_blank"
                rel="noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>WhatsApp IT</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
