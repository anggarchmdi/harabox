<?php

namespace App\Services;

use App\Models\Addon;
use App\Models\Order;
use App\Models\Package;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class OrderService
{
    public function createOrder(array $data): Order
    {
        return DB::transaction(function () use ($data) {

            $packages = Package::query()
                ->where('is_active', true)
                ->whereIn(
                    'id',
                    collect($data['items'])
                        ->pluck('package_id')
                        ->unique()
                )
                ->get()
                ->keyBy('id');

            if ($packages->count() !== collect($data['items'])
                ->pluck('package_id')
                ->unique()
                ->count()) {
                throw new RuntimeException(
                    'One or more packages are unavailable.'
                );
            }

            $addons = collect();

            if (!empty($data['addons'])) {
                $addons = Addon::query()
                    ->where('is_active', true)
                    ->whereIn(
                        'id',
                        collect($data['addons'])
                            ->pluck('addon_id')
                            ->unique()
                    )
                    ->get()
                    ->keyBy('id');

                if ($addons->count() !== collect($data['addons'])
                    ->pluck('addon_id')
                    ->unique()
                    ->count()) {
                    throw new RuntimeException(
                        'One or more addons are unavailable.'
                    );
                }
            }

            $subtotal = 0;

            foreach ($data['items'] as $item) {
                $package = $packages->get($item['package_id']);

                if ($item['quantity'] < $package->minimum_order) {
                    throw new RuntimeException(
                        "Minimum order for {$package->name} is {$package->minimum_order}."
                    );
                }

                $subtotal += $package->price * $item['quantity'];
            }

            foreach ($data['addons'] ?? [] as $addonItem) {
                $addon = $addons->get($addonItem['addon_id']);

                $subtotal += $addon->price * $addonItem['quantity'];
            }

            // $deliveryFee = $data['delivery_fee'] ?? 0;
            $deliveryFee = 10000;

            $total = $subtotal + $deliveryFee;

            $accessToken = Str::random(64);

            $order = Order::create([
                'order_code' => $this->generateOrderCode(),
                'access_token_hash' => hash('sha256', $accessToken),
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

            foreach ($data['items'] as $item) {
                $package = $packages->get($item['package_id']);

                $order->items()->create([
                    'package_id' => $package->id,
                    'item_name' => $package->name,
                    'price' => $package->price,
                    'quantity' => $item['quantity'],
                    'subtotal' => $package->price * $item['quantity'],
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
                'items',
                'addons',
            ]);

            $order->access_token = $accessToken;
            return $order;
        });
    }

    private function generateOrderCode(): string
    {
        do {
            $code = 'HB-' . now()->format('Ymd') . '-' . strtoupper(
                Str::random(6)
            );
        } while (
            Order::where('order_code', $code)->exists()
        );

        return $code;
    }
}
