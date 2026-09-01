<?php

namespace App\Http\Controllers\Api\Admin;
use Illuminate\Support\Str;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Product;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    public function index(): JsonResponse
    {
        $products = Product::with('category')
            ->latest()
            ->paginate(10);

        return response()->json([
            'success' => true,
            'message' => 'Products retrieved successfully',
            'data' => $products,
        ]);
    }

    // public function store(StoreProductRequest $request): JsonResponse
    // {
    //     $product = Product::create($request->validated());

    //     $product->load('category');

    //     return response()->json([
    //         'success' => true,
    //         'message' => 'Product created successfully',
    //         'data' => $product,
    //     ], 201);
    // }

 public function store(StoreProductRequest $request)
{
    $data = $request->validated();

    $data['slug'] = Str::slug($data['name']);

    $product = Product::create($data);

    return response()->json([
        'message' => 'Produk berhasil dibuat.',
        'data' => $product,
    ], 201);
}

    public function show(Product $product): JsonResponse
    {
        $product->load('category');

        return response()->json([
            'success' => true,
            'message' => 'Product retrieved successfully',
            'data' => $product,
        ]);
    }

    public function update(
        UpdateProductRequest $request,
        Product $product
    ): JsonResponse {
        $product->update($request->validated());

        $product->load('category');

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully',
            'data' => $product,
        ]);
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully',
        ]);
    }
}
