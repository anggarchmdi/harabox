<?php

namespace Tests\Feature;

use App\Http\Controllers\GoogleDriveOAuthController;
use App\Models\User;
use Google\Client;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\URL;
use Laravel\Sanctum\Sanctum;
use Mockery;
use Tests\TestCase;

class GoogleDriveOAuthTest extends TestCase
{
    use DatabaseTransactions;

    protected User $superAdmin;

    protected User $regularAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::factory()->create([
            'role' => 'super_admin',
            'is_active' => true,
        ]);

        $this->regularAdmin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        config([
            'services.google_drive.client_id' => 'mock-client-id-123.apps.googleusercontent.com',
            'services.google_drive.client_secret' => 'mock-client-secret-456',
            'services.google_drive.redirect_uri' => 'http://localhost:8000/google-drive/callback',
        ]);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_super_admin_can_generate_signed_auth_url(): void
    {
        Sanctum::actingAs($this->superAdmin);

        $response = $this->getJson('/api/v1/google-drive/auth-url');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'expires_in_minutes' => 15,
                ],
            ]);

        $url = $response->json('data.url');
        $this->assertNotEmpty($url);
        $this->assertStringContainsString('/google-drive/connect', $url);
        $this->assertStringContainsString('signature=', $url);
    }

    public function test_regular_admin_cannot_generate_auth_url(): void
    {
        Sanctum::actingAs($this->regularAdmin);

        $response = $this->getJson('/api/v1/google-drive/auth-url');

        $response->assertStatus(403);
    }

    public function test_connect_requires_valid_signed_url(): void
    {
        // Unsigned request should be rejected with 403 Invalid Signature
        $response = $this->get('/google-drive/connect');

        $response->assertStatus(403);
    }

    public function test_connect_redirects_to_google_with_offline_and_csrf_state(): void
    {
        $signedUrl = URL::temporarySignedRoute('google-drive.connect', now()->addMinutes(15));

        $response = $this->get($signedUrl);

        $response->assertStatus(302);
        $targetUrl = $response->headers->get('Location');

        $this->assertStringContainsString('accounts.google.com', $targetUrl);
        $this->assertStringContainsString('access_type=offline', $targetUrl);
        $this->assertStringContainsString('state=', $targetUrl);

        // Verify state is stored in cache
        parse_str(parse_url($targetUrl, PHP_URL_QUERY), $queryParams);
        $state = $queryParams['state'] ?? '';
        $this->assertNotEmpty($state);
        $this->assertTrue(Cache::has('gdrive_oauth_state_'.$state));
    }

    public function test_connect_sets_prompt_consent_on_reconnect(): void
    {
        // Existing refresh token present -> should set prompt=consent
        config(['services.google_drive.refresh_token' => 'existing-token']);

        $signedUrl = URL::temporarySignedRoute('google-drive.connect', now()->addMinutes(15));

        $response = $this->get($signedUrl);

        $response->assertStatus(302);
        $targetUrl = $response->headers->get('Location');
        $this->assertStringContainsString('prompt=consent', $targetUrl);
    }

    public function test_callback_rejects_missing_or_invalid_csrf_state(): void
    {
        $response = $this->get('/google-drive/callback?state=invalid-state&code=some-code');

        $response->assertStatus(403);
        $this->assertStringContainsString('State OAuth tidak valid', $response->getContent());
    }

    public function test_callback_handles_google_error_query_param(): void
    {
        $response = $this->get('/google-drive/callback?error=access_denied&error_description=The+user+denied+access');

        $response->assertStatus(400);
        $this->assertStringContainsString('Otorisasi Dibatalkan', $response->getContent());
    }

    public function test_callback_handles_google_error_payload_on_code_exchange(): void
    {
        $state = 'mock-valid-state-123';
        Cache::put('gdrive_oauth_state_'.$state, true, now()->addMinutes(15));

        $mockClient = Mockery::mock(Client::class);
        $mockClient->shouldReceive('fetchAccessTokenWithAuthCode')
            ->with('mock-auth-code')
            ->once()
            ->andReturn([
                'error' => 'invalid_grant',
                'error_description' => 'Malformed auth code.',
            ]);

        $this->app->bind(GoogleDriveOAuthController::class, function () use ($mockClient) {
            $controller = Mockery::mock(GoogleDriveOAuthController::class)->makePartial();
            $controller->shouldReceive('createGoogleClient')->once()->andReturn($mockClient);

            return $controller;
        });

        $response = $this->get("/google-drive/callback?state={$state}&code=mock-auth-code");

        $response->assertStatus(400);
        $this->assertStringContainsString('Otorisasi Ditolak oleh Google', $response->getContent());
        $this->assertStringContainsString('Malformed auth code', $response->getContent());
    }

    public function test_callback_handles_missing_refresh_token_and_provides_force_consent_url(): void
    {
        $state = 'mock-valid-state-456';
        Cache::put('gdrive_oauth_state_'.$state, true, now()->addMinutes(15));

        $mockClient = Mockery::mock(Client::class);
        $mockClient->shouldReceive('fetchAccessTokenWithAuthCode')
            ->with('mock-auth-code')
            ->once()
            ->andReturn([
                'access_token' => 'mock-access-token-without-refresh-token',
                'expires_in' => 3600,
            ]);

        $this->app->bind(GoogleDriveOAuthController::class, function () use ($mockClient) {
            $controller = Mockery::mock(GoogleDriveOAuthController::class)->makePartial();
            $controller->shouldReceive('createGoogleClient')->once()->andReturn($mockClient);

            return $controller;
        });

        $response = $this->get("/google-drive/callback?state={$state}&code=mock-auth-code");

        $response->assertStatus(400);
        $this->assertStringContainsString('Refresh Token Tidak Diberikan', $response->getContent());
        $this->assertStringContainsString('force_consent=1', $response->getContent());
    }

    public function test_update_env_refresh_token_persists_and_verifies_safely(): void
    {
        $tempEnv = tempnam(sys_get_temp_dir(), 'env_test_');
        file_put_contents($tempEnv, "APP_NAME=Laravel\nGOOGLE_DRIVE_REFRESH_TOKEN=\"old_token\"\nAPP_ENV=local\n");

        $controller = new GoogleDriveOAuthController;
        $newToken = '1//04AbCd_NewValidRefreshToken_98765';

        $result = $controller->updateEnvRefreshToken($newToken, $tempEnv);

        $this->assertTrue($result['success']);
        $this->assertEquals('Token berhasil disimpan dan diverifikasi.', $result['message']);

        // Check file content
        $savedContent = file_get_contents($tempEnv);
        $this->assertStringContainsString('GOOGLE_DRIVE_REFRESH_TOKEN="'.$newToken.'"', $savedContent);
        $this->assertStringNotContainsString('old_token', $savedContent);

        // Check runtime config update
        $this->assertEquals($newToken, config('services.google_drive.refresh_token'));

        unlink($tempEnv);
    }

    public function test_update_env_refresh_token_fails_safely_if_env_is_unwritable(): void
    {
        $tempEnv = tempnam(sys_get_temp_dir(), 'env_test_ro_');
        file_put_contents($tempEnv, "APP_NAME=Laravel\n");
        chmod($tempEnv, 0444); // Read-only

        $controller = new GoogleDriveOAuthController;
        $result = $controller->updateEnvRefreshToken('mock-token', $tempEnv);

        // On Linux, if process is not root, 0444 makes file not writable
        if (! is_writable($tempEnv)) {
            $this->assertFalse($result['success']);
            $this->assertStringContainsString('izin tulis', $result['message']);
        }

        chmod($tempEnv, 0666);
        unlink($tempEnv);
    }

    public function test_callback_returns_error_and_does_not_claim_success_when_env_write_fails(): void
    {
        $state = 'mock-valid-state-789';
        Cache::put('gdrive_oauth_state_'.$state, true, now()->addMinutes(15));

        $mockClient = Mockery::mock(Client::class);
        $mockClient->shouldReceive('fetchAccessTokenWithAuthCode')
            ->with('mock-auth-code')
            ->once()
            ->andReturn([
                'access_token' => 'mock-access-token',
                'refresh_token' => 'mock-new-refresh-token',
                'expires_in' => 3600,
            ]);

        $this->app->bind(GoogleDriveOAuthController::class, function () use ($mockClient) {
            $controller = Mockery::mock(GoogleDriveOAuthController::class)->makePartial();
            $controller->shouldReceive('createGoogleClient')->once()->andReturn($mockClient);
            // Simulate write failure
            $controller->shouldReceive('updateEnvRefreshToken')
                ->once()
                ->andReturn([
                    'success' => false,
                    'message' => 'Simulated disk write failure',
                ]);

            return $controller;
        });

        $response = $this->get("/google-drive/callback?state={$state}&code=mock-auth-code");

        $response->assertStatus(500);
        $this->assertStringContainsString('Gagal Menyimpan Kredensial', $response->getContent());
        $this->assertStringContainsString('Simulated disk write failure', $response->getContent());
        $this->assertStringNotContainsString('Google Drive Berhasil Terhubung', $response->getContent());
    }

    public function test_callback_full_success_flow(): void
    {
        $state = 'mock-valid-state-success';
        Cache::put('gdrive_oauth_state_'.$state, true, now()->addMinutes(15));

        $mockClient = Mockery::mock(Client::class);
        $mockClient->shouldReceive('fetchAccessTokenWithAuthCode')
            ->with('mock-auth-code')
            ->once()
            ->andReturn([
                'access_token' => 'mock-access-token',
                'refresh_token' => 'mock-new-refresh-token',
                'expires_in' => 3600,
            ]);

        $this->app->bind(GoogleDriveOAuthController::class, function () use ($mockClient) {
            $controller = Mockery::mock(GoogleDriveOAuthController::class)->makePartial();
            $controller->shouldReceive('createGoogleClient')->once()->andReturn($mockClient);
            $controller->shouldReceive('updateEnvRefreshToken')
                ->once()
                ->andReturn([
                    'success' => true,
                    'message' => 'Token berhasil disimpan dan diverifikasi.',
                ]);

            return $controller;
        });

        $response = $this->get("/google-drive/callback?state={$state}&code=mock-auth-code");

        $response->assertStatus(200);
        $this->assertStringContainsString('Google Drive Berhasil Terhubung', $response->getContent());
    }
}
