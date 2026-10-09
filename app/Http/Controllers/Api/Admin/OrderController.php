<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAdminOrderRequest;
use App\Http\Requests\UpdateOrderPaymentRequest;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Models\Order;
use App\Services\ActivityLogger;
use App\Services\KitchenCapacityService;
use App\Services\OrderService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class OrderController extends Controller
{
    public function __construct(
        protected KitchenCapacityService $capacityService,
        protected OrderService $orderService
    ) {}

    /**
     * Store a new manual order created by admin.
     */
    public function store(StoreAdminOrderRequest $request): JsonResponse
    {
        try {
            $order = $this->orderService->createOrder(
                $request->validated(),
                isAdmin: true
            );

            ActivityLogger::log(
                action: 'create',
                subjectType: 'order',
                description: "Membuat pesanan manual #{$order->order_code} untuk pelanggan '{$order->customers_name}'",
                subjectName: $order->order_code,
                subjectId: $order->id
            );

            return response()->json([
                'success' => true,
                'message' => 'Pesanan manual berhasil dibuat',
                'data' => $order->load(['items.product', 'items.addons', 'addons.addon']),
            ], 201);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Display a listing of orders.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min(
            $request->integer('per_page', 10),
            50
        );

        $query = Order::query()
            ->with(['items.product', 'items.addons', 'addons.addon', 'paymentProofs'])
            ->latest();

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($paymentStatus = $request->query('payment_status')) {
            $query->where('payment_status', $paymentStatus);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('order_code', 'like', "%{$search}%")
                    ->orWhere('customers_name', 'like', "%{$search}%")
                    ->orWhere('customers_phone', 'like', "%{$search}%");
            });
        }

        $orders = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Orders retrieved successfully',
            'data' => $orders,
        ]);
    }

    /**
     * Get calendar order tracking data grouped by date for a given month.
     */
    public function calendar(Request $request): JsonResponse
    {
        $month = $request->query('month'); // Format: YYYY-MM
        if (! $month || ! preg_match('/^\d{4}-\d{2}$/', $month)) {
            $month = now()->format('Y-m');
        }

        $startDate = Carbon::createFromFormat('Y-m', $month)->startOfMonth()->format('Y-m-d');
        $endDate = Carbon::createFromFormat('Y-m', $month)->endOfMonth()->format('Y-m-d');

        $orders = Order::query()
            ->with(['items.product', 'items.addons', 'addons.addon'])
            ->whereBetween('event_date', [$startDate, $endDate])
            ->orderBy('event_date', 'asc')
            ->orderBy('event_time', 'asc')
            ->get();

        $grouped = [];
        $monthlyPortions = 0;
        $monthlyRevenue = 0;
        $allSoldItems = [];

        foreach ($orders as $order) {
            $dateKey = $order->event_date instanceof \DateTimeInterface
                ? $order->event_date->format('Y-m-d')
                : Carbon::parse($order->event_date)->format('Y-m-d');

            if (! isset($grouped[$dateKey])) {
                $grouped[$dateKey] = [
                    'date' => $dateKey,
                    'orders' => [],
                    'order_count' => 0,
                    'total_portions' => 0,
                    'total_revenue' => 0,
                    'items_breakdown' => [],
                    'max_capacity' => $this->capacityService->getMaxCapacity($dateKey),
                    'is_closed' => $this->capacityService->isDateClosed($dateKey),
                    'status_counts' => [
                        'pending' => 0,
                        'confirmed' => 0,
                        'processing' => 0,
                        'completed' => 0,
                        'cancelled' => 0,
                    ],
                ];
            }

            $orderData = $order->toArray();
            $orderPortions = (int) $order->items->sum('quantity');
            $orderData['total_portions'] = $orderPortions;
            $grouped[$dateKey]['orders'][] = $orderData;
            $grouped[$dateKey]['order_count']++;

            $status = $order->status ?? 'pending';
            if (isset($grouped[$dateKey]['status_counts'][$status])) {
                $grouped[$dateKey]['status_counts'][$status]++;
            }

            if ($status !== 'cancelled') {
                $grouped[$dateKey]['total_portions'] += $orderPortions;
                $grouped[$dateKey]['total_revenue'] += (float) $order->total;
                $monthlyPortions += $orderPortions;
                $monthlyRevenue += (float) $order->total;

                foreach ($order->items as $item) {
                    $itemName = $item->item_name ?: ($item->product?->name ?? 'Menu Katering');
                    if (! isset($grouped[$dateKey]['items_breakdown'][$itemName])) {
                        $grouped[$dateKey]['items_breakdown'][$itemName] = [
                            'name' => $itemName,
                            'quantity' => 0,
                            'subtotal' => 0,
                        ];
                    }
                    $grouped[$dateKey]['items_breakdown'][$itemName]['quantity'] += (int) $item->quantity;
                    $grouped[$dateKey]['items_breakdown'][$itemName]['subtotal'] += (float) $item->subtotal;

                    if (! isset($allSoldItems[$itemName])) {
                        $allSoldItems[$itemName] = [
                            'name' => $itemName,
                            'quantity' => 0,
                            'subtotal' => 0,
                        ];
                    }
                    $allSoldItems[$itemName]['quantity'] += (int) $item->quantity;
                    $allSoldItems[$itemName]['subtotal'] += (float) $item->subtotal;
                }
            }
        }

        foreach ($grouped as &$dayData) {
            $dayData['items_breakdown'] = array_values($dayData['items_breakdown']);
        }
        unset($dayData);

        usort($allSoldItems, fn ($a, $b) => $b['quantity'] <=> $a['quantity']);

        return response()->json([
            'success' => true,
            'data' => [
                'month' => $month,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'days' => $grouped,
                'monthly_summary' => [
                    'total_orders' => $orders->count(),
                    'active_orders' => $orders->where('status', '!=', 'cancelled')->count(),
                    'total_portions' => $monthlyPortions,
                    'total_revenue' => $monthlyRevenue,
                    'top_sold_items' => array_slice(array_values($allSoldItems), 0, 5),
                ],
            ],
        ]);
    }

    /**
     * Display the specified order.
     */
    public function show(Order $order): JsonResponse
    {
        $order->load([
            'items.product',
            'items.addons',
            'addons.addon',
            'paymentProofs',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Order retrieved successfully',
            'data' => $order,
        ]);
    }

    /**
     * Update order status.
     */
    public function updateStatus(
        UpdateOrderStatusRequest $request,
        Order $order
    ): JsonResponse {
        $newStatus = $request->validated('status');
        $isAlreadyCounted = in_array($order->status, ['processing', 'completed']);
        $willBeCounted = in_array($newStatus, ['processing', 'completed']);

        // If transitioning from non-counted (e.g. pending/confirmed/cancelled) to counted (processing/completed)
        if (! $isAlreadyCounted && $willBeCounted) {
            $orderPortions = (int) $order->items()->sum('quantity');
            $remaining = $this->capacityService->getRemainingCapacity($order->event_date);

            if ($orderPortions > $remaining && ! $request->boolean('force')) {
                return response()->json([
                    'success' => false,
                    'requires_confirmation' => true,
                    'message' => "Kapasitas dapur untuk tanggal {$order->event_date->format('d/m/Y')} tidak mencukupi (sisa slot: {$remaining} box, pesanan ini: {$orderPortions} box). Tetap lanjutkan?",
                    'data' => [
                        'event_date' => $order->event_date->format('Y-m-d'),
                        'order_portions' => $orderPortions,
                        'remaining_capacity' => $remaining,
                        'max_capacity' => $this->capacityService->getMaxCapacity($order->event_date),
                        'booked_portions' => $this->capacityService->getBookedPortions($order->event_date),
                    ],
                ], 422);
            }
        }

        $oldStatus = $order->status;
        $order->update([
            'status' => $newStatus,
        ]);

        ActivityLogger::log(
            action: 'status_change',
            subjectType: 'order',
            description: "Mengubah status pesanan #{$order->order_code} dari '{$oldStatus}' menjadi '{$newStatus}'",
            subjectName: $order->order_code,
            subjectId: $order->id,
            properties: ['old_status' => $oldStatus, 'new_status' => $newStatus]
        );

        return response()->json([
            'success' => true,
            'message' => 'Order status updated successfully',
            'data' => $order->fresh(['items.product', 'items.addons', 'addons.addon', 'paymentProofs']),
        ]);
    }

    /**
     * Update order payment status and financial details.
     */
    public function updatePayment(
        UpdateOrderPaymentRequest $request,
        Order $order
    ): JsonResponse {
        $validated = $request->validated();

        // If marked as 'paid' and paid_amount is not set or 0, auto-fill with total
        if ($validated['payment_status'] === 'paid' && (! isset($validated['paid_amount']) || $validated['paid_amount'] <= 0)) {
            $validated['paid_amount'] = $order->total;
        }

        // If marked as 'unpaid', reset paid_amount to 0
        if ($validated['payment_status'] === 'unpaid') {
            $validated['paid_amount'] = 0;
        }

        // Set paid_at timestamp
        if ($validated['payment_status'] !== 'unpaid' && empty($validated['paid_at'])) {
            $validated['paid_at'] = now();
        } elseif ($validated['payment_status'] === 'unpaid') {
            $validated['paid_at'] = null;
        }

        $order->update($validated);

        ActivityLogger::log(
            action: 'payment_update',
            subjectType: 'order',
            description: "Memperbarui status pembayaran pesanan #{$order->order_code} menjadi '{$validated['payment_status']}'",
            subjectName: $order->order_code,
            subjectId: $order->id,
            properties: ['payment_status' => $validated['payment_status']]
        );

        return response()->json([
            'success' => true,
            'message' => 'Catatan pembayaran berhasil diperbarui',
            'data' => $order->fresh(['items.product', 'items.addons', 'addons.addon', 'paymentProofs']),
        ]);
    }
}
