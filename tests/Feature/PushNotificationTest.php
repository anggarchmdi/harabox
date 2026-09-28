<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PushNotificationTest extends TestCase
{
    use DatabaseTransactions;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::first() ?? User::factory()->create();
    }

    public function test_guest_cannot_access_push_endpoints(): void
    {
        $this->getJson('/api/v1/admin/push/vapid-key')->assertStatus(401);
        $this->postJson('/api/v1/admin/push/subscribe', [])->assertStatus(401);
        $this->postJson('/api/v1/admin/push/unsubscribe', [])->assertStatus(401);
        $this->getJson('/api/v1/admin/push/status')->assertStatus(401);
    }

    public function test_admin_can_get_vapid_key(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson('/api/v1/admin/push/vapid-key');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => ['public_key'],
            ]);
    }

    public function test_admin_can_subscribe_and_unsubscribe(): void
    {
        Sanctum::actingAs($this->admin);

        $dummyEndpoint = 'https://updates.push.services.mozilla.com/wpush/v2/test-'.uniqid();
        $payload = [
            'endpoint' => $dummyEndpoint,
            'keys' => [
                'p256dh' => 'BLdummyKeyForTestingP256dhBase64FormatStringOnly',
                'auth' => 'dummyAuthToken1234',
            ],
            'content_encoding' => 'aes128gcm',
        ];

        // Subscribe
        $response = $this->postJson('/api/v1/admin/push/subscribe', $payload);
        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseHas('admin_push_subscriptions', [
            'user_id' => $this->admin->id,
            'endpoint_hash' => hash('sha256', $dummyEndpoint),
        ]);

        // Status check
        $statusResponse = $this->getJson('/api/v1/admin/push/status');
        $statusResponse->assertStatus(200)
            ->assertJsonPath('data.user_subscriptions_count', 1);

        // Unsubscribe
        $unsubResponse = $this->postJson('/api/v1/admin/push/unsubscribe', [
            'endpoint' => $dummyEndpoint,
        ]);
        $unsubResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseMissing('admin_push_subscriptions', [
            'endpoint_hash' => hash('sha256', $dummyEndpoint),
        ]);
    }
}
