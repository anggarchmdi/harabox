<?php

namespace App\Http\Controllers;

use App\Services\GoogleDriveService;
use Google\Client;
use Google\Service\Drive;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class GoogleDriveOAuthController extends Controller
{
    /**
     * Get the consistent OAuth redirect URI.
     */
    public function getRedirectUri(): string
    {
        return config('services.google_drive.redirect_uri') ?: route('google-drive.callback');
    }

    /**
     * Create and configure a Google API client instance.
     */
    public function createGoogleClient(): Client
    {
        $client = new Client;
        $client->setClientId((string) config('services.google_drive.client_id'));
        $client->setClientSecret((string) config('services.google_drive.client_secret'));
        $client->setRedirectUri($this->getRedirectUri());
        $client->addScope(Drive::DRIVE);
        $client->setAccessType('offline');

        return $client;
    }

    /**
     * Generate a signed authorization URL for Super Admin.
     */
    public function getAuthUrl(Request $request): JsonResponse
    {
        $parameters = [];
        if ($request->boolean('force_consent') || $request->boolean('reconnect')) {
            $parameters['force_consent'] = 1;
        }

        $signedUrl = URL::temporarySignedRoute('google-drive.connect', now()->addMinutes(15), $parameters);

        return response()->json([
            'success' => true,
            'message' => 'Signed Google Drive authorization URL generated successfully',
            'data' => [
                'url' => $signedUrl,
                'redirect_uri' => $this->getRedirectUri(),
                'expires_in_minutes' => 15,
            ],
        ]);
    }

    /**
     * Redirect to Google OAuth consent page with CSRF state protection.
     * Protected by 'signed' middleware.
     */
    public function connect(Request $request)
    {
        $clientId = config('services.google_drive.client_id');
        $clientSecret = config('services.google_drive.client_secret');

        if (empty($clientId) || empty($clientSecret)) {
            return response(
                '<h3>Konfigurasi Belum Lengkap</h3>'
                .'<p>GOOGLE_DRIVE_CLIENT_ID atau GOOGLE_DRIVE_CLIENT_SECRET belum dikonfigurasi di file .env.</p>'
                .'<p>Silakan isi kredensial OAuth terlebih dahulu sebelum melakukan koneksi.</p>',
                400
            );
        }

        // Generate one-time state token to protect against OAuth CSRF
        $state = Str::random(40);
        Cache::put('gdrive_oauth_state_'.$state, true, now()->addMinutes(15));

        $client = $this->createGoogleClient();
        $client->setState($state);

        // Gunakan prompt=consent untuk otorisasi ulang (reconnect) atau saat diminta eksplisit
        $existingToken = config('services.google_drive.refresh_token');
        $isReconnect = $request->boolean('force_consent') || ! empty($existingToken);
        if ($isReconnect) {
            $client->setPrompt('consent');
        }

        $authUrl = $client->createAuthUrl();

        return redirect()->away($authUrl);
    }

    /**
     * Handle Google OAuth callback with CSRF state verification.
     */
    public function callback(Request $request): Response
    {
        // 1. Check if Google returned an error query parameter (e.g. user canceled consent)
        if ($request->has('error')) {
            $error = (string) $request->query('error');
            $errorDescription = (string) $request->query('error_description', 'Otorisasi ditolak oleh pengguna atau Google.');

            Log::warning('Google Drive OAuth callback returned an error: '.$error, [
                'description' => $errorDescription,
            ]);

            return response(
                '<h3>Otorisasi Dibatalkan atau Gagal</h3>'
                .'<p>Terjadi kesalahan dari Google: '.htmlspecialchars($errorDescription).'</p>'
                .'<p><a href="/admin/orders">Kembali ke Panel Admin</a></p>',
                400
            );
        }

        // 2. Verify CSRF State
        $state = (string) $request->query('state');
        if (empty($state) || ! Cache::pull('gdrive_oauth_state_'.$state)) {
            return response('<h3>Aksi tidak sah (403): State OAuth tidak valid atau sesi telah kedaluwarsa.</h3>', 403);
        }

        // 3. Verify authorization code
        $code = (string) $request->query('code');
        if (empty($code)) {
            return response('<h3>Gagal: Kode otorisasi tidak ditemukan pada URL callback.</h3>', 400);
        }

        $clientId = config('services.google_drive.client_id');
        $clientSecret = config('services.google_drive.client_secret');

        if (empty($clientId) || empty($clientSecret)) {
            return response('<h3>Gagal: Kredensial Client ID / Secret tidak ditemukan pada konfigurasi aplikasi.</h3>', 500);
        }

        $client = $this->createGoogleClient();

        try {
            $token = $client->fetchAccessTokenWithAuthCode($code);
        } catch (\Throwable $e) {
            Log::error('Google Drive OAuth token exchange exception: '.$e->getMessage());

            return response('<h3>Gagal Mengambil Token:</h3><p>Terjadi kesalahan jaringan saat penukaran token otorisasi dengan Google. Silakan coba kembali.</p>', 500);
        }

        // Check if Google returned an error payload
        if (isset($token['error'])) {
            $errorDesc = $token['error_description'] ?? $token['error'];
            Log::error('Google Drive OAuth token exchange rejected: '.$token['error'], [
                'description' => $errorDesc,
            ]);

            return response('<h3>Otorisasi Ditolak oleh Google</h3><p>Google menolak kode otorisasi: '.htmlspecialchars($errorDesc).'</p>', 400);
        }

        $refreshToken = $token['refresh_token'] ?? null;

        if (empty($refreshToken)) {
            $reconnectUrl = URL::temporarySignedRoute('google-drive.connect', now()->addMinutes(15), ['force_consent' => 1]);

            return response(
                '<h3>Otorisasi Berhasil, Namun Refresh Token Tidak Diberikan</h3>'
                .'<p>Google tidak mengembalikan refresh token baru karena akun ini sebelumnya sudah pernah memberikan otorisasi tanpa consent ulang.</p>'
                .'<p style="margin-top: 16px;"><a href="'.$reconnectUrl.'" style="display: inline-block; background: #2563eb; color: white; padding: 10px 18px; border-radius: 8px; text-decoration: none; font-weight: bold;">Ulangi dengan Memaksa Persetujuan (Force Consent)</a></p>',
                400
            );
        }

        // 4. Safely update .env and verify persistence without logging secret tokens
        $saveResult = $this->updateEnvRefreshToken($refreshToken);
        if (! $saveResult['success']) {
            Log::error('Gagal menyimpan Google Drive refresh token: '.$saveResult['message']);

            return response(
                '<h3>Gagal Menyimpan Kredensial:</h3>'
                .'<p>'.htmlspecialchars($saveResult['message']).'</p>'
                .'<p>Pastikan izin tulis pada file .env di server sudah sesuai.</p>',
                500
            );
        }

        Log::info('Google Drive OAuth successfully connected and verified by administrator.');

        // 5. Return clean, safe HTML without leaking raw token
        return response(
            '<div style="font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 28px; border-radius: 16px; border: 1px solid #10b981; background: #ecfdf5; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">'
            .'<h2 style="color: #065f46; margin-top: 0;">✓ Google Drive Berhasil Terhubung!</h2>'
            .'<p style="color: #047857; line-height: 1.6;">Otorisasi berhasil dan token baru telah disimpan serta diverifikasi secara aman. Kuota Google Drive akun Anda kini aktif untuk penyimpanan bukti transfer pesanan.</p>'
            .'<p style="margin-top: 24px;"><a href="/admin/orders" style="display: inline-block; background: #059669; color: white; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: bold;">Kembali ke Panel Admin</a></p>'
            .'</div>'
        );
    }

    /**
     * Safely write and verify the new refresh token in .env file.
     *
     * @return array{success: bool, message: string}
     */
    public function updateEnvRefreshToken(string $refreshToken, ?string $envPath = null): array
    {
        $envPath = $envPath ?: base_path('.env');

        if (! file_exists($envPath)) {
            return [
                'success' => false,
                'message' => 'File .env tidak ditemukan di server.',
            ];
        }

        if (! is_writable($envPath)) {
            return [
                'success' => false,
                'message' => 'File .env tidak memiliki izin tulis (write permission denied).',
            ];
        }

        $envContent = file_get_contents($envPath);
        if ($envContent === false) {
            return [
                'success' => false,
                'message' => 'Gagal membaca isi file .env.',
            ];
        }

        $escapedToken = addcslashes($refreshToken, '"\\$');
        $targetLine = 'GOOGLE_DRIVE_REFRESH_TOKEN="'.$escapedToken.'"';

        if (preg_match('/^GOOGLE_DRIVE_REFRESH_TOKEN=.*$/m', $envContent)) {
            $updatedContent = preg_replace(
                '/^GOOGLE_DRIVE_REFRESH_TOKEN=.*$/m',
                $targetLine,
                $envContent
            );
        } else {
            $updatedContent = rtrim($envContent).PHP_EOL.$targetLine.PHP_EOL;
        }

        if ($updatedContent === null) {
            return [
                'success' => false,
                'message' => 'Gagal memproses string penggantian untuk .env.',
            ];
        }

        $bytes = file_put_contents($envPath, $updatedContent, LOCK_EX);
        if ($bytes === false || $bytes === 0) {
            return [
                'success' => false,
                'message' => 'Gagal menulis data ke file .env.',
            ];
        }

        // Verification step: re-read file and check token matches without printing token in logs
        $reRead = file_get_contents($envPath);
        if ($reRead === false) {
            return [
                'success' => false,
                'message' => 'Gagal membaca ulang file .env untuk verifikasi.',
            ];
        }

        if (! preg_match('/^GOOGLE_DRIVE_REFRESH_TOKEN=["\']?(.*?)["\']?$/m', $reRead, $matches)) {
            return [
                'success' => false,
                'message' => 'Kunci GOOGLE_DRIVE_REFRESH_TOKEN tidak ditemukan pada file .env setelah penulisan.',
            ];
        }

        $savedToken = trim($matches[1]);
        if (! hash_equals($refreshToken, $savedToken)) {
            return [
                'success' => false,
                'message' => 'Verifikasi integritas token gagal: token yang tersimpan pada .env tidak sesuai.',
            ];
        }

        // Invalidate configuration cache if active so next requests read the new token
        if (app()->configurationIsCached()) {
            try {
                Artisan::call('config:clear');
            } catch (\Throwable $e) {
                Log::warning('Gagal membersihkan cache konfigurasi setelah update refresh token: '.$e->getMessage());
            }
        }

        // Update in-memory runtime configuration for current request lifecycle
        config(['services.google_drive.refresh_token' => $refreshToken]);

        // Reset singleton/service instance if already bound in container
        if (app()->resolved(GoogleDriveService::class)) {
            app(GoogleDriveService::class)->resetService();
        }

        return [
            'success' => true,
            'message' => 'Token berhasil disimpan dan diverifikasi.',
        ];
    }
}
