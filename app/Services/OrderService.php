<?php

namespace App\Services;

use App\Models\Addon;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class OrderService
{
    public function createOrder(array $data): Order
    {
        return DB::transaction(function () use ($data) {
            $items = collect($data['items']);

            $productIds = $items
                ->pluck('product_id')
                ->unique();

            $products = Product::query()
                ->where('is_active', true)
                ->whereIn('id', $productIds)
                ->get()
                ->keyBy('id');

            if ($products->count() !== $productIds->count()) {
                throw new RuntimeException(
                    'One or more products are unavailable.'
                );
            }

            $addons = collect();

            if (! empty($data['addons'])) {
                $addonIds = collect($data['addons'])
                    ->pluck('addon_id')
                    ->unique();

                $addons = Addon::query()
                    ->where('is_active', true)
                    ->whereIn('id', $addonIds)
                    ->get()
                    ->keyBy('id');

                if ($addons->count() !== $addonIds->count()) {
                    throw new RuntimeException(
                        'One or more addons are unavailable.'
                    );
                }
            }

            $subtotal = 0;

            foreach ($items as $item) {
                $product = $products->get($item['product_id']);

                if ($item['quantity'] < $product->minimum_order) {
                    throw new RuntimeException(
                        "Minimum order for {$product->name} is {$product->minimum_order}."
                    );
                }

                $subtotal += $product->price * $item['quantity'];
            }

            foreach ($data['addons'] ?? [] as $addonItem) {
                $addon = $addons->get($addonItem['addon_id']);

                $subtotal += $addon->price * $addonItem['quantity'];
            }

            $deliveryFee = 10000;

            $total = $subtotal + $deliveryFee;

            $order = Order::create([
                'order_code' => $this->generateOrderCode(),

                'customers_name' => $data['customers_name'],
                'customers_phone' => $data['customers_phone'],

                'event_date' => $data['event_date'],
                'event_time' => $data['event_time'] ?? null,

                'delivery_address' => $data['delivery_address'],
                'notes' => $data['notes'] ?? null,

                'subtotal' => $subtotal,
                'delivery_fee' => $deliveryFee,
                'total' => $total,

                'status' => 'pending',
            ]);

            foreach ($items as $item) {
                $product = $products->get($item['product_id']);

                $order->items()->create([
                    'product_id' => $product->id,
                    'item_name' => $product->name,
                    'price' => $product->price,
                    'quantity' => $item['quantity'],
                    'subtotal' => $product->price * $item['quantity'],
                ]);
            }

            foreach ($data['addons'] ?? [] as $addonItem) {
                $addon = $addons->get($addonItem['addon_id']);

                $order->addons()->create([
                    'addon_id' => $addon->id,
                    'addon_name' => $addon->name,
                    'price' => $addon->price,
                    'quantity' => $addonItem['quantity'],
                    'subtotal' => $addon->price * $addonItem['quantity'],
                ]);
            }

            $order->load([
                'items.product',
                'addons.addon',
            ]);

            return $order;
        });
    }

    private function generateOrderCode(): string
    {
        do {
            $code = 'HB-'.now()->format('Ymd').'-'.strtoupper(
                Str::random(6)
            );
        } while (
            Order::where('order_code', $code)->exists()
        );

        return $code;
    }
}
