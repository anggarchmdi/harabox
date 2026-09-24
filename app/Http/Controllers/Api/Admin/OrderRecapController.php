<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class OrderRecapController extends Controller
{
    /**
     * Indonesian month names mapping.
     *
     * @var array<int, string>
     */
    protected const MONTH_NAMES = [
        1 => 'Januari',
        2 => 'Februari',
        3 => 'Maret',
        4 => 'April',
        5 => 'Mei',
        6 => 'Juni',
        7 => 'Juli',
        8 => 'Agustus',
        9 => 'September',
        10 => 'Oktober',
        11 => 'November',
        12 => 'Desember',
    ];

    /**
     * Indonesian order status translations.
     *
     * @var array<string, string>
     */
    protected const STATUS_LABELS = [
        'pending' => 'Menunggu Konfirmasi',
        'confirmed' => 'Dikonfirmasi',
        'processing' => 'Diproses Dapur',
        'completed' => 'Selesai',
        'cancelled' => 'Dibatalkan',
    ];

    /**
     * Indonesian payment status translations.
     *
     * @var array<string, string>
     */
    protected const PAYMENT_STATUS_LABELS = [
        'unpaid' => 'Belum Bayar',
        'dp' => 'DP Masuk',
        'paid' => 'Lunas',
    ];

    /**
     * Display a monthly / flexible date-range recap overview and paginated orders.
     */
    public function index(Request $request): JsonResponse
    {
        $year = $request->integer('year', (int) date('Y'));
        $monthInput = $request->query('month', (string) (int) date('m'));
        $month = $monthInput === 'all' ? 'all' : (int) $monthInput;
        $dateType = $request->query('date_type', 'event_date');
        if (! in_array($dateType, ['event_date', 'created_at'], true)) {
            $dateType = 'event_date';
        }

        $startDate = $request->query('start_date') ?: $request->query('date_from');
        $endDate = $request->query('end_date') ?: $request->query('date_to');

        $baseQuery = $this->buildFilterQuery($request, $year, $month, $dateType, $startDate, $endDate);

        $totalOrders = (clone $baseQuery)->count();

        $activeOrdersQuery = (clone $baseQuery)->where('status', '!=', 'cancelled');
        $totalRevenue = (float) $activeOrdersQuery->sum('total');
        $totalPaid = (float) $activeOrdersQuery->sum('paid_amount');
        $totalUnpaid = max(0.0, $totalRevenue - $totalPaid);

        $matchingOrderSubquery = (clone $baseQuery)->select('id');
        $totalPortions = (int) OrderItem::query()
            ->whereIn('order_id', $matchingOrderSubquery)
            ->sum('quantity');

        $statusCounts = (clone $baseQuery)
            ->select('status')
            ->selectRaw('count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $paymentStatusCounts = (clone $baseQuery)
            ->select('payment_status')
            ->selectRaw('count(*) as count')
            ->groupBy('payment_status')
            ->pluck('count', 'payment_status')
            ->toArray();

        $perPage = min($request->integer('per_page', 15), 100);
        $dateSortField = $dateType === 'created_at' ? 'created_at' : 'event_date';

        $orders = (clone $baseQuery)
            ->with(['items.addons', 'addons.addon'])
            ->orderBy($dateSortField, 'desc')
            ->paginate($perPage);

        $dateTypeLabel = $dateType === 'created_at' ? 'Tanggal Pesanan Masuk (Dibuat)' : 'Tanggal Acara (Event Date)';

        if ($startDate && $endDate) {
            $periodLabel = Carbon::parse($startDate)->format('d/m/Y').' - '.Carbon::parse($endDate)->format('d/m/Y');
        } elseif ($startDate) {
            $periodLabel = 'Mulai '.Carbon::parse($startDate)->format('d/m/Y');
        } elseif ($endDate) {
            $periodLabel = 'Sampai '.Carbon::parse($endDate)->format('d/m/Y');
        } else {
            $monthLabel = $month === 'all' ? 'Semua Bulan' : (self::MONTH_NAMES[$month] ?? "Bulan {$month}");
            $periodLabel = "{$monthLabel} {$year}";
        }

        return response()->json([
            'success' => true,
            'message' => 'Data rekapitulasi pesanan berhasil dimuat',
            'data' => [
                'summary' => [
                    'total_orders' => $totalOrders,
                    'total_portions' => $totalPortions,
                    'total_revenue' => $totalRevenue,
                    'total_paid' => $totalPaid,
                    'total_unpaid' => $totalUnpaid,
                    'status_counts' => $statusCounts,
                    'payment_status_counts' => $paymentStatusCounts,
                ],
                'filter_info' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'period_label' => $periodLabel,
                    'year' => $year,
                    'month' => $month,
                    'month_name' => $month === 'all' ? 'Semua Bulan' : (self::MONTH_NAMES[$month] ?? "Bulan {$month}"),
                    'date_type' => $dateType,
                    'date_type_label' => $dateTypeLabel,
                ],
                'orders' => $orders,
            ],
        ]);
    }

    /**
     * Export flexible date-range order recap as an Excel-compatible CSV with UTF-8 BOM.
     */
    public function export(Request $request): StreamedResponse
    {
        $year = $request->integer('year', (int) date('Y'));
        $monthInput = $request->query('month', (string) (int) date('m'));
        $month = $monthInput === 'all' ? 'all' : (int) $monthInput;
        $dateType = $request->query('date_type', 'event_date');
        if (! in_array($dateType, ['event_date', 'created_at'], true)) {
            $dateType = 'event_date';
        }

        $startDate = $request->query('start_date') ?: $request->query('date_from');
        $endDate = $request->query('end_date') ?: $request->query('date_to');

        $baseQuery = $this->buildFilterQuery($request, $year, $month, $dateType, $startDate, $endDate);
        $dateSortField = $dateType === 'created_at' ? 'created_at' : 'event_date';

        $dateTypeLabel = $dateType === 'created_at' ? 'Tanggal Pesanan Dibuat' : 'Tanggal Acara (Event Date)';

        if ($startDate && $endDate) {
            $startFormatted = Carbon::parse($startDate)->format('d/m/Y');
            $endFormatted = Carbon::parse($endDate)->format('d/m/Y');
            $periodLabel = "{$startFormatted} s/d {$endFormatted}";
            $periodSlug = Carbon::parse($startDate)->format('Ymd').'-sd-'.Carbon::parse($endDate)->format('Ymd');
        } elseif ($startDate) {
            $startFormatted = Carbon::parse($startDate)->format('d/m/Y');
            $periodLabel = "Mulai {$startFormatted}";
            $periodSlug = 'dari-'.Carbon::parse($startDate)->format('Ymd');
        } elseif ($endDate) {
            $endFormatted = Carbon::parse($endDate)->format('d/m/Y');
            $periodLabel = "Sampai {$endFormatted}";
            $periodSlug = 'sampai-'.Carbon::parse($endDate)->format('Ymd');
        } else {
            $monthLabel = $month === 'all' ? 'Semua Bulan' : (self::MONTH_NAMES[$month] ?? "Bulan {$month}");
            $periodLabel = "{$monthLabel} {$year}";
            $periodSlug = $month === 'all' ? "tahun-{$year}" : sprintf('%04d-%02d', $year, $month);
        }

        $fileName = "rekap-pesanan-harabox-{$periodSlug}.csv";

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () use ($baseQuery, $dateSortField, $periodLabel, $dateTypeLabel) {
            $handle = fopen('php://output', 'w');

            // Write UTF-8 BOM for Microsoft Excel compatibility
            fwrite($handle, "\xEF\xBB\xBF");

            // Report Header
            fputcsv($handle, ['REKAPITULASI PESANAN KATERING - HARABOX']);
            fputcsv($handle, ['Periode Tanggal', $periodLabel]);
            fputcsv($handle, ['Dasar Tanggal Filter', $dateTypeLabel]);
            fputcsv($handle, ['Waktu Unduh', Carbon::now()->translatedFormat('d F Y, H:i:s')]);
            fputcsv($handle, []);

            // Table Column Headers
            fputcsv($handle, [
                'No',
                'Kode Pesanan',
                'Tanggal Acara',
                'Waktu Acara',
                'Tanggal Dibuat',
                'Nama Pemesan',
                'Nomor WhatsApp',
                'Alamat Pengiriman',
                'Rincian Menu & Addon',
                'Total Porsi (Box)',
                'Catatan Khusus',
                'Subtotal (Rp)',
                'Ongkos Kirim (Rp)',
                'Total Tagihan (Rp)',
                'Status Pesanan',
                'Status Pembayaran',
                'Nominal Dibayar (Rp)',
                'Sisa Tagihan (Rp)',
                'Metode Pembayaran',
                'Catatan Pembayaran',
            ]);

            $rowNumber = 1;
            $grandPortions = 0;
            $grandSubtotal = 0.0;
            $grandDeliveryFee = 0.0;
            $grandTotal = 0.0;
            $grandPaid = 0.0;
            $grandUnpaid = 0.0;

            $orders = (clone $baseQuery)
                ->with(['items.addons', 'addons.addon'])
                ->orderBy($dateSortField, 'asc')
                ->cursor();

            foreach ($orders as $order) {
                $itemDescriptions = [];
                $orderPortions = 0;

                foreach ($order->items as $item) {
                    $orderPortions += (int) $item->quantity;
                    $itemText = "{$item->item_name} ({$item->quantity}x)";

                    if ($item->addons->isNotEmpty()) {
                        $addonNames = $item->addons->map(function ($a) {
                            return ($a->addon_group_name ? "{$a->addon_group_name}: " : '').$a->addon_name;
                        })->join(', ');
                        $itemText .= " [Addon: {$addonNames}]";
                    }

                    $itemDescriptions[] = $itemText;
                }

                if ($order->addons->isNotEmpty()) {
                    $orderAddons = $order->addons->map(function ($oa) {
                        return ($oa->addon->name ?? 'Addon')." ({$oa->quantity}x)";
                    })->join(', ');
                    $itemDescriptions[] = "[Addon Tambahan: {$orderAddons}]";
                }

                $menuText = implode(' | ', $itemDescriptions);
                $remainingPayment = max(0.0, (float) $order->total - (float) $order->paid_amount);

                if ($order->status !== 'cancelled') {
                    $grandPortions += $orderPortions;
                    $grandSubtotal += (float) $order->subtotal;
                    $grandDeliveryFee += (float) $order->delivery_fee;
                    $grandTotal += (float) $order->total;
                    $grandPaid += (float) $order->paid_amount;
                    $grandUnpaid += $remainingPayment;
                }

                $statusLabel = self::STATUS_LABELS[$order->status] ?? ucfirst($order->status);
                $paymentStatusLabel = self::PAYMENT_STATUS_LABELS[$order->payment_status] ?? ucfirst($order->payment_status);

                fputcsv($handle, [
                    $rowNumber++,
                    $order->order_code,
                    $order->event_date ? $order->event_date->format('d/m/Y') : '-',
                    $order->event_time ?? '-',
                    $order->created_at ? $order->created_at->format('d/m/Y H:i') : '-',
                    $order->customers_name,
                    "'".$order->customers_phone,
                    $order->delivery_address,
                    $menuText,
                    $orderPortions,
                    $order->notes ?? '-',
                    (float) $order->subtotal,
                    (float) $order->delivery_fee,
                    (float) $order->total,
                    $statusLabel,
                    $paymentStatusLabel,
                    (float) $order->paid_amount,
                    $remainingPayment,
                    $order->payment_method ?? '-',
                    $order->payment_note ?? '-',
                ]);
            }

            // Summary Totals Row (excluding cancelled orders)
            fputcsv($handle, []);
            fputcsv($handle, [
                'TOTAL (Tidak termasuk dibatalkan)',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                $grandPortions,
                '',
                $grandSubtotal,
                $grandDeliveryFee,
                $grandTotal,
                '',
                '',
                $grandPaid,
                $grandUnpaid,
                '',
                '',
            ]);

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Build the filtered Eloquent query based on request parameters.
     */
    protected function buildFilterQuery(
        Request $request,
        int $year,
        int|string $month,
        string $dateType,
        ?string $startDate = null,
        ?string $endDate = null
    ): Builder {
        $dateColumn = $dateType === 'created_at' ? 'created_at' : 'event_date';

        $query = Order::query();

        if ($startDate && $endDate) {
            $query->whereDate($dateColumn, '>=', $startDate)
                ->whereDate($dateColumn, '<=', $endDate);
        } elseif ($startDate) {
            $query->whereDate($dateColumn, '>=', $startDate);
        } elseif ($endDate) {
            $query->whereDate($dateColumn, '<=', $endDate);
        } else {
            $query->whereYear($dateColumn, $year);

            if ($month !== 'all') {
                $query->whereMonth($dateColumn, (int) $month);
            }
        }

        if ($status = $request->query('status')) {
            if ($status !== 'all') {
                $query->where('status', $status);
            }
        }

        if ($paymentStatus = $request->query('payment_status')) {
            if ($paymentStatus !== 'all') {
                $query->where('payment_status', $paymentStatus);
            }
        }

        if ($search = $request->query('search')) {
            $trimmed = trim($search);
            $query->where(function (Builder $q) use ($trimmed) {
                $q->where('order_code', 'like', "%{$trimmed}%")
                    ->orWhere('customers_name', 'like', "%{$trimmed}%")
                    ->orWhere('customers_phone', 'like', "%{$trimmed}%");
            });
        }

        return $query;
    }
}
