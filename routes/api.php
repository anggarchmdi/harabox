<?php

use App\Http\Controllers\Api\AddonController;
use App\Http\Controllers\Api\Admin\AddonController as AdminAddonController;
use App\Http\Controllers\Api\Admin\AddonGroupController as AdminAddonGroupController;
use App\Http\Controllers\Api\Admin\AuthController;
use App\Http\Controllers\Api\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Api\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Api\Admin\SettingController as AdminSettingController;
use App\Http\Controllers\Api\Admin\TestimonialController as AdminTestimonialController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\TestimonialController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // ==========================
    // PUBLIC CATALOG
    // ==========================
    Route::middleware('throttle:public-api')->group(function () {

        Route::get('/categories', [CategoryController::class, 'index']);
        Route::get('/categories/{slug}', [CategoryController::class, 'show']);

        Route::get('/products', [ProductController::class, 'index']);
        Route::get('/products/{slug}', [ProductController::class, 'show']);

        Route::get('/addons', [AddonController::class, 'index']);
        Route::get('/addons/{slug}', [AddonController::class, 'show']);

        // Testimonials (Public)
        Route::get('/testimonials', [TestimonialController::class, 'index']);
        Route::post('/testimonials', [TestimonialController::class, 'store']);
    });

    // ==========================
    // CUSTOMER ORDERS
    // ==========================

    Route::post('/orders', [OrderController::class, 'store'])->middleware('throttle:create-order');

    Route::get('/orders/{orderCode}', [
        OrderController::class,
        'show',
    ])->middleware('throttle:public-api');

    Route::post('/orders/{orderCode}/confirm', [
        OrderController::class,
        'confirm',
    ])->middleware('throttle:confirm-order');

    Route::get('/capacity-check', [
        OrderController::class,
        'checkCapacity',
    ])->middleware('throttle:public-api');

    // ==========================
    // ADMIN
    // ==========================

    Route::prefix('admin')->group(function () {

        // Authentication
        Route::post('/login', [
            AuthController::class,
            'login',
        ])->middleware('throttle:admin-login');

        Route::middleware(['auth:sanctum', 'throttle:admin-api'])->group(function () {

            Route::get('/me', [
                AuthController::class,
                'me',
            ]);

            Route::post('/logout', [
                AuthController::class,
                'logout',
            ]);

            // Dashboard overview
            Route::get('/dashboard', [
                DashboardController::class,
                'index',
            ]);

            // Kitchen Capacity & Settings
            Route::get('/settings/capacity', [
                AdminSettingController::class,
                'getCapacitySettings',
            ]);
            Route::put('/settings/capacity', [
                AdminSettingController::class,
                'updateCapacitySettings',
            ]);
            Route::post('/settings/capacity/overrides', [
                AdminSettingController::class,
                'storeOverride',
            ]);
            Route::delete('/settings/capacity/overrides/{date}', [
                AdminSettingController::class,
                'deleteOverride',
            ]);
            Route::get('/capacity/overview', [
                AdminSettingController::class,
                'getCapacityOverview',
            ]);

            // Product CRUD
            Route::apiResource(
                'products',
                AdminProductController::class
            );

            // Category CRUD
            Route::apiResource(
                'categories',
                AdminCategoryController::class
            );

            // Addons
            Route::apiResource(
                'addons',
                AdminAddonController::class
            );

            // Addon Groups
            Route::apiResource(
                'addon-groups',
                AdminAddonGroupController::class
            );

            // orders
            Route::get('/orders', [
                AdminOrderController::class,
                'index',
            ]);

            Route::get('/orders/{order}', [
                AdminOrderController::class,
                'show',
            ]);

            Route::patch('/orders/{order}/status', [
                AdminOrderController::class,
                'updateStatus',
            ]);

            Route::patch('/orders/{order}/payment', [
                AdminOrderController::class,
                'updatePayment',
            ]);

            // Testimonials (Admin)
            Route::get('/testimonials', [AdminTestimonialController::class, 'index']);
            Route::post('/testimonials', [AdminTestimonialController::class, 'store']);
            Route::patch('/testimonials/{testimonial}/toggle', [AdminTestimonialController::class, 'toggle']);
            Route::put('/testimonials/{testimonial}', [AdminTestimonialController::class, 'update']);
            Route::delete('/testimonials/{testimonial}', [AdminTestimonialController::class, 'destroy']);

        });

    });

});
