<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Http\Request;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {// Login admin: 5 attempts per minute per IP
        RateLimiter::for('admin-login', function (Request $request) {
            return Limit::perMinute(5)
                ->by($request->ip());
        });

        // Public API: 60 requests per minute per IP
        RateLimiter::for('public-api', function (Request $request) {
            return Limit::perMinute(60)
                ->by($request->ip());
        });

        // Customer order creation: 10 requests per minute per IP
        RateLimiter::for('create-order', function (Request $request) {
            return Limit::perMinute(10)
                ->by($request->ip());
        });

        // Order confirmation: 10 requests per minute per IP
        RateLimiter::for('confirm-order', function (Request $request) {
            return Limit::perMinute(10)
                ->by($request->ip());
        });

        // Admin API: 120 requests per minute per authenticated user
        RateLimiter::for('admin-api', function (Request $request) {
            return Limit::perMinute(120)
                ->by($request->user()?->id ?? $request->ip());
        });
    }
}
