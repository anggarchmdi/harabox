<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Package;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PackageController extends Controller
{
    /**
     * Display a listing of active packages.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min(
            $request->integer('per_page', 10),
            50
        );

        $packages = Package::query()
            ->with([
                'items.product:id,category_id,name,slug,description,price,image,is_active',
            ])
            ->where('is_active', true)
            ->latest()
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Packages retrieved successfully',
            'data' => $packages->items(),
            'meta' => [
                'current_page' => $packages->currentPage(),
                'last_page' => $packages->lastPage(),
                'per_page' => $packages->perPage(),
                'total' => $packages->total(),
            ],
        ]);
    }

    /**
     * Store a newly created package.
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
     * Display the specified package.
     */
    public function show(string $slug): JsonResponse
    {
        $package = Package::query()
            ->with([
                'items.product:id,category_id,name,slug,description,price,image,is_active',
            ])
            ->where('slug', $slug)
            ->where('is_active', true)
            ->first();

        if (!$package) {
            return response()->json([
                'success' => false,
                'message' => 'Package not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Package retrieved successfully',
            'data' => $package,
        ]);
    }

    /**
     * Update the specified package.
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
     * Remove the specified package.
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
