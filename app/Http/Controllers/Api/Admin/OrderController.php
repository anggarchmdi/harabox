<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateOrderPaymentRequest;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
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
        $order->update([
            'status' => $request->validated('status'),
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
