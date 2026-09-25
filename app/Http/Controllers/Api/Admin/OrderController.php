<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAdminOrderRequest;
use App\Http\Requests\UpdateOrderPaymentRequest;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Models\Order;
use App\Services\KitchenCapacityService;
use App\Services\OrderService;
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
                $request->validated()
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
            ->with(['items.product', 'items.addons', 'addons.addon'])
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
     * Display the specified order.
     */
    public function show(Order $order): JsonResponse
    {
        $order->load([
            'items.product',
            'items.addons',
            'addons.addon',
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

        $order->update([
            'status' => $newStatus,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Order status updated successfully',
            'data' => $order->fresh(['items.product', 'items.addons', 'addons.addon']),
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

        return response()->json([
            'success' => true,
            'message' => 'Catatan pembayaran berhasil diperbarui',
            'data' => $order->fresh(['items.product', 'items.addons', 'addons.addon']),
        ]);
    }
}
