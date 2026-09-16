<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\Testimonial;
use Illuminate\Database\Seeder;

class TestimonialSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $seedOrders = [
            [
                'order_code' => 'HB-08101',
                'customers_name' => 'Dian Safitri',
                'customers_phone' => '081234567801',
                'event_date' => now()->subDays(3)->toDateString(),
                'delivery_address' => 'Gedung Menara Mandiri Lt. 12',
                'subtotal' => 85 * 25000,
                'delivery_fee' => 0,
                'total' => 85 * 25000,
                'status' => 'completed',
                'items' => [
                    ['item_name' => 'Paket Bento Katsu Komplit', 'quantity' => 85, 'price' => 25000],
                ],
            ],
            [
                'order_code' => 'HB-08102',
                'customers_name' => 'Bpk. Hendra Gunawan',
                'customers_phone' => '081234567802',
                'event_date' => now()->subDays(5)->toDateString(),
                'delivery_address' => 'Jl. Kaliurang Km 7, Yogyakarta',
                'subtotal' => 50 * 28000,
                'delivery_fee' => 0,
                'total' => 50 * 28000,
                'status' => 'completed',
                'items' => [
                    ['item_name' => 'Paket Rames Balado & Nasi Kuning', 'quantity' => 50, 'price' => 28000],
                ],
            ],
            [
                'order_code' => 'HB-08103',
                'customers_name' => 'Rian Kurniawan',
                'customers_phone' => '081234567803',
                'event_date' => now()->subDays(7)->toDateString(),
                'delivery_address' => 'Sekretariat BEM Kampus',
                'subtotal' => 120 * 24000,
                'delivery_fee' => 0,
                'total' => 120 * 24000,
                'status' => 'completed',
                'items' => [
                    ['item_name' => 'Paket Nasi Ayam Krisbar Super', 'quantity' => 120, 'price' => 24000],
                ],
            ],
        ];

        foreach ($seedOrders as $orderData) {
            $items = $orderData['items'];
            unset($orderData['items']);

            $order = Order::firstOrCreate(
                ['order_code' => $orderData['order_code']],
                $orderData
            );

            foreach ($items as $item) {
                $order->items()->firstOrCreate(
                    ['item_name' => $item['item_name']],
                    [
                        'quantity' => $item['quantity'],
                        'price' => $item['price'],
                        'subtotal' => $item['quantity'] * $item['price'],
                    ]
                );
            }
        }

        $testimonials = [
            [
                'name' => 'Dian Safitri',
                'institution' => 'HR Officer, PT Mandiri Bersama',
                'rating' => 5,
                'order_quantity' => '85 Box',
                'message' => 'Nasi Box Bento Katsunya juara! Kami pesan 85 box untuk seminar kantor, makanan tiba 30 menit sebelum jadwal. Semua peserta memuji rasa ayamnya yang renyah dan kemasannya rapi.',
                'is_displayed' => true,
                'order_code' => 'HB-08101',
            ],
            [
                'name' => 'Bpk. Hendra Gunawan',
                'institution' => 'Yogyakarta',
                'rating' => 5,
                'order_quantity' => '50 Box',
                'message' => 'Rames Balado dan Nasi Kuningnya mantap bumbu meresap. Syukuran keluarga besar jadi lancar tanpa saya harus repot masak seharian di dapur. Pelayanan adminnya ramah dan komunikatif!',
                'is_displayed' => true,
                'order_code' => 'HB-08102',
            ],
            [
                'name' => 'Rian Kurniawan',
                'institution' => 'Ketua Panitia Dies Natalis',
                'rating' => 5,
                'order_quantity' => '120 Box',
                'message' => 'Fast response banget via WhatsApp! Invoice langsung dikirim rapi, sangat memudahkan LPJ kegiatan kampus kami. Nasi box ayam krisbarnya favorit anak-anak organisasi.',
                'is_displayed' => true,
                'order_code' => 'HB-08103',
            ],
        ];

        foreach ($testimonials as $data) {
            Testimonial::firstOrCreate(
                ['name' => $data['name'], 'order_quantity' => $data['order_quantity']],
                $data
            );
        }
    }
}
