<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    /**
     * Get all products for admin.
     *
     * Supported query params:
     * - search
     * - category_id
     * - is_active
     * - per_page
     * - page
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::with('category');

        // Search berdasarkan nama produk
        if ($request->filled('search')) {
            $search = $request->string('search')->trim();

            $query->where('name', 'like', "%{$search}%");
        }

        // Filter berdasarkan kategori
        if ($request->filled('category_id')) {
            $query->where(
                'category_id',
                $request->integer('category_id')
            );
        }

        // Filter berdasarkan status
        if ($request->has('is_active')) {
            $query->where(
                'is_active',
                $request->boolean('is_active')
            );
        }

        // Pagination
        $perPage = min(
            max($request->integer('per_page', 10), 1),
            50
        );

        $products = $query
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        return response()->json([
            'success' => true,
            'message' => 'Products retrieved successfully',
            'data' => $products,
        ]);
    }

    /**
     * Create product.
     */
    public function store(StoreProductRequest $request): JsonResponse
    {
        $data = $request->validated();

        $data['slug'] = Str::slug($data['name']);

        $product = Product::create($data);

        $product->load('category');

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil dibuat.',
            'data' => $product,
        ], 201);
    }

    /**
     * Get product detail.
     */
    public function show(Product $product): JsonResponse
    {
        $product->load('category');

        return response()->json([
            'success' => true,
            'message' => 'Product retrieved successfully',
            'data' => $product,
        ]);
    }

    /**
     * Update product.
     */
    public function update(
        UpdateProductRequest $request,
        Product $product
    ): JsonResponse {
        $data = $request->validated();

        // Kalau nama berubah, slug ikut berubah
        if (isset($data['name']) && $data['name'] !== $product->name) {
            $data['slug'] = Str::slug($data['name']);
        }

        $product->update($data);

        $product->load('category');

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully',
            'data' => $product,
        ]);
    }

    /**
     * Delete product.
     */
    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully',
        ]);
    }
}
