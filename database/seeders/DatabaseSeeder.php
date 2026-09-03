<?php

namespace Database\Seeders;

use App\Models\Addon;
use App\Models\Category;
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
                'minimum_order' => 10,
            ],
            [
                'category_id' => $nasiBox->id,
                'name' => 'Ayam Bakar',
                'slug' => 'ayam-bakar',
                'description' => 'Ayam bakar dengan bumbu spesial.',
                'price' => 15000,
                'minimum_order' => 10,
            ],
            [
                'category_id' => $nasiBox->id,
                'name' => 'Ayam Goreng',
                'slug' => 'ayam-goreng',
                'description' => 'Ayam goreng gurih dan renyah.',
                'price' => 14000,
                'minimum_order' => 10,
            ],
            [
                'category_id' => $prasmanan->id,
                'name' => 'Rendang',
                'slug' => 'rendang',
                'description' => 'Rendang sapi dengan bumbu rempah.',
                'price' => 20000,
                'minimum_order' => 10,
            ],
            [
                'category_id' => $prasmanan->id,
                'name' => 'Sayur Capcay',
                'slug' => 'sayur-capcay',
                'description' => 'Aneka sayuran dengan bumbu gurih.',
                'price' => 8000,
                'minimum_order' => 10,
            ],
            [
                'category_id' => $prasmanan->id,
                'name' => 'Sambal',
                'slug' => 'sambal',
                'description' => 'Sambal pelengkap.',
                'price' => 3000,
                'minimum_order' => 10,
            ],
            [
                'category_id' => $prasmanan->id,
                'name' => 'Kerupuk',
                'slug' => 'kerupuk',
                'description' => 'Kerupuk sebagai pelengkap hidangan.',
                'price' => 2000,
                'minimum_order' => 10,
            ],
            [
                'category_id' => $nasiBox->id,
                'name' => 'Air Mineral',
                'slug' => 'air-mineral',
                'description' => 'Air mineral kemasan.',
                'price' => 3000,
                'minimum_order' => 10,
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
