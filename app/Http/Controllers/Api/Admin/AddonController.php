<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAddonRequest;
use App\Http\Requests\UpdateAddonRequest;
use App\Models\Addon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AddonController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Addon::with('addonGroup')->latest();

        if ($request->boolean('all')) {
            return response()->json([
                'success' => true,
                'message' => 'Addons retrieved successfully',
                'data' => $query->get(),
            ]);
        }

        $addons = $query->paginate($request->integer('per_page', 10));

        return response()->json([
            'success' => true,
            'message' => 'Addons retrieved successfully',
            'data' => $addons,
        ]);
    }

    public function store(StoreAddonRequest $request): JsonResponse
    {
        $addon = Addon::create($request->validated());
        $addon->load('addonGroup');

        return response()->json([
            'success' => true,
            'message' => 'Addon created successfully',
            'data' => $addon,
        ], 201);
    }

    public function show(Addon $addon): JsonResponse
    {
        $addon->load('addonGroup');

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
        $addon->load('addonGroup');

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
