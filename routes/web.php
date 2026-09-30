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
