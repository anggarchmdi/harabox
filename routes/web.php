<?php

use App\Http\Controllers\GoogleDriveOAuthController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Google Drive OAuth 2.0 Authorization Flow (for personal 15GB Gmail storage)
Route::get('/google-drive/connect', [GoogleDriveOAuthController::class, 'connect']);
Route::get('/google-drive/callback', [GoogleDriveOAuthController::class, 'callback']);
