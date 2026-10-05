<?php

use App\Http\Controllers\GoogleDriveOAuthController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Google Drive OAuth 2.0 Authorization Flow (Protected with signed URLs and anti-CSRF state)
Route::get('/google-drive/connect', [GoogleDriveOAuthController::class, 'connect'])
    ->name('google-drive.connect')
    ->middleware('signed');

Route::get('/google-drive/callback', [GoogleDriveOAuthController::class, 'callback'])
    ->name('google-drive.callback');

// Dynamic XML Sitemap for Google Search Console & Search Engines
Route::get('/sitemap.xml', function () {
    $staticUrls = [
        ['loc' => 'https://pawonhara.com/', 'priority' => '1.0', 'changefreq' => 'daily'],
        ['loc' => 'https://pawonhara.com/menu', 'priority' => '0.9', 'changefreq' => 'daily'],
        ['loc' => 'https://pawonhara.com/tentang-kami', 'priority' => '0.8', 'changefreq' => 'weekly'],
        ['loc' => 'https://pawonhara.com/cara-pesan', 'priority' => '0.8', 'changefreq' => 'weekly'],
        ['loc' => 'https://pawonhara.com/testimoni', 'priority' => '0.8', 'changefreq' => 'weekly'],
        ['loc' => 'https://pawonhara.com/cek-pesanan', 'priority' => '0.6', 'changefreq' => 'monthly'],
    ];

    $products = \App\Models\Product::where('is_active', true)->get();

    $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">' . "\n";

    foreach ($staticUrls as $item) {
        $xml .= "  <url>\n";
        $xml .= "    <loc>{$item['loc']}</loc>\n";
        $xml .= "    <lastmod>" . date('Y-m-d') . "</lastmod>\n";
        $xml .= "    <changefreq>{$item['changefreq']}</changefreq>\n";
        $xml .= "    <priority>{$item['priority']}</priority>\n";
        if ($item['loc'] === 'https://pawonhara.com/') {
            $xml .= "    <image:image>\n";
            $xml .= "      <image:loc>https://pawonhara.com/og-image.jpg</image:loc>\n";
            $xml .= "      <image:title>Pawon Hara | Nasi Box &amp; Katering Jogja</image:title>\n";
            $xml .= "    </image:image>\n";
        }
        $xml .= "  </url>\n";
    }

    foreach ($products as $p) {
        $lastmod = $p->updated_at ? $p->updated_at->format('Y-m-d') : date('Y-m-d');
        $xml .= "  <url>\n";
        $xml .= "    <loc>https://pawonhara.com/menu/" . htmlspecialchars($p->slug) . "</loc>\n";
        $xml .= "    <lastmod>{$lastmod}</lastmod>\n";
        $xml .= "    <changefreq>weekly</changefreq>\n";
        $xml .= "    <priority>0.8</priority>\n";
        $xml .= "  </url>\n";
    }

    $xml .= '</urlset>';

    return response($xml, 200)->header('Content-Type', 'application/xml');
});
