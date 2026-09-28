<?php

use Google\Client;
use Google\Service\Drive;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('drive:auth', function () {
    $clientId = config('services.google_drive.client_id');
    $clientSecret = config('services.google_drive.client_secret');

    if (empty($clientId) || empty($clientSecret)) {
        $this->error('GOOGLE_DRIVE_CLIENT_ID atau GOOGLE_DRIVE_CLIENT_SECRET belum diisi di .env.');
        $this->info('Silakan isi terlebih dahulu di .env:');
        $this->line('GOOGLE_DRIVE_CLIENT_ID=...');
        $this->line('GOOGLE_DRIVE_CLIENT_SECRET=...');

        return 1;
    }

    $redirectUri = url('/google-drive/callback');
    $client = new Client;
    $client->setClientId($clientId);
    $client->setClientSecret($clientSecret);
    $client->setRedirectUri($redirectUri);
    $client->addScope(Drive::DRIVE);
    $client->setAccessType('offline');
    $client->setPrompt('consent');

    $authUrl = $client->createAuthUrl();

    $this->info('=== Google Drive OAuth 2.0 Setup ===');
    $this->line('1. Pastikan Authorized Redirect URI di Google Cloud Console adalah:');
    $this->comment("   {$redirectUri}");
    $this->line('2. Buka URL ini di browser untuk login dengan akun Google Anda:');
    $this->comment('   '.url('/google-drive/connect'));
    $this->line('3. Atau buka URL otorisasi langsung:');
    $this->comment("   {$authUrl}");

    return 0;
})->purpose('Menampilkan link otorisasi OAuth 2.0 untuk Google Drive');
