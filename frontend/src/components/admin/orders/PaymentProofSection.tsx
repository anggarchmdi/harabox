import { useState, useRef, type ChangeEvent, type FormEvent } from 'react'
import {
  UploadCloud,
  FileCheck2,
  ExternalLink,
  Trash2,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Order, OrderPaymentProof, PaymentProofType } from '../../../types/orders'
import { ordersService } from '../../../services/orders.service'

interface PaymentProofSectionProps {
  order: Order
  isDark: boolean
  onProofUpdated?: (proofs: OrderPaymentProof[]) => void
}

function formatDateTime(dateStr: string) {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

export default function PaymentProofSection({
  order,
  isDark,
  onProofUpdated,
}: PaymentProofSectionProps) {
  const [proofs, setProofs] = useState<OrderPaymentProof[]>(order.payment_proofs || [])
  const [paymentType, setPaymentType] = useState<PaymentProofType>('dp')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setSelectedFile(null)
      setFilePreview(null)
      return
    }

    // Validate type
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar (JPG, PNG, atau WebP)')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 10MB')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setSelectedFile(file)
    const previewUrl = URL.createObjectURL(file)
    setFilePreview(previewUrl)
  }

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault()

    if (!selectedFile) {
      toast.error('Pilih file bukti transfer terlebih dahulu')
      return
    }

    const formData = new FormData()
    formData.append('payment_type', paymentType)
    formData.append('file', selectedFile)

    setUploading(true)

    try {
      const newProof = await ordersService.uploadPaymentProof(order.id, formData)
      toast.success('Bukti transfer berhasil diupload ke Google Drive')

      const updated = [newProof, ...proofs.filter((p) => p.id !== newProof.id)]
      setProofs(updated)
      if (onProofUpdated) {
        onProofUpdated(updated)
      }

      // Reset form
      setSelectedFile(null)
      if (filePreview) {
        URL.revokeObjectURL(filePreview)
        setFilePreview(null)
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } }
      const msg =
        errorObj.response?.data?.message ||
        'Gagal mengupload bukti transfer. Silakan periksa koneksi atau coba lagi.'
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (proof: OrderPaymentProof) => {
    if (!confirm(`Hapus bukti transfer ${proof.payment_type.toUpperCase()} (${proof.drive_file_name})?`)) {
      return
    }

    setDeletingId(proof.id)
    try {
      await ordersService.deletePaymentProof(order.id, proof.id)
      toast.success('Bukti transfer berhasil dihapus')
      const updated = proofs.filter((p) => p.id !== proof.id)
      setProofs(updated)
      if (onProofUpdated) {
        onProofUpdated(updated)
      }
    } catch {
      toast.error('Gagal menghapus bukti transfer')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div
      className={`rounded-2xl p-4 transition-all duration-200 border shadow-xs ${
        isDark ? 'border-[#60241E]/80 bg-[#1A0A08]' : 'border-stone-200/90 bg-stone-50/60'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-xl ${
              isDark ? 'bg-[#2D120F] text-amber-300' : 'bg-red-50 text-red-600'
            }`}
          >
            <FolderOpen size={16} />
          </div>
          <div>
            <h4
              className={`text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-white' : 'text-stone-900'
              }`}
            >
              Bukti Transfer (Google Drive)
            </h4>
            <p className={`text-[11px] ${isDark ? 'text-amber-200/50' : 'text-stone-400'}`}>
              Tersimpan otomatis di folder cloud Google Drive per pelanggan
            </p>
          </div>
        </div>

        {proofs.length > 0 && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
              isDark
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            <CheckCircle2 size={11} />
            {proofs.length} File Tersimpan
          </span>
        )}
      </div>

      {/* Upload Form */}
      <form onSubmit={handleUpload} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          {/* Jenis Pembayaran */}
          <div>
            <label
              className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                isDark ? 'text-amber-200/60' : 'text-stone-500'
              }`}
            >
              Jenis Pembayaran
            </label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as PaymentProofType)}
              disabled={uploading}
              className={`w-full rounded-xl border px-3 py-2 text-xs font-semibold outline-none cursor-pointer transition ${
                isDark
                  ? 'border-[#60241E] bg-[#240E0C] text-white focus:border-[#F59E0B]'
                  : 'border-stone-200 bg-white text-stone-900 focus:border-red-600'
              }`}
            >
              <option value="dp">DP (Down Payment)</option>
              <option value="pelunasan">Pelunasan</option>
            </select>
          </div>

          {/* File Picker */}
          <div className="sm:col-span-2">
            <label
              className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                isDark ? 'text-amber-200/60' : 'text-stone-500'
              }`}
            >
              Pilih Bukti Transfer (.jpg, .png, .webp)
            </label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
                id="payment-proof-file-input"
              />
              <label
                htmlFor="payment-proof-file-input"
                className={`flex-1 flex items-center justify-between gap-2 rounded-xl border px-3 py-1.5 text-xs cursor-pointer transition select-none truncate ${
                  isDark
                    ? 'border-[#60241E] bg-[#240E0C] text-stone-300 hover:bg-[#2D120F]'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <span className="truncate flex items-center gap-2">
                  <ImageIcon size={14} className={isDark ? 'text-amber-400' : 'text-red-500'} />
                  {selectedFile ? selectedFile.name : 'Pilih file gambar...'}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg shrink-0 ${
                    isDark ? 'bg-[#3A1814] text-amber-200' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  Browse
                </span>
              </label>

              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-red-700 active:scale-95 transition disabled:opacity-50 h-[38px] shrink-0 cursor-pointer"
              >
                {uploading ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={14} />
                    <span>Upload</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Selected file mini preview */}
        {filePreview && (
          <div
            className={`flex items-center gap-3 rounded-xl p-2.5 border ${
              isDark ? 'border-[#60241E]/60 bg-[#240E0C]' : 'border-stone-200 bg-white'
            }`}
          >
            <img
              src={filePreview}
              alt="Preview bukti"
              className="h-12 w-12 rounded-lg object-cover border border-stone-300 dark:border-[#60241E]"
            />
            <div className="flex-1 min-w-0 text-xs">
              <p className={`font-semibold truncate ${isDark ? 'text-white' : 'text-stone-800'}`}>
                {selectedFile?.name}
              </p>
              <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                {selectedFile && (selectedFile.size / 1024).toFixed(0)} KB • Siap dikonversi ke WebP
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null)
                if (filePreview) URL.revokeObjectURL(filePreview)
                setFilePreview(null)
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
              className={`p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer`}
              title="Batalkan pilihan file"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </form>

      {/* List of Uploaded Proofs */}
      <div className="mt-4 pt-3 border-t border-dashed border-stone-200 dark:border-[#60241E]/60">
        <h5
          className={`text-[11px] font-bold uppercase tracking-wider mb-2.5 ${
            isDark ? 'text-amber-200/60' : 'text-stone-500'
          }`}
        >
          Bukti Transfer Tersimpan
        </h5>

        {proofs.length === 0 ? (
          <div
            className={`rounded-xl p-3 text-center text-xs ${
              isDark ? 'bg-[#240E0C]/40 text-stone-400' : 'bg-white text-stone-500'
            }`}
          >
            <AlertCircle size={16} className="mx-auto mb-1 opacity-50" />
            Belum ada bukti transfer yang diupload untuk pesanan ini.
          </div>
        ) : (
          <div className="space-y-2">
            {proofs.map((proof) => {
              const isDp = proof.payment_type.toLowerCase() === 'dp'
              const viewUrl = proof.drive_web_view_link || proof.drive_file_url

              return (
                <div
                  key={proof.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl p-3 border transition ${
                    isDark
                      ? 'border-[#60241E] bg-[#240E0C] hover:border-[#8C342C]'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase shrink-0 ${
                        isDp
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {isDp ? 'DP' : 'Pelunasan'}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <FileCheck2
                          size={13}
                          className={isDp ? 'text-amber-500' : 'text-emerald-500'}
                        />
                        <span
                          className={`font-semibold text-xs truncate ${
                            isDark ? 'text-stone-200' : 'text-stone-800'
                          }`}
                          title={proof.drive_file_name}
                        >
                          {proof.drive_file_name}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] block mt-0.5 ${
                          isDark ? 'text-stone-400' : 'text-stone-400'
                        }`}
                      >
                        Diupload: {formatDateTime(proof.uploaded_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <a
                      href={viewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-2xs transition active:scale-95 ${
                        isDark
                          ? 'bg-[#3A1814] text-amber-200 hover:bg-[#4D201A] border border-[#60241E]'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                      }`}
                    >
                      <span>Lihat Bukti</span>
                      <ExternalLink size={12} />
                    </a>

                    <button
                      type="button"
                      disabled={deletingId === proof.id}
                      onClick={() => handleDelete(proof)}
                      className={`p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition active:scale-95 disabled:opacity-50 cursor-pointer`}
                      title="Hapus Bukti Transfer"
                    >
                      {deletingId === proof.id ? (
                        <RefreshCw size={13} className="animate-spin text-red-500" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
