import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  Heart,
  MessageSquareQuote,
  Package,
  Send,
  Sparkles,
  Star,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { testimonialService } from '../services/testimonial.service'

const ratingDescriptions: Record<number, { title: string; subtitle: string }> = {
  5: { title: 'Luar Biasa!', subtitle: 'Sangat puas dengan rasa, kemasan, dan ketepatan waktu pengantaran.' },
  4: { title: 'Puas & Enak', subtitle: 'Pesanan sesuai harapan dan pelayanan memuaskan.' },
  3: { title: 'Cukup Baik', subtitle: 'Makanan cukup oke, ada beberapa hal yang bisa ditingkatkan.' },
  2: { title: 'Kurang Puas', subtitle: 'Ada bagian makanan atau pelayanan yang mengecewakan.' },
  1: { title: 'Mengecewakan', subtitle: 'Pesanan tidak sesuai dengan yang diharapkan.' },
}

export default function TestimonialPage() {
  const [searchParams] = useSearchParams()

  const [name, setName] = useState('')
  const [institution, setInstitution] = useState('')
  const [orderQuantity, setOrderQuantity] = useState('')
  const [message, setMessage] = useState('')
  const [orderCode, setOrderCode] = useState('')
  const [rating, setRating] = useState<number>(5)
  const [hoverRating, setHoverRating] = useState<number | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Otomatis mengisi form dari URL parameter jika dikirim dari WhatsApp pesanan selesai
  useEffect(() => {
    const paramName = searchParams.get('name')
    const paramQty = searchParams.get('qty') || searchParams.get('quantity')
    const paramInstitution = searchParams.get('institution')
    const paramOrder = searchParams.get('order') || searchParams.get('order_code')

    if (paramName) setName(paramName)
    if (paramQty) setOrderQuantity(paramQty)
    if (paramInstitution) setInstitution(paramInstitution)
    if (paramOrder) setOrderCode(paramOrder)
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Mohon isi nama lengkap Anda.')
      return
    }

    if (!orderQuantity.trim()) {
      toast.error('Mohon cantumkan jumlah pesanan (contoh: 85 Box).')
      return
    }

    if (!message.trim() || message.trim().length < 5) {
      toast.error('Mohon tulis ulasan pengalaman Anda (minimal 5 karakter).')
      return
    }

    try {
      setIsSubmitting(true)

      await testimonialService.submit({
        name: name.trim(),
        institution: institution.trim() ? institution.trim() : undefined,
        rating,
        order_quantity: orderQuantity.trim(),
        message: message.trim(),
        order_code: orderCode.trim() ? orderCode.trim() : undefined,
      })

      setIsSubmitted(true)
      toast.success('Terima kasih! Ulasan Anda berhasil dikirim.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Terjadi kesalahan saat mengirim ulasan. Silakan coba lagi.'
      toast.error(errorMsg || 'Gagal mengirim ulasan.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const activeRating = hoverRating !== null ? hoverRating : rating
  const activeRatingDesc = ratingDescriptions[activeRating] || ratingDescriptions[5]

  return (
    <div className="min-h-screen bg-[#fafaf9] pt-28 pb-20 sm:pt-36 sm:pb-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* Breadcrumb minimalis */}
        <div className="mb-6 flex items-center gap-2 text-xs font-semibold text-stone-500">
          <Link to="/" className="hover:text-red-700 transition">
            HaraBox
          </Link>
          <ChevronRight size={14} className="text-stone-400" />
          <span className="text-stone-900 font-bold">Ulasan Pengalaman Katering</span>
        </div>

        {isSubmitted ? (
          /* =====================================================
             KARTU SUKSES SETELAH SUBMIT
          ====================================================== */
          <div className="rounded-3xl border border-stone-200/80 bg-white p-8 sm:p-12 shadow-sm text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50 mb-6 animate-bounce">
              <CheckCircle2 size={42} strokeWidth={2.2} />
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-3.5 py-1 text-xs font-bold text-emerald-800 uppercase tracking-wider">
              <Sparkles size={13} /> Ulasan Berhasil Disimpan
            </span>

            <h1 className="mt-4 text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Terima Kasih Banyak, Kak {name || 'Pelanggan Setia'}!
            </h1>

            <p className="mt-3 text-sm sm:text-base text-stone-600 max-w-lg mx-auto leading-relaxed">
              Ulasan dan penilaian yang Anda berikan sangat berarti bagi seluruh tim dapur dan kru Hara Chicken untuk terus menyajikan hidangan lezat dan pelayanan terbaik.
            </p>

            <div className="mt-6 flex justify-center gap-1 text-amber-400">
              {Array.from({ length: rating }).map((_, r) => (
                <Star key={r} size={22} className="fill-amber-400 text-amber-400" />
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                to="/"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-2xl bg-stone-900 px-6 py-3.5 text-xs sm:text-sm font-black text-white hover:bg-stone-800 transition shadow-sm"
              >
                Kembali ke Beranda
              </Link>
              <Link
                to="/menu"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-2xl border border-stone-300 bg-white px-6 py-3.5 text-xs sm:text-sm font-black text-stone-800 hover:bg-stone-50 transition"
              >
                Lihat Menu Katering
              </Link>
            </div>
          </div>
        ) : (
          /* =====================================================
             FORM INPUT TESTIMONI
          ====================================================== */
          <div className="rounded-3xl border border-stone-200/80 bg-white shadow-sm overflow-hidden">
            {/* Header Form */}
            <div className="relative bg-gradient-to-br from-red-600 via-red-700 to-red-800 px-6 py-8 sm:px-10 sm:py-10 text-white">
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md px-3 py-1 text-xs font-bold text-white mb-3">
                  <Heart size={14} className="fill-white" />
                  <span>Suara Pelanggan HaraBox</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Bagikan Pengalaman Katering Anda
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-red-100 max-w-xl leading-relaxed">
                  Bagaimana rasa makanan, ketepatan waktu, dan pelayanan kami? Masukan Anda membantu kami terus menjaga cita rasa ayam krispi dan kelezatan bento katering kami.
                </p>
              </div>

              <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10 pointer-events-none">
                <MessageSquareQuote size={200} />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-7">
              {/* 1. Rating Bintang Interaktif */}
              <div className="rounded-2xl bg-stone-50/80 border border-stone-200/70 p-5 sm:p-6 text-center">
                <label className="block text-xs font-black uppercase tracking-wider text-stone-500 mb-2">
                  Penilaian Keseluruhan (Bintang) *
                </label>

                <div className="flex items-center justify-center gap-2 sm:gap-3 my-2">
                  {[1, 2, 3, 4, 5].map((starValue) => {
                    const isFilled = starValue <= activeRating
                    return (
                      <button
                        key={starValue}
                        type="button"
                        onClick={() => setRating(starValue)}
                        onMouseEnter={() => setHoverRating(starValue)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="group relative p-1 focus:outline-none transition-transform active:scale-95"
                        aria-label={`Beri nilai ${starValue} bintang`}
                      >
                        <Star
                          size={36}
                          className={`transition-all duration-200 ${
                            isFilled
                              ? 'text-amber-400 fill-amber-400 drop-shadow-sm scale-110'
                              : 'text-stone-300 group-hover:text-amber-300'
                          }`}
                        />
                      </button>
                    )
                  })}
                </div>

                <div className="mt-2 text-xs sm:text-sm font-black text-stone-800">
                  {activeRatingDesc.title} —{' '}
                  <span className="font-normal text-stone-500">{activeRatingDesc.subtitle}</span>
                </div>
              </div>

              {/* 2. Nama & Instansi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-stone-700 mb-2 flex items-center gap-1.5">
                    <User size={14} className="text-red-600" />
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Dian Safitri"
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/10 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-stone-700 mb-2 flex items-center gap-1.5">
                    <Building2 size={14} className="text-red-600" />
                    Nama Instansi / Acara (Opsional)
                  </label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="Contoh: HR PT Mandiri / Acara Syukuran"
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/10 transition"
                  />
                </div>
              </div>

              {/* 3. Jumlah Pesanan */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-stone-700 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Package size={14} className="text-red-600" />
                    Jumlah Pesanan yang Diorder *
                  </span>
                  <span className="text-[11px] font-normal text-stone-400 normal-case">
                    Tanpa mencantumkan addons
                  </span>
                </label>
                <input
                  type="text"
                  required
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(e.target.value)}
                  placeholder="Contoh: 85 Box atau 50 Porsi"
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/10 transition"
                />
                <p className="mt-1.5 text-[11px] text-stone-400">
                  Tuliskan jumlah porsi/box utama katering Anda (contoh: <strong>85 Box</strong> atau <strong>120 Box Seminar Kampus</strong>).
                </p>
              </div>

              {/* 4. Teks Ulasan / Testimoni */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-stone-700 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MessageSquareQuote size={14} className="text-red-600" />
                    Ulasan & Pengalaman Anda *
                  </span>
                  <span className="text-[11px] font-normal text-stone-400">
                    {message.length}/1000 karakter
                  </span>
                </label>
                <textarea
                  required
                  rows={4}
                  maxLength={1000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ceritakan kepuasan Anda mengenai rasa ayam, bento box, porsi, ketepatan pengantaran, atau respon admin kami..."
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/10 transition resize-y"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 py-4 text-sm font-black text-white hover:bg-red-700 active:scale-[0.99] transition shadow-lg shadow-red-600/20 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Mengirim Ulasan...
                    </span>
                  ) : (
                    <>
                      <Send size={16} />
                      Kirim Testimoni
                    </>
                  )}
                </button>

                <p className="mt-3 text-center text-[11px] text-stone-400">
                  Ulasan Anda akan membantu pelanggan lain memilih paket katering terbaik di Hara Chicken.
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
