<?php

namespace Tests\Feature;

use App\Models\Addon;
use App\Models\AddonGroup;
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
            'event_date' => now()->addDays(5)->format('Y-m-d'),
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
            'event_date' => now()->addDays(5)->format('Y-m-d'),
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

    public function test_admin_can_create_manual_order_with_multiple_addons_selected(): void
    {
        Sanctum::actingAs($this->admin);

        $category = Category::firstOrCreate(['slug' => 'cat-manual-addons'], ['name' => 'Cat Manual Addons']);
        $group = AddonGroup::create([
            'name' => 'Lauk Tambahan',
            'is_required' => false,
            'min_selection' => 0,
            'max_selection' => 1, // Online restricts to 1, but admin can select multiple
            'is_active' => true,
        ]);

        $addon1 = Addon::create([
            'addon_group_id' => $group->id,
            'name' => 'Sambal Matah',
            'slug' => 'sambal-matah-'.uniqid(),
            'price' => 2000,
            'is_active' => true,
        ]);

        $addon2 = Addon::create([
            'addon_group_id' => $group->id,
            'name' => 'Telur Balado',
            'slug' => 'telur-balado-'.uniqid(),
            'price' => 5000,
            'is_active' => true,
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Nasi Box Spesial Manual',
            'slug' => 'nasi-box-spesial-'.uniqid(),
            'price' => 20000,
            'minimum_order' => 5,
            'lead_time_days' => 0,
            'addons_enabled' => true,
            'is_active' => true,
        ]);

        $product->addonGroups()->attach($group->id, ['sort_order' => 1]);

        $payload = [
            'customers_name' => 'Ibu Siti Walk-in',
            'customers_phone' => '081234567899',
            'event_date' => now()->addDays(5)->format('Y-m-d'),
            'delivery_address' => 'Ambil di tempat',
            'delivery_fee' => 5000,
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 5,
                    'addons' => [
                        ['addon_id' => $addon1->id],
                        ['addon_id' => $addon2->id],
                    ],
                ],
            ],
        ];

        // Base 20000 + Addon1 2000 + Addon2 5000 = 27000 per box
        // 5 box * 27000 = 135000 + 5000 delivery = 140000
        $response = $this->postJson('/api/v1/admin/orders', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Pesanan manual berhasil dibuat',
            ])
            ->assertJsonPath('data.subtotal', '135000.00')
            ->assertJsonPath('data.total', '140000.00');

        $this->assertDatabaseHas('order_item_addons', [
            'addon_id' => $addon1->id,
            'addon_name' => 'Sambal Matah',
            'price' => 2000,
        ]);

        $this->assertDatabaseHas('order_item_addons', [
            'addon_id' => $addon2->id,
            'addon_name' => 'Telur Balado',
            'price' => 5000,
        ]);
    }
}
