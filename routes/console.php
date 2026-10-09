<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\URL;

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
    $signedConnectUrl = URL::temporarySignedRoute('google-drive.connect', now()->addMinutes(30));

    $this->info('=== Google Drive OAuth 2.0 Secure Setup ===');
    $this->line('1. Pastikan Authorized Redirect URI di Google Cloud Console adalah:');
    $this->comment("   {$redirectUri}");
    $this->line('2. Buka link bertanda tangan aman ini di browser (berlaku 30 menit):');
    $this->comment("   {$signedConnectUrl}");

    return 0;
})->purpose('Menampilkan link otorisasi OAuth 2.0 bertanda tangan aman untuk Google Drive');

// Jadwal pembersihan log aktivitas otomatis (retensi 60 hari)
\Illuminate\Support\Facades\Schedule::command('activity-logs:prune --days=60')->daily();

