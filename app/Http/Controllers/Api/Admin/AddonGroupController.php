<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AddonGroup;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AddonGroupController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AddonGroup::with(['addons' => function ($q) {
            $q->orderBy('price');
        }])->latest();

        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        $groups = $query->get();

        return response()->json([
            'success' => true,
            'message' => 'Addon groups retrieved successfully',
            'data' => $groups,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_required' => ['sometimes', 'boolean'],
            'min_selection' => ['required', 'integer', 'min:0'],
            'max_selection' => ['required', 'integer', 'min:1'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $group = AddonGroup::create($validated);
        $group->load('addons');

        ActivityLogger::log(
            action: 'create',
            subjectType: 'addon_group',
            description: "Menambahkan grup pilihan addon baru '{$group->name}'",
            subjectName: $group->name,
            subjectId: $group->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Addon group created successfully',
            'data' => $group,
        ], 201);
    }

    public function show(AddonGroup $addonGroup): JsonResponse
    {
        $addonGroup->load(['addons' => function ($q) {
            $q->orderBy('price');
        }]);

        return response()->json([
            'success' => true,
            'message' => 'Addon group retrieved successfully',
            'data' => $addonGroup,
        ]);
    }

    public function update(Request $request, AddonGroup $addonGroup): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'is_required' => ['sometimes', 'boolean'],
            'min_selection' => ['sometimes', 'required', 'integer', 'min:0'],
            'max_selection' => ['sometimes', 'required', 'integer', 'min:1'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $addonGroup->update($validated);
        $addonGroup->load(['addons' => function ($q) {
            $q->orderBy('price');
        }]);

        ActivityLogger::log(
            action: 'update',
            subjectType: 'addon_group',
            description: "Memperbarui grup pilihan addon '{$addonGroup->name}'",
            subjectName: $addonGroup->name,
            subjectId: $addonGroup->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Addon group updated successfully',
            'data' => $addonGroup,
        ]);
    }

    public function destroy(AddonGroup $addonGroup): JsonResponse
    {
        $name = $addonGroup->name;
        $id = $addonGroup->id;
        $addonGroup->delete();

        ActivityLogger::log(
            action: 'delete',
            subjectType: 'addon_group',
            description: "Menghapus grup pilihan addon '{$name}'",
            subjectName: $name,
            subjectId: $id
        );

        return response()->json([
            'success' => true,
            'message' => 'Addon group deleted successfully',
        ]);
    }
}
