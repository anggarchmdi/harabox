<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePackageRequest;
use App\Http\Requests\UpdatePackageRequest;
use App\Models\Package;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class PackageController extends Controller
{
    public function index(): JsonResponse
    {
        $packages = Package::with([
            'items.product',
        ])
            ->latest()
            ->paginate(10);

        return response()->json([
            'success' => true,
            'message' => 'Packages retrieved successfully',
            'data' => $packages,
        ]);
    }

    public function store(StorePackageRequest $request): JsonResponse
    {
        $package = DB::transaction(function () use ($request) {
            $data = $request->validated();

            $items = $data['items'];
            unset($data['items']);

            $package = Package::create($data);

            $package->items()->createMany($items);

            return $package->load('items.product');
        });

        return response()->json([
            'success' => true,
            'message' => 'Package created successfully',
            'data' => $package,
        ], 201);
    }

    public function show(Package $package): JsonResponse
    {
        $package->load('items.product');

        return response()->json([
            'success' => true,
            'message' => 'Package retrieved successfully',
            'data' => $package,
        ]);
    }

    public function update(
        UpdatePackageRequest $request,
        Package $package
    ): JsonResponse {
        $package = DB::transaction(function () use ($request, $package) {
            $data = $request->validated();

            $items = $data['items'] ?? null;
            unset($data['items']);

            $package->update($data);

            if ($items !== null) {
                $package->items()->delete();
                $package->items()->createMany($items);
            }

            return $package->load('items.product');
        });

        return response()->json([
            'success' => true,
            'message' => 'Package updated successfully',
            'data' => $package,
        ]);
    }

    public function destroy(Package $package): JsonResponse
    {
        $package->delete();

        return response()->json([
            'success' => true,
            'message' => 'Package deleted successfully',
        ]);
    }
}
