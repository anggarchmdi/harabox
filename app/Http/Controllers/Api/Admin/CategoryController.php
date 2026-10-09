<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\Category;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::withCount('products')
            ->latest()
            ->paginate(10);

        return response()->json([
            'success' => true,
            'message' => 'Categories retrieved successfully',
            'data' => $categories,
        ]);
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $category = Category::create($request->validated());

        ActivityLogger::log(
            action: 'create',
            subjectType: 'category',
            description: "Menambahkan kategori baru '{$category->name}'",
            subjectName: $category->name,
            subjectId: $category->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Category created successfully',
            'data' => $category,
        ], 201);
    }

    public function show(Category $category): JsonResponse
    {
        $category->loadCount('products');

        return response()->json([
            'success' => true,
            'message' => 'Category retrieved successfully',
            'data' => $category,
        ]);
    }

    public function update(
        UpdateCategoryRequest $request,
        Category $category
    ): JsonResponse {
        $category->update($request->validated());

        ActivityLogger::log(
            action: 'update',
            subjectType: 'category',
            description: "Memperbarui kategori '{$category->name}'",
            subjectName: $category->name,
            subjectId: $category->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Category updated successfully',
            'data' => $category,
        ]);
    }

    public function destroy(Category $category): JsonResponse
    {
        $categoryName = $category->name;
        $categoryId = $category->id;

        $category->delete();

        ActivityLogger::log(
            action: 'delete',
            subjectType: 'category',
            description: "Menghapus kategori '{$categoryName}'",
            subjectName: $categoryName,
            subjectId: $categoryId
        );

        return response()->json([
            'success' => true,
            'message' => 'Category deleted successfully',
        ]);
    }
}
