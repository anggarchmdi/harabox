<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Testimonial;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TestimonialTest extends TestCase
{
    use DatabaseTransactions;

    public function test_homepage_can_fetch_only_displayed_testimonials(): void
    {
        // Create 1 displayed and 1 hidden testimonial
        $displayed = Testimonial::factory()->create([
            'name' => 'Displayed Customer',
            'is_displayed' => true,
        ]);

        $hidden = Testimonial::factory()->create([
            'name' => 'Hidden Customer',
            'is_displayed' => false,
        ]);

        $response = $this->getJson('/api/v1/testimonials');

        $response->assertOk()
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonFragment(['name' => 'Displayed Customer'])
            ->assertJsonMissing(['name' => 'Hidden Customer']);
    }

    public function test_homepage_testimonials_include_ordered_items(): void
    {
        $order = Order::create([
            'order_code' => 'HB-ORDER-ITEMS-01',
            'customers_name' => 'Pak Rudi',
            'customers_phone' => '081234567899',
            'event_date' => now()->toDateString(),
            'delivery_address' => 'Jl. Pahlawan No. 10',
            'subtotal' => 600000,
            'delivery_fee' => 0,
            'total' => 600000,
            'status' => 'completed',
        ]);

        $order->items()->create([
            'item_name' => 'Paket Bento Katsu',
            'price' => 25000,
            'quantity' => 24,
            'subtotal' => 600000,
        ]);

        Testimonial::factory()->create([
            'order_code' => 'HB-ORDER-ITEMS-01',
            'name' => 'Pak Rudi',
            'order_quantity' => '24 Box',
            'is_displayed' => true,
        ]);

        $response = $this->getJson('/api/v1/testimonials');
        $response->assertOk()
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonFragment([
                'name' => 'Pak Rudi',
                'order_quantity' => '24 Box',
                'ordered_items' => [
                    [
                        'name' => 'Paket Bento Katsu',
                        'quantity' => 24,
                        'price' => 25000,
                        'image' => null,
                    ],
                ],
            ]);
    }

    public function test_customer_can_submit_testimonial(): void
    {
        $payload = [
            'name' => 'Budi Santoso',
            'institution' => 'PT Maju Terus',
            'rating' => 5,
            'order_quantity' => '100 Box',
            'message' => 'Makanannya sangat lezat dan tepat waktu untuk acara kantor kami!',
            'order_code' => 'HB-99999',
        ];

        $response = $this->postJson('/api/v1/testimonials', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'Budi Santoso',
                    'order_quantity' => '100 Box',
                    'rating' => 5,
                ],
            ]);

        $this->assertDatabaseHas('testimonials', [
            'name' => 'Budi Santoso',
            'order_quantity' => '100 Box',
            'order_code' => 'HB-99999',
            'is_displayed' => true,
        ]);
    }

    public function test_customer_can_submit_testimonial_with_order_code_auto_populating_name_and_quantity(): void
    {
        $order = Order::create([
            'order_code' => 'HB-2026-TEST01',
            'customers_name' => 'Ibu Siti Aminah',
            'customers_phone' => '081234567890',
            'event_date' => now()->toDateString(),
            'delivery_address' => 'Jl. Merdeka No. 1',
            'subtotal' => 1250000,
            'delivery_fee' => 0,
            'total' => 1250000,
            'status' => 'completed',
        ]);

        $order->items()->create([
            'item_name' => 'Bento Katsu Madu',
            'price' => 25000,
            'quantity' => 35,
            'subtotal' => 875000,
        ]);

        $order->items()->create([
            'item_name' => 'Bento Ayam Krispi',
            'price' => 25000,
            'quantity' => 15,
            'subtotal' => 375000,
        ]);

        // Customer submits WITHOUT specifying name or order_quantity
        $payload = [
            'order_code' => 'HB-2026-TEST01',
            'rating' => 5,
            'message' => 'Rasa ayamnya benar-benar mantap dan renyah!',
            'institution' => 'Arisan Keluarga',
        ];

        $response = $this->postJson('/api/v1/testimonials', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'Ibu Siti Aminah',
                    'order_quantity' => '50 Box',
                    'order_code' => 'HB-2026-TEST01',
                    'rating' => 5,
                ],
            ]);

        $this->assertDatabaseHas('testimonials', [
            'name' => 'Ibu Siti Aminah',
            'order_quantity' => '50 Box',
            'order_code' => 'HB-2026-TEST01',
            'institution' => 'Arisan Keluarga',
        ]);
    }

    public function test_cannot_submit_duplicate_testimonial_for_same_order(): void
    {
        $order = Order::create([
            'order_code' => 'HB-2026-DUP01',
            'customers_name' => 'Bpk. Hendra',
            'customers_phone' => '081234567891',
            'event_date' => now()->toDateString(),
            'delivery_address' => 'Jl. Melati No. 5',
            'subtotal' => 500000,
            'delivery_fee' => 0,
            'total' => 500000,
            'status' => 'completed',
        ]);

        Testimonial::factory()->create([
            'order_code' => 'HB-2026-DUP01',
            'name' => 'Bpk. Hendra',
        ]);

        $response = $this->postJson('/api/v1/testimonials', [
            'order_code' => 'HB-2026-DUP01',
            'rating' => 4,
            'message' => 'Ulasan kedua yang tidak boleh lolos',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);
    }

    public function test_can_check_if_order_has_been_reviewed(): void
    {
        $orderCodeNotReviewed = 'HB-NOT-REVIEWED-99';
        $res1 = $this->getJson("/api/v1/testimonials/check/{$orderCodeNotReviewed}");
        $res1->assertOk()
            ->assertJson([
                'success' => true,
                'has_reviewed' => false,
                'data' => null,
            ]);

        $orderCodeReviewed = 'HB-REVIEWED-88';
        $testimonial = Testimonial::factory()->create([
            'order_code' => $orderCodeReviewed,
            'name' => 'Rina Nose',
        ]);

        $res2 = $this->getJson("/api/v1/testimonials/check/{$orderCodeReviewed}");
        $res2->assertOk()
            ->assertJson([
                'success' => true,
                'has_reviewed' => true,
                'data' => [
                    'id' => $testimonial->id,
                    'name' => 'Rina Nose',
                    'order_code' => $orderCodeReviewed,
                ],
            ]);
    }

    public function test_check_by_order_returns_order_and_product_details(): void
    {
        $order = Order::create([
            'order_code' => 'HB-CHECK-ITEMS-01',
            'customers_name' => 'Pak Budi Hartono',
            'customers_phone' => '081299998888',
            'event_date' => now()->toDateString(),
            'delivery_address' => 'Jl. Sudirman No. 45',
            'subtotal' => 1500000,
            'delivery_fee' => 0,
            'total' => 1500000,
            'status' => 'completed',
        ]);

        $order->items()->create([
            'item_name' => 'Paket Bento Spesial Madu',
            'price' => 30000,
            'quantity' => 50,
            'subtotal' => 1500000,
        ]);

        $response = $this->getJson('/api/v1/testimonials/check/HB-CHECK-ITEMS-01');
        $response->assertOk()
            ->assertJson([
                'success' => true,
                'has_reviewed' => false,
                'order' => [
                    'order_code' => 'HB-CHECK-ITEMS-01',
                    'customers_name' => 'Pak Budi Hartono',
                    'total_quantity' => 50,
                    'items' => [
                        [
                            'item_name' => 'Paket Bento Spesial Madu',
                            'quantity' => 50,
                        ],
                    ],
                ],
            ]);
    }

    public function test_testimonial_submission_validation(): void
    {
        $response = $this->postJson('/api/v1/testimonials', [
            'name' => '',
            'rating' => 6, // invalid > 5
            'order_quantity' => '',
            'message' => 'abc', // too short
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'rating', 'order_quantity', 'message']);
    }

    public function test_admin_can_list_all_testimonials(): void
    {
        $admin = User::factory()->create();
        Sanctum::actingAs($admin);

        Testimonial::factory()->create(['name' => 'Test Admin View 1']);
        Testimonial::factory()->create(['name' => 'Test Admin View 2']);

        $response = $this->getJson('/api/v1/admin/testimonials');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    'data',
                    'total',
                ],
                'summary' => [
                    'total',
                    'displayed',
                    'hidden',
                    'average_rating',
                ],
            ]);
    }

    public function test_admin_can_toggle_testimonial_display_status(): void
    {
        $admin = User::factory()->create();
        Sanctum::actingAs($admin);

        $testimonial = Testimonial::factory()->create([
            'is_displayed' => true,
        ]);

        $response = $this->patchJson("/api/v1/admin/testimonials/{$testimonial->id}/toggle");

        $response->assertOk()
            ->assertJsonPath('data.is_displayed', false);

        $this->assertDatabaseHas('testimonials', [
            'id' => $testimonial->id,
            'is_displayed' => false,
        ]);

        // Toggle back
        $response2 = $this->patchJson("/api/v1/admin/testimonials/{$testimonial->id}/toggle");
        $response2->assertOk()
            ->assertJsonPath('data.is_displayed', true);
    }

    public function test_admin_can_delete_testimonial(): void
    {
        $admin = User::factory()->create();
        Sanctum::actingAs($admin);

        $testimonial = Testimonial::factory()->create();

        $response = $this->deleteJson("/api/v1/admin/testimonials/{$testimonial->id}");

        $response->assertOk()
            ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('testimonials', [
            'id' => $testimonial->id,
        ]);
    }

    public function test_unauthenticated_user_cannot_access_admin_testimonials(): void
    {
        $response = $this->getJson('/api/v1/admin/testimonials');

        $response->assertStatus(401);
    }
}
