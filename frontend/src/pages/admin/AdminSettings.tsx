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

export default function AdminSettings() {
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

  if (isSettingsLoading) {
    return <PageLoader isLoading={isSettingsLoading} />
  }

  const defaultCapacity = settingsData?.daily_box_capacity ?? 500
  const overridesList = settingsData?.overrides ?? []

  return (
    <div className="space-y-8 pb-16 p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 text-orange-600">
              <Sliders size={18} />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900">
              Pengaturan & Kapasitas Dapur
            </h1>
          </div>
          <p className="text-sm text-zinc-500 max-w-2xl">
            Atur batas maksimal pesanan nasi box harian dan kelola jadwal khusus/libur dapur.
          </p>
        </div>

        <button
          onClick={() => handleOpenNewOverride()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm shadow-sm transition active:scale-95 self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Atur Tanggal Khusus</span>
        </button>
      </div>

      {/* Info Banner: Rule Bisnis Kuota */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 sm:p-5 flex items-start gap-3.5">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-blue-950 space-y-1">
          <p className="font-bold text-blue-900">
            Mekanisme Perhitungan Kuota Dapur:
          </p>
          <p className="text-blue-800 leading-relaxed">
            • Pesanan berstatus <strong className="text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">Menunggu</strong> <span className="underline font-medium">belum memotong slot</span> untuk mencegah pesanan palsu/belum bayar DP mengunci dapur.
            <br />
            • Kuota <strong className="text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">resmi terpotong</strong> saat status pesanan diubah ke <strong>Di Proses</strong> atau <strong>Selesai</strong>.
            <br />
            • Jika pesanan diubah ke <strong className="text-red-800 bg-red-100 px-1.5 py-0.5 rounded">Dibatalkan</strong>, slot porsi pesanan tersebut langsung otomatis kembali tersedia ke hari tersebut.
          </p>
        </div>
      </div>

      {/* Section 1: Default Daily Capacity Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
                <UtensilsCrossed size={22} />
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 size={12} />
                Aktif Otomatis
              </span>
            </div>

            <h2 className="text-lg font-bold text-zinc-900 mb-1">
              Kapasitas Harian Default
            </h2>
            <p className="text-xs text-zinc-500 mb-6">
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
                    className="w-full text-2xl font-black text-zinc-900 border-2 border-orange-500 rounded-xl px-4 py-2.5 outline-none focus:ring-4 focus:ring-orange-500/10"
                    placeholder="500"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                    Box / Hari
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setDailyCapacityInput((prev) => (Number(prev) || 0) + 50)}
                    type="button"
                    className="flex-1 py-1.5 text-xs font-bold bg-zinc-100 hover:bg-zinc-200 rounded-lg text-zinc-700 transition"
                  >
                    +50
                  </button>
                  <button
                    onClick={() => setDailyCapacityInput((prev) => (Number(prev) || 0) + 100)}
                    type="button"
                    className="flex-1 py-1.5 text-xs font-bold bg-zinc-100 hover:bg-zinc-200 rounded-lg text-zinc-700 transition"
                  >
                    +100
                  </button>
                  <button
                    onClick={() => setDailyCapacityInput((prev) => Math.max(50, (Number(prev) || 0) - 50))}
                    type="button"
                    className="flex-1 py-1.5 text-xs font-bold bg-zinc-100 hover:bg-zinc-200 rounded-lg text-zinc-700 transition"
                  >
                    -50
                  </button>
                </div>
              </div>
            ) : (
              <div className="my-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black tracking-tight text-zinc-900">
                    {defaultCapacity.toLocaleString('id-ID')}
                  </span>
                  <span className="text-sm font-semibold text-zinc-500">
                    Nasi Box / Hari
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Maksimal yang dapat diproses per hari jika tidak ada override.
                </p>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-zinc-100 mt-6 flex items-center gap-2">
            {isEditingDefault ? (
              <>
                <button
                  type="button"
                  disabled={updateDefaultMutation.isPending}
                  onClick={handleSaveDefaultCapacity}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs transition disabled:opacity-50"
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
                  className="px-3 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-600 font-semibold text-xs transition"
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
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 text-zinc-800 font-semibold text-xs transition active:scale-98"
              >
                <Edit2 size={14} />
                <span>Ubah Kuota Default</span>
              </button>
            )}
          </div>
        </div>

        {/* Section 2: Overrides Table */}
        <div className="lg:col-span-2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-zinc-900">
                Override Tanggal Khusus & Hari Libur
              </h2>
              <p className="text-xs text-zinc-500">
                Daftar tanggal dengan kuota khusus (misal pesanan akbar) atau saat dapur tutup.
              </p>
            </div>
            <button
              onClick={() => handleOpenNewOverride()}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1"
            >
              <Plus size={14} />
              <span>Tambah Tanggal</span>
            </button>
          </div>

          {overridesList.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/70 p-8 text-center">
              <Calendar className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-zinc-700">
                Belum ada override tanggal khusus
              </p>
              <p className="text-xs text-zinc-400 mt-0.5 max-w-sm mx-auto">
                Semua tanggal saat ini menggunakan batas default ({defaultCapacity} box/hari).
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-400 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Status / Kapasitas</th>
                    <th className="py-2.5 px-3">Catatan</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {overridesList.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50/60 transition">
                      <td className="py-3 px-3 font-bold text-zinc-900 whitespace-nowrap">
                        {new Date(item.date).toLocaleDateString('id-ID', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {item.is_closed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800">
                            <XCircle size={12} />
                            Dapur Tutup / Libur
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900">
                            <Sparkles size={12} />
                            {item.max_capacity.toLocaleString('id-ID')} Box
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-zinc-600 max-w-xs truncate">
                        {item.note || '-'}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap space-x-1">
                        <button
                          onClick={() => handleEditOverride(item)}
                          className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition"
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
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
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
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <Calendar size={18} className="text-orange-500" />
              <span>Monitoring Beban Dapur (14 Hari ke Depan)</span>
            </h2>
            <p className="text-xs text-zinc-500">
              Pantau real-time jumlah porsi yang sudah di-ACC (Di Proses/Selesai) vs kuota yang tersedia.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-zinc-500">
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
          <div className="py-12 text-center text-xs text-zinc-400">
            Memuat kalender kapasitas...
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {overviewData?.map((day: CapacitySummary) => {
              const d = new Date(day.date)
              const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' })
              const dateFormatted = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
              const isToday = new Date().toISOString().split('T')[0] === day.date

              let statusColor = 'bg-emerald-50 text-emerald-800 border-emerald-200'
              let barColor = 'bg-emerald-500'
              let badgeLabel = `${day.remaining_portions} Sisa`

              if (day.is_closed) {
                statusColor = 'bg-zinc-100 text-zinc-600 border-zinc-200'
                badgeLabel = 'Tutup'
              } else if (day.is_full) {
                statusColor = 'bg-red-50 text-red-800 border-red-200'
                barColor = 'bg-red-500'
                badgeLabel = 'Penuh'
              } else if (day.percentage_booked >= 80) {
                statusColor = 'bg-amber-50 text-amber-800 border-amber-200'
                barColor = 'bg-amber-500'
              }

              return (
                <div
                  key={day.date}
                  onClick={() => handleOpenNewOverride(day.date)}
                  className={`relative p-3.5 rounded-xl border transition cursor-pointer hover:shadow-md hover:border-orange-300 flex flex-col justify-between ${
                    isToday ? 'ring-2 ring-orange-500 bg-orange-50/20' : 'bg-white'
                  }`}
                  title="Klik untuk atur kapasitas khusus tanggal ini"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                        {dayName} {isToday && '• Hari Ini'}
                      </span>
                      {day.has_override && (
                        <span className="w-2 h-2 rounded-full bg-orange-500" title="Override khusus aktif" />
                      )}
                    </div>
                    <p className="text-sm font-black text-zinc-900">
                      {dateFormatted}
                    </p>

                    <div className="mt-2.5">
                      <div className="flex items-baseline justify-between text-xs font-bold mb-1">
                        <span className="text-zinc-900">
                          {day.booked_portions}
                        </span>
                        <span className="text-zinc-400 text-[11px]">
                          / {day.max_capacity}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${day.percentage_booked}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px]">
                    <span className={`px-2 py-0.5 rounded-md font-bold border ${statusColor}`}>
                      {badgeLabel}
                    </span>
                    <span className="text-zinc-400 font-semibold">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-zinc-100 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-zinc-900 mb-1">
              {isEditingOverride ? 'Ubah Kapasitas Khusus' : 'Atur Kapasitas Khusus Tanggal'}
            </h3>
            <p className="text-xs text-zinc-500 mb-5">
              Override batas kuota atau tandai tanggal ini sebagai hari libur dapur.
            </p>

            <form onSubmit={handleSaveOverrideSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Tanggal Acara / Dapur
                </label>
                <input
                  type="date"
                  required
                  value={overrideDate}
                  onChange={(e) => setOverrideDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-zinc-200 text-xs font-medium focus:border-orange-500 focus:outline-none"
                />
              </div>

              {/* Checkbox Libur */}
              <div className="flex items-center gap-2 p-3 rounded-xl border border-zinc-200 bg-zinc-50">
                <input
                  type="checkbox"
                  id="is_closed"
                  checked={overrideIsClosed}
                  onChange={(e) => setOverrideIsClosed(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded border-zinc-300 focus:ring-orange-500"
                />
                <label htmlFor="is_closed" className="text-xs font-bold text-zinc-800 cursor-pointer">
                  Tandai sebagai Dapur Libur / Tutup Pesanan
                </label>
              </div>

              {!overrideIsClosed && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Maksimal Nasi Box (Porsi)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    required={!overrideIsClosed}
                    value={overrideCapacity}
                    onChange={(e) => setOverrideCapacity(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl border border-zinc-200 text-xs font-medium focus:border-orange-500 focus:outline-none"
                    placeholder="Contoh: 800"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Kapasitas standar adalah {defaultCapacity} box.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Catatan / Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  value={overrideNote}
                  onChange={(e) => setOverrideNote(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-zinc-200 text-xs font-medium focus:border-orange-500 focus:outline-none"
                  placeholder="Contoh: Shift Tambahan Weekend / Libur Nasional"
                />
              </div>

              <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOverrideModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saveOverrideMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-xs font-semibold text-white transition disabled:opacity-50"
                >
                  {saveOverrideMutation.isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
