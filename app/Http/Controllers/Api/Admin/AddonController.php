<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAddonRequest;
use App\Http\Requests\UpdateAddonRequest;
use App\Models\Addon;
use Illuminate\Http\JsonResponse;

class AddonController extends Controller
{
    public function index(): JsonResponse
    {
        $addons = Addon::latest()
            ->paginate(10);

        return response()->json([
            'success' => true,
            'message' => 'Addons retrieved successfully',
            'data' => $addons,
        ]);
    }

    public function store(StoreAddonRequest $request): JsonResponse
    {
        $addon = Addon::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Addon created successfully',
            'data' => $addon,
        ], 201);
    }

    public function show(Addon $addon): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Addon retrieved successfully',
            'data' => $addon,
        ]);
    }

    public function update(
        UpdateAddonRequest $request,
        Addon $addon
    ): JsonResponse {
        $addon->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Addon updated successfully',
            'data' => $addon,
        ]);
    }

    public function destroy(Addon $addon): JsonResponse
    {
        $addon->delete();

        return response()->json([
            'success' => true,
            'message' => 'Addon deleted successfully',
        ]);
    }
}
