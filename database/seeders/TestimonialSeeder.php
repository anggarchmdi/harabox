<?php

namespace Database\Seeders;

use App\Models\Testimonial;
use Illuminate\Database\Seeder;

class TestimonialSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
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
