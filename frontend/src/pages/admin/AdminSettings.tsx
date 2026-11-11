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
      <div className={`space-y-6 sm:space-y-8 pb-20 p-4 sm:p-6 lg:p-8 ${
        isDark ? 'text-stone-100' : 'text-stone-900'
      }`}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 border-b pb-5 sm:pb-6 ${
        isDark ? 'border-[#382321]' : 'border-stone-200'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-wider">
            <Sliders size={13} className="shrink-0" />
            <span>Operasional • Konfigurasi Dapur</span>
          </div>

          <h1 className={`text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight ${
            isDark ? 'text-white' : 'text-stone-950'
          }`}>
            Pengaturan & Kapasitas Dapur
          </h1>

          <p className={`text-xs sm:text-sm max-w-2xl font-normal ${
            isDark ? 'text-stone-400' : 'text-stone-600'
          }`}>
            Atur batas maksimal pesanan nasi box harian dan kelola jadwal khusus atau hari libur dapur.
          </p>
        </div>

        <button
          onClick={() => handleOpenNewOverride()}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#95271D] to-[#7D1E16] hover:from-[#A82D22] hover:to-[#8E2219] text-white font-bold text-xs sm:text-sm shadow-xs transition active:scale-95 self-start sm:self-auto cursor-pointer shrink-0"
        >
          <Plus size={15} />
          <span>Atur Tanggal Khusus</span>
        </button>
      </div>

      {/* Info Banner: Rule Bisnis Kuota */}
      <div className={`rounded-2xl border p-3.5 sm:p-4.5 flex items-start gap-3 shadow-2xs ${
        isDark
          ? 'border-amber-500/25 bg-amber-950/15 text-amber-100'
          : 'border-amber-200 bg-amber-50/70 text-amber-950'
      }`}>
        <Info className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
        <div className="text-xs space-y-1 min-w-0 flex-1">
          <p className={`font-bold ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
            Mekanisme Perhitungan Kuota Dapur:
          </p>
          <ul className={`text-[11px] sm:text-xs space-y-0.5 leading-relaxed ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
            <li>
              • Pesanan <strong className="font-bold text-amber-500">Menunggu</strong>: Belum memotong slot (mencegah pesanan belum DP mengunci dapur).
            </li>
            <li>
              • Pesanan <strong className="font-bold text-emerald-500">Diproses Dapur / Selesai</strong>: Kuota resmi terpotong dari slot harian.
            </li>
            <li>
              • Pesanan <strong className="font-bold text-rose-500">Dibatalkan</strong>: Kuota slot porsi otomatis dikembalikan ke hari tersebut.
            </li>
          </ul>
        </div>
      </div>

      {/* Section 1: Default Daily Capacity Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        <div className={`lg:col-span-1 rounded-2xl sm:rounded-3xl border p-4 sm:p-5 shadow-2xs flex flex-col justify-between ${
          isDark ? 'border-[#382321] bg-[#18100F]' : 'border-stone-200/90 bg-white'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <span className={`flex items-center justify-center w-10 h-10 rounded-xl border ${
                isDark
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-amber-50 text-amber-600 border-amber-200'
              }`}>
                <UtensilsCrossed size={18} />
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                isDark
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                <CheckCircle2 size={12} />
                Aktif Otomatis
              </span>
            </div>

            <h2 className={`text-base font-extrabold mb-1 ${isDark ? 'text-white' : 'text-stone-950'}`}>
              Kapasitas Harian Default
            </h2>
            <p className={`text-xs mb-4 sm:mb-5 font-normal ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
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
                    className={`w-full text-2xl font-extrabold font-mono border-2 border-amber-500 rounded-xl px-3.5 py-2 outline-none ${
                      isDark ? 'bg-[#140D0C] text-white' : 'text-stone-900 bg-white'
                    }`}
                    placeholder="500"
                  />
                  <span className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold ${
                    isDark ? 'text-stone-400' : 'text-stone-400'
                  }`}>
                    Box / Hari
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setDailyCapacityInput((prev) => (Number(prev) || 0) + 50)}
                    type="button"
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer border ${
                      isDark
                        ? 'bg-[#140D0C] hover:bg-[#251715] text-stone-200 border-[#382321]'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    +50
                  </button>
                  <button
                    onClick={() => setDailyCapacityInput((prev) => (Number(prev) || 0) + 100)}
                    type="button"
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer border ${
                      isDark
                        ? 'bg-[#140D0C] hover:bg-[#251715] text-stone-200 border-[#382321]'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    +100
                  </button>
                  <button
                    onClick={() => setDailyCapacityInput((prev) => Math.max(50, (Number(prev) || 0) - 50))}
                    type="button"
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer border ${
                      isDark
                        ? 'bg-[#140D0C] hover:bg-[#251715] text-stone-200 border-[#382321]'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    -50
                  </button>
                </div>
              </div>
            ) : (
              <div className="my-2">
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${
                    isDark ? 'text-white' : 'text-stone-950'
                  }`}>
                    {defaultCapacity.toLocaleString('id-ID')}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-amber-500">
                    Box / Hari
                  </span>
                </div>
                <p className={`text-xs mt-1 font-normal ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  Maksimal yang diproses per hari jika tidak ada override khusus.
                </p>
              </div>
            )}
          </div>

          <div className={`pt-4 border-t mt-5 flex items-center gap-2 ${
            isDark ? 'border-[#382321]' : 'border-stone-100'
          }`}>
            {isEditingDefault ? (
              <>
                <button
                  type="button"
                  disabled={updateDefaultMutation.isPending}
                  onClick={handleSaveDefaultCapacity}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#95271D] to-[#7D1E16] hover:from-[#A82D22] hover:to-[#8E2219] text-white font-bold text-xs transition disabled:opacity-50 cursor-pointer shadow-2xs"
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
                  className={`px-3 py-2 rounded-xl border font-bold text-xs transition cursor-pointer ${
                    isDark
                      ? 'border-[#382321] hover:bg-[#140D0C] text-stone-300'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-600'
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
                className={`w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl border font-bold text-xs transition active:scale-98 cursor-pointer shadow-2xs ${
                  isDark
                    ? 'border-[#382321] hover:border-amber-500/40 hover:bg-[#1E1413] text-stone-200'
                    : 'border-stone-200 hover:border-amber-300 hover:bg-stone-50 text-stone-800'
                }`}
              >
                <Edit2 size={13} className="text-amber-500" />
                <span>Ubah Kuota Default</span>
              </button>
            )}
          </div>
        </div>

        {/* Section 2: Overrides Table & Mobile Card List */}
        <div className={`lg:col-span-2 rounded-2xl sm:rounded-3xl border p-4 sm:p-5 shadow-2xs ${
          isDark ? 'border-[#382321] bg-[#18100F]' : 'border-stone-200/90 bg-white'
        }`}>
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h2 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-stone-950'}`}>
                Override Tanggal Khusus & Hari Libur
              </h2>
              <p className={`text-xs font-normal ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                Jadwal khusus dengan batas kuota berbeda atau saat dapur ditutup.
              </p>
            </div>
            <button
              onClick={() => handleOpenNewOverride()}
              className={`text-xs font-bold flex items-center gap-1 hover:underline cursor-pointer ${
                isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-700 hover:text-amber-800'
              }`}
            >
              <Plus size={14} />
              <span>Tambah</span>
            </button>
          </div>

          {overridesList.length === 0 ? (
            <div className={`rounded-xl border border-dashed p-6 sm:p-8 text-center ${
              isDark ? 'border-[#382321] bg-[#140D0C]/60' : 'border-stone-200 bg-stone-50/70'
            }`}>
              <Calendar className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-stone-600' : 'text-stone-400'}`} />
              <p className={`text-xs sm:text-sm font-bold ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                Belum ada override tanggal khusus
              </p>
              <p className={`text-xs mt-0.5 max-w-sm mx-auto font-normal ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                Semua tanggal saat ini menggunakan batas default ({defaultCapacity} box/hari).
              </p>
            </div>
          ) : (
            <>
              {/* MOBILE VIEW: Responsive Card List (< 640px) */}
              <div className="sm:hidden space-y-2.5">
                {overridesList.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-3 space-y-2 transition shadow-2xs ${
                      isDark ? 'border-[#382321] bg-[#1E1413]' : 'border-stone-200 bg-stone-50/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`text-xs font-extrabold ${isDark ? 'text-white' : 'text-stone-900'}`}>
                          {new Date(item.date).toLocaleDateString('id-ID', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                        {item.note && (
                          <p className={`text-[11px] font-normal mt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                            {item.note}
                          </p>
                        )}
                      </div>

                      {item.is_closed ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${
                          isDark
                            ? 'bg-rose-950/40 text-rose-300 border-rose-800/50'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          <XCircle size={11} />
                          Dapur Libur
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${
                          isDark
                            ? 'bg-amber-950/40 text-amber-300 border-amber-800/50'
                            : 'bg-amber-50 text-amber-900 border-amber-200'
                        }`}>
                          <Sparkles size={11} />
                          {item.max_capacity.toLocaleString('id-ID')} Box
                        </span>
                      )}
                    </div>

                    <div className={`pt-2 border-t flex items-center justify-end gap-2 text-xs ${
                      isDark ? 'border-[#382321]/60' : 'border-stone-200'
                    }`}>
                      <button
                        onClick={() => handleEditOverride(item)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
                          isDark
                            ? 'border-[#382321] text-stone-300 hover:text-white hover:bg-[#140D0C]'
                            : 'border-stone-200 text-stone-700 hover:bg-white'
                        }`}
                      >
                        <Edit2 size={11} className="text-amber-500" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Hapus override untuk ${item.date}?`)) {
                            deleteOverrideMutation.mutate(item.date)
                          }
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
                          isDark
                            ? 'border-rose-900/40 text-rose-400 hover:bg-rose-950/50'
                            : 'border-rose-200 text-rose-600 hover:bg-rose-50'
                        }`}
                      >
                        <Trash2 size={11} />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP VIEW: Data Table (>= 640px) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className={`border-b font-bold uppercase tracking-wider text-[10px] ${
                      isDark ? 'border-[#382321] text-stone-400' : 'border-stone-200 text-stone-500'
                    }`}>
                      <th className="py-2.5 px-3">Tanggal</th>
                      <th className="py-2.5 px-3">Status / Kapasitas</th>
                      <th className="py-2.5 px-3">Catatan</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-[#382321]/60' : 'divide-stone-100'}`}>
                    {overridesList.map((item) => (
                      <tr key={item.id} className={`transition ${
                        isDark ? 'hover:bg-[#1E1413]' : 'hover:bg-stone-50'
                      }`}>
                        <td className={`py-3 px-3 font-bold whitespace-nowrap ${
                          isDark ? 'text-white' : 'text-stone-950'
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
                                ? 'bg-rose-950/40 text-rose-300 border-rose-800/50'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              <XCircle size={12} />
                              Dapur Libur
                            </span>
                          ) : (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              isDark
                                ? 'bg-amber-950/40 text-amber-300 border-amber-800/50'
                                : 'bg-amber-50 text-amber-900 border-amber-200'
                            }`}>
                              <Sparkles size={12} />
                              {item.max_capacity.toLocaleString('id-ID')} Box
                            </span>
                          )}
                        </td>
                        <td className={`py-3 px-3 max-w-xs truncate font-normal ${
                          isDark ? 'text-stone-300' : 'text-stone-600'
                        }`}>
                          {item.note || '-'}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap space-x-1">
                          <button
                            onClick={() => handleEditOverride(item)}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              isDark
                                ? 'text-stone-400 hover:text-white hover:bg-[#140D0C]'
                                : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
                            }`}
                            title="Edit Override"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Hapus override untuk ${item.date}?`)) {
                                deleteOverrideMutation.mutate(item.date)
                              }
                            }}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              isDark
                                ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/40'
                                : 'text-rose-500 hover:text-rose-700 hover:bg-rose-50'
                            }`}
                            title="Hapus Override"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Section 3: 14-Day Capacity Monitor */}
      <div className={`rounded-2xl sm:rounded-3xl border p-4 sm:p-5 shadow-2xs ${
        isDark ? 'border-[#382321] bg-[#18100F]' : 'border-stone-200/90 bg-white'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 mb-4 sm:mb-5">
          <div>
            <h2 className={`text-base font-extrabold flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-stone-950'
            }`}>
              <Calendar size={17} className="text-amber-500" />
              <span>Monitoring Beban Dapur (14 Hari ke Depan)</span>
            </h2>
            <p className={`text-xs font-normal ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              Pantau jumlah porsi terkonfirmasi vs kuota yang tersedia per hari.
            </p>
          </div>

          <div className={`flex flex-wrap items-center gap-3 text-[11px] font-semibold ${
            isDark ? 'text-stone-300' : 'text-stone-600'
          }`}>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>Tersedia (&lt;80%)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span>Padat (≥80%)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span>Penuh (100%)</span>
            </span>
          </div>
        </div>

        {isOverviewLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
            {Array.from({ length: 14 }).map((_, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl border animate-pulse flex flex-col justify-between h-32 ${
                  isDark ? 'bg-[#140D0C] border-[#382321]' : 'bg-stone-50 border-stone-200'
                }`}
              >
                <div>
                  <div className={`h-2.5 w-12 rounded mb-2 ${isDark ? 'bg-[#251715]' : 'bg-stone-200'}`} />
                  <div className={`h-4 w-16 rounded mb-3 ${isDark ? 'bg-[#251715]' : 'bg-stone-200'}`} />
                  <div className={`h-1.5 w-full rounded mb-2 ${isDark ? 'bg-[#251715]' : 'bg-stone-200'}`} />
                </div>
                <div className={`flex items-center justify-between pt-2 border-t ${
                  isDark ? 'border-[#382321]/60' : 'border-stone-200'
                }`}>
                  <div className={`h-3 w-10 rounded ${isDark ? 'bg-[#251715]' : 'bg-stone-200'}`} />
                  <div className={`h-3 w-6 rounded ${isDark ? 'bg-[#251715]' : 'bg-stone-200'}`} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
            {overviewData?.map((day: CapacitySummary) => {
              const d = new Date(day.date)
              const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' })
              const dateFormatted = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
              const isToday = new Date().toISOString().split('T')[0] === day.date

              let statusColor = isDark
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              let barColor = 'bg-emerald-500'
              let badgeLabel = `${day.remaining_portions} sisa`

              if (day.is_closed) {
                statusColor = isDark
                  ? 'bg-stone-800/70 text-stone-300 border-stone-700'
                  : 'bg-stone-100 text-stone-600 border-stone-200'
                badgeLabel = 'Tutup'
              } else if (day.is_full) {
                statusColor = isDark
                  ? 'bg-rose-950/40 text-rose-300 border-rose-800/50'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
                barColor = 'bg-rose-500'
                badgeLabel = 'Penuh'
              } else if (day.percentage_booked >= 80) {
                statusColor = isDark
                  ? 'bg-amber-950/40 text-amber-300 border-amber-800/50'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
                barColor = 'bg-amber-500'
              }

              return (
                <div
                  key={day.date}
                  onClick={() => handleOpenNewOverride(day.date)}
                  className={`relative p-3 rounded-xl border transition-all cursor-pointer hover:shadow-sm flex flex-col justify-between ${
                    isToday
                      ? isDark
                        ? 'ring-1.5 ring-inset ring-amber-500/80 bg-amber-950/20 border-amber-500/40'
                        : 'ring-1.5 ring-inset ring-amber-500/80 bg-amber-50/70 border-amber-300'
                      : isDark
                        ? 'bg-[#140D0C] border-[#382321] hover:border-amber-500/40 hover:bg-[#1E1413]'
                        : 'bg-white border-stone-200 hover:border-amber-300 hover:bg-stone-50'
                  }`}
                  title="Klik untuk atur kapasitas khusus tanggal ini"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${
                        isToday ? (isDark ? 'text-amber-400 font-extrabold' : 'text-amber-700 font-extrabold') : (isDark ? 'text-stone-400' : 'text-stone-500')
                      }`}>
                        {dayName} {isToday && '• Kini'}
                      </span>
                      {day.has_override && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Override khusus aktif" />
                      )}
                    </div>
                    <p className={`text-xs sm:text-sm font-extrabold ${isDark ? 'text-white' : 'text-stone-950'}`}>
                      {dateFormatted}
                    </p>

                    <div className="mt-2">
                      <div className="flex items-baseline justify-between text-[11px] font-bold font-mono mb-1">
                        <span className={isDark ? 'text-stone-200' : 'text-stone-900'}>
                          {day.booked_portions}
                        </span>
                        <span className={`text-[10px] font-normal ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                          /{day.max_capacity}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className={`w-full h-1.5 rounded-full overflow-hidden ${
                        isDark ? 'bg-[#251715]' : 'bg-stone-100'
                      }`}>
                        <div
                          className={`h-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${day.percentage_booked}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className={`mt-2.5 pt-1.5 border-t flex items-center justify-between text-[10px] ${
                    isDark ? 'border-[#382321]/60' : 'border-stone-100'
                  }`}>
                    <span className={`px-1.5 py-0.2 rounded font-bold border ${statusColor}`}>
                      {badgeLabel}
                    </span>
                    <span className={`font-semibold font-mono ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`relative w-full max-w-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border ${
            isDark ? 'bg-[#18100F] border-[#382321]' : 'bg-white border-stone-200'
          }`}>
            <h3 className={`text-base sm:text-lg font-extrabold mb-1 ${isDark ? 'text-white' : 'text-stone-950'}`}>
              {isEditingOverride ? 'Ubah Kapasitas Khusus' : 'Atur Kapasitas Khusus Tanggal'}
            </h3>
            <p className={`text-xs mb-4 sm:mb-5 font-normal ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              Override batas kuota atau tandai tanggal ini sebagai hari libur dapur.
            </p>

            <form onSubmit={handleSaveOverrideSubmit} className="space-y-3.5">
              <div>
                <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                  isDark ? 'text-stone-300' : 'text-stone-700'
                }`}>
                  Tanggal Acara / Dapur
                </label>
                <input
                  type="date"
                  required
                  value={overrideDate}
                  onChange={(e) => setOverrideDate(e.target.value)}
                  className={`w-full h-10 px-3 rounded-xl border text-xs font-medium focus:outline-none ${
                    isDark
                      ? 'border-[#382321] bg-[#140D0C] text-white focus:border-amber-500'
                      : 'border-stone-200 text-stone-900 bg-white focus:border-amber-500'
                  }`}
                />
              </div>

              {/* Checkbox Libur */}
              <div className={`flex items-center gap-2.5 p-3 rounded-xl border ${
                isDark ? 'border-[#382321] bg-[#140D0C]' : 'border-stone-200 bg-stone-50'
              }`}>
                <input
                  type="checkbox"
                  id="is_closed"
                  checked={overrideIsClosed}
                  onChange={(e) => setOverrideIsClosed(e.target.checked)}
                  className="w-4 h-4 text-[#95271D] rounded border-stone-300 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="is_closed" className={`text-xs font-bold cursor-pointer ${
                  isDark ? 'text-stone-200' : 'text-stone-800'
                }`}>
                  Tandai sebagai Dapur Libur / Tutup Pesanan
                </label>
              </div>

              {!overrideIsClosed && (
                <div>
                  <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                    isDark ? 'text-stone-300' : 'text-stone-700'
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
                    className={`w-full h-10 px-3 rounded-xl border text-xs font-bold font-mono focus:outline-none ${
                      isDark
                        ? 'border-[#382321] bg-[#140D0C] text-white focus:border-amber-500'
                        : 'border-stone-200 text-stone-900 bg-white focus:border-amber-500'
                    }`}
                    placeholder="Contoh: 800"
                  />
                  <p className={`text-[10px] mt-1 font-normal ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    Kapasitas standar adalah {defaultCapacity} box.
                  </p>
                </div>
              )}

              <div>
                <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                  isDark ? 'text-stone-300' : 'text-stone-700'
                }`}>
                  Catatan / Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  value={overrideNote}
                  onChange={(e) => setOverrideNote(e.target.value)}
                  className={`w-full h-10 px-3 rounded-xl border text-xs font-medium focus:outline-none ${
                    isDark
                      ? 'border-[#382321] bg-[#140D0C] text-white placeholder-stone-500 focus:border-amber-500'
                      : 'border-stone-200 text-stone-900 bg-white placeholder-stone-400 focus:border-amber-500'
                  }`}
                  placeholder="Contoh: Shift Tambahan Weekend / Libur Nasional"
                />
              </div>

              <div className={`pt-3.5 border-t flex items-center justify-end gap-2 ${
                isDark ? 'border-[#382321]' : 'border-stone-200'
              }`}>
                <button
                  type="button"
                  onClick={() => setOverrideModalOpen(false)}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    isDark
                      ? 'border-[#382321] text-stone-300 hover:bg-[#140D0C] hover:text-white'
                      : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saveOverrideMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#95271D] to-[#7D1E16] hover:from-[#A82D22] hover:to-[#8E2219] text-xs font-bold text-white transition disabled:opacity-50 cursor-pointer shadow-2xs"
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
