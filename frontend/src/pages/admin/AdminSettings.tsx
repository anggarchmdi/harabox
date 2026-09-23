import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Calendar,
  CheckCircle2,
  Edit2,
  Info,
  Plus,
  Save,
  Sliders,
  Sparkles,
  Trash2,
  UtensilsCrossed,
  XCircle,
} from 'lucide-react'

import { settingsService } from '../../services/settings.service'
import type { CapacityOverride, CapacitySummary } from '../../types/capacity'
import PageLoader from '../../components/ui/PageLoader'
import { useThemeStore } from '../../stores/theme.store'

export default function AdminSettings() {
  const isDark = useThemeStore((state) => state.theme === 'dark')
  const queryClient = useQueryClient()

  // State default capacity
  const [dailyCapacityInput, setDailyCapacityInput] = useState<number | ''>('')
  const [isEditingDefault, setIsEditingDefault] = useState(false)

  // State Modal Override
  const [overrideModalOpen, setOverrideModalOpen] = useState(false)
  const [overrideDate, setOverrideDate] = useState('')
  const [overrideCapacity, setOverrideCapacity] = useState<number>(500)
  const [overrideIsClosed, setOverrideIsClosed] = useState(false)
  const [overrideNote, setOverrideNote] = useState('')
  const [isEditingOverride, setIsEditingOverride] = useState(false)

  // Fetch Settings (Default & Overrides)
  const {
    data: settingsData,
    isLoading: isSettingsLoading,
  } = useQuery({
    queryKey: ['admin-capacity-settings'],
    queryFn: async () => {
      const res = await settingsService.getCapacitySettings()
      if (dailyCapacityInput === '') {
        setDailyCapacityInput(res.daily_box_capacity)
      }
      return res
    },
  })

  // Fetch 14-Day Overview
  const {
    data: overviewData,
    isLoading: isOverviewLoading,
  } = useQuery({
    queryKey: ['admin-capacity-overview'],
    queryFn: () => settingsService.getCapacityOverview(undefined, 14),
  })

  // Mutation: Update default capacity
  const updateDefaultMutation = useMutation({
    mutationFn: (capacity: number) => settingsService.updateDailyCapacity(capacity),
    onSuccess: (newCap) => {
      toast.success(`Kapasitas default berhasil disimpan: ${newCap} box/hari`)
      setIsEditingDefault(false)
      queryClient.invalidateQueries({ queryKey: ['admin-capacity-settings'] })
      queryClient.invalidateQueries({ queryKey: ['admin-capacity-overview'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menyimpan kapasitas default')
    },
  })

  // Mutation: Save override
  const saveOverrideMutation = useMutation({
    mutationFn: (payload: {
      date: string
      max_capacity: number
      is_closed?: boolean
      note?: string
    }) => settingsService.saveOverride(payload),
    onSuccess: () => {
      toast.success('Pengaturan kapasitas tanggal berhasil disimpan')
      setOverrideModalOpen(false)
      resetOverrideForm()
      queryClient.invalidateQueries({ queryKey: ['admin-capacity-settings'] })
      queryClient.invalidateQueries({ queryKey: ['admin-capacity-overview'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menyimpan override tanggal')
    },
  })

  // Mutation: Delete override
  const deleteOverrideMutation = useMutation({
    mutationFn: (date: string) => settingsService.deleteOverride(date),
    onSuccess: () => {
      toast.success('Override tanggal dihapus, kembali ke kapasitas default')
      queryClient.invalidateQueries({ queryKey: ['admin-capacity-settings'] })
      queryClient.invalidateQueries({ queryKey: ['admin-capacity-overview'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menghapus override tanggal')
    },
  })

  const resetOverrideForm = () => {
    setOverrideDate('')
    setOverrideCapacity(settingsData?.daily_box_capacity || 500)
    setOverrideIsClosed(false)
    setOverrideNote('')
    setIsEditingOverride(false)
  }

  const handleOpenNewOverride = (prefilledDate?: string) => {
    setOverrideDate(prefilledDate || new Date().toISOString().split('T')[0])
    setOverrideCapacity(settingsData?.daily_box_capacity || 500)
    setOverrideIsClosed(false)
    setOverrideNote('')
    setIsEditingOverride(false)
    setOverrideModalOpen(true)
  }

  const handleEditOverride = (item: CapacityOverride) => {
    setOverrideDate(item.date)
    setOverrideCapacity(item.max_capacity)
    setOverrideIsClosed(Boolean(item.is_closed))
    setOverrideNote(item.note || '')
    setIsEditingOverride(true)
    setOverrideModalOpen(true)
  }

  const handleSaveDefaultCapacity = () => {
    const val = Number(dailyCapacityInput)
    if (!val || val <= 0) {
      toast.error('Masukkan angka kapasitas yang valid (minimal 1 box)')
      return
    }
    updateDefaultMutation.mutate(val)
  }

  const handleSaveOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!overrideDate) {
      toast.error('Pilih tanggal terlebih dahulu')
      return
    }
    saveOverrideMutation.mutate({
      date: overrideDate,
      max_capacity: overrideIsClosed ? 0 : Number(overrideCapacity),
      is_closed: overrideIsClosed,
      note: overrideNote.trim() || undefined,
    })
  }

  const defaultCapacity = settingsData?.daily_box_capacity ?? 500
  const overridesList = settingsData?.overrides ?? []

  return (
    <>
      <PageLoader
        isLoading={isSettingsLoading || isOverviewLoading}
        text="Memuat Pengaturan & Kapasitas Dapur..."
        subtext="Sinkronisasi kuota produksi harian dan monitoring dapur"
        minDuration={400}
      />
      <div className="space-y-8 pb-16 p-8">
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6 ${
        isDark ? 'border-[#60241E]/80' : 'border-zinc-200'
      }`}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`flex items-center justify-center w-8 h-8 rounded-lg ${
              isDark ? 'bg-orange-950/60 text-orange-400 border border-orange-900/50' : 'bg-orange-100 text-orange-600'
            }`}>
              <Sliders size={18} />
            </span>
            <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${
              isDark ? 'text-white' : 'text-zinc-900'
            }`}>
              Pengaturan & Kapasitas Dapur
            </h1>
          </div>
          <p className={`text-sm max-w-2xl ${
            isDark ? 'text-amber-100/60' : 'text-zinc-500'
          }`}>
            Atur batas maksimal pesanan nasi box harian dan kelola jadwal khusus/libur dapur.
          </p>
        </div>

        <button
          onClick={() => handleOpenNewOverride()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-700 transform hover:scale-95 duration-300 text-white font-semibold text-sm shadow-sm transition active:scale-95 self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} />
          <span>Atur Tanggal Khusus</span>
        </button>
      </div>

      {/* Info Banner: Rule Bisnis Kuota */}
      <div className={`rounded-2xl border p-4 sm:p-5 flex items-start gap-3.5 ${
        isDark
          ? 'border-blue-900/50 bg-blue-950/30 text-blue-100'
          : 'border-blue-200 bg-blue-50/70 text-blue-950'
      }`}>
        <Info className={`w-5 h-5 shrink-0 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
        <div className={`text-xs sm:text-sm space-y-1 ${isDark ? 'text-blue-200' : 'text-blue-950'}`}>
          <p className={`font-bold ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>
            Mekanisme Perhitungan Kuota Dapur:
          </p>
          <p className={`leading-relaxed ${isDark ? 'text-blue-200/90' : 'text-blue-800'}`}>
            • Pesanan berstatus <strong className={`px-1.5 py-0.5 rounded ${isDark ? 'text-amber-300 bg-amber-950/70 border border-amber-900/50' : 'text-amber-800 bg-amber-100'}`}>Menunggu</strong> <span className="underline font-medium">belum memotong slot</span> untuk mencegah pesanan palsu/belum bayar DP mengunci dapur.
            <br />
            • Kuota <strong className={`px-1.5 py-0.5 rounded ${isDark ? 'text-emerald-300 bg-emerald-950/70 border border-emerald-900/50' : 'text-emerald-800 bg-emerald-100'}`}>resmi terpotong</strong> saat status pesanan diubah ke <strong>Di Proses</strong> atau <strong>Selesai</strong>.
            <br />
            • Jika pesanan diubah ke <strong className={`px-1.5 py-0.5 rounded ${isDark ? 'text-red-300 bg-red-950/70 border border-red-900/50' : 'text-red-800 bg-red-100'}`}>Dibatalkan</strong>, slot porsi pesanan tersebut langsung otomatis kembali tersedia ke hari tersebut.
          </p>
        </div>
      </div>

      {/* Section 1: Default Daily Capacity Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-1 rounded-2xl border p-6 shadow-sm flex flex-col justify-between ${
          isDark ? 'border-[#60241E] bg-[#240E0C]' : 'border-zinc-200 bg-white'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className={`flex items-center justify-center w-12 h-12 rounded-xl border ${
                isDark
                  ? 'bg-orange-950/50 text-orange-400 border-orange-900/50'
                  : 'bg-orange-50 text-orange-600 border-orange-100'
              }`}>
                <UtensilsCrossed size={22} />
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                isDark
                  ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                <CheckCircle2 size={12} />
                Aktif Otomatis
              </span>
            </div>

            <h2 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              Kapasitas Harian Default
            </h2>
            <p className={`text-xs mb-6 ${isDark ? 'text-amber-100/60' : 'text-zinc-500'}`}>
              Batas standar produksi dapur per hari untuk semua tanggal normal.
            </p>

            {isEditingDefault ? (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={dailyCapacityInput}
                    onChange={(e) => setDailyCapacityInput(e.target.value === '' ? '' : Number(e.target.value))}
                    className={`w-full text-2xl font-black border-2 border-orange-500 rounded-xl px-4 py-2.5 outline-none focus:ring-4 focus:ring-orange-500/10 ${
                      isDark ? 'bg-[#1C0B09] text-white' : 'text-zinc-900 bg-white'
                    }`}
                    placeholder="500"
                  />
                  <span className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold ${
                    isDark ? 'text-stone-400' : 'text-zinc-400'
                  }`}>
                    Box / Hari
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setDailyCapacityInput((prev) => (Number(prev) || 0) + 50)}
                    type="button"
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                      isDark
                        ? 'bg-[#1C0B09] hover:bg-[#2D120F] text-stone-200 border border-[#60241E]/60'
                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                    }`}
                  >
                    +50
                  </button>
                  <button
                    onClick={() => setDailyCapacityInput((prev) => (Number(prev) || 0) + 100)}
                    type="button"
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                      isDark
                        ? 'bg-[#1C0B09] hover:bg-[#2D120F] text-stone-200 border border-[#60241E]/60'
                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                    }`}
                  >
                    +100
                  </button>
                  <button
                    onClick={() => setDailyCapacityInput((prev) => Math.max(50, (Number(prev) || 0) - 50))}
                    type="button"
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                      isDark
                        ? 'bg-[#1C0B09] hover:bg-[#2D120F] text-stone-200 border border-[#60241E]/60'
                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                    }`}
                  >
                    -50
                  </button>
                </div>
              </div>
            ) : (
              <div className="my-2">
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-black tracking-tight ${
                    isDark ? 'text-white' : 'text-zinc-900'
                  }`}>
                    {defaultCapacity.toLocaleString('id-ID')}
                  </span>
                  <span className={`text-sm font-semibold ${
                    isDark ? 'text-amber-100/60' : 'text-zinc-500'
                  }`}>
                    Nasi Box / Hari
                  </span>
                </div>
                <p className={`text-xs mt-1 ${isDark ? 'text-stone-400' : 'text-zinc-400'}`}>
                  Maksimal yang dapat diproses per hari jika tidak ada override.
                </p>
              </div>
            )}
          </div>

          <div className={`pt-6 border-t mt-6 flex items-center gap-2 ${
            isDark ? 'border-[#60241E]/60' : 'border-zinc-100'
          }`}>
            {isEditingDefault ? (
              <>
                <button
                  type="button"
                  disabled={updateDefaultMutation.isPending}
                  onClick={handleSaveDefaultCapacity}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs transition disabled:opacity-50 cursor-pointer"
                >
                  <Save size={14} />
                  <span>{updateDefaultMutation.isPending ? 'Menyimpan...' : 'Simpan Kuota'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDailyCapacityInput(defaultCapacity)
                    setIsEditingDefault(false)
                  }}
                  className={`px-3 py-2.5 rounded-xl border font-semibold text-xs transition cursor-pointer ${
                    isDark
                      ? 'border-[#60241E] hover:bg-[#1C0B09] text-stone-300'
                      : 'border-zinc-200 hover:bg-zinc-50 text-zinc-600'
                  }`}
                >
                  Batal
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setDailyCapacityInput(defaultCapacity)
                  setIsEditingDefault(true)
                }}
                className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border font-semibold text-xs transition active:scale-98 cursor-pointer ${
                  isDark
                    ? 'border-[#60241E] hover:border-orange-500/50 hover:bg-[#1C0B09] text-stone-200'
                    : 'border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 text-zinc-800'
                }`}
              >
                <Edit2 size={14} />
                <span>Ubah Kuota Default</span>
              </button>
            )}
          </div>
        </div>

        {/* Section 2: Overrides Table */}
        <div className={`lg:col-span-2 rounded-2xl border p-6 shadow-sm ${
          isDark ? 'border-[#60241E] bg-[#240E0C]' : 'border-zinc-200 bg-white'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                Override Tanggal Khusus & Hari Libur
              </h2>
              <p className={`text-xs ${isDark ? 'text-amber-100/60' : 'text-zinc-500'}`}>
                Daftar tanggal dengan kuota khusus (misal pesanan akbar) atau saat dapur tutup.
              </p>
            </div>
            <button
              onClick={() => handleOpenNewOverride()}
              className={`text-xs font-semibold flex items-center gap-1 hover:underline cursor-pointer ${
                isDark ? 'text-orange-400 hover:text-orange-300' : 'text-orange-600 hover:text-orange-700'
              }`}
            >
              <Plus size={14} />
              <span>Tambah Tanggal</span>
            </button>
          </div>

          {overridesList.length === 0 ? (
            <div className={`rounded-xl border border-dashed p-8 text-center ${
              isDark ? 'border-[#60241E]/80 bg-[#1C0B09]/60' : 'border-zinc-200 bg-zinc-50/70'
            }`}>
              <Calendar className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-stone-600' : 'text-zinc-300'}`} />
              <p className={`text-sm font-semibold ${isDark ? 'text-stone-300' : 'text-zinc-700'}`}>
                Belum ada override tanggal khusus
              </p>
              <p className={`text-xs mt-0.5 max-w-sm mx-auto ${isDark ? 'text-stone-400' : 'text-zinc-400'}`}>
                Semua tanggal saat ini menggunakan batas default ({defaultCapacity} box/hari).
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className={`border-b font-semibold uppercase tracking-wider ${
                    isDark ? 'border-[#60241E]/80 text-stone-400' : 'border-zinc-200 text-zinc-400'
                  }`}>
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Status / Kapasitas</th>
                    <th className="py-2.5 px-3">Catatan</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-[#60241E]/60' : 'divide-zinc-100'}`}>
                  {overridesList.map((item) => (
                    <tr key={item.id} className={`transition ${
                      isDark ? 'hover:bg-[#1C0B09]/60' : 'hover:bg-zinc-50/60'
                    }`}>
                      <td className={`py-3 px-3 font-bold whitespace-nowrap ${
                        isDark ? 'text-white' : 'text-zinc-900'
                      }`}>
                        {new Date(item.date).toLocaleDateString('id-ID', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {item.is_closed ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            isDark
                              ? 'bg-red-950/70 text-red-300 border-red-800/50'
                              : 'bg-red-100 text-red-800 border-transparent'
                          }`}>
                            <XCircle size={12} />
                            Dapur Tutup / Libur
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            isDark
                              ? 'bg-amber-950/70 text-amber-300 border-amber-800/50'
                              : 'bg-amber-100 text-amber-900 border-transparent'
                          }`}>
                            <Sparkles size={12} />
                            {item.max_capacity.toLocaleString('id-ID')} Box
                          </span>
                        )}
                      </td>
                      <td className={`py-3 px-3 max-w-xs truncate ${
                        isDark ? 'text-stone-300' : 'text-zinc-600'
                      }`}>
                        {item.note || '-'}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap space-x-1">
                        <button
                          onClick={() => handleEditOverride(item)}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            isDark
                              ? 'text-stone-400 hover:text-white hover:bg-[#1C0B09]'
                              : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                          }`}
                          title="Edit Override"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Hapus override untuk ${item.date}?`)) {
                              deleteOverrideMutation.mutate(item.date)
                            }
                          }}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            isDark
                              ? 'text-red-400 hover:text-red-300 hover:bg-red-950/50'
                              : 'text-red-500 hover:text-red-700 hover:bg-red-50'
                          }`}
                          title="Hapus Override"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Section 3: 14-Day Capacity Monitor */}
      <div className={`rounded-2xl border p-6 shadow-sm ${
        isDark ? 'border-[#60241E] bg-[#240E0C]' : 'border-zinc-200 bg-white'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
          <div>
            <h2 className={`text-lg font-bold flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-zinc-900'
            }`}>
              <Calendar size={18} className="text-orange-500" />
              <span>Monitoring Beban Dapur (14 Hari ke Depan)</span>
            </h2>
            <p className={`text-xs ${isDark ? 'text-amber-100/60' : 'text-zinc-500'}`}>
              Pantau real-time jumlah porsi yang sudah di-ACC (Di Proses/Selesai) vs kuota yang tersedia.
            </p>
          </div>

          <div className={`flex items-center gap-4 text-xs font-semibold ${
            isDark ? 'text-stone-300' : 'text-zinc-500'
          }`}>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Tersedia (&lt;80%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Padat (≥80%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              Penuh (100%)
            </span>
          </div>
        </div>

        {isOverviewLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {Array.from({ length: 14 }).map((_, i) => (
              <div
                key={i}
                className={`p-3.5 rounded-xl border animate-pulse flex flex-col justify-between h-36 ${
                  isDark ? 'bg-[#1C0B09] border-[#60241E]/60' : 'bg-white border-zinc-200'
                }`}
              >
                <div>
                  <div className={`h-2.5 w-14 rounded mb-2 ${isDark ? 'bg-[#2D120F]' : 'bg-zinc-200'}`} />
                  <div className={`h-4 w-20 rounded mb-4 ${isDark ? 'bg-[#2D120F]' : 'bg-zinc-200'}`} />
                  <div className={`h-2 w-full rounded mb-2 ${isDark ? 'bg-[#2D120F]' : 'bg-zinc-100'}`} />
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-[#60241E]/40">
                  <div className={`h-4 w-12 rounded ${isDark ? 'bg-[#2D120F]' : 'bg-zinc-200'}`} />
                  <div className={`h-3 w-8 rounded ${isDark ? 'bg-[#2D120F]' : 'bg-zinc-100'}`} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {overviewData?.map((day: CapacitySummary) => {
              const d = new Date(day.date)
              const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' })
              const dateFormatted = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
              const isToday = new Date().toISOString().split('T')[0] === day.date

              let statusColor = isDark
                ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              let barColor = 'bg-emerald-500'
              let badgeLabel = `${day.remaining_portions} Sisa`

              if (day.is_closed) {
                statusColor = isDark
                  ? 'bg-zinc-800/70 text-stone-300 border-stone-700'
                  : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                badgeLabel = 'Tutup'
              } else if (day.is_full) {
                statusColor = isDark
                  ? 'bg-red-950/50 text-red-300 border-red-800/60'
                  : 'bg-red-50 text-red-800 border-red-200'
                barColor = 'bg-red-500'
                badgeLabel = 'Penuh'
              } else if (day.percentage_booked >= 80) {
                statusColor = isDark
                  ? 'bg-amber-950/50 text-amber-300 border-amber-800/60'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
                barColor = 'bg-amber-500'
              }

              return (
                <div
                  key={day.date}
                  onClick={() => handleOpenNewOverride(day.date)}
                  className={`relative p-3.5 rounded-xl border transition cursor-pointer hover:shadow-md flex flex-col justify-between ${
                    isToday
                      ? isDark
                        ? 'ring-2 ring-orange-500 bg-orange-950/30 border-orange-500/50'
                        : 'ring-2 ring-orange-500 bg-orange-50/20 border-orange-300'
                      : isDark
                        ? 'bg-[#1C0B09] border-[#60241E]/70 hover:border-orange-500/60'
                        : 'bg-white border-zinc-200 hover:border-orange-300'
                  }`}
                  title="Klik untuk atur kapasitas khusus tanggal ini"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${
                        isDark ? 'text-stone-400' : 'text-zinc-400'
                      }`}>
                        {dayName} {isToday && '• Hari Ini'}
                      </span>
                      {day.has_override && (
                        <span className="w-2 h-2 rounded-full bg-orange-500" title="Override khusus aktif" />
                      )}
                    </div>
                    <p className={`text-sm font-black ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                      {dateFormatted}
                    </p>

                    <div className="mt-2.5">
                      <div className="flex items-baseline justify-between text-xs font-bold mb-1">
                        <span className={isDark ? 'text-stone-100' : 'text-zinc-900'}>
                          {day.booked_portions}
                        </span>
                        <span className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-zinc-400'}`}>
                          / {day.max_capacity}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className={`w-full h-1.5 rounded-full overflow-hidden ${
                        isDark ? 'bg-[#2D120F]' : 'bg-zinc-100'
                      }`}>
                        <div
                          className={`h-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${day.percentage_booked}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className={`mt-3 pt-2 border-t flex items-center justify-between text-[11px] ${
                    isDark ? 'border-[#60241E]/60' : 'border-zinc-100'
                  }`}>
                    <span className={`px-2 py-0.5 rounded-md font-bold border ${statusColor}`}>
                      {badgeLabel}
                    </span>
                    <span className={`font-semibold ${isDark ? 'text-stone-400' : 'text-zinc-400'}`}>
                      {day.percentage_booked}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal: Add/Edit Override */}
      {overrideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`relative w-full max-w-md rounded-2xl p-6 shadow-2xl border animate-in fade-in zoom-in-95 ${
            isDark ? 'bg-[#240E0C] border-[#60241E]' : 'bg-white border-zinc-100'
          }`}>
            <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              {isEditingOverride ? 'Ubah Kapasitas Khusus' : 'Atur Kapasitas Khusus Tanggal'}
            </h3>
            <p className={`text-xs mb-5 ${isDark ? 'text-amber-100/60' : 'text-zinc-500'}`}>
              Override batas kuota atau tandai tanggal ini sebagai hari libur dapur.
            </p>

            <form onSubmit={handleSaveOverrideSubmit} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                  isDark ? 'text-amber-100/80' : 'text-zinc-700'
                }`}>
                  Tanggal Acara / Dapur
                </label>
                <input
                  type="date"
                  required
                  value={overrideDate}
                  onChange={(e) => setOverrideDate(e.target.value)}
                  className={`w-full h-10 px-3 rounded-xl border text-xs font-medium focus:border-orange-500 focus:outline-none ${
                    isDark
                      ? 'border-[#60241E] bg-[#1C0B09] text-white focus:bg-[#1C0B09]'
                      : 'border-zinc-200 text-zinc-900 bg-white'
                  }`}
                />
              </div>

              {/* Checkbox Libur */}
              <div className={`flex items-center gap-2 p-3 rounded-xl border ${
                isDark ? 'border-[#60241E] bg-[#1C0B09]' : 'border-zinc-200 bg-zinc-50'
              }`}>
                <input
                  type="checkbox"
                  id="is_closed"
                  checked={overrideIsClosed}
                  onChange={(e) => setOverrideIsClosed(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded border-zinc-300 focus:ring-orange-500 cursor-pointer"
                />
                <label htmlFor="is_closed" className={`text-xs font-bold cursor-pointer ${
                  isDark ? 'text-stone-200' : 'text-zinc-800'
                }`}>
                  Tandai sebagai Dapur Libur / Tutup Pesanan
                </label>
              </div>

              {!overrideIsClosed && (
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                    isDark ? 'text-amber-100/80' : 'text-zinc-700'
                  }`}>
                    Maksimal Nasi Box (Porsi)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    required={!overrideIsClosed}
                    value={overrideCapacity}
                    onChange={(e) => setOverrideCapacity(Number(e.target.value))}
                    className={`w-full h-10 px-3 rounded-xl border text-xs font-medium focus:border-orange-500 focus:outline-none ${
                      isDark
                        ? 'border-[#60241E] bg-[#1C0B09] text-white focus:bg-[#1C0B09]'
                        : 'border-zinc-200 text-zinc-900 bg-white'
                    }`}
                    placeholder="Contoh: 800"
                  />
                  <p className={`text-[11px] mt-1 ${isDark ? 'text-stone-400' : 'text-zinc-400'}`}>
                    Kapasitas standar adalah {defaultCapacity} box.
                  </p>
                </div>
              )}

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                  isDark ? 'text-amber-100/80' : 'text-zinc-700'
                }`}>
                  Catatan / Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  value={overrideNote}
                  onChange={(e) => setOverrideNote(e.target.value)}
                  className={`w-full h-10 px-3 rounded-xl border text-xs font-medium focus:border-orange-500 focus:outline-none ${
                    isDark
                      ? 'border-[#60241E] bg-[#1C0B09] text-white placeholder-stone-500 focus:bg-[#1C0B09]'
                      : 'border-zinc-200 text-zinc-900 bg-white placeholder-zinc-400'
                  }`}
                  placeholder="Contoh: Shift Tambahan Weekend / Libur Nasional"
                />
              </div>

              <div className={`pt-4 border-t flex items-center justify-end gap-2 ${
                isDark ? 'border-[#60241E]/60' : 'border-zinc-100'
              }`}>
                <button
                  type="button"
                  onClick={() => setOverrideModalOpen(false)}
                  className={`px-4 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    isDark
                      ? 'border-[#60241E] text-stone-300 hover:bg-[#1C0B09]'
                      : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saveOverrideMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-xs font-semibold text-white transition disabled:opacity-50 cursor-pointer"
                >
                  {saveOverrideMutation.isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
