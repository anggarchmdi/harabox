<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Laravel\Facades\Image;
use Intervention\Image\Format;

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

            $query->where(
                'name',
                'like',
                "%{$search}%"
            );
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

        // Generate slug dari nama produk
        $data['slug'] = Str::slug($data['name']);

        /*
        |--------------------------------------------------------------------------
        | Upload & Convert Image
        |--------------------------------------------------------------------------
        */

        if ($request->hasFile('image')) {
            $image = Image::decode(
                $request->file('image')
            );
            $image = Image::decode(
                $request->file('image')
            );

            $image->scale(width: 1200);

            $filename = Str::uuid() . '.webp';

            $path = 'products/' . $filename;

            $encoded = $image->encodeUsingFormat(
                Format::WEBP,
                quality: 80
            );

            Storage::disk('public')->put(
                $path,
                $encoded
            );

            $data['image'] = $path;
        } else {
            $data['image'] = null;
        }

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
        if (
            isset($data['name']) &&
            $data['name'] !== $product->name
        ) {
            $data['slug'] = Str::slug($data['name']);
        }

        /*
        |--------------------------------------------------------------------------
        | Upload & Replace Image
        |--------------------------------------------------------------------------
        */

        if ($request->hasFile('image')) {
            // Simpan path gambar lama
            $oldImage = $product->image;
           $image = Image::decode(
                $request->file('image')
            );
            $image->scale(width: 1200);
            $filename = Str::uuid() . '.webp';
            $path = 'products/' . $filename;
            $encoded = $image->encodeUsingFormat(
                Format::WEBP,
                quality: 80
            );
            Storage::disk('public')->put(
                $path,
                $encoded
            );
            $data['image'] = $path;
            if (
                $oldImage &&
                Storage::disk('public')->exists($oldImage)
            ) {
                Storage::disk('public')->delete($oldImage);
            }
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
        // Hapus file gambar jika ada
        if (
            $product->image &&
            Storage::disk('public')->exists($product->image)
        ) {
            Storage::disk('public')->delete(
                $product->image
            );
        }

        // Hapus product dari database
        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully',
        ]);
    }
}
