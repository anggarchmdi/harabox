<?php

namespace App\Services;

use App\Models\AdminPushSubscription;
use App\Models\Order;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

class WebPushService
{
    /**
     * Get the public VAPID key.
     */
    public function getPublicKey(): ?string
    {
        return config('services.webpush.public_key');
    }

    /**
     * Save or update an admin push subscription.
     *
     * @param  array{endpoint: string, keys?: array{p256dh?: string, auth?: string}, public_key?: string, auth_token?: string, content_encoding?: string}  $data
     */
    public function saveSubscription(?int $userId, array $data, ?string $userAgent = null): AdminPushSubscription
    {
        $endpoint = $data['endpoint'];
        $endpointHash = hash('sha256', $endpoint);
        $publicKey = $data['keys']['p256dh'] ?? ($data['public_key'] ?? '');
        $authToken = $data['keys']['auth'] ?? ($data['auth_token'] ?? '');
        $contentEncoding = $data['content_encoding'] ?? 'aes128gcm';

        return AdminPushSubscription::updateOrCreate(
            ['endpoint_hash' => $endpointHash],
            [
                'user_id' => $userId,
                'endpoint' => $endpoint,
                'public_key' => $publicKey,
                'auth_token' => $authToken,
                'content_encoding' => $contentEncoding,
                'user_agent' => $userAgent ? substr($userAgent, 0, 500) : null,
            ]
        );
    }

    /**
     * Delete a push subscription by its endpoint.
     */
    public function deleteSubscription(string $endpoint): bool
    {
        return (bool) AdminPushSubscription::where('endpoint_hash', hash('sha256', $endpoint))->delete();
    }

    /**
     * Send Web Push notification to all subscribed admin devices when a new order is received.
     *
     * @return array{total: int, sent: int, failed: int}
     */
    public function sendOrderNotification(Order $order): array
    {
        $itemsCount = $order->items->sum('quantity') ?: 1;
        $totalFormatted = 'Rp '.number_format((float) $order->total, 0, ',', '.');

        $payload = json_encode([
            'title' => '🔔 Pesanan Baru Masuk!',
            'body' => "{$order->order_code} • {$order->customers_name} ({$itemsCount} box, {$totalFormatted})",
            'icon' => '/favicon.webp',
            'badge' => '/favicon.webp',
            'tag' => 'new-order-'.$order->order_code,
            'url' => '/admin/orders',
            'orderId' => $order->id,
            'orderCode' => $order->order_code,
            'timestamp' => now()->timestamp * 1000,
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        return $this->broadcastPush($payload);
    }

    /**
     * Send a test push notification.
     *
     * @return array{total: int, sent: int, failed: int}
     */
    public function sendTestNotification(?int $userId = null): array
    {
        $payload = json_encode([
            'title' => '🔔 Notifikasi Pawon Hara Aktif!',
            'body' => 'Web Push & PWA berhasil dihubungkan. Notifikasi pesanan akan masuk otomatis meskipun aplikasi ditutup.',
            'icon' => '/favicon.webp',
            'badge' => '/favicon.webp',
            'tag' => 'test-push-'.time(),
            'url' => '/admin/orders',
            'timestamp' => now()->timestamp * 1000,
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        $query = AdminPushSubscription::query();
        if ($userId) {
            $query->where('user_id', $userId);
        }

        return $this->broadcastPush($payload, $query->get());
    }

    /**
     * Broadcast a push payload to subscribers.
     *
     * @param  Collection<int, AdminPushSubscription>|null  $subscriptions
     * @return array{total: int, sent: int, failed: int}
     */
    protected function broadcastPush(string $payload, $subscriptions = null): array
    {
        $subscriptions = $subscriptions ?? AdminPushSubscription::all();

        if ($subscriptions->isEmpty()) {
            return ['total' => 0, 'sent' => 0, 'failed' => 0];
        }

        $publicKey = config('services.webpush.public_key');
        $privateKey = config('services.webpush.private_key');
        $subject = config('services.webpush.subject');

        if (! $publicKey || ! $privateKey) {
            Log::warning('WebPushService: VAPID keys are not configured.');

            return ['total' => $subscriptions->count(), 'sent' => 0, 'failed' => $subscriptions->count()];
        }

        try {
            $auth = [
                'VAPID' => [
                    'subject' => $subject,
                    'publicKey' => $publicKey,
                    'privateKey' => $privateKey,
                ],
            ];

            $webPush = new WebPush($auth);
            $webPush->setReuseVAPIDHeaders(true);

            $subscriptionMap = [];
            foreach ($subscriptions as $sub) {
                try {
                    $webPushSubscription = $sub->toWebPushSubscription();
                    $webPush->queueNotification($webPushSubscription, $payload);
                    $subscriptionMap[$sub->endpoint] = $sub;
                } catch (\Throwable $e) {
                    Log::warning('WebPushService: Invalid subscription format', [
                        'id' => $sub->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            $sent = 0;
            $failed = 0;

            foreach ($webPush->flush() as $report) {
                $endpoint = $report->getRequest()->getUri()->__toString();

                if ($report->isSuccess()) {
                    $sent++;
                } else {
                    $failed++;
                    $statusCode = $report->getResponse()?->getStatusCode();
                    Log::info('WebPushService: Push notification failed', [
                        'endpoint' => substr($endpoint, 0, 40).'...',
                        'reason' => $report->getReason(),
                        'status' => $statusCode,
                    ]);

                    // Automatically purge expired or invalid subscriptions (404 Not Found, 410 Gone)
                    if (in_array($statusCode, [404, 410], true)) {
                        AdminPushSubscription::where('endpoint_hash', hash('sha256', $endpoint))->delete();
                    }
                }
            }

            return [
                'total' => $subscriptions->count(),
                'sent' => $sent,
                'failed' => $failed,
            ];
        } catch (\Throwable $e) {
            Log::error('WebPushService: Exception during push broadcast', [
                'error' => $e->getMessage(),
            ]);

            return [
                'total' => $subscriptions->count(),
                'sent' => 0,
                'failed' => $subscriptions->count(),
            ];
        }
    }
}
