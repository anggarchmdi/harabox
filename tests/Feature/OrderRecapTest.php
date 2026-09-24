<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OrderRecapTest extends TestCase
{
    use DatabaseTransactions;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::first() ?? User::factory()->create();
    }

    public function test_unauthenticated_user_cannot_access_order_recap(): void
    {
        $response = $this->getJson('/api/v1/admin/orders/recap');
        $response->assertStatus(401);
    }

    public function test_admin_can_retrieve_monthly_order_recap(): void
    {
        Sanctum::actingAs($this->admin);

        $category = Category::firstOrCreate(['slug' => 'test-recap-cat'], ['name' => 'Recap Cat']);
        $product = Product::firstOrCreate(
            ['slug' => 'test-recap-box'],
            [
                'category_id' => $category->id,
                'name' => 'Recap Box Menu',
                'price' => 25000,
                'minimum_order' => 5,
                'is_active' => true,
            ]
        );

        $order = Order::create([
            'order_code' => 'HB-RECAP-'.uniqid(),
            'customers_name' => 'Budi Santoso',
            'customers_phone' => '081234567891',
            'event_date' => '2026-05-15',
            'event_time' => '10:00:00',
            'delivery_address' => 'Jl. Malioboro No. 10',
            'subtotal' => 250000,
            'delivery_fee' => 20000,
            'total' => 270000,
            'status' => 'completed',
            'payment_status' => 'paid',
            'paid_amount' => 270000,
            'payment_method' => 'Transfer BCA',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'item_name' => 'Recap Box Menu',
            'price' => 25000,
            'quantity' => 10,
            'subtotal' => 250000,
        ]);

        $response = $this->getJson('/api/v1/admin/orders/recap?year=2026&month=5&date_type=event_date');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'filter_info' => [
                        'year' => 2026,
                        'month' => 5,
                        'month_name' => 'Mei',
                        'date_type' => 'event_date',
                    ],
                ],
            ]);

        $data = $response->json('data');
        $this->assertGreaterThanOrEqual(1, $data['summary']['total_orders']);
        $this->assertGreaterThanOrEqual(10, $data['summary']['total_portions']);
        $this->assertGreaterThanOrEqual(270000, $data['summary']['total_revenue']);
        $this->assertGreaterThanOrEqual(270000, $data['summary']['total_paid']);
    }

    public function test_admin_can_filter_recap_by_created_at_and_status(): void
    {
        Sanctum::actingAs($this->admin);

        $order = Order::create([
            'order_code' => 'HB-RECAP-CANCEL-'.uniqid(),
            'customers_name' => 'Siti Aminah',
            'customers_phone' => '081234567892',
            'event_date' => '2026-06-20',
            'delivery_address' => 'Jl. Solo KM 8',
            'subtotal' => 100000,
            'delivery_fee' => 0,
            'total' => 100000,
            'status' => 'cancelled',
            'payment_status' => 'unpaid',
            'paid_amount' => 0,
        ]);

        // Filter for completed orders in June: should not include this cancelled order
        $response = $this->getJson('/api/v1/admin/orders/recap?year=2026&month=6&date_type=event_date&status=completed');
        $response->assertStatus(200);

        $orderCodes = collect($response->json('data.orders.data'))->pluck('order_code');
        $this->assertNotContains($order->order_code, $orderCodes);

        // Filter for cancelled orders in June: should include this cancelled order
        $responseCancelled = $this->getJson('/api/v1/admin/orders/recap?year=2026&month=6&date_type=event_date&status=cancelled');
        $responseCancelled->assertStatus(200);

        $cancelledCodes = collect($responseCancelled->json('data.orders.data'))->pluck('order_code');
        $this->assertContains($order->order_code, $cancelledCodes);
    }

    public function test_admin_can_export_monthly_order_recap_as_excel_csv(): void
    {
        Sanctum::actingAs($this->admin);

        $order = Order::create([
            'order_code' => 'HB-EXP-'.uniqid(),
            'customers_name' => 'Dewi Sartika Export',
            'customers_phone' => '081234567899',
            'event_date' => '2026-07-10',
            'event_time' => '12:00:00',
            'delivery_address' => 'Jl. Palagan KM 9',
            'notes' => 'Tolong antar tepat waktu',
            'subtotal' => 500000,
            'delivery_fee' => 15000,
            'total' => 515000,
            'status' => 'processing',
            'payment_status' => 'dp',
            'paid_amount' => 200000,
            'payment_method' => 'Transfer Mandiri',
            'payment_note' => 'DP 40%',
        ]);

        $response = $this->get('/api/v1/admin/orders/recap/export?year=2026&month=7&date_type=event_date');

        $response->assertStatus(200);
        $this->assertStringContainsString('text/csv', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('rekap-pesanan-harabox-2026-07.csv', $response->headers->get('Content-Disposition'));

        $content = $response->streamedContent();

        // Check UTF-8 BOM
        $this->assertStringStartsWith("\xEF\xBB\xBF", $content);

        // Check report header and order content
        $this->assertStringContainsString('REKAPITULASI PESANAN KATERING - HARABOX', $content);
        $this->assertStringContainsString('Kode Pesanan', $content);
        $this->assertStringContainsString('Total Tagihan (Rp)', $content);
        $this->assertStringContainsString($order->order_code, $content);
        $this->assertStringContainsString('Dewi Sartika Export', $content);
        $this->assertStringContainsString('DP Masuk', $content);
        $this->assertStringContainsString('TOTAL (Tidak termasuk dibatalkan)', $content);
    }

    public function test_admin_can_filter_and_export_recap_by_custom_date_range(): void
    {
        Sanctum::actingAs($this->admin);

        $order1 = Order::create([
            'order_code' => 'HB-RANGE-1-'.uniqid(),
            'customers_name' => 'Pesanan Awal',
            'customers_phone' => '081111111111',
            'event_date' => '2026-08-05',
            'delivery_address' => 'Jl. Gejayan No. 1',
            'subtotal' => 200000,
            'delivery_fee' => 0,
            'total' => 200000,
            'status' => 'completed',
            'payment_status' => 'paid',
            'paid_amount' => 200000,
        ]);

        $order2 = Order::create([
            'order_code' => 'HB-RANGE-2-'.uniqid(),
            'customers_name' => 'Pesanan Akhir',
            'customers_phone' => '082222222222',
            'event_date' => '2026-08-25',
            'delivery_address' => 'Jl. Gejayan No. 2',
            'subtotal' => 300000,
            'delivery_fee' => 0,
            'total' => 300000,
            'status' => 'completed',
            'payment_status' => 'paid',
            'paid_amount' => 300000,
        ]);

        // Filter range between 2026-08-01 and 2026-08-10: should include order1, not order2
        $response = $this->getJson('/api/v1/admin/orders/recap?start_date=2026-08-01&end_date=2026-08-10&date_type=event_date');
        $response->assertStatus(200);

        $codes = collect($response->json('data.orders.data'))->pluck('order_code');
        $this->assertContains($order1->order_code, $codes);
        $this->assertNotContains($order2->order_code, $codes);

        // Export range
        $exportResponse = $this->get('/api/v1/admin/orders/recap/export?start_date=2026-08-01&end_date=2026-08-10&date_type=event_date');
        $exportResponse->assertStatus(200);
        $this->assertStringContainsString('rekap-pesanan-harabox-20260801-sd-20260810.csv', $exportResponse->headers->get('Content-Disposition'));
        $content = $exportResponse->streamedContent();
        $this->assertStringContainsString($order1->order_code, $content);
        $this->assertStringNotContainsString($order2->order_code, $content);
    }
}
