<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Addon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AddonController extends Controller
{
    /**
     * Display a listing of active addons.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min(
            $request->integer('per_page', 12),
            50
        );

        $addons = Addon::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Addons retrieved successfully',
            'data' => $addons->items(),
            'meta' => [
                'current_page' => $addons->currentPage(),
                'last_page' => $addons->lastPage(),
                'per_page' => $addons->perPage(),
                'total' => $addons->total(),
            ],
        ]);
    }

    /**
     * Store a newly created addon.
     *
     * Admin endpoint - will be implemented later.
     */
    public function store(Request $request): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Not implemented yet',
        ], 501);
    }

    /**
     * Display the specified addon.
     */
    public function show(string $slug): JsonResponse
    {
        $addon = Addon::query()
            ->where('slug', $slug)
            ->where('is_active', true)
            ->first();

        if (! $addon) {
            return response()->json([
                'success' => false,
                'message' => 'Addon not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Addon retrieved successfully',
            'data' => $addon,
        ]);
    }

    /**
     * Update the specified addon.
     *
     * Admin endpoint - will be implemented later.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Not implemented yet',
        ], 501);
    }

    /**
     * Remove the specified addon.
     *
     * Admin endpoint - will be implemented later.
     */
    public function destroy(string $id): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Not implemented yet',
        ], 501);
    }
}
