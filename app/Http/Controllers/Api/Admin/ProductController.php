<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Addon;
use App\Models\AddonGroup;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Format;
use Intervention\Image\Laravel\Facades\Image;

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
        $query = Product::with(['category', 'addonGroups.addons']);

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

            $filename = Str::uuid().'.webp';

            $path = 'products/'.$filename;

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

        if (! $product->addons_enabled) {
            $this->syncProductCustomizations($product, [], [], []);
        } elseif ($request->has('custom_nasi') || $request->has('custom_sayur') || $request->has('addons')) {
            $customNasi = $request->input('custom_nasi', []);
            $customSayur = $request->input('custom_sayur', []);
            $addonsData = $request->input('addons', []);
            $this->syncProductCustomizations($product, $customNasi, $customSayur, $addonsData);
        } elseif ($request->has('addon_group_ids')) {
            $syncData = [];
            foreach ($request->input('addon_group_ids', []) as $index => $groupId) {
                $syncData[$groupId] = ['sort_order' => $index + 1];
            }
            $product->addonGroups()->sync($syncData);
        }

        $product->load(['category', 'addonGroups.addons']);

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
        $product->load(['category', 'addonGroups.addons']);

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
            $filename = Str::uuid().'.webp';
            $path = 'products/'.$filename;
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

        if (! $product->addons_enabled) {
            $this->syncProductCustomizations($product, [], [], []);
        } elseif ($request->has('custom_nasi') || $request->has('custom_sayur') || $request->has('addons')) {
            $customNasi = $request->input('custom_nasi', []);
            $customSayur = $request->input('custom_sayur', []);
            $addonsData = $request->input('addons', []);
            $this->syncProductCustomizations($product, $customNasi, $customSayur, $addonsData);
        } elseif ($request->has('addon_group_ids')) {
            $syncData = [];
            foreach ($request->input('addon_group_ids', []) as $index => $groupId) {
                $syncData[$groupId] = ['sort_order' => $index + 1];
            }
            $product->addonGroups()->sync($syncData);
        }

        $product->load(['category', 'addonGroups.addons']);

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

    private function syncProductPackageAddons(Product $product, array $addonsData): void
    {
        $this->syncProductCustomizations($product, [], [], $addonsData);
    }

    private function syncProductCustomizations(
        Product $product,
        array $customNasi,
        array $customSayur,
        array $addonsData
    ): void {
        $existingGroups = $product->addonGroups()->with('addons')->get();

        $findGroup = function (string $type) use ($existingGroups) {
            return $existingGroups->first(function ($group) use ($type) {
                $name = strtolower($group->name);
                if ($type === 'nasi') {
                    return str_contains($name, 'nasi');
                }
                if ($type === 'sayur') {
                    return str_contains($name, 'sayur');
                }
                if ($type === 'tambahan') {
                    return str_contains($name, 'tambahan') || str_contains($name, 'addon') || (! str_contains($name, 'nasi') && ! str_contains($name, 'sayur'));
                }

                return false;
            });
        };

        $nasiGroup = $findGroup('nasi');
        $sayurGroup = $findGroup('sayur');
        $tambahanGroup = $findGroup('tambahan');

        $cleanNasi = array_values(array_filter($customNasi, fn ($item) => ! empty(trim($item['name'] ?? ''))));
        $cleanSayur = array_values(array_filter($customSayur, fn ($item) => ! empty(trim($item['name'] ?? ''))));
        $cleanAddons = array_values(array_filter($addonsData, fn ($item) => ! empty(trim($item['name'] ?? ''))));

        $this->syncSingleGroup(
            $product,
            $nasiGroup,
            'Pilihan Nasi',
            'Pilih variasi nasi untuk paket '.$product->name,
            true,
            1,
            1,
            1,
            $cleanNasi
        );

        $this->syncSingleGroup(
            $product,
            $sayurGroup,
            'Pilihan Sayur',
            'Pilih variasi sayur untuk paket '.$product->name,
            true,
            1,
            1,
            2,
            $cleanSayur
        );

        $this->syncSingleGroup(
            $product,
            $tambahanGroup,
            'Pilihan Tambahan',
            'Pilihan kustomisasi / add-on tambahan untuk paket '.$product->name,
            false,
            0,
            max(15, count($cleanAddons)),
            3,
            $cleanAddons
        );

        $product->updateQuietly([
            'custom_nasi' => empty($cleanNasi) ? null : $cleanNasi,
            'custom_sayur' => empty($cleanSayur) ? null : $cleanSayur,
        ]);
    }

    private function syncSingleGroup(
        Product $product,
        ?AddonGroup $group,
        string $groupName,
        string $description,
        bool $isRequired,
        int $minSelection,
        int $maxSelection,
        int $sortOrder,
        array $items
    ): void {
        if (empty($items)) {
            if ($group) {
                $group->addons()->delete();
                $product->addonGroups()->detach($group->id);
                $group->delete();
            }

            return;
        }

        if (! $group) {
            $group = AddonGroup::create([
                'name' => $groupName,
                'description' => $description,
                'is_required' => $isRequired,
                'min_selection' => $minSelection,
                'max_selection' => $maxSelection,
                'is_active' => true,
            ]);
            $product->addonGroups()->attach($group->id, ['sort_order' => $sortOrder]);
        } else {
            $group->update([
                'name' => $groupName,
                'description' => $description,
                'is_required' => $isRequired,
                'min_selection' => $minSelection,
                'max_selection' => $maxSelection,
                'is_active' => true,
            ]);
            $product->addonGroups()->updateExistingPivot($group->id, ['sort_order' => $sortOrder]);
        }

        $keptIds = [];
        foreach ($items as $item) {
            $addonId = $item['id'] ?? null;
            $addon = null;
            if ($addonId) {
                $addon = Addon::where('addon_group_id', $group->id)->find($addonId);
            }
            if ($addon) {
                $addon->update([
                    'name' => trim($item['name']),
                    'price' => (float) ($item['price'] ?? 0),
                    'is_active' => $item['is_active'] ?? true,
                ]);
            } else {
                $addon = Addon::create([
                    'addon_group_id' => $group->id,
                    'name' => trim($item['name']),
                    'slug' => Str::slug($item['name']).'-'.uniqid(),
                    'price' => (float) ($item['price'] ?? 0),
                    'is_active' => $item['is_active'] ?? true,
                ]);
            }
            $keptIds[] = $addon->id;
        }

        Addon::where('addon_group_id', $group->id)
            ->whereNotIn('id', $keptIds)
            ->delete();
    }
}
