<?php

namespace Tests\Feature;

use App\Models\Addon;
use App\Models\AddonGroup;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OrderFlowTest extends TestCase
{
    use DatabaseTransactions;

    public function test_customer_can_order_product_without_addons(): void
    {
        $category = Category::firstOrCreate(['slug' => 'test-cat'], ['name' => 'Test Cat']);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Nasi Box Polos',
            'slug' => 'nasi-box-polos-'.uniqid(),
            'price' => 10000,
            'minimum_order' => 10,
            'addons_enabled' => false,
            'is_active' => true,
        ]);

        $payload = [
            'customers_name' => 'Pak Bambang Test',
            'customers_phone' => '081234567890',
            'event_date' => now()->addDays(3)->format('Y-m-d'),
            'delivery_address' => 'Gedung Graha Lt. 5, Jl. Sudirman',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 10,
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/orders', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Order berhasil',
            ])
            ->assertJsonStructure([
                'data' => [
                    'order_code',
                ],
            ]);

        $this->assertDatabaseHas('orders', [
            'customers_name' => 'Pak Bambang Test',
            'subtotal' => 100000.00,
            'delivery_fee' => 10000.00,
            'total' => 110000.00,
            'status' => 'pending',
        ]);
    }

    public function test_customer_can_order_product_with_customization_addons(): void
    {
        $category = Category::firstOrCreate(['slug' => 'test-cat'], ['name' => 'Test Cat']);

        $groupNasi = AddonGroup::create([
            'name' => 'Pilihan Nasi',
            'is_required' => true,
            'min_selection' => 1,
            'max_selection' => 1,
            'is_active' => true,
        ]);

        $addonNasiKuning = Addon::create([
            'addon_group_id' => $groupNasi->id,
            'name' => 'Nasi Kuning Special',
            'slug' => 'addon-nk-'.uniqid(),
            'price' => 1000,
            'is_active' => true,
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Nasi Box Custom',
            'slug' => 'nasi-box-custom-'.uniqid(),
            'price' => 15000,
            'minimum_order' => 10,
            'addons_enabled' => true,
            'is_active' => true,
        ]);

        $product->addonGroups()->attach($groupNasi->id, ['sort_order' => 1]);

        $payload = [
            'customers_name' => 'Ibu Rina Test',
            'customers_phone' => '081234567890',
            'event_date' => now()->addDays(3)->format('Y-m-d'),
            'delivery_address' => 'Jl. Kaliurang KM 7',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 20,
                    'addons' => [
                        ['addon_id' => $addonNasiKuning->id],
                    ],
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/orders', $payload);

        // Unit price = 15000 + 1000 = 16000. Subtotal = 16000 * 20 = 320000. Total = 320000 + 10000 = 330000
        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Order berhasil',
            ])
            ->assertJsonStructure([
                'data' => [
                    'order_code',
                ],
            ]);

        $this->assertDatabaseHas('orders', [
            'customers_name' => 'Ibu Rina Test',
            'subtotal' => 320000.00,
            'total' => 330000.00,
        ]);

        $this->assertDatabaseHas('order_item_addons', [
            'addon_id' => $addonNasiKuning->id,
            'addon_name' => 'Nasi Kuning Special',
            'price' => 1000.00,
            'quantity' => 20,
            'subtotal' => 20000.00,
        ]);
    }

    public function test_customer_cannot_inject_unauthorized_addons(): void
    {
        $category = Category::firstOrCreate(['slug' => 'test-cat'], ['name' => 'Test Cat']);

        $unauthorizedAddon = Addon::create([
            'name' => 'Es Teh Ilegal',
            'slug' => 'es-teh-ilegal-'.uniqid(),
            'price' => 3000,
            'is_active' => true,
        ]);

        $productWithoutAddons = Product::create([
            'category_id' => $category->id,
            'name' => 'Produk Tanpa Addon',
            'slug' => 'pta-'.uniqid(),
            'price' => 10000,
            'minimum_order' => 10,
            'addons_enabled' => false,
            'is_active' => true,
        ]);

        // Attempting to send addon to product where addons_enabled is false
        $payload = [
            'customers_name' => 'Attacker Test',
            'customers_phone' => '081234567890',
            'event_date' => now()->addDays(3)->format('Y-m-d'),
            'delivery_address' => 'Jl. Anonymous',
            'items' => [
                [
                    'product_id' => $productWithoutAddons->id,
                    'quantity' => 10,
                    'addons' => [
                        ['addon_id' => $unauthorizedAddon->id],
                    ],
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/orders', $payload);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Produk Tanpa Addon tidak memiliki opsi kustomisasi addon.',
            ]);
    }

    public function test_customer_cannot_order_when_required_addon_group_missing(): void
    {
        $category = Category::firstOrCreate(['slug' => 'test-cat'], ['name' => 'Test Cat']);

        $groupNasi = AddonGroup::create([
            'name' => 'Pilihan Nasi',
            'is_required' => true,
            'min_selection' => 1,
            'max_selection' => 1,
            'is_active' => true,
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Nasi Box Custom Required',
            'slug' => 'nasi-box-cr-'.uniqid(),
            'price' => 15000,
            'minimum_order' => 10,
            'addons_enabled' => true,
            'is_active' => true,
        ]);

        $product->addonGroups()->attach($groupNasi->id, ['sort_order' => 1]);

        $payload = [
            'customers_name' => 'Test Customer',
            'customers_phone' => '081234567890',
            'event_date' => now()->addDays(3)->format('Y-m-d'),
            'delivery_address' => 'Jl. Gejayan No. 10',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 10,
                    'addons' => [],
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/orders', $payload);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Silakan pilih Pilihan Nasi untuk Nasi Box Custom Required.',
            ]);
    }

    public function test_admin_can_update_order_status(): void
    {
        $admin = User::first() ?? User::factory()->create();
        Sanctum::actingAs($admin);

        $order = Order::create([
            'order_code' => 'HB-TEST-'.uniqid(),
            'customers_name' => 'Ibu Maya Test',
            'customers_phone' => '089876543210',
            'event_date' => now()->addDays(2)->format('Y-m-d'),
            'delivery_address' => 'Jl. Kaliurang KM 5',
            'subtotal' => 250000,
            'delivery_fee' => 0,
            'total' => 250000,
            'status' => 'pending',
        ]);

        $response = $this->patchJson("/api/v1/admin/orders/{$order->id}/status", [
            'status' => 'processing',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'processing',
                ],
            ]);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'processing',
        ]);
    }

    public function test_admin_can_access_dashboard_and_see_summary(): void
    {
        $admin = User::first() ?? User::factory()->create();
        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/admin/dashboard');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'data' => [
                    'summary' => [
                        'orders_today',
                        'orders_this_month',
                        'revenue_today',
                        'revenue_this_month',
                        'pending_orders',
                        'processing_orders',
                        'completed_orders',
                        'total_products',
                        'active_products',
                    ],
                    'last_seven_days',
                    'order_statuses',
                    'recent_orders',
                ],
            ]);
    }

    public function test_customer_cannot_order_with_event_date_violating_product_lead_time(): void
    {
        $category = Category::firstOrCreate(['slug' => 'test-cat'], ['name' => 'Test Cat']);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Tumpeng Spesial',
            'slug' => 'tumpeng-spesial-'.uniqid(),
            'price' => 50000,
            'minimum_order' => 1,
            'lead_time_days' => 5, // H-5
            'addons_enabled' => false,
            'is_active' => true,
        ]);

        $payload = [
            'customers_name' => 'Bu Rina Test',
            'customers_phone' => '081299998888',
            'event_date' => now()->addDays(2)->format('Y-m-d'), // Ordering for H-2 when H-5 is required
            'delivery_address' => 'Jl. Mawar No. 10',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 1,
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/orders', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['event_date']);
    }

    public function test_customer_can_order_when_event_date_satisfies_product_lead_time(): void
    {
        $category = Category::firstOrCreate(['slug' => 'test-cat'], ['name' => 'Test Cat']);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Tumpeng Sukses',
            'slug' => 'tumpeng-sukses-'.uniqid(),
            'price' => 50000,
            'minimum_order' => 1,
            'lead_time_days' => 5, // H-5
            'addons_enabled' => false,
            'is_active' => true,
        ]);

        $payload = [
            'customers_name' => 'Pak Haris Test',
            'customers_phone' => '081277776666',
            'event_date' => now()->addDays(5)->format('Y-m-d'), // Exactly H-5
            'delivery_address' => 'Jl. Melati No. 20',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 1,
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/orders', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Order berhasil',
            ]);
    }

    public function test_customer_can_create_single_order_with_multiple_items_and_addons_from_cart(): void
    {
        $category = Category::firstOrCreate(['slug' => 'test-catering-cat'], ['name' => 'Catering Cat']);

        $group = AddonGroup::create([
            'name' => 'Pilihan Sambal',
            'is_required' => false,
            'min_selection' => 0,
            'max_selection' => 1,
            'is_active' => true,
        ]);

        $addon = Addon::create([
            'addon_group_id' => $group->id,
            'name' => 'Sambal Matah Extra',
            'slug' => 'sambal-matah-'.uniqid(),
            'price' => 2000,
            'is_active' => true,
        ]);

        $productA = Product::create([
            'category_id' => $category->id,
            'name' => 'Paket Ayam Bakar A',
            'slug' => 'paket-ayam-bakar-a-'.uniqid(),
            'price' => 15000,
            'minimum_order' => 10,
            'addons_enabled' => true,
            'is_active' => true,
        ]);
        $productA->addonGroups()->attach($group->id, ['sort_order' => 1]);

        $productB = Product::create([
            'category_id' => $category->id,
            'name' => 'Paket Krisbar B',
            'slug' => 'paket-krisbar-b-'.uniqid(),
            'price' => 20000,
            'minimum_order' => 10,
            'addons_enabled' => false,
            'is_active' => true,
        ]);

        $payload = [
            'customers_name' => 'Siti Cart Tester',
            'customers_phone' => '081234567899',
            'event_date' => now()->addDays(4)->format('Y-m-d'),
            'event_time' => '12:00',
            'delivery_address' => 'Kampus UGM, Sekip Blok L-1',
            'notes' => 'Tolong pisahkan box untuk ruang VIP',
            'items' => [
                [
                    'product_id' => $productA->id,
                    'quantity' => 30,
                    'addons' => [
                        ['addon_id' => $addon->id],
                    ],
                ],
                [
                    'product_id' => $productA->id,
                    'quantity' => 20,
                ],
                [
                    'product_id' => $productB->id,
                    'quantity' => 25,
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/orders', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Order berhasil',
            ]);

        $orderCode = $response->json('data.order_code');

        $order = Order::where('order_code', $orderCode)->firstOrFail();

        // 1 Order has 3 OrderItems
        $this->assertEquals(3, $order->items()->count());

        // Item 1: (15000 + 2000) * 30 = 510000
        // Item 2: 15000 * 20 = 300000
        // Item 3: 20000 * 25 = 500000
        // Subtotal = 1310000, Delivery Fee = 10000, Total = 1320000
        $this->assertEquals(1310000.00, (float) $order->subtotal);
        $this->assertEquals(10000.00, (float) $order->delivery_fee);
        $this->assertEquals(1320000.00, (float) $order->total);

        // Check addons on first item
        $firstItem = $order->items()->where('product_id', $productA->id)->where('quantity', 30)->first();
        $this->assertNotNull($firstItem);
        $this->assertEquals(1, $firstItem->addons()->count());
        $this->assertEquals('Sambal Matah Extra', $firstItem->addons()->first()->addon_name);
    }
}
