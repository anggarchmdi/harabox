<?php

namespace App\Http\Controllers;

use Google\Client;
use Google\Service\Drive;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class GoogleDriveOAuthController extends Controller
{
    /**
     * Generate a signed authorization URL for Super Admin.
     */
    public function getAuthUrl(): JsonResponse
    {
        $signedUrl = URL::temporarySignedRoute('google-drive.connect', now()->addMinutes(15));

        return response()->json([
            'success' => true,
            'message' => 'Signed Google Drive authorization URL generated successfully',
            'data' => [
                'url' => $signedUrl,
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
                '<h3>GOOGLE_DRIVE_CLIENT_ID atau GOOGLE_DRIVE_CLIENT_SECRET belum diisi di file .env</h3>'
                .'<p>Silakan isi di .env terlebih dahulu:</p>'
                .'<pre>GOOGLE_DRIVE_CLIENT_ID=isi_di_sini'.PHP_EOL.'GOOGLE_DRIVE_CLIENT_SECRET=isi_di_sini</pre>',
                400
            );
        }

        // Generate one-time state token to protect against OAuth CSRF
        $state = Str::random(40);
        Cache::put('gdrive_oauth_state_'.$state, true, now()->addMinutes(15));

        $client = new Client;
        $client->setClientId($clientId);
        $client->setClientSecret($clientSecret);
        $client->setRedirectUri(url('/google-drive/callback'));
        $client->addScope(Drive::DRIVE);
        $client->setAccessType('offline');
        $client->setPrompt('consent');
        $client->setState($state);

        $authUrl = $client->createAuthUrl();

        return redirect()->away($authUrl);
    }

    /**
     * Handle Google OAuth callback with CSRF state verification.
     */
    public function callback(Request $request): Response
    {
        // 1. Verify CSRF State
        $state = (string) $request->query('state');
        if (empty($state) || ! Cache::pull('gdrive_oauth_state_'.$state)) {
            return response('<h3>Aksi tidak sah (403): State OAuth tidak valid atau sesi telah kedaluwarsa.</h3>', 403);
        }

        // 2. Verify authorization code
        $code = $request->query('code');
        if (empty($code)) {
            return response('<h3>Gagal: Kode otorisasi tidak ditemukan.</h3>', 400);
        }

        $clientId = config('services.google_drive.client_id');
        $clientSecret = config('services.google_drive.client_secret');

        $client = new Client;
        $client->setClientId($clientId);
        $client->setClientSecret($clientSecret);
        $client->setRedirectUri(url('/google-drive/callback'));

        try {
            $token = $client->fetchAccessTokenWithAuthCode($code);
        } catch (\Throwable $e) {
            Log::error('Google Drive OAuth token exchange error: '.$e->getMessage());

            return response('<h3>Gagal mengambil token:</h3><p>Terjadi kesalahan saat otorisasi dengan Google.</p>', 500);
        }

        $refreshToken = $token['refresh_token'] ?? null;

        if (empty($refreshToken)) {
            $reconnectUrl = URL::temporarySignedRoute('google-drive.connect', now()->addMinutes(15));

            return response(
                '<h3>Otorisasi berhasil, tetapi Google tidak mengembalikan Refresh Token baru.</h3>'
                .'<p>Hal ini biasanya terjadi jika Anda sudah pernah login sebelumnya tanpa prompt consent.</p>'
                .'<p><a href="'.$reconnectUrl.'">Klik di sini untuk mengulangi dengan memaksa consent</a></p>',
                400
            );
        }

        // 3. Automatically update .env safely
        $envPath = base_path('.env');
        if (file_exists($envPath) && is_writable($envPath)) {
            $envContent = file_get_contents($envPath);
            if (str_contains($envContent, 'GOOGLE_DRIVE_REFRESH_TOKEN=')) {
                $envContent = preg_replace(
                    '/^GOOGLE_DRIVE_REFRESH_TOKEN=.*$/m',
                    'GOOGLE_DRIVE_REFRESH_TOKEN='.$refreshToken,
                    $envContent
                );
            } else {
                $envContent .= PHP_EOL.'GOOGLE_DRIVE_REFRESH_TOKEN='.$refreshToken.PHP_EOL;
            }
            file_put_contents($envPath, $envContent);
        }

        Log::info('Google Drive OAuth successfully connected and updated by administrator.');

        // 4. Return clean, safe HTML without leaking raw token
        return response(
            '<div style="font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 28px; border-radius: 16px; border: 1px solid #10b981; background: #ecfdf5; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">'
            .'<h2 style="color: #065f46; margin-top: 0;">✓ Google Drive Berhasil Terhubung!</h2>'
            .'<p style="color: #047857; line-height: 1.6;">Otorisasi berhasil. Kredensial telah disimpan dengan aman dan kuota Google Drive Anda kini aktif untuk penyimpanan bukti transfer pesanan.</p>'
            .'<p style="margin-top: 24px;"><a href="/admin/orders" style="display: inline-block; background: #059669; color: white; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: bold;">Kembali ke Panel Admin</a></p>'
            .'</div>'
        );
    }
}
