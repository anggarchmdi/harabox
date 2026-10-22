<?php

namespace App\Services;

use App\Models\Addon;
use App\Models\Order;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class OrderService
{
    public function __construct(
        protected KitchenCapacityService $capacityService,
        protected WebPushService $webPushService
    ) {}

    public function createOrder(array $data, bool $isAdmin = false): Order
    {
        $order = DB::transaction(function () use ($data, $isAdmin) {
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

                if (! $isAdmin && ($product->lead_time_days ?? 0) > 0) {
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

                        if (! $isAdmin) {
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

            if (isset($data['delivery_fee'])) {
                $deliveryFee = (float) $data['delivery_fee'];
            } else {
                $calculatedProductFee = 0.0;
                foreach ($itemsCalculated as $calcItem) {
                    if (! empty($calcItem['product']->has_delivery_fee)) {
                        $calculatedProductFee = max($calculatedProductFee, (float) $calcItem['product']->delivery_fee);
                    }
                }
                $deliveryFee = $calculatedProductFee;
            }
            $total = $subtotal + $deliveryFee;

            $status = $data['status'] ?? 'pending';
            $paymentStatus = $data['payment_status'] ?? 'unpaid';
            $paidAmount = isset($data['paid_amount']) ? (float) $data['paid_amount'] : 0.0;

            if ($paymentStatus === 'paid' && $paidAmount <= 0) {
                $paidAmount = $total;
            } elseif ($paymentStatus === 'unpaid') {
                $paidAmount = 0.0;
            }

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
                'status' => $status,
                'payment_status' => $paymentStatus,
                'paid_amount' => $paidAmount,
                'payment_method' => $data['payment_method'] ?? null,
                'payment_note' => $data['payment_note'] ?? null,
                'paid_at' => $paymentStatus !== 'unpaid' ? ($data['paid_at'] ?? now()) : null,
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

        if (! $isAdmin) {
            try {
                $this->webPushService->sendOrderNotification($order);
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return $order;
    }

    public function updateOrder(Order $order, array $data, bool $isAdmin = true, bool $force = false): Order
    {
        return DB::transaction(function () use ($order, $data, $isAdmin, $force) {
            $items = collect($data['items']);
            $newEventDate = $data['event_date'];
            $oldEventDate = $order->event_date instanceof \DateTimeInterface
                ? $order->event_date->format('Y-m-d')
                : Carbon::parse($order->event_date)->format('Y-m-d');

            $dateChanged = $newEventDate !== $oldEventDate;
            $oldPortions = (int) $order->items()->sum('quantity');
            $newPortions = (int) $items->sum('quantity');

            // Validate kitchen capacity
            if ($this->capacityService->isDateClosed($newEventDate) && ! $force) {
                throw new RuntimeException('Dapur libur dan tidak menerima pesanan pada tanggal tersebut.');
            }

            // Calculate remaining capacity: if date is unchanged, only check portion delta
            $remaining = $this->capacityService->getRemainingCapacity($newEventDate);
            $portionDelta = $dateChanged ? $newPortions : max(0, $newPortions - $oldPortions);

            if ($portionDelta > $remaining && ! $force) {
                if ($remaining <= 0) {
                    throw new RuntimeException('Kapasitas dapur untuk tanggal tersebut sudah penuh.');
                }
                throw new RuntimeException("Kapasitas dapur untuk tanggal tersebut tersisa {$remaining} box (tambahan pesanan: {$portionDelta} box).");
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
                throw new RuntimeException('Satu atau lebih produk tidak ditemukan atau tidak aktif.');
            }

            $subtotal = 0;
            $itemsCalculated = [];

            foreach ($items as $item) {
                $product = $products->get($item['product_id']);

                if (! $isAdmin && $item['quantity'] < $product->minimum_order) {
                    throw new RuntimeException("Minimum order untuk {$product->name} adalah {$product->minimum_order}.");
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

                    foreach ($selectedAddonIds as $addonId) {
                        if (! $availableAddons->has($addonId)) {
                            throw new RuntimeException("Satu atau lebih addon tidak valid untuk {$product->name}.");
                        }
                    }

                    foreach ($product->addonGroups as $group) {
                        $groupAddonIds = $group->addons->pluck('id')->all();
                        $selectedInGroup = array_intersect($selectedAddonIds, $groupAddonIds);
                        $count = count($selectedInGroup);

                        if (! $isAdmin) {
                            if ($count < $group->min_selection) {
                                throw new RuntimeException("Silakan pilih {$group->name} untuk {$product->name}.");
                            }
                            if ($count > $group->max_selection) {
                                throw new RuntimeException("Pilihan {$group->name} melebihi batas maksimal ({$group->max_selection}) untuk {$product->name}.");
                            }
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

            if (isset($data['delivery_fee'])) {
                $deliveryFee = (float) $data['delivery_fee'];
            } else {
                $deliveryFee = (float) $order->delivery_fee;
            }
            $total = $subtotal + $deliveryFee;

            $status = $data['status'] ?? $order->status;
            $paymentStatus = $data['payment_status'] ?? $order->payment_status;
            $paidAmount = isset($data['paid_amount']) ? (float) $data['paid_amount'] : (float) $order->paid_amount;

            if ($paymentStatus === 'paid' && $paidAmount <= 0) {
                $paidAmount = $total;
            } elseif ($paymentStatus === 'unpaid') {
                $paidAmount = 0.0;
            }

            $order->update([
                'customers_name' => $data['customers_name'],
                'customers_phone' => $data['customers_phone'],
                'event_date' => $data['event_date'],
                'event_time' => $data['event_time'] ?? null,
                'delivery_address' => $data['delivery_address'],
                'notes' => $data['notes'] ?? null,
                'subtotal' => $subtotal,
                'delivery_fee' => $deliveryFee,
                'total' => $total,
                'status' => $status,
                'payment_status' => $paymentStatus,
                'paid_amount' => $paidAmount,
                'payment_method' => $data['payment_method'] ?? $order->payment_method,
                'payment_note' => $data['payment_note'] ?? $order->payment_note,
                'paid_at' => $paymentStatus !== 'unpaid' ? ($data['paid_at'] ?? $order->paid_at ?? now()) : null,
            ]);

            // Sync items: Delete existing items and recreates them
            foreach ($order->items as $oldItem) {
                $oldItem->addons()->delete();
                $oldItem->delete();
            }

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

            $order->load(['items.product', 'items.addons', 'addons.addon', 'paymentProofs']);

            return $order;
        });
    }

    /**
     * Delete an order and clean up related files (local & Google Drive).
     */
    public function deleteOrder(Order $order): void
    {
        DB::transaction(function () use ($order) {
            $order->loadMissing('paymentProofs');

            foreach ($order->paymentProofs as $proof) {
                if (! empty($proof->drive_file_id)) {
                    if (str_starts_with($proof->drive_file_id, 'local:')) {
                        $relativePath = substr($proof->drive_file_id, 6);
                        Storage::disk('public')->delete($relativePath);
                    } else {
                        try {
                            app(GoogleDriveService::class)->deleteFile($proof->drive_file_id);
                        } catch (\Throwable $e) {
                            Log::warning('Gagal menghapus file Google Drive saat hapus order: '.$e->getMessage());
                        }
                    }
                }
            }

            $order->delete();
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
