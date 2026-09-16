<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CapacityOverride;
use App\Services\KitchenCapacityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function __construct(
        protected KitchenCapacityService $capacityService
    ) {}

    /**
     * Get general capacity settings & overrides list.
     */
    public function getCapacitySettings(): JsonResponse
    {
        $overrides = CapacityOverride::orderBy('date', 'asc')
            ->where('date', '>=', now()->startOfDay()->format('Y-m-d'))
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'daily_box_capacity' => $this->capacityService->getDefaultCapacity(),
                'overrides' => $overrides,
            ],
        ]);
    }

    /**
     * Update default daily box capacity.
     */
    public function updateCapacitySettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'daily_box_capacity' => ['required', 'integer', 'min:1', 'max:50000'],
        ]);

        $this->capacityService->setDefaultCapacity((int) $validated['daily_box_capacity']);

        return response()->json([
            'success' => true,
            'message' => 'Batas kuota harian berhasil disimpan.',
            'data' => [
                'daily_box_capacity' => $this->capacityService->getDefaultCapacity(),
            ],
        ]);
    }

    /**
     * Store or update a capacity override for a specific date.
     */
    public function storeOverride(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'max_capacity' => ['required', 'integer', 'min:0', 'max:50000'],
            'is_closed' => ['sometimes', 'boolean'],
            'note' => ['nullable', 'string', 'max:255'],
        ]);

        $override = CapacityOverride::updateOrCreate(
            ['date' => $validated['date']],
            [
                'max_capacity' => (int) $validated['max_capacity'],
                'is_closed' => (bool) ($validated['is_closed'] ?? false),
                'note' => $validated['note'] ?? null,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Kapasitas khusus tanggal berhasil disimpan.',
            'data' => $override,
        ]);
    }

    /**
     * Delete a capacity override for a specific date.
     */
    public function deleteOverride(string $date): JsonResponse
    {
        CapacityOverride::whereDate('date', $date)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Kapasitas khusus tanggal telah dihapus dan kembali ke kuota default.',
        ]);
    }

    /**
     * Get 14-day upcoming capacity overview.
     */
    public function getCapacityOverview(Request $request): JsonResponse
    {
        $startDate = $request->query('start_date', now()->format('Y-m-d'));
        $days = min(31, max(1, $request->integer('days', 14)));

        $overview = $this->capacityService->getUpcomingCapacities($startDate, $days);

        return response()->json([
            'success' => true,
            'data' => $overview,
        ]);
    }
}
