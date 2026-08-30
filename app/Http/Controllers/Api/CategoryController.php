<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    /**
     * Display a listing of active categories.
     */
    public function index(): JsonResponse
    {
        $categories = Category::query()
            ->whereHas('products', function ($query) {
                $query->where('is_active', true);
            })
            ->withCount([
                'products as active_products_count' => function ($query) {
                    $query->where('is_active', true);
                },
            ])
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'slug',
                'description',
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Categories retrieved successfully',
            'data' => $categories,
        ]);
    }

    /**
     * Store a newly created category.
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
     * Display the specified category.
     *
     * Admin endpoint - will be implemented later.
     */
    public function show(string $slug): JsonResponse
    {
        $category = Category::query()
            ->with([
                'products' => function ($query) {
                    $query
                        ->select([
                            'id',
                            'category_id',
                            'name',
                            'slug',
                            'description',
                            'price',
                            'image',
                            'is_active',
                        ])
                        ->where('is_active', true);
                },
            ])
            ->where('slug', $slug)
            ->first();

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Category not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Category retrieved successfully',
            'data' => $category,
        ]);
    }

    /**
     * Update the specified category.
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
     * Remove the specified category.
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
