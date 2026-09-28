<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminPushSubscription;
use App\Services\WebPushService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PushNotificationController extends Controller
{
    public function __construct(
        protected WebPushService $webPushService
    ) {}

    /**
     * Get the VAPID public key needed for browser subscription.
     */
    public function getVapidKey(): JsonResponse
    {
        $publicKey = $this->webPushService->getPublicKey();

        return response()->json([
            'success' => true,
            'data' => [
                'public_key' => $publicKey,
            ],
        ]);
    }

    /**
     * Save an admin browser push subscription.
     */
    public function subscribe(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'endpoint' => ['required', 'string'],
            'keys' => ['required', 'array'],
            'keys.p256dh' => ['required', 'string'],
            'keys.auth' => ['required', 'string'],
            'content_encoding' => ['nullable', 'string'],
        ]);

        $this->webPushService->saveSubscription(
            $request->user()?->id,
            $validated,
            $request->userAgent()
        );

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi web push berhasil diaktifkan.',
        ]);
    }

    /**
     * Remove an admin browser push subscription.
     */
    public function unsubscribe(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'endpoint' => ['required', 'string'],
        ]);

        $this->webPushService->deleteSubscription($validated['endpoint']);

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi web push dinonaktifkan.',
        ]);
    }

    /**
     * Send a test push notification to verify setup.
     */
    public function testPush(Request $request): JsonResponse
    {
        $result = $this->webPushService->sendTestNotification();

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi uji coba telah dikirim.',
            'data' => $result,
        ]);
    }

    /**
     * Get push subscription status for admin.
     */
    public function status(Request $request): JsonResponse
    {
        $userId = $request->user()?->id;
        $userSubscriptionsCount = $userId ? AdminPushSubscription::where('user_id', $userId)->count() : 0;
        $totalSubscriptionsCount = AdminPushSubscription::count();
        $isVapidConfigured = ! empty($this->webPushService->getPublicKey());

        return response()->json([
            'success' => true,
            'data' => [
                'is_vapid_configured' => $isVapidConfigured,
                'user_subscriptions_count' => $userSubscriptionsCount,
                'total_subscriptions_count' => $totalSubscriptionsCount,
            ],
        ]);
    }
}
