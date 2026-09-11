<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * Display a listing of active products.
     *
     * Supported query params:
     * - search
     * - category
     * - per_page
     * - page
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::query()
            ->with('category:id,name,slug')
            ->where('is_active', true);

        // Search berdasarkan nama atau deskripsi
        if ($request->filled('search')) {
            $search = $request->string('search')->trim();

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter berdasarkan category slug
        if ($request->filled('category')) {
            $category = $request->string('category')->trim();

            $query->whereHas('category', function ($q) use ($category) {
                $q->where('slug', $category);
            });
        }

        // Pagination
        $perPage = min(
            max($request->integer('per_page', 12), 1),
            50
        );

        $products = $query
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        return response()->json([
            'success' => true,
            'message' => 'Products retrieved successfully',
            'data' => ProductResource::collection($products->items()),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        ]);
    }

    /**
     * Display the specified active product.
     */
    public function show(string $slug): JsonResponse
    {
        $product = Product::query()
            ->with('category:id,name,slug')
            ->where('slug', $slug)
            ->where('is_active', true)
            ->first();

        if (! $product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found',
            ], 404);
        }

        if ($product->addons_enabled) {
            $product->load([
                'addonGroups' => function ($q) {
                    $q->where('addon_groups.is_active', true)
                        ->orderBy('product_addon_groups.sort_order')
                        ->with(['addons' => function ($aq) {
                            $aq->where('is_active', true)->orderBy('price');
                        }]);
                },
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Product retrieved successfully',
            'data' => new ProductResource($product),
        ]);
    }
}
