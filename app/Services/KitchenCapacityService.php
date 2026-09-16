<?php

namespace App\Services;

use App\Models\CapacityOverride;
use App\Models\OrderItem;
use App\Models\Setting;
use Carbon\Carbon;

class KitchenCapacityService
{
    public const DEFAULT_CAPACITY = 500;

    /**
     * Get system-wide default daily box capacity.
     */
    public function getDefaultCapacity(): int
    {
        return (int) Setting::get('daily_box_capacity', self::DEFAULT_CAPACITY);
    }

    /**
     * Set system-wide default daily box capacity.
     */
    public function setDefaultCapacity(int $capacity): void
    {
        Setting::set('daily_box_capacity', $capacity);
    }

    /**
     * Format date to Y-m-d string.
     */
    protected function formatDate(string|Carbon $date): string
    {
        return $date instanceof Carbon ? $date->format('Y-m-d') : Carbon::parse($date)->format('Y-m-d');
    }

    /**
     * Get maximum capacity for a specific date (considering overrides).
     */
    public function getMaxCapacity(string|Carbon $date): int
    {
        $dateStr = $this->formatDate($date);
        $override = CapacityOverride::whereDate('date', $dateStr)->first();

        if ($override) {
            return $override->is_closed ? 0 : (int) $override->max_capacity;
        }

        return $this->getDefaultCapacity();
    }

    /**
     * Check if a specific date is marked as closed/holiday for kitchen.
     */
    public function isDateClosed(string|Carbon $date): bool
    {
        $dateStr = $this->formatDate($date);
        $override = CapacityOverride::whereDate('date', $dateStr)->first();

        return $override ? (bool) $override->is_closed : false;
    }

    /**
     * Get booked box portions for a specific date.
     * Note: Only orders with status 'processing' and 'completed' consume quota.
     * 'pending' does NOT consume quota, and 'cancelled' frees up quota.
     */
    public function getBookedPortions(string|Carbon $date): int
    {
        $dateStr = $this->formatDate($date);

        return (int) OrderItem::whereHas('order', function ($q) use ($dateStr) {
            $q->whereDate('event_date', $dateStr)
                ->whereIn('status', ['processing', 'completed']);
        })->sum('quantity');
    }

    /**
     * Get remaining available box capacity for a specific date.
     */
    public function getRemainingCapacity(string|Carbon $date): int
    {
        if ($this->isDateClosed($date)) {
            return 0;
        }

        $max = $this->getMaxCapacity($date);
        $booked = $this->getBookedPortions($date);

        return max(0, $max - $booked);
    }

    /**
     * Check if the requested portion count is available for the given date.
     */
    public function isCapacityAvailable(string|Carbon $date, int $requestedPortions): bool
    {
        if ($this->isDateClosed($date)) {
            return false;
        }

        return $this->getRemainingCapacity($date) >= $requestedPortions;
    }

    /**
     * Get detailed capacity summary for a single date.
     */
    public function getCapacitySummary(string|Carbon $date): array
    {
        $dateStr = $this->formatDate($date);
        $override = CapacityOverride::whereDate('date', $dateStr)->first();
        $isClosed = $override ? (bool) $override->is_closed : false;
        $maxCapacity = $override ? ($isClosed ? 0 : (int) $override->max_capacity) : $this->getDefaultCapacity();
        $booked = $this->getBookedPortions($dateStr);
        $remaining = $isClosed ? 0 : max(0, $maxCapacity - $booked);
        $percentage = ($maxCapacity > 0) ? min(100, round(($booked / $maxCapacity) * 100)) : 100;

        return [
            'date' => $dateStr,
            'is_closed' => $isClosed,
            'max_capacity' => $maxCapacity,
            'booked_portions' => $booked,
            'remaining_portions' => $remaining,
            'is_full' => $remaining <= 0,
            'percentage_booked' => (int) $percentage,
            'override_note' => $override?->note,
            'has_override' => (bool) $override,
        ];
    }

    /**
     * Get batch capacity summaries for a range of dates starting from $startDate.
     * Optimized with batch queries to avoid N+1 queries.
     */
    public function getUpcomingCapacities(string|Carbon $startDate, int $days = 14): array
    {
        $start = $startDate instanceof Carbon ? $startDate->copy()->startOfDay() : Carbon::parse($startDate)->startOfDay();
        $end = $start->copy()->addDays($days - 1)->endOfDay();
        $defaultCapacity = $this->getDefaultCapacity();

        // 1. Fetch overrides in date range
        $overrides = CapacityOverride::whereBetween('date', [$start->format('Y-m-d'), $end->format('Y-m-d')])
            ->get()
            ->keyBy(fn ($o) => Carbon::parse($o->date)->format('Y-m-d'));

        // 2. Fetch sum of portions grouped by event_date
        $bookedGrouped = OrderItem::selectRaw('DATE(orders.event_date) as event_date, SUM(order_items.quantity) as total_booked')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->whereBetween('orders.event_date', [$start->format('Y-m-d'), $end->format('Y-m-d')])
            ->whereIn('orders.status', ['processing', 'completed'])
            ->groupByRaw('DATE(orders.event_date)')
            ->pluck('total_booked', 'event_date');

        $result = [];
        $current = $start->copy();

        for ($i = 0; $i < $days; $i++) {
            $dateKey = $current->format('Y-m-d');
            $override = $overrides->get($dateKey);
            $isClosed = $override ? (bool) $override->is_closed : false;
            $maxCapacity = $override ? ($isClosed ? 0 : (int) $override->max_capacity) : $defaultCapacity;
            $booked = (int) ($bookedGrouped->get($dateKey) ?? 0);
            $remaining = $isClosed ? 0 : max(0, $maxCapacity - $booked);
            $percentage = ($maxCapacity > 0) ? min(100, round(($booked / $maxCapacity) * 100)) : 100;

            $result[] = [
                'date' => $dateKey,
                'is_closed' => $isClosed,
                'max_capacity' => $maxCapacity,
                'booked_portions' => $booked,
                'remaining_portions' => $remaining,
                'is_full' => $remaining <= 0,
                'percentage_booked' => (int) $percentage,
                'override_note' => $override?->note,
                'has_override' => (bool) $override,
            ];

            $current->addDay();
        }

        return $result;
    }
}
