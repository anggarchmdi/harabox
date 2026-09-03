<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OrderFlowTest extends TestCase
{
    use DatabaseTransactions;

    public function test_customer_can_create_catering_order_with_product_id(): void
    {
        $product = Product::query()->where('is_active', true)->first();

        if (! $product) {
            $this->markTestSkipped('No active product found in database.');
        }

        $payload = [
            'customers_name' => 'Pak Bambang Test',
            'customers_phone' => '081234567890',
            'event_date' => now()->addDays(3)->format('Y-m-d'),
            'event_time' => '11:30',
            'delivery_address' => 'Gedung Graha Lt. 5, Jl. Sudirman',
            'notes' => 'Minta sambal dipisah',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 30,
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/orders', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseHas('orders', [
            'customers_name' => 'Pak Bambang Test',
            'customers_phone' => '081234567890',
            'status' => 'pending',
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
}
