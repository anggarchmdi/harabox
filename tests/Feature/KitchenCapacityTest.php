<?php

namespace Tests\Feature;

use App\Models\CapacityOverride;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use App\Services\KitchenCapacityService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class KitchenCapacityTest extends TestCase
{
    use DatabaseTransactions;

    protected User $admin;

    protected KitchenCapacityService $capacityService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::firstOrCreate(
            ['email' => 'admin_capacity_test@harabox.id'],
            [
                'name' => 'Admin Capacity Test',
                'password' => bcrypt('secret123'),
            ]
        );

        $this->capacityService = app(KitchenCapacityService::class);
    }

    public function test_default_daily_box_capacity_is_500(): void
    {
        $defaultCapacity = $this->capacityService->getDefaultCapacity();
        $this->assertGreaterThanOrEqual(1, $defaultCapacity);

        // Test API
        Sanctum::actingAs($this->admin);
        $response = $this->getJson('/api/v1/admin/settings/capacity');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'data' => [
                    'daily_box_capacity',
                    'overrides',
                ],
            ]);
    }

    public function test_admin_can_update_default_daily_capacity(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->putJson('/api/v1/admin/settings/capacity', [
            'daily_box_capacity' => 600,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'daily_box_capacity' => 600,
                ],
            ]);

        $this->assertEquals(600, $this->capacityService->getDefaultCapacity());
    }

    public function test_admin_can_set_and_delete_date_override(): void
    {
        Sanctum::actingAs($this->admin);
        $targetDate = now()->addDays(5)->format('Y-m-d');

        // 1. Create override (e.g. weekend shift 1000 box)
        $storeResponse = $this->postJson('/api/v1/admin/settings/capacity/overrides', [
            'date' => $targetDate,
            'max_capacity' => 1000,
            'is_closed' => false,
            'note' => 'Weekend Shift Extra',
        ]);

        $storeResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'date' => $targetDate,
                    'max_capacity' => 1000,
                    'is_closed' => false,
                ],
            ]);

        $this->assertEquals(1000, $this->capacityService->getMaxCapacity($targetDate));

        // 2. Delete override (returns to default)
        $deleteResponse = $this->deleteJson("/api/v1/admin/settings/capacity/overrides/{$targetDate}");
        $deleteResponse->assertStatus(200);

        $this->assertNotEquals(1000, $this->capacityService->getMaxCapacity($targetDate));
    }

    public function test_pending_order_does_not_consume_capacity(): void
    {
        $targetDate = now()->addDays(120)->format('Y-m-d');
        $initialRemaining = $this->capacityService->getRemainingCapacity($targetDate);

        $category = Category::firstOrCreate(['slug' => 'test-cat-cap'], ['name' => 'Test Cat Cap']);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Box Nasi Test',
            'slug' => 'box-nasi-test-'.uniqid(),
            'price' => 15000,
            'minimum_order' => 10,
            'addons_enabled' => false,
            'is_active' => true,
        ]);

        // Customer checkout creates order in 'pending' status
        $response = $this->postJson('/api/v1/orders', [
            'customers_name' => 'Rian Test',
            'customers_phone' => '081234567890',
            'event_date' => $targetDate,
            'delivery_address' => 'Jl. Merdeka No. 10',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 200,
                ],
            ],
        ]);

        $response->assertStatus(201);

        // Capacity remaining should STILL be identical because pending does not consume quota!
        $remainingAfterPending = $this->capacityService->getRemainingCapacity($targetDate);
        $this->assertEquals($initialRemaining, $remainingAfterPending);
        $this->assertEquals(0, $this->capacityService->getBookedPortions($targetDate));
    }

    public function test_order_changed_to_processing_consumes_capacity_and_cancel_restores_it(): void
    {
        $targetDate = now()->addDays(125)->format('Y-m-d');
        Setting::set('daily_box_capacity', 500);

        $category = Category::firstOrCreate(['slug' => 'test-cat-cap-2'], ['name' => 'Test Cat Cap 2']);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Box Nasi Test 2',
            'slug' => 'box-nasi-test-2-'.uniqid(),
            'price' => 15000,
            'minimum_order' => 10,
            'addons_enabled' => false,
            'is_active' => true,
        ]);

        $order = Order::create([
            'order_code' => 'HB-TEST-'.uniqid(),
            'customers_name' => 'Customer Test Cap',
            'customers_phone' => '081299998888',
            'event_date' => $targetDate,
            'delivery_address' => 'Jl. Sudirman No. 12',
            'subtotal' => 3000000,
            'delivery_fee' => 10000,
            'total' => 3010000,
            'status' => 'pending',
        ]);

        $order->items()->create([
            'product_id' => $product->id,
            'item_name' => $product->name,
            'price' => $product->price,
            'quantity' => 200,
            'subtotal' => 3000000,
        ]);

        // 1. Initially booked is 0, remaining is 500
        $this->assertEquals(0, $this->capacityService->getBookedPortions($targetDate));
        $this->assertEquals(500, $this->capacityService->getRemainingCapacity($targetDate));

        // 2. Admin marks order as 'processing'
        Sanctum::actingAs($this->admin);
        $statusResponse = $this->patchJson("/api/v1/admin/orders/{$order->id}/status", [
            'status' => 'processing',
        ]);

        $statusResponse->assertStatus(200);

        // 3. Capacity booked must now be 200, remaining must be 300
        $this->assertEquals(200, $this->capacityService->getBookedPortions($targetDate));
        $this->assertEquals(300, $this->capacityService->getRemainingCapacity($targetDate));

        // 4. Admin cancels the order -> Slot must immediately revert back to 500!
        $cancelResponse = $this->patchJson("/api/v1/admin/orders/{$order->id}/status", [
            'status' => 'cancelled',
        ]);

        $cancelResponse->assertStatus(200);

        // 5. Verification: Booked back to 0, remaining back to 500!
        $this->assertEquals(0, $this->capacityService->getBookedPortions($targetDate));
        $this->assertEquals(500, $this->capacityService->getRemainingCapacity($targetDate));
    }

    public function test_admin_over_capacity_blocks_unless_force_flag_is_passed(): void
    {
        $targetDate = now()->addDays(130)->format('Y-m-d');
        Setting::set('daily_box_capacity', 100); // set limit to 100

        $category = Category::firstOrCreate(['slug' => 'test-cat-cap-3'], ['name' => 'Test Cat Cap 3']);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Box Nasi Test 3',
            'slug' => 'box-nasi-test-3-'.uniqid(),
            'price' => 15000,
            'minimum_order' => 10,
            'addons_enabled' => false,
            'is_active' => true,
        ]);

        $order = Order::create([
            'order_code' => 'HB-OVER-'.uniqid(),
            'customers_name' => 'Big Order',
            'customers_phone' => '081299997777',
            'event_date' => $targetDate,
            'delivery_address' => 'Jl. Mega Kuningan',
            'subtotal' => 2250000,
            'delivery_fee' => 10000,
            'total' => 2260000,
            'status' => 'pending',
        ]);

        $order->items()->create([
            'product_id' => $product->id,
            'item_name' => $product->name,
            'price' => $product->price,
            'quantity' => 150, // 150 box > 100 capacity
            'subtotal' => 2250000,
        ]);

        Sanctum::actingAs($this->admin);

        // 1. Without force flag: must return 422 with requires_confirmation
        $blockedResponse = $this->patchJson("/api/v1/admin/orders/{$order->id}/status", [
            'status' => 'processing',
        ]);

        $blockedResponse->assertStatus(422)
            ->assertJson([
                'success' => false,
                'requires_confirmation' => true,
            ]);

        $this->assertEquals('pending', $order->fresh()->status);

        // 2. With force flag = true: must succeed
        $forceResponse = $this->patchJson("/api/v1/admin/orders/{$order->id}/status", [
            'status' => 'processing',
            'force' => true,
        ]);

        $forceResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertEquals('processing', $order->fresh()->status);
        $this->assertEquals(150, $this->capacityService->getBookedPortions($targetDate));
    }

    public function test_customer_cannot_order_on_closed_date(): void
    {
        $targetDate = now()->addDays(135)->format('Y-m-d');

        // Mark date as closed (libur dapur)
        CapacityOverride::updateOrCreate(
            ['date' => $targetDate],
            [
                'max_capacity' => 0,
                'is_closed' => true,
                'note' => 'Libur Nasional Dapur',
            ]
        );

        $category = Category::firstOrCreate(['slug' => 'test-cat-cap-4'], ['name' => 'Test Cat Cap 4']);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Box Nasi Test 4',
            'slug' => 'box-nasi-test-4-'.uniqid(),
            'price' => 15000,
            'minimum_order' => 10,
            'addons_enabled' => false,
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/v1/orders', [
            'customers_name' => 'Customer Libur',
            'customers_phone' => '081288887777',
            'event_date' => $targetDate,
            'delivery_address' => 'Jl. Danau Sunter',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 20,
                ],
            ],
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);
    }
}
