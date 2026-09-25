import { useState, useRef } from 'react'
import {
  Printer,
  X,
  Receipt,
  ChefHat,
  FileText,
  Copy,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Order } from '../../../types/orders'
import { useThemeStore } from '../../../stores/theme.store'

interface PrintOrderModalProps {
  order: Order | null
  isOpen: boolean
  onClose: () => void
}

type PrintTemplate = 'thermal' | 'kitchen' | 'invoice'
type PaperWidth = '58mm' | '80mm'

function formatRupiah(value: string | number) {
  return `Rp ${Number(value || 0).toLocaleString('id-ID')}`
}

function formatDateIndo(dateStr: string) {
  if (!dateStr) return '-'
  try {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

function formatShortDate(dateStr: string) {
  if (!dateStr) return '-'
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return `${formatShortDate(dateStr)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  } catch {
    return dateStr || '-'
  }
}

export default function PrintOrderModal({
  order,
  isOpen,
  onClose,
}: PrintOrderModalProps) {
  const isDark = useThemeStore((state) => state.theme === 'dark')
  const [template, setTemplate] = useState<PrintTemplate>('thermal')
  const [paperWidth, setPaperWidth] = useState<PaperWidth>('58mm')
  const [copied, setCopied] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  if (!isOpen || !order) return null

  // Calculate numbers
  const subtotal = Number(order.subtotal || 0)
  const deliveryFee = Number(order.delivery_fee || 0)
  const total = Number(order.total || 0)
  const paidAmount = Number(order.paid_amount || 0)
  const remaining = Math.max(0, total - paidAmount)

  const paymentStatusText =
    order.payment_status === 'paid'
      ? 'LUNAS'
      : order.payment_status === 'dp'
        ? 'DP DITERIMA'
        : 'BELUM BAYAR'

  const orderStatusText =
    {
      pending: 'MENUNGGU KONFIRMASI',
      confirmed: 'DIKONFIRMASI',
      processing: 'DIPROSES DAPUR',
      completed: 'SELESAI',
      cancelled: 'DIBATALKAN',
    }[order.status] || order.status.toUpperCase()

  // Generate plain text version for copying / bluetooth print apps
  const generatePlainText = () => {
    const line = '--------------------------------'
    const doubleLine = '================================'
    const itemsText = (order.items || [])
      .map((item) => {
        let text = `${item.item_name}\n  ${item.quantity}x @${Number(item.price).toLocaleString('id-ID')} = Rp ${Number(item.subtotal).toLocaleString('id-ID')}`
        if (item.addons && item.addons.length > 0) {
          const addons = item.addons
            .map(
              (a) =>
                `   + ${a.addon_name} (+Rp ${Number(a.price).toLocaleString('id-ID')})`
            )
            .join('\n')
          text += `\n${addons}`
        }
        return text
      })
      .join('\n')

    if (template === 'kitchen') {
      return `*** TIKET KERJA DAPUR ***
PAWON HARA CATERING
${doubleLine}
JADWAL KIRIM / SIAP:
${formatDateIndo(order.event_date).toUpperCase()}
JAM: ${order.event_time ? `${order.event_time} WIB` : 'JAM BELUM DITENTUKAN'}
${line}
Kode Order : ${order.order_code}
Pemesan    : ${order.customers_name} (${order.customers_phone})
Alamat     : ${order.delivery_address}
${doubleLine}
DAFTAR MENU YANG HARUS DIMASAK:
${(order.items || [])
  .map(
    (item, idx) =>
      `[ ] ${idx + 1}. ${item.quantity}x ${item.item_name.toUpperCase()}${
        item.addons && item.addons.length > 0
          ? '\n' +
            item.addons
              .map((a) => `     - [ ] ${a.addon_name} (${item.quantity} porsi)`)
              .join('\n')
          : ''
      }`
  )
  .join('\n')}
${line}
CATATAN KHUSUS:
${order.notes || 'Tidak ada catatan khusus'}
${doubleLine}
Dicek Dapur : [          ]
Dicek QC    : [          ]
Dicetak     : ${formatDateTime(new Date().toISOString())}
`
    }

    return `PAWON HARA
Nasi Box & Katering Yogyakarta
WA: 0896-6974-3193
${doubleLine}
No. Nota    : ${order.order_code}
Tgl Order   : ${formatDateTime(order.created_at)}
Tgl Acara   : ${formatDateIndo(order.event_date)}
Waktu Acara : ${order.event_time ? `${order.event_time} WIB` : '-'}
Pemesan     : ${order.customers_name}
No. WA      : ${order.customers_phone}
Alamat      : ${order.delivery_address}
${line}
RINCIAN PESANAN:
${itemsText}
${line}
Subtotal Menu : ${formatRupiah(subtotal)}
Ongkos Kirim  : ${formatRupiah(deliveryFee)}
TOTAL TAGIHAN : ${formatRupiah(total)}
${line}
Status Order  : ${orderStatusText}
Status Bayar  : ${paymentStatusText}
Telah Dibayar : ${formatRupiah(paidAmount)}
${remaining > 0 ? `Sisa Tagihan  : ${formatRupiah(remaining)}\n` : ''}Metode Bayar  : ${order.payment_method || '-'}
${order.notes ? `Catatan       : ${order.notes}\n` : ''}${doubleLine}
Terima kasih telah mempercayakan
hidangan Anda kepada Pawon Hara!
Instagram: @pawonhara
`
  }

  // Handle Copy to Clipboard
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(generatePlainText())
      setCopied(true)
      toast.success('Teks nota berhasil disalin ke clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Gagal menyalin teks.')
    }
  }

  // Generate HTML for iframe printing
  const generatePrintHtml = () => {
    const isKitchen = template === 'kitchen'
    const isInvoice = template === 'invoice'
    const isThermal = template === 'thermal'

    const receiptWidthCss = isThermal
      ? paperWidth === '58mm'
        ? 'width: 54mm; max-width: 54mm;'
        : 'width: 76mm; max-width: 76mm;'
      : isKitchen
        ? 'width: 76mm; max-width: 76mm;'
        : 'width: 100%; max-width: 210mm;' // A4

    const fontSize = isThermal
      ? paperWidth === '58mm'
        ? '10px'
        : '12px'
      : isKitchen
        ? '12px'
        : '13px'

    let contentHtml = ''

    if (isKitchen) {
      // SLIP DAPUR (KITCHEN WORK ORDER)
      contentHtml = `
        <div class="header">
          <div class="title" style="font-size: 16px; font-weight: 900; letter-spacing: 0.5px;">*** TIKET KERJA DAPUR ***</div>
          <div style="font-size: 13px; font-weight: bold; margin-top: 2px;">PAWON HARA CATERING</div>
        </div>
        <div class="divider-double"></div>

        <div class="highlight-box">
          <div style="font-size: 10px; font-weight: bold; text-transform: uppercase;">Waktu Kirim / Acara:</div>
          <div style="font-size: 15px; font-weight: 900; margin-top: 2px;">
            ${formatDateIndo(order.event_date)}
          </div>
          <div style="font-size: 17px; font-weight: 900; color: #000; margin-top: 1px;">
            PUKUL ${order.event_time ? `${order.event_time} WIB` : 'JAM BELUM DIATUR'}
          </div>
        </div>

        <div style="margin-top: 8px; font-size: 11px;">
          <div><strong>Kode Order:</strong> ${order.order_code}</div>
          <div><strong>Pemesan:</strong> ${order.customers_name} (${order.customers_phone})</div>
          <div><strong>Alamat / Kirim:</strong> ${order.delivery_address || 'Ambil Sendiri'}</div>
        </div>

        <div class="divider-double"></div>
        <div style="font-weight: 900; font-size: 12px; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
          DAFTAR MENU & PORSI DAPUR:
        </div>

        ${(order.items || [])
          .map(
            (item) => `
          <div class="kitchen-item">
            <div style="display: flex; align-items: flex-start; gap: 6px;">
              <span class="checkbox-box">[&nbsp;&nbsp;]</span>
              <div style="flex: 1;">
                <div style="font-size: 14px; font-weight: 900; line-height: 1.2;">
                  ${item.quantity}x ${item.item_name}
                </div>
                ${
                  item.addons && item.addons.length > 0
                    ? `
                  <div style="margin-top: 3px; padding-left: 4px; font-size: 11px;">
                    ${item.addons
                      .map(
                        (a) => `
                      <div style="display: flex; align-items: center; gap: 4px; margin-top: 2px;">
                        <span>[&nbsp;]</span>
                        <span><strong>+ ${a.addon_name}</strong> (${item.quantity}x)</span>
                      </div>
                    `
                      )
                      .join('')}
                  </div>
                `
                    : ''
                }
              </div>
            </div>
          </div>
        `
          )
          .join('')}

        <div class="divider"></div>
        <div style="font-weight: bold; font-size: 11px;">CATATAN KHUSUS ACARA:</div>
        <div style="border: 1px dashed #000; padding: 6px; font-size: 11px; margin-top: 4px; background: #fafafa; font-style: italic;">
          ${order.notes ? order.notes : 'Tidak ada catatan khusus.'}
        </div>

        <div class="divider-double"></div>
        <div style="display: flex; justify-content: space-between; font-size: 10px; margin-top: 8px;">
          <div style="text-align: center; width: 45%;">
            <div>Disiapkan (Dapur)</div>
            <div style="height: 35px;"></div>
            <div>( .................... )</div>
          </div>
          <div style="text-align: center; width: 45%;">
            <div>Dicek (QC / Packing)</div>
            <div style="height: 35px;"></div>
            <div>( .................... )</div>
          </div>
        </div>
        <div style="text-align: center; font-size: 9px; margin-top: 10px; color: #555;">
          Dicetak: ${formatDateTime(new Date().toISOString())}
        </div>
      `
    } else if (isInvoice) {
      // INVOICE RESMI STANDAR A4 / FORMAL
      contentHtml = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 12px;">
          <div>
            <div style="font-size: 22px; font-weight: 900; letter-spacing: 0.5px;">PAWON HARA</div>
            <div style="font-size: 11px; color: #444; margin-top: 2px;">Katering & Nasi Box Istimewa Yogyakarta</div>
            <div style="font-size: 11px; color: #444;">WhatsApp: 0896-6974-3193 | Instagram: @pawonhara</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 18px; font-weight: 900; text-transform: uppercase;">INVOICE TAGIHAN</div>
            <div style="font-size: 12px; font-weight: bold; margin-top: 2px;">No: ${order.order_code}</div>
            <div style="font-size: 11px; color: #555;">Tgl Cetak: ${formatDateTime(new Date().toISOString())}</div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 14px; font-size: 11px; line-height: 1.5;">
          <div style="width: 48%;">
            <div style="font-weight: bold; text-transform: uppercase; color: #555; margin-bottom: 2px;">DITUJUKAN KEPADA:</div>
            <div style="font-size: 13px; font-weight: bold;">${order.customers_name}</div>
            <div>No. WhatsApp : ${order.customers_phone}</div>
            <div>Alamat Kirim  : ${order.delivery_address || '-'}</div>
          </div>
          <div style="width: 48%; text-align: right;">
            <div style="font-weight: bold; text-transform: uppercase; color: #555; margin-bottom: 2px;">DETAIL JADWAL ACARA:</div>
            <div style="font-size: 13px; font-weight: bold;">${formatDateIndo(order.event_date)}</div>
            <div>Waktu Pengantaran: ${order.event_time ? `${order.event_time} WIB` : 'Fleksibel'}</div>
            <div style="margin-top: 4px;">
              <span style="display: inline-block; padding: 2px 8px; font-weight: bold; font-size: 11px; border: 1px solid #000; border-radius: 4px;">
                STATUS: ${paymentStatusText}
              </span>
            </div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 11px;">
          <thead>
            <tr style="border-top: 2px solid #000; border-bottom: 2px solid #000; background: #f5f5f5;">
              <th style="padding: 6px; text-align: left; width: 5%;">NO</th>
              <th style="padding: 6px; text-align: left;">DESKRIPSI MENU & ADDON</th>
              <th style="padding: 6px; text-align: center; width: 12%;">JUMLAH</th>
              <th style="padding: 6px; text-align: right; width: 22%;">HARGA SATUAN</th>
              <th style="padding: 6px; text-align: right; width: 22%;">SUBTOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${(order.items || [])
              .map((item, idx) => {
                const addonsPrice = (item.addons || []).reduce(
                  (sum, a) => sum + Number(a.price || 0),
                  0
                )
                const unitTotal = Number(item.price) + addonsPrice

                return `
                <tr style="border-bottom: 1px solid #ddd;">
                  <td style="padding: 8px 6px; vertical-align: top;">${idx + 1}</td>
                  <td style="padding: 8px 6px; vertical-align: top;">
                    <div style="font-weight: bold; font-size: 12px;">${item.item_name}</div>
                    <div style="color: #555; font-size: 10px;">Harga dasar: ${formatRupiah(item.price)}</div>
                    ${
                      item.addons && item.addons.length > 0
                        ? `
                      <div style="margin-top: 4px; padding-left: 8px; border-left: 2px solid #ccc; font-size: 10px;">
                        ${item.addons
                          .map(
                            (a) => `
                          <div>+ ${a.addon_name} (${formatRupiah(a.price)})</div>
                        `
                          )
                          .join('')}
                      </div>
                    `
                        : ''
                    }
                  </td>
                  <td style="padding: 8px 6px; text-align: center; vertical-align: top; font-weight: bold;">
                    ${item.quantity} box
                  </td>
                  <td style="padding: 8px 6px; text-align: right; vertical-align: top; font-family: monospace;">
                    ${formatRupiah(unitTotal)}
                  </td>
                  <td style="padding: 8px 6px; text-align: right; vertical-align: top; font-family: monospace; font-weight: bold;">
                    ${formatRupiah(item.subtotal)}
                  </td>
                </tr>
              `
              })
              .join('')}
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; margin-top: 14px;">
          <div style="width: 50%; font-size: 11px;">
            <div style="border: 1px dashed #999; padding: 8px; border-radius: 4px; background: #fafafa;">
              <div style="font-weight: bold; margin-bottom: 2px;">Catatan Pesanan:</div>
              <div style="color: #444;">${order.notes || 'Tidak ada catatan.'}</div>
            </div>
            <div style="margin-top: 10px; font-size: 10px; color: #666;">
              <div>Pembayaran Transfer Bank:</div>
              <div style="font-weight: bold; color: #000;">BCA: 037-XXXX-XXXX a/n PAWON HARA</div>
            </div>
          </div>

          <div style="width: 44%; font-size: 11px;">
            <div style="display: flex; justify-content: space-between; padding: 4px 0;">
              <span>Subtotal Menu:</span>
              <span style="font-family: monospace;">${formatRupiah(subtotal)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 4px 0;">
              <span>Ongkos Kirim:</span>
              <span style="font-family: monospace;">${formatRupiah(deliveryFee)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-top: 2px solid #000; border-bottom: 2px solid #000; font-size: 13px; font-weight: 900;">
              <span>TOTAL TAGIHAN:</span>
              <span style="font-family: monospace;">${formatRupiah(total)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 4px 0; margin-top: 4px;">
              <span>Nominal Dibayar:</span>
              <span style="font-family: monospace; font-weight: bold;">${formatRupiah(paidAmount)}</span>
            </div>
            ${
              remaining > 0
                ? `
              <div style="display: flex; justify-content: space-between; padding: 4px 0; font-weight: bold; color: #b91c1c;">
                <span>Sisa Tagihan (Piutang):</span>
                <span style="font-family: monospace;">${formatRupiah(remaining)}</span>
              </div>
            `
                : `
              <div style="display: flex; justify-content: space-between; padding: 4px 0; font-weight: bold; color: #15803d;">
                <span>Status Pembayaran:</span>
                <span>LUNAS</span>
              </div>
            `
            }
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 40px; font-size: 11px; text-align: center;">
          <div style="width: 35%;">
            <div>Tanda Terima Pemesan,</div>
            <div style="height: 50px;"></div>
            <div style="font-weight: bold;">( ${order.customers_name} )</div>
          </div>
          <div style="width: 35%;">
            <div>Hormat Kami,</div>
            <div style="height: 50px;"></div>
            <div style="font-weight: bold;">( Pawon Hara Management )</div>
          </div>
        </div>
      `
    } else {
      // NOTA STRUK THERMAL STANDAR (58mm / 80mm)
      contentHtml = `
        <div class="header">
          <div class="title" style="font-size: 16px; font-weight: 900; letter-spacing: 0.5px;">PAWON HARA</div>
          <div style="font-size: 10px; margin-top: 1px;">Nasi Box & Katering Yogyakarta</div>
          <div style="font-size: 10px;">WA: 0896-6974-3193</div>
        </div>
        <div class="divider-double"></div>

        <div class="info-row">
          <span>No. Nota:</span>
          <span style="font-weight: bold;">${order.order_code}</span>
        </div>
        <div class="info-row">
          <span>Tgl Pesan:</span>
          <span>${formatDateTime(order.created_at)}</span>
        </div>
        <div class="info-row">
          <span>Pemesan:</span>
          <span><strong>${order.customers_name}</strong></span>
        </div>
        <div class="info-row">
          <span>WhatsApp:</span>
          <span>${order.customers_phone}</span>
        </div>

        <div class="divider"></div>
        <div class="highlight-box">
          <div style="font-size: 9px; font-weight: bold; text-transform: uppercase;">Jadwal Pengantaran Acara:</div>
          <div style="font-size: 12px; font-weight: 900; margin-top: 1px;">
            ${formatShortDate(order.event_date)} (${order.event_time ? `${order.event_time} WIB` : 'Siang'})
          </div>
        </div>

        <div class="info-row" style="margin-top: 4px;">
          <span>Alamat:</span>
          <span style="text-align: right; max-width: 60%;">${order.delivery_address || '-'}</span>
        </div>

        <div class="divider-double"></div>
        <div style="font-size: 10px; font-weight: 900; text-transform: uppercase; margin-bottom: 4px;">
          RINCIAN MENU
        </div>

        ${(order.items || [])
          .map((item) => {
            const addonsPrice = (item.addons || []).reduce(
              (sum, a) => sum + Number(a.price || 0),
              0
            )
            const unitPrice = Number(item.price) + addonsPrice

            return `
            <div class="thermal-item">
              <div style="font-weight: bold; font-size: 11px;">${item.item_name}</div>
              <div style="display: flex; justify-content: space-between; font-size: 10px;">
                <span>${item.quantity} x @${Number(unitPrice).toLocaleString('id-ID')}</span>
                <span style="font-weight: bold;">${formatRupiah(item.subtotal)}</span>
              </div>
              ${
                item.addons && item.addons.length > 0
                  ? `
                <div style="padding-left: 4px; font-size: 9px; color: #333;">
                  ${item.addons
                    .map(
                      (a) => `
                    <div>+ ${a.addon_name} (+${formatRupiah(a.price)})</div>
                  `
                    )
                    .join('')}
                </div>
              `
                  : ''
              }
            </div>
          `
          })
          .join('')}

        <div class="divider"></div>
        <div class="total-row">
          <span>Subtotal Menu:</span>
          <span>${formatRupiah(subtotal)}</span>
        </div>
        <div class="total-row">
          <span>Ongkos Kirim:</span>
          <span>${formatRupiah(deliveryFee)}</span>
        </div>
        <div class="divider"></div>
        <div class="total-row" style="font-size: 13px; font-weight: 900;">
          <span>TOTAL:</span>
          <span>${formatRupiah(total)}</span>
        </div>
        <div class="divider"></div>

        <div class="total-row" style="font-weight: bold;">
          <span>Status Bayar:</span>
          <span>${paymentStatusText}</span>
        </div>
        <div class="total-row">
          <span>Dibayar:</span>
          <span>${formatRupiah(paidAmount)}</span>
        </div>
        ${
          remaining > 0
            ? `
          <div class="total-row" style="font-weight: bold; color: #000;">
            <span>Sisa Tagihan:</span>
            <span>${formatRupiah(remaining)}</span>
          </div>
        `
            : ''
        }
        <div class="total-row">
          <span>Metode:</span>
          <span>${order.payment_method || 'Transfer'}</span>
        </div>

        ${
          order.notes
            ? `
          <div class="divider"></div>
          <div style="font-size: 9px; font-style: italic;">
            <strong>Catatan:</strong> ${order.notes}
          </div>
        `
            : ''
        }

        <div class="divider-double"></div>
        <div class="footer">
          <div>Terima kasih atas pesanan Anda!</div>
          <div style="margin-top: 2px;">Pawon Hara - Dari Pawon Ke Meja Anda</div>
          <div>Instagram: @pawonhara</div>
        </div>
      `
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${isKitchen ? 'Slip_Dapur' : 'Nota'}_${order.order_code}</title>
        <style>
          @page {
            margin: ${isInvoice ? '10mm' : '2mm'};
            size: ${isInvoice ? 'A4 portrait' : 'auto'};
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Courier New', Courier, Consolas, Monaco, monospace, sans-serif;
            color: #000000;
            background: #ffffff;
            font-size: ${fontSize};
            line-height: 1.35;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .receipt-container {
            ${receiptWidthCss}
            margin: 0 auto;
            padding: ${isInvoice ? '0' : '4px 2px'};
          }
          .header {
            text-align: center;
            margin-bottom: 4px;
          }
          .divider {
            border-top: 1px dashed #000;
            margin: 5px 0;
          }
          .divider-double {
            border-top: 2px dashed #000;
            margin: 6px 0;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin: 2px 0;
          }
          .highlight-box {
            border: 1px solid #000;
            padding: 4px;
            text-align: center;
            margin: 4px 0;
            background: #f7f7f7;
          }
          .kitchen-item {
            margin-bottom: 8px;
            padding-bottom: 6px;
            border-bottom: 1px dashed #ccc;
          }
          .thermal-item {
            margin-bottom: 5px;
          }
          .checkbox-box {
            font-family: monospace;
            font-size: 13px;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            font-size: 9px;
            margin-top: 6px;
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          ${contentHtml}
        </div>
      </body>
      </html>
    `
  }

  // Trigger Print via isolated Hidden Iframe
  const handlePrint = () => {
    const html = generatePrintHtml()
    let iframe = iframeRef.current

    if (!iframe) {
      iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.right = '0'
      iframe.style.bottom = '0'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = '0'
      document.body.appendChild(iframe)
      iframeRef.current = iframe
    }

    const doc = iframe.contentWindow?.document
    if (doc) {
      doc.open()
      doc.write(html)
      doc.close()

      setTimeout(() => {
        iframe?.contentWindow?.focus()
        iframe?.contentWindow?.print()
      }, 250)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isDark
            ? 'border-[#60241E] bg-[#1C0B09] text-stone-100'
            : 'border-stone-200 bg-white text-stone-900'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-[#60241E]/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-600 text-white shadow-2xs">
              <Printer size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">
                Cetak Nota & Slip Pesanan
              </h3>
              <p className="text-xs text-stone-400">
                Order #{order.order_code} • {order.customers_name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-full border transition cursor-pointer ${
              isDark
                ? 'border-[#60241E] bg-[#240E0C] text-stone-400 hover:text-white'
                : 'border-stone-200 bg-stone-50 text-stone-500 hover:text-stone-900'
            }`}
          >
            <X size={16} />
          </button>
        </div>

        {/* Control Toolbar (Template Switcher & Size Selector) */}
        <div className="px-5 py-3 border-b border-stone-200/80 dark:border-[#60241E]/60 bg-stone-50/50 dark:bg-[#240E0C]/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Format Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl border border-stone-200 dark:border-[#60241E] bg-white dark:bg-[#1C0B09]">
            <button
              type="button"
              onClick={() => setTemplate('thermal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                template === 'thermal'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white'
              }`}
            >
              <Receipt size={13} />
              <span>Struk Thermal (Kasir)</span>
            </button>

            <button
              type="button"
              onClick={() => setTemplate('kitchen')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                template === 'kitchen'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white'
              }`}
            >
              <ChefHat size={13} />
              <span>Slip Dapur (Tiket Kerja)</span>
            </button>

            <button
              type="button"
              onClick={() => setTemplate('invoice')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                template === 'invoice'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white'
              }`}
            >
              <FileText size={13} />
              <span>Invoice Resmi (A4)</span>
            </button>
          </div>

          {/* Thermal Paper Width Selector */}
          {template === 'thermal' && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-stone-400">
                Lebar Kertas:
              </span>
              <div className="inline-flex rounded-lg border border-stone-200 dark:border-[#60241E] p-0.5 bg-white dark:bg-[#1C0B09]">
                <button
                  type="button"
                  onClick={() => setPaperWidth('58mm')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                    paperWidth === '58mm'
                      ? 'bg-red-600 text-white'
                      : 'text-stone-500 hover:text-stone-800 dark:text-stone-400'
                  }`}
                >
                  58mm (Kecil)
                </button>
                <button
                  type="button"
                  onClick={() => setPaperWidth('80mm')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                    paperWidth === '80mm'
                      ? 'bg-red-600 text-white'
                      : 'text-stone-500 hover:text-stone-800 dark:text-stone-400'
                  }`}
                >
                  80mm (Standar)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live Preview Paper Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-100 dark:bg-[#140605] flex justify-center">
          <div
            className={`bg-white text-black shadow-lg border border-stone-300 rounded-lg p-5 font-mono text-xs leading-relaxed select-text transition-all ${
              template === 'invoice'
                ? 'w-full max-w-xl text-[12px]'
                : paperWidth === '58mm'
                  ? 'w-[280px] text-[11px]'
                  : 'w-[360px] text-[12px]'
            }`}
            style={{
              fontFamily:
                "'Courier New', Courier, Consolas, Monaco, monospace, sans-serif",
            }}
          >
            {/* Live Paper Preview Render */}
            {template === 'kitchen' ? (
              <div className="space-y-3">
                <div className="text-center font-bold">
                  <p className="text-sm font-extrabold tracking-wider">
                    *** TIKET KERJA DAPUR ***
                  </p>
                  <p className="text-xs">PAWON HARA CATERING</p>
                </div>
                <div className="border-t-2 border-dashed border-black" />

                <div className="border border-black p-2.5 text-center bg-stone-50">
                  <p className="text-[10px] font-bold uppercase">Waktu Pengantaran:</p>
                  <p className="font-extrabold text-sm mt-0.5">
                    {formatDateIndo(order.event_date)}
                  </p>
                  <p className="font-black text-base text-red-600">
                    PUKUL {order.event_time ? `${order.event_time} WIB` : 'JAM BELUM DIATUR'}
                  </p>
                </div>

                <div className="text-[11px] space-y-0.5">
                  <p>
                    <strong>Order:</strong> {order.order_code}
                  </p>
                  <p>
                    <strong>Pemesan:</strong> {order.customers_name} ({order.customers_phone})
                  </p>
                  <p>
                    <strong>Alamat:</strong> {order.delivery_address}
                  </p>
                </div>

                <div className="border-t-2 border-dashed border-black" />
                <p className="font-extrabold text-xs tracking-wider">
                  MENU YANG HARUS DISIAPKAN:
                </p>

                <div className="space-y-3">
                  {(order.items || []).map((item, idx) => (
                    <div key={idx} className="border-b border-dashed border-stone-300 pb-2">
                      <div className="flex items-start gap-2">
                        <span className="font-bold">[  ]</span>
                        <div>
                          <p className="font-extrabold text-sm leading-tight">
                            {item.quantity}x {item.item_name}
                          </p>
                          {item.addons && item.addons.length > 0 && (
                            <div className="mt-1 pl-2 text-[11px] space-y-0.5">
                              {item.addons.map((a, aIdx) => (
                                <p key={aIdx}>
                                  - [ ] {a.addon_name} ({item.quantity}x)
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border border-dashed border-black p-2 text-[11px] bg-stone-50">
                  <p className="font-bold">CATATAN KHUSUS:</p>
                  <p className="italic mt-0.5">{order.notes || 'Tidak ada catatan.'}</p>
                </div>

                <div className="border-t-2 border-dashed border-black" />
                <div className="flex justify-between text-[10px] text-center pt-2">
                  <div className="w-[45%]">
                    <p>Disiapkan (Dapur)</p>
                    <div className="h-8" />
                    <p>( .................... )</p>
                  </div>
                  <div className="w-[45%]">
                    <p>Dicek (QC / Packing)</p>
                    <div className="h-8" />
                    <p>( .................... )</p>
                  </div>
                </div>
              </div>
            ) : template === 'invoice' ? (
              <div className="space-y-4">
                <div className="flex justify-between items-start border-b-2 border-black pb-3">
                  <div>
                    <h4 className="text-xl font-black tracking-tight">PAWON HARA</h4>
                    <p className="text-[11px] text-stone-600">Nasi Box & Katering Yogyakarta</p>
                    <p className="text-[10px] text-stone-600">WA: 0896-6974-3193 | @pawonhara</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black uppercase">INVOICE PESANAN</p>
                    <p className="text-xs font-bold font-mono">#{order.order_code}</p>
                    <p className="text-[10px] text-stone-500">{formatShortDate(order.created_at)}</p>
                  </div>
                </div>

                <div className="flex justify-between text-xs">
                  <div>
                    <p className="text-[10px] font-bold text-stone-500 uppercase">PEMESAN:</p>
                    <p className="font-bold">{order.customers_name}</p>
                    <p>{order.customers_phone}</p>
                    <p className="max-w-[200px] text-[11px]">{order.delivery_address}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-stone-500 uppercase">WAKTU ACARA:</p>
                    <p className="font-bold">{formatDateIndo(order.event_date)}</p>
                    <p>Jam: {order.event_time ? `${order.event_time} WIB` : 'Fleksibel'}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 border border-black rounded text-[10px] font-bold">
                      {paymentStatusText}
                    </span>
                  </div>
                </div>

                <table className="w-full text-left text-xs border-y-2 border-black">
                  <thead>
                    <tr className="border-b border-stone-300 bg-stone-100">
                      <th className="py-1 px-1">MENU & ADDON</th>
                      <th className="py-1 text-center">QTY</th>
                      <th className="py-1 text-right">HARGA</th>
                      <th className="py-1 text-right">SUBTOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order.items || []).map((item, idx) => (
                      <tr key={idx} className="border-b border-stone-200">
                        <td className="py-1.5 px-1">
                          <p className="font-bold">{item.item_name}</p>
                          {item.addons && item.addons.length > 0 && (
                            <p className="text-[10px] text-stone-600">
                              + {item.addons.map((a) => a.addon_name).join(', ')}
                            </p>
                          )}
                        </td>
                        <td className="py-1.5 text-center font-bold">{item.quantity}</td>
                        <td className="py-1.5 text-right font-mono">
                          {formatRupiah(item.price)}
                        </td>
                        <td className="py-1.5 text-right font-mono font-bold">
                          {formatRupiah(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-between items-start text-xs pt-1">
                  <div className="w-1/2 text-[11px]">
                    <p className="font-bold">Catatan:</p>
                    <p className="italic text-stone-600">{order.notes || '-'}</p>
                  </div>
                  <div className="w-1/2 space-y-1 text-right">
                    <div className="flex justify-between">
                      <span>Subtotal Menu:</span>
                      <span className="font-mono">{formatRupiah(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ongkir:</span>
                      <span className="font-mono">{formatRupiah(deliveryFee)}</span>
                    </div>
                    <div className="flex justify-between font-black text-sm border-t border-black pt-1">
                      <span>TOTAL:</span>
                      <span className="font-mono">{formatRupiah(total)}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>Sudah Dibayar:</span>
                      <span className="font-mono font-bold">{formatRupiah(paidAmount)}</span>
                    </div>
                    {remaining > 0 && (
                      <div className="flex justify-between font-bold text-red-600">
                        <span>Sisa Tagihan:</span>
                        <span className="font-mono">{formatRupiah(remaining)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // THERMAL RECEIPT PREVIEW (58mm / 80mm)
              <div className="space-y-2">
                <div className="text-center font-bold">
                  <p className="text-sm font-extrabold tracking-wide">PAWON HARA</p>
                  <p className="text-[10px]">Nasi Box & Katering Yogyakarta</p>
                  <p className="text-[10px]">WA: 0896-6974-3193</p>
                </div>
                <div className="border-t-2 border-dashed border-black" />

                <div className="space-y-0.5 text-[11px]">
                  <div className="flex justify-between">
                    <span>No. Nota:</span>
                    <span className="font-bold">{order.order_code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tgl Order:</span>
                    <span>{formatShortDate(order.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pemesan:</span>
                    <span className="font-bold">{order.customers_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>WhatsApp:</span>
                    <span>{order.customers_phone}</span>
                  </div>
                </div>

                <div className="border border-black p-1.5 text-center bg-stone-50 text-[10px]">
                  <p className="font-bold uppercase text-[9px]">Jadwal Acara:</p>
                  <p className="font-black text-xs">
                    {formatShortDate(order.event_date)} (
                    {order.event_time ? `${order.event_time} WIB` : 'Siang'})
                  </p>
                </div>

                <div className="border-t border-dashed border-black" />
                <p className="font-bold text-[10px] uppercase">Rincian Menu:</p>

                <div className="space-y-1.5">
                  {(order.items || []).map((item, idx) => (
                    <div key={idx} className="text-[11px]">
                      <p className="font-bold">{item.item_name}</p>
                      <div className="flex justify-between text-[10px]">
                        <span>
                          {item.quantity} x @{formatRupiah(item.price)}
                        </span>
                        <span className="font-bold">{formatRupiah(item.subtotal)}</span>
                      </div>
                      {item.addons && item.addons.length > 0 && (
                        <div className="pl-1 text-[9px] text-stone-700">
                          {item.addons.map((a, aIdx) => (
                            <p key={aIdx}>
                              + {a.addon_name} (+{formatRupiah(a.price)})
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="border-t border-dashed border-black" />
                <div className="space-y-0.5 text-[11px]">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatRupiah(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ongkir:</span>
                    <span>{formatRupiah(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between font-black text-xs border-t border-black pt-1">
                    <span>TOTAL:</span>
                    <span>{formatRupiah(total)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span>Status:</span>
                    <span className="font-bold">{paymentStatusText}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dibayar:</span>
                    <span>{formatRupiah(paidAmount)}</span>
                  </div>
                  {remaining > 0 && (
                    <div className="flex justify-between font-bold">
                      <span>Sisa:</span>
                      <span>{formatRupiah(remaining)}</span>
                    </div>
                  )}
                </div>

                {order.notes && (
                  <div className="border-t border-dashed border-black pt-1 text-[9px]">
                    <span className="font-bold">Ket: </span>
                    <span className="italic">{order.notes}</span>
                  </div>
                )}

                <div className="border-t-2 border-dashed border-black pt-2 text-center text-[9px]">
                  <p>Terima kasih atas pesanan Anda!</p>
                  <p>Pawon Hara - Dari Pawon Ke Meja Anda</p>
                  <p>IG: @pawonhara</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-stone-200 dark:border-[#60241E]/80 shrink-0">
          <div className="text-xs text-stone-400">
            {template === 'thermal'
              ? `Format Struk Kasir (${paperWidth}) • Font Monospace Jelas & Rapi`
              : template === 'kitchen'
                ? 'Format Tiket Dapur • Dilengkapi Checkbox Porsi & Addon'
                : 'Format Invoice Resmi • Ukuran A4 dengan Tanda Tangan'}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleCopyText}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                isDark
                  ? 'border-[#60241E] bg-[#240E0C] text-stone-300 hover:text-white hover:bg-[#2D120F]'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
              }`}
              title="Salin teks struk untuk aplikasi printer bluetooth HP / WA"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span>{copied ? 'Tersalin!' : 'Salin Teks Struk'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white text-xs font-bold shadow-md shadow-red-950/20 transition active:scale-95 cursor-pointer"
            >
              <Printer size={15} />
              <span>Cetak Sekarang (Print)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
