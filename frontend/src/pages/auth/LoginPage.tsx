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
import LogoSpinner from '../../components/ui/LogoSpinner'
import PawonHaraImg from '../../assets/PawonHara.webp'

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
  const [loadingText, setLoadingText] = useState('Memproses Masuk...')
  const [loadingSubtext, setLoadingSubtext] = useState('Sedang memverifikasi kredensial admin...')
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
    }
  }, [])

  const handleClearSavedEmail = () => {
    try {
      localStorage.removeItem(REMEMBERED_EMAIL_KEY)
    } catch {
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
      setLoadingText('Memproses Masuk...')
      setLoadingSubtext('Sedang memverifikasi kredensial admin...')

      const textTimer = setTimeout(() => {
        setLoadingText('Menyiapkan Akses...')
        setLoadingSubtext('Menghubungkan ke sistem manajemen HaraBox...')
      }, 1200)

      // Jeda minimum 2.4 detik agar animasi loading tampil anggun dan mantap (2-3 detik)
      const minDelay = new Promise((resolve) => setTimeout(resolve, 2400))

      let response: Awaited<ReturnType<typeof authService.login>>
      try {
        response = await authService.login({
          email: cleanEmail,
          password,
        })
      } catch (err) {
        await minDelay
        clearTimeout(textTimer)
        throw err
      }

      await minDelay
      clearTimeout(textTimer)

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
      {/* Loading Overlay dengan LogoSpinner Variant Dark */}
      {loading && (
        <LogoSpinner
          fullScreen
          theme="dark"
          size="sm"
          logoVariant="mascot"
          text={loadingText}
          subtext={loadingSubtext}
        />
      )}

      {/* Login Card */}
      <div className="relative overflow-hidden rounded-2xl border border-[#60241E] bg-[#240E0C] shadow-[0_12px_40px_rgba(0,0,0,0.6)] sm:rounded-3xl">
        {/* Subtle Top Accent (Coklat, Emas, & Terakota Pawon Hara) */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#60241E] via-[#F59E0B] to-[#E77B49]" />

        <div className="p-6 sm:p-8">
          {/* Card Header with Logo */}
          <div className="mb-6 text-center sm:mb-8">
            <Link
              to="/"
              className="inline-block transition-transform hover:scale-105 mb-4"
              title="Kembali ke Beranda Pawon Hara"
            >
              <img src={PawonHaraImg} className='w-16 xl:w-24' alt="" />
            </Link>

            <h1 className="text-xl font-dhaksinarga tracking-wide text-white sm:text-2xl">
              Portal Admin Pawon Hara
            </h1>

            <p className="mt-1 text-xs text-amber-100/70 sm:text-sm">
              Gunakan akun administrator untuk mengakses panel kontrol & dapur.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Email Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-amber-100/80"
                >
                  Alamat Email
                </label>

                {isSavedEmail && (
                  <span className="inline-flex items-center gap-1 rounded bg-[#2D120F] border border-[#60241E] px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                    <span>Tersimpan</span>
                    <button
                      type="button"
                      onClick={handleClearSavedEmail}
                      className="text-stone-400 hover:text-amber-300 transition-colors"
                      title="Hapus email tersimpan"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                )}
              </div>

              <div className="group relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400 transition-colors group-focus-within:text-[#F59E0B]">
                  <Mail className="h-4.5 w-4.5" />
                </div>

                <input
                  id="email"
                  type="email"
                  placeholder="admin@pawonhara.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    if (isSavedEmail) {
                      setIsSavedEmail(false)
                    }
                  }}
                  className="h-11 sm:h-12 w-full rounded-xl border border-[#60241E] bg-[#1C0B09] pl-10.5 pr-4 text-sm text-white placeholder:text-stone-500 outline-none transition duration-150 hover:border-[#F59E0B]/50 focus:border-[#F59E0B] focus:bg-[#1C0B09] focus:ring-2 focus:ring-[#F59E0B]/20 disabled:cursor-not-allowed disabled:opacity-60"
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
                  className="block text-xs font-semibold text-amber-100/80"
                >
                  Kata Sandi
                </label>
              </div>

              <div className="group relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400 transition-colors group-focus-within:text-[#F59E0B]">
                  <Lock className="h-4.5 w-4.5" />
                </div>

                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-11 sm:h-12 w-full rounded-xl border border-[#60241E] bg-[#1C0B09] pl-10.5 pr-11 text-sm text-white placeholder:text-stone-500 outline-none transition duration-150 hover:border-[#F59E0B]/50 focus:border-[#F59E0B] focus:bg-[#1C0B09] focus:ring-2 focus:ring-[#F59E0B]/20 disabled:cursor-not-allowed disabled:opacity-60"
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />

                {/* Toggle Password Visibility */}
                <button
                  type="button"
                  onClick={() => setShowPassword((val) => !val)}
                  disabled={loading}
                  className="absolute inset-y-0 right-0 flex items-center px-3.5 text-stone-400 transition hover:text-amber-300 focus:outline-none"
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
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer h-4 w-4 appearance-none rounded border border-[#60241E] bg-[#1C0B09] checked:border-[#F59E0B] checked:bg-[#F59E0B] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/30"
                  />
                  <Check className="pointer-events-none absolute left-0.5 top-0.5 h-3 w-3 text-[#1C0B09] opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>

                <span className="text-xs sm:text-sm font-medium text-amber-100/80 group-hover:text-white transition-colors">
                  Ingat saya
                </span>
              </label>

              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs sm:text-sm font-medium text-amber-300 transition-colors hover:text-[#F59E0B]"
              >
                Lupa kata sandi?
              </button>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="group flex h-11 sm:h-12 w-full items-center justify-center gap-2 rounded-xl transform active:scale-98 bg-gradient-to-r from-[#F59E0B] via-[#E77B49] to-[#F59E0B] px-5 text-sm font-dhaksinarga tracking-wide font-black text-[#1C0B09] shadow-lg shadow-[#F59E0B]/20 transition duration-300 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/40 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin text-[#1C0B09]"
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
          <div className="mt-6 flex items-center justify-center gap-1.5 border-t border-[#60241E]/80 pt-4 text-center">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-[11px] text-amber-100/60">
              Sesi terenkripsi & diawasi sistem keamanan Pawon Hara
            </span>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal Dialog */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs transition-opacity">
          <div className="w-full max-w-sm rounded-2xl border border-[#60241E] bg-[#240E0C] p-6 shadow-2xl text-stone-100">
            <div className="flex items-start justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2D120F] text-amber-400 border border-[#60241E]">
                <HelpCircle className="h-5 w-5" />
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="rounded-lg p-1 text-stone-400 hover:bg-[#2D120F] hover:text-white transition-colors"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3.5">
              <h3 className="text-base font-dhaksinarga tracking-wide text-white font-bold">
                Pemulihan Kata Sandi
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-amber-100/80 leading-relaxed">
                Untuk keamanan operasional, pemulihan akun dan reset kata sandi dikonfirmasi langsung oleh Super Administrator Pawon Hara.
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-[#60241E] bg-[#1C0B09] p-3 text-xs text-amber-100/80 space-y-1">
              <p className="font-semibold text-amber-300">
                Hubungi IT Support:
              </p>
              <p className="text-stone-400">
                Kirimkan nama lengkap dan email admin Anda melalui WhatsApp resmi untuk verifikasi identitas.
              </p>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="flex-1 rounded-xl border border-[#60241E] bg-[#2D120F] py-2.5 text-xs font-semibold text-amber-100 transition-colors hover:bg-[#3B1814]"
              >
                Tutup
              </button>

              <a
                href="https://wa.me/6289669743193?text=Halo%20Admin%20Pawon%20Hara,%20saya%20membutuhkan%20bantuan%20reset%20kata%20sandi%20portal%20admin."
                target="_blank"
                rel="noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#E77B49] py-2.5 text-xs font-bold text-[#1C0B09] shadow-md transition-all hover:brightness-110"
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
