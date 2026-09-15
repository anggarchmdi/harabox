import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Plus,
  Layers,
  Edit2,
  Trash2,
  X,
  UtensilsCrossed,
  Info,
} from 'lucide-react'
import { addonGroupService } from '../../../services/addonGroup.service'
import { addonService } from '../../../services/adddon.service'
import type { AddonGroup, Addon } from '../../../types/addon'
import PageLoader from '../../../components/ui/PageLoader'

export default function AdminAddons() {
  const queryClient = useQueryClient()

  // Queries
  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['admin-addon-groups'],
    queryFn: () => addonGroupService.getAll(),
  })

  // Modal State for Addon Group
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<AddonGroup | null>(null)
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    is_required: false,
    min_selection: 0,
    max_selection: 1,
    is_active: true,
  })
  const [groupSubmitting, setGroupSubmitting] = useState(false)

  // Modal State for Addon Item
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [targetGroupId, setTargetGroupId] = useState<number | null>(null)
  const [editingItem, setEditingItem] = useState<Addon | null>(null)
  const [itemForm, setItemForm] = useState({
    name: '',
    price: '0',
    description: '',
    is_active: true,
  })
  const [itemSubmitting, setItemSubmitting] = useState(false)

  // ==========================================
  // GROUP HANDLERS
  // ==========================================
  const handleOpenCreateGroup = () => {
    setEditingGroup(null)
    setGroupForm({
      name: '',
      description: '',
      is_required: false,
      min_selection: 0,
      max_selection: 1,
      is_active: true,
    })
    setIsGroupModalOpen(true)
  }

  const handleOpenEditGroup = (group: AddonGroup) => {
    setEditingGroup(group)
    setGroupForm({
      name: group.name,
      description: group.description ?? '',
      is_required: group.is_required,
      min_selection: group.min_selection,
      max_selection: group.max_selection,
      is_active: group.is_active,
    })
    setIsGroupModalOpen(true)
  }

  const handleSubmitGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupForm.name.trim()) {
      toast.error('Nama grup addon wajib diisi')
      return
    }

    try {
      setGroupSubmitting(true)
      if (editingGroup) {
        await addonGroupService.update(editingGroup.id, {
          name: groupForm.name.trim(),
          description: groupForm.description.trim() || null,
          is_required: groupForm.is_required,
          min_selection: Number(groupForm.min_selection),
          max_selection: Number(groupForm.max_selection),
          is_active: groupForm.is_active,
        })
        toast.success('Grup addon berhasil diperbarui')
      } else {
        await addonGroupService.create({
          name: groupForm.name.trim(),
          description: groupForm.description.trim() || null,
          is_required: groupForm.is_required,
          min_selection: Number(groupForm.min_selection),
          max_selection: Number(groupForm.max_selection),
          is_active: groupForm.is_active,
        })
        toast.success('Grup addon baru berhasil dibuat')
      }

      await queryClient.invalidateQueries({ queryKey: ['admin-addon-groups'] })
      setIsGroupModalOpen(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan grup addon')
    } finally {
      setGroupSubmitting(false)
    }
  }

  const handleDeleteGroup = async (id: number, name: string) => {
    if (!confirm(`Hapus grup "${name}" beserta semua addon di dalamnya?`)) return
    try {
      await addonGroupService.delete(id)
      toast.success(`Grup "${name}" berhasil dihapus`)
      await queryClient.invalidateQueries({ queryKey: ['admin-addon-groups'] })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus grup')
    }
  }

  // ==========================================
  // ITEM HANDLERS
  // ==========================================
  const handleOpenCreateItem = (groupId: number) => {
    setTargetGroupId(groupId)
    setEditingItem(null)
    setItemForm({
      name: '',
      price: '0',
      description: '',
      is_active: true,
    })
    setIsItemModalOpen(true)
  }

  const handleOpenEditItem = (addon: Addon, groupId: number) => {
    setTargetGroupId(groupId)
    setEditingItem(addon)
    setItemForm({
      name: addon.name,
      price: String(Number(addon.price)),
      description: addon.description ?? '',
      is_active: addon.is_active,
    })
    setIsItemModalOpen(true)
  }

  const handleSubmitItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemForm.name.trim()) {
      toast.error('Nama addon wajib diisi')
      return
    }

    try {
      setItemSubmitting(true)
      if (editingItem) {
        await addonService.update(editingItem.id, {
          addon_group_id: targetGroupId,
          name: itemForm.name.trim(),
          price: Number(itemForm.price) || 0,
          description: itemForm.description.trim() || null,
          is_active: itemForm.is_active,
        })
        toast.success('Item addon berhasil diperbarui')
      } else {
        await addonService.create({
          addon_group_id: targetGroupId,
          name: itemForm.name.trim(),
          price: Number(itemForm.price) || 0,
          description: itemForm.description.trim() || null,
          is_active: itemForm.is_active,
        })
        toast.success('Item addon baru berhasil ditambahkan')
      }

      await queryClient.invalidateQueries({ queryKey: ['admin-addon-groups'] })
      setIsItemModalOpen(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan item addon')
    } finally {
      setItemSubmitting(false)
    }
  }

  const handleDeleteItem = async (id: number, name: string) => {
    if (!confirm(`Hapus item addon "${name}"?`)) return
    try {
      await addonService.delete(id)
      toast.success(`Addon "${name}" berhasil dihapus`)
      await queryClient.invalidateQueries({ queryKey: ['admin-addon-groups'] })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus addon')
    }
  }

  return (
    <div className="space-y-6">
      <PageLoader
        isLoading={isLoading}
        text="Memuat Data Add-on & Pelengkap..."
        subtext="Menyiapkan opsi sambal, lauk ekstra, dan minuman"
        minDuration={400}
      />
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            <Layers className="text-emerald-600" size={26} />
            Kelola Add-on & Kustomisasi Menu
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Atur opsi variasi (pilihan nasi, lauk pelengkap, atau tambahan) yang dapat diaktifkan pada menu katering.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateGroup}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-stone-800 active:scale-95"
        >
          <Plus size={16} />
          Buat Grup Add-on Baru
        </button>
      </div>

      {/* Info Alert */}
      <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-4 text-xs text-emerald-900 flex items-start gap-3">
        <Info className="shrink-0 text-emerald-600 mt-0.5" size={18} />
        <div>
          <p className="font-bold">Bagaimana Add-on Bekerja:</p>
          <p className="mt-0.5 text-emerald-800">
            1. Buat grup (misal: "Pilihan Nasi", "Extra Lauk"). 2. Masukkan item variasi ke dalam grup tersebut beserta harganya (Rp 0 jika sudah termasuk). 3. Pada menu <strong>Katalog Produk</strong>, aktifkan tombol <strong>On/Off Add-on</strong> dan centang grup yang ingin disertakan pada produk tersebut.
          </p>
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-stone-100 animate-pulse" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-white p-12 text-center">
          <UtensilsCrossed className="mx-auto h-12 w-12 text-stone-300" />
          <h3 className="mt-3 text-sm font-bold text-stone-900">Belum Ada Grup Add-on</h3>
          <p className="mt-1 text-xs text-stone-500 max-w-sm mx-auto">
            Mulai dengan membuat grup pilihan pertama Anda, misalnya pilihan variasi nasi atau minuman pendamping.
          </p>
          <button
            type="button"
            onClick={handleOpenCreateGroup}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
          >
            <Plus size={16} />
            Buat Grup Pertama
          </button>
        </div>
      ) : (
        /* Groups List */
        <div className="space-y-6">
          {groups.map((group) => (
            <div
              key={group.id}
              className="rounded-2xl border border-stone-200/90 bg-white shadow-2xs overflow-hidden"
            >
              {/* Group Header */}
              <div className="border-b border-stone-100 bg-stone-50/70 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold text-sm">
                    {group.addons?.length || 0}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-stone-900">{group.name}</h2>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          group.is_required
                            ? 'bg-amber-100 text-amber-800 border border-amber-200/80'
                            : 'bg-stone-200/80 text-stone-700'
                        }`}
                      >
                        {group.is_required ? 'Wajib Pilih' : 'Opsional'}
                      </span>
                      <span className="text-[11px] font-medium text-stone-500">
                        (Min: {group.min_selection}, Max: {group.max_selection})
                      </span>
                      {!group.is_active && (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                          Nonaktif
                        </span>
                      )}
                    </div>
                    {group.description && (
                      <p className="text-xs text-stone-500 mt-0.5">{group.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleOpenCreateItem(group.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                  >
                    <Plus size={14} />
                    Tambah Item
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEditGroup(group)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100"
                    title="Edit Grup"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteGroup(group.id, group.name)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-rose-600 hover:bg-rose-50"
                    title="Hapus Grup"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Addons Inside Group */}
              <div className="p-4 sm:p-5">
                {(!group.addons || group.addons.length === 0) ? (
                  <p className="text-xs text-stone-400 italic py-2">
                    Belum ada pilihan variasi di grup ini. Klik "Tambah Item" untuk menambahkan.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {group.addons.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-xl border border-stone-200/80 bg-stone-50/40 p-3 hover:bg-white hover:border-stone-300 transition shadow-2xs"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-stone-900 truncate">{item.name}</p>
                            {!item.is_active && (
                              <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-1 rounded">
                                Nonaktif
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-emerald-600 mt-0.5">
                            {Number(item.price) === 0
                              ? 'Termasuk (Rp 0)'
                              : `+Rp ${Number(item.price).toLocaleString('id-ID')}`}
                          </p>
                          {item.description && (
                            <p className="text-[11px] text-stone-400 truncate mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditItem(item, group.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-stone-200 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                            title="Edit Addon"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id, item.name)}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-stone-200 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                            title="Hapus Addon"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =====================================================
          MODAL: GRUP ADDON (CREATE / EDIT)
      ====================================================== */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900">
                {editingGroup ? 'Edit Grup Add-on' : 'Buat Grup Add-on Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsGroupModalOpen(false)}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitGroup} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Nama Grup <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Misal: Pilihan Nasi, Extra Lauk, Minuman"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs text-stone-900 outline-none focus:border-emerald-600 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Deskripsi Singkat</label>
                <input
                  type="text"
                  value={groupForm.description}
                  onChange={(e) => setGroupForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Misal: Pilih 1 variasi nasi untuk paket bento"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs text-stone-900 outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Minimal Pilihan</label>
                  <input
                    type="number"
                    min="0"
                    value={groupForm.min_selection}
                    onChange={(e) => setGroupForm((prev) => ({ ...prev, min_selection: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs text-stone-900 outline-none focus:border-emerald-600 focus:bg-white"
                  />
                  <span className="text-[10px] text-stone-400">1 jika wajib pilih, 0 jika opsional</span>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Maksimal Pilihan</label>
                  <input
                    type="number"
                    min="1"
                    value={groupForm.max_selection}
                    onChange={(e) => setGroupForm((prev) => ({ ...prev, max_selection: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs text-stone-900 outline-none focus:border-emerald-600 focus:bg-white"
                  />
                  <span className="text-[10px] text-stone-400">Batas maks per porsi (mencegah spam)</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_required"
                  checked={groupForm.is_required}
                  onChange={(e) => setGroupForm((prev) => ({
                    ...prev,
                    is_required: e.target.checked,
                    min_selection: e.target.checked ? Math.max(1, prev.min_selection) : 0,
                  }))}
                  className="h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="is_required" className="text-xs text-stone-700 font-semibold cursor-pointer">
                  Grup ini wajib dipilih oleh pelanggan (Required)
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="group_active"
                  checked={groupForm.is_active}
                  onChange={(e) => setGroupForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="group_active" className="text-xs text-stone-700 font-semibold cursor-pointer">
                  Status Grup Aktif
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="rounded-xl border border-stone-200 px-4 py-2 font-bold text-stone-600 hover:bg-stone-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={groupSubmitting}
                  className="rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {groupSubmitting ? 'Menyimpan...' : 'Simpan Grup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL: ITEM ADDON (CREATE / EDIT)
      ====================================================== */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900">
                {editingItem ? 'Edit Item Add-on' : 'Tambah Item Add-on'}
              </h3>
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitItem} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Nama Variasi / Add-on <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={itemForm.name}
                  onChange={(e) => setItemForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Misal: Nasi Uduk, Sambal Matah, Es Teh"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs text-stone-900 outline-none focus:border-emerald-600 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Harga Tambahan (Rp) <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-bold text-stone-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={itemForm.price}
                    onChange={(e) => setItemForm((prev) => ({ ...prev, price: e.target.value }))}
                    placeholder="0"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 pl-9 pr-3.5 py-2.5 text-xs text-stone-900 outline-none focus:border-emerald-600 focus:bg-white font-bold"
                    required
                  />
                </div>
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Isi 0 jika variasi ini tidak menambah harga dasar menu.
                </span>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Deskripsi Singkat (Opsional)</label>
                <input
                  type="text"
                  value={itemForm.description}
                  onChange={(e) => setItemForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Misal: Nasi gurih santan wangi daun salam"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs text-stone-900 outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="item_active"
                  checked={itemForm.is_active}
                  onChange={(e) => setItemForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="item_active" className="text-xs text-stone-700 font-semibold cursor-pointer">
                  Status Item Aktif
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="rounded-xl border border-stone-200 px-4 py-2 font-bold text-stone-600 hover:bg-stone-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={itemSubmitting}
                  className="rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {itemSubmitting ? 'Menyimpan...' : 'Simpan Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
