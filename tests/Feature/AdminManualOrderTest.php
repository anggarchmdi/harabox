<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminManualOrderTest extends TestCase
{
    use DatabaseTransactions;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::first() ?? User::factory()->create();
    }

    public function test_guest_cannot_create_manual_order(): void
    {
        $response = $this->postJson('/api/v1/admin/orders', []);
        $response->assertStatus(401);
    }

    public function test_admin_can_create_manual_order_with_payment_and_custom_delivery(): void
    {
        Sanctum::actingAs($this->admin);

        $category = Category::firstOrCreate(['slug' => 'cat-manual'], ['name' => 'Cat Manual']);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Nasi Box Offline Walk-in',
            'slug' => 'nasi-box-offline-'.uniqid(),
            'price' => 20000,
            'minimum_order' => 5,
            'lead_time_days' => 0,
            'addons_enabled' => false,
            'is_active' => true,
        ]);

        $payload = [
            'customers_name' => 'Pak Joko Offline',
            'customers_phone' => '081234567800',
            'event_date' => now()->format('Y-m-d'),
            'event_time' => '13:00',
            'delivery_address' => 'Ambil Sendiri di Toko',
            'delivery_fee' => 0,
            'notes' => 'Pesanan walk-in bayar tunai di tempat',
            'status' => 'completed',
            'payment_status' => 'paid',
            'paid_amount' => 100000,
            'payment_method' => 'Tunai / Cash',
            'payment_note' => 'Lunas di kasir',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 5,
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/admin/orders', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Pesanan manual berhasil dibuat',
            ])
            ->assertJsonPath('data.customers_name', 'Pak Joko Offline')
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.payment_status', 'paid')
            ->assertJsonPath('data.delivery_fee', '0.00')
            ->assertJsonPath('data.total', '100000.00');

        $this->assertDatabaseHas('orders', [
            'customers_name' => 'Pak Joko Offline',
            'payment_method' => 'Tunai / Cash',
            'status' => 'completed',
            'payment_status' => 'paid',
        ]);
    }

    public function test_admin_manual_order_respects_minimum_order(): void
    {
        Sanctum::actingAs($this->admin);

        $category = Category::firstOrCreate(['slug' => 'cat-manual-2'], ['name' => 'Cat Manual 2']);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Nasi Box Min 10',
            'slug' => 'nasi-box-min-10-'.uniqid(),
            'price' => 25000,
            'minimum_order' => 10,
            'lead_time_days' => 0,
            'addons_enabled' => false,
            'is_active' => true,
        ]);

        $payload = [
            'customers_name' => 'Pak Budi',
            'customers_phone' => '081234567801',
            'event_date' => now()->format('Y-m-d'),
            'delivery_address' => 'Jl. Kaliurang KM 6',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 5, // Below minimum 10
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/admin/orders', $payload);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);
    }
}
