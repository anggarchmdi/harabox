<?php

namespace App\Http\Controllers;

use Google\Client;
use Google\Service\Drive;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class GoogleDriveOAuthController extends Controller
{
    /**
     * Redirect to Google OAuth consent page.
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

        $client = new Client;
        $client->setClientId($clientId);
        $client->setClientSecret($clientSecret);
        $client->setRedirectUri(url('/google-drive/callback'));
        $client->addScope(Drive::DRIVE);
        $client->setAccessType('offline');
        $client->setPrompt('consent');

        $authUrl = $client->createAuthUrl();

        return redirect()->away($authUrl);
    }

    /**
     * Handle Google OAuth callback and get Refresh Token.
     */
    public function callback(Request $request): Response
    {
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
            return response('<h3>Gagal mengambil token:</h3><p>'.$e->getMessage().'</p>', 500);
        }

        $refreshToken = $token['refresh_token'] ?? null;

        if (empty($refreshToken)) {
            return response(
                '<h3>Otorisasi berhasil, tetapi Google tidak mengembalikan Refresh Token baru.</h3>'
                .'<p>Hal ini biasanya terjadi jika Anda sudah pernah login sebelumnya tanpa prompt consent.</p>'
                .'<p><a href="'.url('/google-drive/connect').'">Klik di sini untuk mengulangi dengan memaksa consent</a></p>',
                400
            );
        }

        // Automatically update .env if possible
        $envPath = base_path('.env');
        if (file_exists($envPath)) {
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

        return response(
            '<div style="font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 24px; border-radius: 12px; border: 1px solid #10b981; background: #ecfdf5;">'
            .'<h2 style="color: #065f46; margin-top: 0;">✓ Google Drive Berhasil Terhubung!</h2>'
            .'<p style="color: #047857;">Akun Google pribadi Anda sekarang dapat digunakan untuk upload bukti transfer dengan kuota 15GB akun Anda.</p>'
            .'<p style="color: #065f46;"><strong>Refresh Token Anda (sudah otomatis disimpan ke .env):</strong></p>'
            .'<div style="background: white; border: 1px solid #a7f3d0; padding: 12px; border-radius: 8px; font-family: monospace; word-break: break-all; font-size: 13px;">'
            .htmlspecialchars($refreshToken)
            .'</div>'
            .'<p style="margin-top: 20px;"><a href="/admin/orders" style="display: inline-block; background: #059669; color: white; padding: 10px 18px; border-radius: 8px; text-decoration: none; font-weight: bold;">Kembali ke Daftar Pesanan</a></p>'
            .'</div>'
        );
    }
}
