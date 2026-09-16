<?php

namespace App\Services;

use App\Models\Addon;
use App\Models\Order;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class OrderService
{
    public function __construct(
        protected KitchenCapacityService $capacityService
    ) {}

    public function createOrder(array $data): Order
    {
        return DB::transaction(function () use ($data) {
            $items = collect($data['items']);

            // Validate kitchen capacity for event_date
            if ($this->capacityService->isDateClosed($data['event_date'])) {
                throw new RuntimeException('Dapur libur dan tidak menerima pesanan pada tanggal tersebut.');
            }

            $totalPortions = (int) $items->sum('quantity');
            $remaining = $this->capacityService->getRemainingCapacity($data['event_date']);

            if ($totalPortions > $remaining) {
                if ($remaining <= 0) {
                    throw new RuntimeException('Kapasitas dapur untuk tanggal tersebut sudah penuh.');
                }
                throw new RuntimeException("Kapasitas dapur untuk tanggal tersebut tersisa {$remaining} box (pesanan Anda: {$totalPortions} box).");
            }

            $productIds = $items
                ->pluck('product_id')
                ->unique();

            $products = Product::query()
                ->with([
                    'addonGroups' => function ($q) {
                        $q->where('addon_groups.is_active', true)
                            ->with([
                                'addons' => function ($aq) {
                                    $aq->where('is_active', true);
                                },
                            ]);
                    },
                ])
                ->where('is_active', true)
                ->whereIn('id', $productIds)
                ->get()
                ->keyBy('id');

            if ($products->count() !== $productIds->count()) {
                throw new RuntimeException(
                    'One or more products are unavailable.'
                );
            }

            $subtotal = 0;
            $itemsCalculated = [];

            foreach ($items as $item) {
                $product = $products->get($item['product_id']);

                if ($item['quantity'] < $product->minimum_order) {
                    throw new RuntimeException(
                        "Minimum order for {$product->name} is {$product->minimum_order}."
                    );
                }

                if (($product->lead_time_days ?? 0) > 0) {
                    $minAllowedDate = now()->startOfDay()->addDays($product->lead_time_days);
                    $eventDate = Carbon::parse($data['event_date'])->startOfDay();
                    if ($eventDate->lt($minAllowedDate)) {
                        throw new RuntimeException(
                            "Pesanan untuk {$product->name} minimal H-{$product->lead_time_days} sebelum acara (paling cepat tanggal {$minAllowedDate->format('d/m/Y')})."
                        );
                    }
                }

                $selectedAddonIds = collect($item['addons'] ?? [])
                    ->pluck('addon_id')
                    ->all();

                $itemAddonsToCreate = [];
                $addonPricePerUnit = 0;

                if ($product->addons_enabled) {
                    $availableAddons = $product->addonGroups
                        ->flatMap->addons
                        ->keyBy('id');

                    // Check that all submitted addons are valid for this product
                    foreach ($selectedAddonIds as $addonId) {
                        if (! $availableAddons->has($addonId)) {
                            throw new RuntimeException(
                                "One or more addons are not valid for {$product->name}."
                            );
                        }
                    }

                    // Validate each addon group min_selection and max_selection
                    foreach ($product->addonGroups as $group) {
                        $groupAddonIds = $group->addons->pluck('id')->all();
                        $selectedInGroup = array_intersect($selectedAddonIds, $groupAddonIds);
                        $count = count($selectedInGroup);

                        if ($count < $group->min_selection) {
                            throw new RuntimeException(
                                "Silakan pilih {$group->name} untuk {$product->name}."
                            );
                        }

                        if ($count > $group->max_selection) {
                            throw new RuntimeException(
                                "Pilihan {$group->name} melebihi batas maksimal ({$group->max_selection}) untuk {$product->name}."
                            );
                        }

                        foreach ($selectedInGroup as $selId) {
                            $addonModel = $availableAddons->get($selId);
                            $addonPricePerUnit += (float) $addonModel->price;
                            $itemAddonsToCreate[] = [
                                'addon_id' => $addonModel->id,
                                'addon_group_name' => $group->name,
                                'addon_name' => $addonModel->name,
                                'price' => $addonModel->price,
                                'quantity' => $item['quantity'],
                                'subtotal' => $addonModel->price * $item['quantity'],
                            ];
                        }
                    }
                } else {
                    if (! empty($selectedAddonIds)) {
                        throw new RuntimeException(
                            "{$product->name} tidak memiliki opsi kustomisasi addon."
                        );
                    }
                }

                $itemSubtotal = ($product->price + $addonPricePerUnit) * $item['quantity'];
                $subtotal += $itemSubtotal;

                $itemsCalculated[] = [
                    'product' => $product,
                    'quantity' => $item['quantity'],
                    'subtotal' => $itemSubtotal,
                    'addons' => $itemAddonsToCreate,
                ];
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

            foreach ($itemsCalculated as $calcItem) {
                $product = $calcItem['product'];

                $orderItem = $order->items()->create([
                    'product_id' => $product->id,
                    'item_name' => $product->name,
                    'price' => $product->price,
                    'quantity' => $calcItem['quantity'],
                    'subtotal' => $calcItem['subtotal'],
                ]);

                foreach ($calcItem['addons'] as $addonData) {
                    $orderItem->addons()->create($addonData);
                }
            }

            $order->load([
                'items.addons',
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
