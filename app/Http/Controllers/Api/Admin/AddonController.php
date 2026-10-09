<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAddonRequest;
use App\Http\Requests\UpdateAddonRequest;
use App\Models\Addon;
use App\Services\ActivityLogger;
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

        ActivityLogger::log(
            action: 'create',
            subjectType: 'addon',
            description: "Menambahkan menu pelengkap/addon '{$addon->name}' (Rp " . number_format($addon->price, 0, ',', '.') . ")",
            subjectName: $addon->name,
            subjectId: $addon->id
        );

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

        ActivityLogger::log(
            action: 'update',
            subjectType: 'addon',
            description: "Memperbarui data addon '{$addon->name}'",
            subjectName: $addon->name,
            subjectId: $addon->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Addon updated successfully',
            'data' => $addon,
        ]);
    }

    public function destroy(Addon $addon): JsonResponse
    {
        $name = $addon->name;
        $id = $addon->id;
        $addon->delete();

        ActivityLogger::log(
            action: 'delete',
            subjectType: 'addon',
            description: "Menghapus menu pelengkap/addon '{$name}'",
            subjectName: $name,
            subjectId: $id
        );

        return response()->json([
            'success' => true,
            'message' => 'Addon deleted successfully',
        ]);
    }
}
