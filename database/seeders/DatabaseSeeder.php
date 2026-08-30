<?php

namespace Database\Seeders;

use App\Models\Addon;
use App\Models\Category;
use App\Models\Package;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Admin
        |--------------------------------------------------------------------------
        */

        User::updateOrCreate(
            [
                'email' => 'admin@harabox.test',
            ],
            [
                'name' => 'Admin HaraBox',
                'password' => Hash::make('password'),
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | Categories
        |--------------------------------------------------------------------------
        */

        $nasiBox = Category::updateOrCreate(
            ['slug' => 'nasi-box'],
            [
                'name' => 'Nasi Box',
                'description' => 'Paket nasi box untuk berbagai kebutuhan acara.',
            ]
        );

        $prasmanan = Category::updateOrCreate(
            ['slug' => 'prasmanan'],
            [
                'name' => 'Prasmanan',
                'description' => 'Paket prasmanan untuk acara keluarga, kantor, dan kegiatan lainnya.',
            ]
        );

        $snackBox = Category::updateOrCreate(
            ['slug' => 'snack-box'],
            [
                'name' => 'Snack Box',
                'description' => 'Aneka paket snack box.',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | Products
        |--------------------------------------------------------------------------
        */

        $products = [
            [
                'category_id' => $nasiBox->id,
                'name' => 'Nasi Putih',
                'slug' => 'nasi-putih',
                'description' => 'Nasi putih pulen.',
                'price' => 5000,
            ],
            [
                'category_id' => $nasiBox->id,
                'name' => 'Ayam Bakar',
                'slug' => 'ayam-bakar',
                'description' => 'Ayam bakar dengan bumbu spesial.',
                'price' => 15000,
            ],
            [
                'category_id' => $nasiBox->id,
                'name' => 'Ayam Goreng',
                'slug' => 'ayam-goreng',
                'description' => 'Ayam goreng gurih dan renyah.',
                'price' => 14000,
            ],
            [
                'category_id' => $prasmanan->id,
                'name' => 'Rendang',
                'slug' => 'rendang',
                'description' => 'Rendang sapi dengan bumbu rempah.',
                'price' => 20000,
            ],
            [
                'category_id' => $prasmanan->id,
                'name' => 'Sayur Capcay',
                'slug' => 'sayur-capcay',
                'description' => 'Aneka sayuran dengan bumbu gurih.',
                'price' => 8000,
            ],
            [
                'category_id' => $prasmanan->id,
                'name' => 'Sambal',
                'slug' => 'sambal',
                'description' => 'Sambal pelengkap.',
                'price' => 3000,
            ],
            [
                'category_id' => $prasmanan->id,
                'name' => 'Kerupuk',
                'slug' => 'kerupuk',
                'description' => 'Kerupuk sebagai pelengkap hidangan.',
                'price' => 2000,
            ],
            [
                'category_id' => $nasiBox->id,
                'name' => 'Air Mineral',
                'slug' => 'air-mineral',
                'description' => 'Air mineral kemasan.',
                'price' => 3000,
            ],
        ];

        $productModels = [];

        foreach ($products as $product) {
            $productModels[$product['slug']] = Product::updateOrCreate(
                ['slug' => $product['slug']],
                [
                    ...$product,
                    'is_active' => true,
                ]
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Packages
        |--------------------------------------------------------------------------
        */

        $packages = [
            [
                'name' => 'Paket Nasi Box Hemat',
                'slug' => 'paket-nasi-box-hemat',
                'description' => 'Paket nasi box sederhana dan ekonomis.',
                'price' => 25000,
                'minimum_order' => 20,
            ],
            [
                'name' => 'Paket Nasi Box Premium',
                'slug' => 'paket-nasi-box-premium',
                'description' => 'Paket nasi box dengan pilihan menu premium.',
                'price' => 35000,
                'minimum_order' => 20,
            ],
            [
                'name' => 'Paket Prasmanan A',
                'slug' => 'paket-prasmanan-a',
                'description' => 'Paket prasmanan untuk berbagai acara.',
                'price' => 35000,
                'minimum_order' => 50,
            ],
            [
                'name' => 'Paket Prasmanan B',
                'slug' => 'paket-prasmanan-b',
                'description' => 'Paket prasmanan lengkap untuk acara spesial.',
                'price' => 45000,
                'minimum_order' => 50,
            ],
        ];

        $packageModels = [];

        foreach ($packages as $package) {
            $packageModels[$package['slug']] = Package::updateOrCreate(
                ['slug' => $package['slug']],
                [
                    ...$package,
                    'is_active' => true,
                ]
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Package Items
        |--------------------------------------------------------------------------
        */

        $packageItems = [
            'paket-nasi-box-hemat' => [
                ['product_slug' => 'nasi-putih', 'quantity' => 1],
                ['product_slug' => 'ayam-goreng', 'quantity' => 1],
                ['product_slug' => 'sambal', 'quantity' => 1],
            ],

            'paket-nasi-box-premium' => [
                ['product_slug' => 'nasi-putih', 'quantity' => 1],
                ['product_slug' => 'ayam-bakar', 'quantity' => 1],
                ['product_slug' => 'sayur-capcay', 'quantity' => 1],
                ['product_slug' => 'sambal', 'quantity' => 1],
                ['product_slug' => 'kerupuk', 'quantity' => 1],
            ],

            'paket-prasmanan-a' => [
                ['product_slug' => 'nasi-putih', 'quantity' => 1],
                ['product_slug' => 'ayam-bakar', 'quantity' => 1],
                ['product_slug' => 'sayur-capcay', 'quantity' => 1],
                ['product_slug' => 'sambal', 'quantity' => 1],
                ['product_slug' => 'kerupuk', 'quantity' => 1],
            ],

            'paket-prasmanan-b' => [
                ['product_slug' => 'nasi-putih', 'quantity' => 1],
                ['product_slug' => 'rendang', 'quantity' => 1],
                ['product_slug' => 'ayam-bakar', 'quantity' => 1],
                ['product_slug' => 'sayur-capcay', 'quantity' => 1],
                ['product_slug' => 'sambal', 'quantity' => 1],
                ['product_slug' => 'kerupuk', 'quantity' => 1],
                ['product_slug' => 'air-mineral', 'quantity' => 1],
            ],
        ];

        foreach ($packageItems as $packageSlug => $items) {
            $package = $packageModels[$packageSlug];

            $package->items()->delete();

            foreach ($items as $item) {
                $product = $productModels[$item['product_slug']];

                $package->items()->create([
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                ]);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Addons
        |--------------------------------------------------------------------------
        */

        $addons = [
            [
                'name' => 'Es Teh',
                'slug' => 'es-teh',
                'description' => 'Es teh manis.',
                'price' => 3000,
            ],
            [
                'name' => 'Air Mineral',
                'slug' => 'addon-air-mineral',
                'description' => 'Air mineral kemasan.',
                'price' => 3000,
            ],
            [
                'name' => 'Buah',
                'slug' => 'buah',
                'description' => 'Potongan buah segar.',
                'price' => 5000,
            ],
            [
                'name' => 'Kerupuk',
                'slug' => 'addon-kerupuk',
                'description' => 'Kerupuk tambahan.',
                'price' => 2000,
            ],
        ];

        foreach ($addons as $addon) {
            Addon::updateOrCreate(
                ['slug' => $addon['slug']],
                [
                    ...$addon,
                    'is_active' => true,
                ]
            );
        }
    }
}
