<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminProductCustomizationTest extends TestCase
{
    use DatabaseTransactions;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::first() ?? User::factory()->create();
    }

    public function test_admin_can_create_product_with_custom_nasi_sayur_and_addons(): void
    {
        Sanctum::actingAs($this->admin);

        $category = Category::firstOrCreate(['slug' => 'cat-custom-test'], ['name' => 'Custom Test Cat']);

        $payload = [
            'category_id' => $category->id,
            'name' => 'Paket Custom Nasi Sayur '.uniqid(),
            'description' => 'Paket hemat dengan custom nasi dan sayur',
            'price' => 25000,
            'minimum_order' => 10,
            'lead_time_days' => 1,
            'is_active' => true,
            'addons_enabled' => true,
            'custom_nasi' => [
                ['name' => 'Nasi Putih Pulen', 'price' => 0],
                ['name' => 'Nasi Kuning Gurih', 'price' => 2000],
                ['name' => 'Nasi Uduk Betawi', 'price' => 2500],
            ],
            'custom_sayur' => [
                ['name' => 'Sayur Capcay', 'price' => 0],
                ['name' => 'Tumis Buncis Jagung', 'price' => 0],
                ['name' => 'Sayur Asem', 'price' => 1000],
            ],
            'addons' => [
                ['name' => 'Kerupuk Udang', 'price' => 2500],
                ['name' => 'Air Mineral', 'price' => 3000],
            ],
        ];

        $response = $this->postJson('/api/v1/admin/products', $payload);

        $response->assertStatus(201);
        $productId = $response->json('data.id');

        $product = Product::with('addonGroups.addons')->findOrFail($productId);

        $this->assertCount(3, $product->custom_nasi);
        $this->assertEquals('Nasi Putih Pulen', $product->custom_nasi[0]['name']);
        $this->assertCount(3, $product->custom_sayur);
        $this->assertEquals('Sayur Capcay', $product->custom_sayur[0]['name']);

        // Check Addon Groups
        $groupNames = $product->addonGroups->pluck('name')->toArray();
        $this->assertContains('Pilihan Nasi', $groupNames);
        $this->assertContains('Pilihan Sayur', $groupNames);
        $this->assertContains('Pilihan Tambahan', $groupNames);

        $nasiGroup = $product->addonGroups->firstWhere('name', 'Pilihan Nasi');
        $this->assertTrue($nasiGroup->is_required);
        $this->assertEquals(1, $nasiGroup->min_selection);
        $this->assertEquals(1, $nasiGroup->max_selection);
        $this->assertCount(3, $nasiGroup->addons);

        $sayurGroup = $product->addonGroups->firstWhere('name', 'Pilihan Sayur');
        $this->assertTrue($sayurGroup->is_required);
        $this->assertEquals(1, $sayurGroup->min_selection);
        $this->assertEquals(1, $sayurGroup->max_selection);
        $this->assertCount(3, $sayurGroup->addons);

        $tambahanGroup = $product->addonGroups->firstWhere('name', 'Pilihan Tambahan');
        $this->assertFalse($tambahanGroup->is_required);
        $this->assertCount(2, $tambahanGroup->addons);
    }

    public function test_admin_can_update_product_custom_nasi_and_sayur(): void
    {
        Sanctum::actingAs($this->admin);

        $category = Category::firstOrCreate(['slug' => 'cat-custom-test'], ['name' => 'Custom Test Cat']);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Paket Update '.uniqid(),
            'slug' => 'paket-update-'.uniqid(),
            'price' => 30000,
            'minimum_order' => 5,
            'lead_time_days' => 1,
            'is_active' => true,
            'addons_enabled' => true,
            'custom_nasi' => [['name' => 'Nasi Putih', 'price' => 0]],
            'custom_sayur' => [['name' => 'Sayur Sop', 'price' => 0]],
        ]);

        $updatePayload = [
            'name' => $product->name,
            'price' => $product->price,
            'minimum_order' => $product->minimum_order,
            'lead_time_days' => $product->lead_time_days,
            'is_active' => true,
            'addons_enabled' => true,
            'custom_nasi' => [
                ['name' => 'Nasi Daun Jeruk', 'price' => 3000],
            ],
            'custom_sayur' => [
                ['name' => 'Tumis Kangkung', 'price' => 0],
                ['name' => 'Capcay Seafood', 'price' => 5000],
            ],
            'addons' => [
                ['name' => 'Telur Balado', 'price' => 4000],
            ],
        ];

        $response = $this->putJson("/api/v1/admin/products/{$product->id}", $updatePayload);
        $response->assertStatus(200);

        $product->refresh();
        $this->assertCount(1, $product->custom_nasi);
        $this->assertEquals('Nasi Daun Jeruk', $product->custom_nasi[0]['name']);
        $this->assertCount(2, $product->custom_sayur);
        $this->assertEquals('Capcay Seafood', $product->custom_sayur[1]['name']);
    }
}
