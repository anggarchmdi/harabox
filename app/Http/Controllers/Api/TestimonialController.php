<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTestimonialRequest;
use App\Models\Order;
use App\Models\Testimonial;
use Illuminate\Http\JsonResponse;

class TestimonialController extends Controller
{
    /**
     * Display a listing of displayed testimonials for homepage.
     */
    public function index(): JsonResponse
    {
        $testimonials = Testimonial::query()
            ->with(['order.items.product'])
            ->displayed()
            ->latest()
            ->get();

        $data = $testimonials->map(function ($testimonial) {
            $orderedItems = [];
            if ($testimonial->order && $testimonial->order->items->isNotEmpty()) {
                $orderedItems = $testimonial->order->items->map(fn ($item) => [
                    'name' => $item->item_name,
                    'quantity' => (int) $item->quantity,
                    'price' => (float) $item->price,
                    'image' => $item->product?->image,
                ])->values()->all();
            }

            return [
                'id' => $testimonial->id,
                'name' => $testimonial->name,
                'institution' => $testimonial->institution,
                'rating' => $testimonial->rating,
                'order_quantity' => $testimonial->order_quantity,
                'message' => $testimonial->message,
                'order_code' => $testimonial->order_code,
                'ordered_items' => $orderedItems,
                'created_at' => $testimonial->created_at,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Testimonials retrieved successfully',
            'data' => $data,
        ]);
    }

    /**
     * Check if a testimonial already exists for an order and return order details.
     */
    public function checkByOrder(string $orderCode): JsonResponse
    {
        $testimonial = Testimonial::where('order_code', $orderCode)->first();
        $order = Order::with('items.product')->where('order_code', $orderCode)->first();

        return response()->json([
            'success' => true,
            'has_reviewed' => (bool) $testimonial,
            'data' => $testimonial,
            'order' => $order ? [
                'order_code' => $order->order_code,
                'customers_name' => $order->customers_name,
                'status' => $order->status,
                'total_quantity' => (int) $order->items->sum('quantity'),
                'items' => $order->items->map(fn ($item) => [
                    'id' => $item->id,
                    'item_name' => $item->item_name,
                    'quantity' => (int) $item->quantity,
                    'price' => (float) $item->price,
                    'product_image' => $item->product?->image,
                    'product_name' => $item->product?->name ?? $item->item_name,
                ]),
            ] : null,
        ]);
    }

    /**
     * Store a newly created testimonial submitted by customer.
     */
    public function store(StoreTestimonialRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Auto-fill and verify from Order if order_code provided
        if (! empty($data['order_code'])) {
            $existing = Testimonial::where('order_code', $data['order_code'])->first();
            if ($existing) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ulasan untuk pesanan ini sudah pernah dikirim sebelumnya. Terima kasih!',
                    'data' => $existing,
                ], 422);
            }

            $order = Order::with('items')->where('order_code', $data['order_code'])->first();
            if ($order) {
                if ($order->status === 'cancelled') {
                    return response()->json([
                        'success' => false,
                        'message' => 'Pesanan yang telah dibatalkan tidak dapat diberikan ulasan.',
                    ], 422);
                }

                // Always use the real verified customer name and portion from the order
                $data['name'] = $order->customers_name;
                $totalQty = (int) $order->items->sum('quantity');
                $data['order_quantity'] = $totalQty > 0 ? "{$totalQty} Box" : ($data['order_quantity'] ?? 'Nasi Box');
            }
        }

        // Ensure new submissions are displayed by default or use provided
        $data['is_displayed'] = $data['is_displayed'] ?? true;

        $testimonial = Testimonial::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Terima kasih! Ulasan Anda berhasil dikirim.',
            'data' => $testimonial,
        ], 201);
    }
}
