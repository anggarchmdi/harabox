<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class OrderController extends Controller
{
    public function __construct(
        private readonly OrderService $orderService
    ) {}

    public function store(StoreOrderRequest $request): JsonResponse
    {
        try {
            $order = $this->orderService->createOrder(
                $request->validated()
            );

            return response()->json([
                'success' => true,
                'message' => 'Order berhasil',
                'data' => [
                    'order_code' => $order->order_code,
                ],
            ], 201);

        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function show(
        Request $request,
        string $orderCode
    ): JsonResponse {
        $token = $request->query('access_token');

        if (! $token) {
            return response()->json([
                'success' => false,
                'message' => 'Access token is required.',
            ], 401);
        }

        $order = Order::with([
            'items',
            'addons',
        ])
            ->where('order_code', $orderCode)
            ->first();

        if (! $order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found.',
            ], 404);
        }

        if (
            ! $order->access_token_hash ||
            ! hash_equals(
                $order->access_token_hash,
                hash('sha256', $token)
            )
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid access token.',
            ], 401);
        }

        return response()->json([
            'success' => true,
            'message' => 'Order retrieved successfully',
            'data' => $order,
        ]);
    }

    public function confirm(
        Request $request,
        string $orderCode
    ): JsonResponse {
        $token = $request->input('access_token');

        if (! $token) {
            return response()->json([
                'success' => false,
                'message' => 'Access token is required.',
            ], 401);
        }

        $order = Order::where(
            'order_code',
            $orderCode
        )->first();

        if (! $order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found.',
            ], 404);
        }

        if (
            ! $order->access_token_hash ||
            ! hash_equals(
                $order->access_token_hash,
                hash('sha256', $token)
            )
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid access token.',
            ], 401);
        }

        if ($order->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Order cannot be confirmed.',
            ], 422);
        }

        $order->update([
            'status' => 'confirmed',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Order confirmed successfully',
            'data' => [
                'order_code' => $order->order_code,
                'status' => $order->status,
            ],
        ]);
    }
}
