<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\Testimonial;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\URL;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SecurityHardeningTest extends TestCase
{
    use DatabaseTransactions;

    protected User $superAdmin;

    protected User $regularAdmin;

    protected User $inactiveAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::create([
            'name' => 'Super Admin Sec',
            'email' => 'supersec@harabox.id',
            'password' => bcrypt('password123'),
            'role' => 'super_admin',
            'is_active' => true,
        ]);

        $this->regularAdmin = User::create([
            'name' => 'Admin Regular Sec',
            'email' => 'adminsec@harabox.id',
            'password' => bcrypt('password123'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        $this->inactiveAdmin = User::create([
            'name' => 'Inactive Admin',
            'email' => 'inactivesec@harabox.id',
            'password' => bcrypt('password123'),
            'role' => 'admin',
            'is_active' => false,
        ]);
    }

    public function test_google_drive_connect_rejects_unsigned_requests(): void
    {
        // Accessing /google-drive/connect directly without signed URL must fail with 403
        $response = $this->get('/google-drive/connect');

        $response->assertStatus(403);
    }

    public function test_google_drive_connect_allows_valid_signed_url(): void
    {
        $signedUrl = URL::temporarySignedRoute('google-drive.connect', now()->addMinutes(15));

        $response = $this->get($signedUrl);

        // Should either redirect to Google (302) or return 400 if client id is not configured
        $this->assertContains($response->getStatusCode(), [302, 400]);
    }

    public function test_google_drive_callback_rejects_invalid_or_missing_state(): void
    {
        // 1. Missing state
        $response = $this->get('/google-drive/callback?code=mock_code');
        $response->assertStatus(403);

        // 2. Bogus state
        $response2 = $this->get('/google-drive/callback?code=mock_code&state=forged_state_token');
        $response2->assertStatus(403);
    }

    public function test_super_admin_can_generate_signed_oauth_url(): void
    {
        Sanctum::actingAs($this->superAdmin);

        $response = $this->getJson('/api/v1/admin/google-drive/auth-url');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => ['url', 'expires_in_minutes'],
            ]);

        $url = $response->json('data.url');
        $this->assertStringContainsString('signature=', $url);
    }

    public function test_regular_admin_cannot_generate_signed_oauth_url(): void
    {
        Sanctum::actingAs($this->regularAdmin);

        $response = $this->getJson('/api/v1/admin/google-drive/auth-url');

        $response->assertStatus(403);
    }

    public function test_inactive_admin_is_immediately_blocked_and_token_revoked(): void
    {
        // Generate actual token for inactive admin
        $token = $this->inactiveAdmin->createToken('test-token');

        $response = $this->withHeader('Authorization', 'Bearer '.$token->plainTextToken)
            ->getJson('/api/v1/admin/me');

        $response->assertStatus(403)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Akun Anda dinonaktifkan. Silakan hubungi tim IT.');

        // Token must have been deleted/revoked
        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $token->accessToken->id,
        ]);
    }

    public function test_public_testimonials_api_does_not_leak_order_codes(): void
    {
        $category = Category::firstOrCreate(['slug' => 'test-cat'], ['name' => 'Test Cat']);
        $product = Product::firstOrCreate(['slug' => 'test-prod'], [
            'name' => 'Nasi Ayam',
            'category_id' => $category->id,
            'price' => 25000,
            'is_active' => true,
        ]);

        $order = Order::create([
            'order_code' => 'HB-SEC-9999',
            'customers_name' => 'Budi Raharjo',
            'customers_phone' => '081234567890',
            'delivery_address' => 'Jl. Kebon Jeruk No 123, Jakarta Barat',
            'event_date' => now()->addDays(2)->toDateString(),
            'delivery_time' => '12:00',
            'subtotal' => 50000,
            'delivery_fee' => 0,
            'total' => 50000,
            'status' => 'completed',
            'source' => 'web',
            'payment_status' => 'paid',
        ]);

        Testimonial::create([
            'order_code' => 'HB-SEC-9999',
            'name' => 'Budi Raharjo',
            'institution' => 'PT Harabox Media',
            'rating' => 5,
            'order_quantity' => '2 Box',
            'message' => 'Makanannya lezat sekali!',
            'is_displayed' => true,
        ]);

        $response = $this->getJson('/api/v1/testimonials');

        $response->assertStatus(200);

        // Verify order_code is NOT present in any testimonial object
        $testimonials = $response->json('data');
        $this->assertNotEmpty($testimonials);

        foreach ($testimonials as $t) {
            $this->assertArrayNotHasKey('order_code', $t, 'Vulnerability: order_code was found in public testimonials list!');
        }
    }

    public function test_order_tracking_requires_mandatory_phone_verification(): void
    {
        $order = Order::create([
            'order_code' => 'HB-TRACK-SEC',
            'customers_name' => 'Rahasia Customer',
            'customers_phone' => '081987654321',
            'delivery_address' => 'Gedung Cyber 2 Lantai 15, Jl. Rasuna Said, Jakarta',
            'notes' => 'Catatan rahasia: Kode gerbang 1234, mohon jangan ketuk pintu keras-keras',
            'event_date' => now()->addDays(3)->toDateString(),
            'delivery_time' => '11:00',
            'subtotal' => 100000,
            'delivery_fee' => 0,
            'total' => 100000,
            'status' => 'confirmed',
            'source' => 'web',
            'payment_status' => 'unpaid',
        ]);

        // 1. Missing phone returns 422
        $noPhoneResponse = $this->getJson('/api/v1/orders/HB-TRACK-SEC');
        $noPhoneResponse->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Nomor WhatsApp pemesan wajib diisi untuk verifikasi pelacakan pesanan.');

        // 2. Mismatched phone returns 404 anti-enumeration
        $wrongPhoneResponse = $this->getJson('/api/v1/orders/HB-TRACK-SEC?phone=081111111111');
        $wrongPhoneResponse->assertStatus(404)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Kombinasi kode pesanan dan nomor WhatsApp tidak cocok atau tidak ditemukan.');

        // 3. Matching last 4 digits succeeds
        $partialMatchResponse = $this->getJson('/api/v1/orders/HB-TRACK-SEC?phone=4321');
        $partialMatchResponse->assertStatus(200)
            ->assertJsonPath('data.order_code', 'HB-TRACK-SEC')
            ->assertJsonPath('data.customers_phone', '081987654321');

        // 4. Full phone matches and returns full details
        $verifiedResponse = $this->getJson('/api/v1/orders/HB-TRACK-SEC?phone=081987654321');
        $verifiedResponse->assertStatus(200);
        $verifiedData = $verifiedResponse->json('data');

        $this->assertEquals('081987654321', $verifiedData['customers_phone']);
        $this->assertEquals('Gedung Cyber 2 Lantai 15, Jl. Rasuna Said, Jakarta', $verifiedData['delivery_address']);
        $this->assertEquals('Catatan rahasia: Kode gerbang 1234, mohon jangan ketuk pintu keras-keras', $verifiedData['notes']);
    }

    public function test_testimonial_check_requires_mandatory_phone_verification(): void
    {
        $order = Order::create([
            'order_code' => 'HB-REV-SEC-1',
            'customers_name' => 'Sari Indah',
            'customers_phone' => '087788990011',
            'delivery_address' => 'Jl. Tebet Raya No 8',
            'event_date' => now()->toDateString(),
            'delivery_time' => '12:00',
            'subtotal' => 75000,
            'delivery_fee' => 0,
            'total' => 75000,
            'status' => 'completed',
            'source' => 'web',
            'payment_status' => 'paid',
        ]);

        // 1. Missing phone returns 422
        $noPhoneRes = $this->getJson('/api/v1/testimonials/check/HB-REV-SEC-1');
        $noPhoneRes->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Nomor WhatsApp pemesan wajib diisi untuk memverifikasi pesanan.');

        // 2. Mismatched phone returns 404 anti-enumeration
        $wrongPhoneRes = $this->getJson('/api/v1/testimonials/check/HB-REV-SEC-1?phone=089999999999');
        $wrongPhoneRes->assertStatus(404);

        // 3. Valid phone returns 200 with order details
        $validRes = $this->getJson('/api/v1/testimonials/check/HB-REV-SEC-1?phone=087788990011');
        $validRes->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('order.order_code', 'HB-REV-SEC-1')
            ->assertJsonPath('order.customers_name', 'Sari Indah');
    }
}
