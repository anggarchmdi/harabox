<?php

namespace Database\Seeders;

use App\Models\Addon;
use App\Models\AddonGroup;
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
        | Addon Groups & Addons
        |--------------------------------------------------------------------------
        */

        $pilihanNasi = AddonGroup::updateOrCreate(
            ['name' => 'Pilihan Nasi'],
            [
                'description' => 'Pilih variasi nasi untuk paket bento Anda.',
                'is_required' => true,
                'min_selection' => 1,
                'max_selection' => 1,
                'is_active' => true,
            ]
        );

        $pilihanLauk = AddonGroup::updateOrCreate(
            ['name' => 'Pilihan Lauk'],
            [
                'description' => 'Pilih variasi olahan lauk utama.',
                'is_required' => true,
                'min_selection' => 1,
                'max_selection' => 1,
                'is_active' => true,
            ]
        );

        $tambahan = AddonGroup::updateOrCreate(
            ['name' => 'Tambahan'],
            [
                'description' => 'Menu pelengkap opsional.',
                'is_required' => false,
                'min_selection' => 0,
                'max_selection' => 5,
                'is_active' => true,
            ]
        );

        $addons = [
            // Pilihan Nasi
            [
                'addon_group_id' => $pilihanNasi->id,
                'name' => 'Nasi Putih',
                'slug' => 'addon-nasi-putih',
                'description' => 'Nasi putih pulen hangat.',
                'price' => 0,
            ],
            [
                'addon_group_id' => $pilihanNasi->id,
                'name' => 'Nasi Kuning',
                'slug' => 'addon-nasi-kuning',
                'description' => 'Nasi kuning rempah wangi gurih.',
                'price' => 1000,
            ],
            [
                'addon_group_id' => $pilihanNasi->id,
                'name' => 'Nasi Uduk',
                'slug' => 'addon-nasi-uduk',
                'description' => 'Nasi uduk gurih santan kelapa.',
                'price' => 2000,
            ],

            // Pilihan Lauk
            [
                'addon_group_id' => $pilihanLauk->id,
                'name' => 'Ayam Goreng Lengkuas',
                'slug' => 'addon-ayam-goreng-lengkuas',
                'description' => 'Ayam goreng gurih bertabur serundeng lengkuas.',
                'price' => 0,
            ],
            [
                'addon_group_id' => $pilihanLauk->id,
                'name' => 'Ayam Bakar Madu',
                'slug' => 'addon-ayam-bakar-madu',
                'description' => 'Ayam bakar dengan bumbu madu gurih manis.',
                'price' => 2000,
            ],

            // Tambahan
            [
                'addon_group_id' => $tambahan->id,
                'name' => 'Es Teh Manis',
                'slug' => 'es-teh',
                'description' => 'Es teh manis segar.',
                'price' => 3000,
            ],
            [
                'addon_group_id' => $tambahan->id,
                'name' => 'Air Mineral',
                'slug' => 'addon-air-mineral',
                'description' => 'Air mineral kemasan.',
                'price' => 3000,
            ],
            [
                'addon_group_id' => $tambahan->id,
                'name' => 'Potongan Buah Segar',
                'slug' => 'buah',
                'description' => 'Potongan buah segar semangka & melon.',
                'price' => 5000,
            ],
            [
                'addon_group_id' => $tambahan->id,
                'name' => 'Kerupuk Udang',
                'slug' => 'addon-kerupuk',
                'description' => 'Kerupuk renyah pelengkap hidangan.',
                'price' => 1000,
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

        /*
        |--------------------------------------------------------------------------
        | Attach Addon Groups to Bento / Nasi Box Products
        |--------------------------------------------------------------------------
        */

        $customizableProducts = ['ayam-bakar', 'ayam-goreng'];

        foreach ($customizableProducts as $slug) {
            if (isset($productModels[$slug])) {
                $p = $productModels[$slug];
                $p->update(['addons_enabled' => true]);
                $p->addonGroups()->syncWithoutDetaching([
                    $pilihanNasi->id => ['sort_order' => 1],
                    $pilihanLauk->id => ['sort_order' => 2],
                    $tambahan->id => ['sort_order' => 3],
                ]);
            }
        }
    }
}
