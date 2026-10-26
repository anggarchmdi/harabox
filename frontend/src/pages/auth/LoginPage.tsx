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
import TraditionalLoader from '../../components/ui/TraditionalLoader'
import PawonHaraImg from '../../assets/PawonHara.webp'
import BatikParang from '../../assets/batik-parang-gold.webp'
import FooterCorner from '../../assets/footer-corner-gold.webp'
import { useSEO } from '../../hooks/useSEO'

const REMEMBERED_EMAIL_KEY = 'harabox_remember_email'

export default function LoginPage() {
  useSEO({
    title: 'Login Admin | Pawon Hara',
    noindex: true,
  })

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
      {/* Loading Overlay dengan TraditionalLoader Kendil Gerabah */}
      {loading && (
        <TraditionalLoader
          fullScreen
          variant="kendil"
          theme="dark"
          size="lg"
          text={loadingText}
          subtext={loadingSubtext}
          showSteam={true}
          showGlow={true}
          showEmbers={true}
          showBrandBadge={true}
        />
      )}

      {/* Centered Royal Card Layout (Proporsional, Anggun, & Seimbang) */}
      <div className="relative w-full max-w-[440px] mx-auto">
        {/* Glow ambient halus tepat di balik card */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#F59E0B]/14 blur-3xl pointer-events-none rounded-full" />

        {/* Card Container Utama */}
        <div className="relative overflow-hidden rounded-3xl border border-[#60241E]/90 bg-[#210D0B]/90 backdrop-blur-xl shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_35px_rgba(245,158,11,0.12),inset_0_1px_1px_rgba(245,158,11,0.25)]">
          {/* Top Royal Accent Gradient Bar dengan Center Amber Beacon */}
          <div className="relative h-1.5 w-full bg-gradient-to-r from-[#60241E] via-[#F59E0B] to-[#E77B49]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-2 bg-[#FEF3C7] blur-[2px] rounded-full opacity-80" />
          </div>

          {/* Card Header dengan Watermark Motif Batik & Medali Logo Maskot */}
          <div className="relative overflow-hidden pt-7 pb-5 px-6 sm:px-8 text-center border-b border-[#60241E]/60 bg-gradient-to-b from-[#2D120F]/80 to-[#210D0B]/60">
            {/* Watermark Batik Parang Emas Keraton */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.16] mix-blend-screen"
              style={{
                backgroundImage: `url(${BatikParang})`,
                backgroundRepeat: 'repeat',
                backgroundSize: '600px auto',
              }}
            />

            {/* Radial glow di belakang emblem */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#F59E0B]/20 blur-2xl pointer-events-none rounded-full" />
            {/* Logo Maskot Pawon Hara (Tetap Menggunakan Logo Saat Ini, dengan Medali Halo Emas) */}
            <div className="relative z-10 mb-3 inline-block">
              <Link
                to="/"
                className="group relative block transition-transform"
                title="Kembali ke Beranda Pawon Hara"
              >
                <div className="relative rounded-full p-1 bg-gradient-to-b from-[#F59E0B] via-[#E77B49] to-[#60241E] shadow-[0_0_25px_rgba(245,158,11,0.4)]">
                  <div className="rounded-full bg-[#180806] p-2 ring-1 ring-[#F59E0B]/25">
                    <img
                      src={PawonHaraImg}
                      className="w-18 h-18 sm:w-20 sm:h-20 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]"
                      alt="Maskot Pawon Hara"
                    />
                  </div>
                </div>
              </Link>
            </div>

            {/* Judul & Keterangan */}
            <div className="relative z-10">
              <h1 className="text-2xl sm:text-[26px] font-dhaksinarga tracking-wide text-white drop-shadow-sm leading-tight">
                Portal Admin Pawon Hara
              </h1>
              <p className="mt-1 text-xs text-amber-100/70 sm:text-sm max-w-xs mx-auto">
                Gunakan akun administrator untuk mengakses panel kontrol & dapur.
              </p>
            </div>
          </div>

          {/* Form Area */}
          <div className="p-6 sm:p-8 pt-5">
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
                    className="h-11 sm:h-12 w-full rounded-xl border border-[#4A1A15] bg-[#180806] pl-10.5 pr-4 text-sm text-white placeholder:text-stone-500 outline-none transition duration-150 hover:border-[#F59E0B]/50 focus:border-[#F59E0B] focus:bg-[#1A0907] focus:ring-2 focus:ring-[#F59E0B]/20 disabled:cursor-not-allowed disabled:opacity-60"
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
                    className="h-11 sm:h-12 w-full rounded-xl border border-[#4A1A15] bg-[#180806] pl-10.5 pr-11 text-sm text-white placeholder:text-stone-500 outline-none transition duration-150 hover:border-[#F59E0B]/50 focus:border-[#F59E0B] focus:bg-[#1A0907] focus:ring-2 focus:ring-[#F59E0B]/20 disabled:cursor-not-allowed disabled:opacity-60"
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
                      className="peer h-4 w-4 appearance-none rounded border border-[#60241E] bg-[#180806] checked:border-[#F59E0B] checked:bg-[#F59E0B] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/30"
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
                  className="group flex h-11 sm:h-12 w-full items-center justify-center gap-2 rounded-xl transform active:scale-98 bg-gradient-to-r from-[#F59E0B] via-[#E77B49] to-[#F59E0B] bg-[length:200%_auto] hover:bg-right px-5 text-sm font-poppins tracking-wide font-black text-[#1C0B09] shadow-lg shadow-[#F59E0B]/25 hover:shadow-[#F59E0B]/40 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/40 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
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
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Bottom Section of Card */}
            <div className="relative mt-6 pt-4">
              {/* Garis Pembatas Emas Halus dengan Diamond Keraton */}
              <div className="relative w-full flex items-center justify-center mb-3.5">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-[#F59E0B]/30 to-transparent" />
                <div className="absolute w-2 h-2 rotate-45 bg-[#F59E0B]/70 shadow-[0_0_6px_#F59E0B]" />
              </div>

              {/* Security Badge */}
              <div className="relative z-10 flex items-center justify-center gap-1.5 px-6 text-center">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="text-[11px] text-amber-100/70">
                  Sesi terenkripsi & diawasi sistem keamanan Pawon Hara
                </span>
              </div>

              {/* Corner Ornament Kiri Bawah (Menempel ala Footer) */}
              <div className="absolute left-0 -translate-x-4 translate-y-4 bottom-0 pointer-events-none select-none z-0">
                <img
                  src={FooterCorner}
                  alt=""
                  aria-hidden="true"
                  className="w-11 sm:w-12 h-auto opacity-75 drop-shadow-[0_2px_8px_rgba(245,158,11,0.25)]"
                />
              </div>

              {/* Corner Ornament Kanan Bawah (Mirrored ala Footer) */}
              <div className="absolute translate-x-4 translate-y-4 right-0 bottom-0 pointer-events-none select-none z-0">
                <img
                  src={FooterCorner}
                  alt=""
                  aria-hidden="true"
                  className="w-11 sm:w-12 h-auto opacity-75 -scale-x-100 drop-shadow-[0_2px_8px_rgba(245,158,11,0.25)]"
                />
              </div>
            </div>
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
                href="https://wa.me/6285181758271?text=Halo%20Admin%20Pawon%20Hara,%20saya%20membutuhkan%20bantuan%20reset%20kata%20sandi%20portal%20admin."
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
