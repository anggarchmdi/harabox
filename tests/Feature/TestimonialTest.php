<?php

namespace Tests\Feature;

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
