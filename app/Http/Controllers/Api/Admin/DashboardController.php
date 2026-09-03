<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $today = Carbon::today();
        $startOfMonth = Carbon::now()->startOfMonth();
        $startOfPreviousMonth = Carbon::now()
            ->subMonthNoOverflow()
            ->startOfMonth();

        $endOfPreviousMonth = Carbon::now()
            ->subMonthNoOverflow()
            ->endOfMonth();

        /*
        |--------------------------------------------------------------------------
        | Current period
        |--------------------------------------------------------------------------
        */

        $ordersToday = Order::query()
            ->whereDate('created_at', $today)
            ->count();

        $ordersThisMonth = Order::query()
            ->whereBetween('created_at', [
                $startOfMonth,
                Carbon::now(),
            ])
            ->count();

        $revenueToday = Order::query()
            ->whereDate('created_at', $today)
            ->whereNotIn('status', ['cancelled'])
            ->sum('total');

        $revenueThisMonth = Order::query()
            ->whereBetween('created_at', [
                $startOfMonth,
                Carbon::now(),
            ])
            ->whereNotIn('status', ['cancelled'])
            ->sum('total');

        /*
        |--------------------------------------------------------------------------
        | Previous month comparison
        |--------------------------------------------------------------------------
        */

        $ordersPreviousMonth = Order::query()
            ->whereBetween('created_at', [
                $startOfPreviousMonth,
                $endOfPreviousMonth,
            ])
            ->count();

        $revenuePreviousMonth = Order::query()
            ->whereBetween('created_at', [
                $startOfPreviousMonth,
                $endOfPreviousMonth,
            ])
            ->whereNotIn('status', ['cancelled'])
            ->sum('total');

        /*
        |--------------------------------------------------------------------------
        | Growth
        |--------------------------------------------------------------------------
        */

        $orderGrowth = $this->calculateGrowth(
            $ordersPreviousMonth,
            $ordersThisMonth
        );

        $revenueGrowth = $this->calculateGrowth(
            $revenuePreviousMonth,
            $revenueThisMonth
        );

        /*
        |--------------------------------------------------------------------------
        | Products
        |--------------------------------------------------------------------------
        */

        $totalProducts = Product::query()->count();

        $activeProducts = Product::query()
            ->where('is_active', true)
            ->count();

        /*
        |--------------------------------------------------------------------------
        | Categories
        |--------------------------------------------------------------------------
        */

        $totalCategories = Category::query()->count();

        $activeCategories = $totalCategories;

        /*
        |--------------------------------------------------------------------------
        | Last 7 days
        |--------------------------------------------------------------------------
        */

        $sevenDaysAgo = Carbon::today()->subDays(6);

        $dailyOrders = Order::query()
            ->selectRaw('DATE(created_at) as date')
            ->selectRaw('COUNT(*) as total_orders')
            ->selectRaw(
                'SUM(
                    CASE
                        WHEN status != "cancelled"
                        THEN total
                        ELSE 0
                    END
                ) as revenue'
            )
            ->whereBetween('created_at', [
                $sevenDaysAgo->startOfDay(),
                Carbon::now(),
            ])
            ->groupByRaw('DATE(created_at)')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $lastSevenDays = collect();

        for ($i = 0; $i < 7; $i++) {
            $date = $sevenDaysAgo->copy()->addDays($i);
            $dateKey = $date->format('Y-m-d');

            $day = $dailyOrders->get($dateKey);

            $lastSevenDays->push([
                'date' => $dateKey,
                'label' => $date->translatedFormat('D'),
                'orders' => (int) ($day->total_orders ?? 0),
                'revenue' => (float) ($day->revenue ?? 0),
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Order statuses
        |--------------------------------------------------------------------------
        */

        $statusCounts = Order::query()
            ->select('status')
            ->selectRaw('COUNT(*) as total')
            ->groupBy('status')
            ->orderByDesc('total')
            ->get()
            ->map(function ($item) {
                return [
                    'status' => $item->status,
                    'total' => (int) $item->total,
                ];
            })
            ->values();

        /*
        |--------------------------------------------------------------------------
        | Recent orders
        |--------------------------------------------------------------------------
        */

        $recentOrders = Order::query()
            ->with(['items.product'])
            ->latest()
            ->limit(15)
            ->get([
                'id',
                'order_code',
                'customers_name',
                'customers_phone',
                'event_date',
                'event_time',
                'delivery_address',
                'notes',
                'subtotal',
                'delivery_fee',
                'total',
                'status',
                'created_at',
            ]);

        /*
        |--------------------------------------------------------------------------
        | Status specific counts
        |--------------------------------------------------------------------------
        */

        $pendingOrders = Order::query()
            ->where('status', 'pending')
            ->count();

        $processingOrders = Order::query()
            ->whereIn('status', ['processing', 'confirmed'])
            ->count();

        $completedOrders = Order::query()
            ->where('status', 'completed')
            ->count();

        /*
        |--------------------------------------------------------------------------
        | Response
        |--------------------------------------------------------------------------
        */

        return response()->json([
            'success' => true,
            'message' => 'Dashboard retrieved successfully',

            'data' => [
                'summary' => [
                    'orders_today' => $ordersToday,
                    'orders_this_month' => $ordersThisMonth,

                    'revenue_today' => (float) $revenueToday,
                    'revenue_this_month' => (float) $revenueThisMonth,

                    'orders_growth' => $orderGrowth,
                    'revenue_growth' => $revenueGrowth,

                    'total_products' => $totalProducts,
                    'active_products' => $activeProducts,

                    'total_categories' => $totalCategories,
                    'active_categories' => $activeCategories,

                    'pending_orders' => $pendingOrders,
                    'processing_orders' => $processingOrders,
                    'completed_orders' => $completedOrders,
                ],

                'last_seven_days' => $lastSevenDays,

                'order_statuses' => $statusCounts,

                'recent_orders' => $recentOrders,
            ],
        ]);
    }

    private function calculateGrowth(
        float|int $previous,
        float|int $current
    ): float {
        if ($previous == 0) {
            return $current > 0 ? 100 : 0;
        }

        return round(
            (($current - $previous) / $previous) * 100,
            1
        );
    }
}
