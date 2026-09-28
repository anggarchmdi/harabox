<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use App\Services\GoogleDriveService;
use Exception;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use Mockery\MockInterface;
use Tests\TestCase;

class OrderPaymentProofTest extends TestCase
{
    use DatabaseTransactions;

    protected User $admin;

    protected Order $order;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::first() ?? User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        $this->order = Order::create([
            'order_code' => 'ORD-TEST-'.uniqid(),
            'customers_name' => 'Budi Santoso',
            'customers_phone' => '081234567890',
            'event_date' => now()->addDays(3)->format('Y-m-d'),
            'event_time' => '12:00',
            'delivery_address' => 'Jl. Test No. 123, Sleman',
            'subtotal' => 1500000,
            'delivery_fee' => 0,
            'total' => 1500000,
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'paid_amount' => 0,
        ]);
    }

    public function test_guest_cannot_upload_payment_proof(): void
    {
        $response = $this->postJson("/api/v1/admin/orders/{$this->order->id}/payment-proof", [
            'payment_type' => 'dp',
            'file' => UploadedFile::fake()->image('bukti.jpg'),
        ]);

        $response->assertStatus(401);
    }

    public function test_inactive_admin_cannot_upload_payment_proof(): void
    {
        $inactiveAdmin = User::factory()->create([
            'role' => 'admin',
            'is_active' => false,
        ]);

        Sanctum::actingAs($inactiveAdmin);

        $response = $this->postJson("/api/v1/admin/orders/{$this->order->id}/payment-proof", [
            'payment_type' => 'dp',
            'file' => UploadedFile::fake()->image('bukti.jpg'),
        ]);

        // Sanctum rejects inactive users or 401/403
        $this->assertTrue(in_array($response->status(), [401, 403]));
    }

    public function test_validation_rejects_invalid_inputs(): void
    {
        Sanctum::actingAs($this->admin);

        // Missing file and payment_type
        $response = $this->postJson("/api/v1/admin/orders/{$this->order->id}/payment-proof", []);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['payment_type', 'file']);

        // Invalid arbitrary payment_type
        $response2 = $this->postJson("/api/v1/admin/orders/{$this->order->id}/payment-proof", [
            'payment_type' => 'cicilan_3',
            'file' => UploadedFile::fake()->image('bukti.jpg'),
        ]);
        $response2->assertStatus(422)
            ->assertJsonValidationErrors(['payment_type']);

        // Invalid file type (e.g. text file instead of image)
        $response3 = $this->postJson("/api/v1/admin/orders/{$this->order->id}/payment-proof", [
            'payment_type' => 'dp',
            'file' => UploadedFile::fake()->create('document.pdf', 100, 'application/pdf'),
        ]);
        $response3->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    public function test_admin_can_upload_dp_proof_successfully(): void
    {
        Sanctum::actingAs($this->admin);

        $this->mock(GoogleDriveService::class, function (MockInterface $mock) {
            $mock->shouldReceive('uploadPaymentProof')
                ->once()
                ->andReturn([
                    'file_id' => 'mock-dp-file-id-123',
                    'file_name' => 'bukti-transfer.webp',
                    'file_url' => 'https://drive.google.com/file/d/mock-dp-file-id-123/view',
                ]);
        });

        $response = $this->postJson("/api/v1/admin/orders/{$this->order->id}/payment-proof", [
            'payment_type' => 'dp',
            'file' => UploadedFile::fake()->image('bukti_dp.jpg', 600, 600),
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Bukti transfer berhasil diupload.',
                'data' => [
                    'order_id' => $this->order->id,
                    'payment_type' => 'dp',
                    'drive_file_id' => 'mock-dp-file-id-123',
                    'drive_file_name' => 'bukti-transfer.webp',
                ],
            ]);

        $this->assertDatabaseHas('order_payment_proofs', [
            'order_id' => $this->order->id,
            'payment_type' => 'dp',
            'drive_file_id' => 'mock-dp-file-id-123',
        ]);
    }

    public function test_admin_can_upload_pelunasan_proof_without_overwriting_dp(): void
    {
        Sanctum::actingAs($this->admin);

        // Pre-create DP proof
        $this->order->paymentProofs()->create([
            'payment_type' => 'dp',
            'drive_file_id' => 'mock-dp-file-id-123',
            'drive_file_name' => 'bukti-transfer.webp',
            'drive_file_url' => 'https://drive.google.com/file/d/mock-dp-file-id-123/view',
            'uploaded_at' => now()->subDays(2),
        ]);

        $this->mock(GoogleDriveService::class, function (MockInterface $mock) {
            $mock->shouldReceive('uploadPaymentProof')
                ->once()
                ->andReturn([
                    'file_id' => 'mock-pelunasan-file-id-456',
                    'file_name' => 'bukti-transfer.webp',
                    'file_url' => 'https://drive.google.com/file/d/mock-pelunasan-file-id-456/view',
                ]);
        });

        $response = $this->postJson("/api/v1/admin/orders/{$this->order->id}/payment-proof", [
            'payment_type' => 'pelunasan',
            'file' => UploadedFile::fake()->image('pelunasan.png', 800, 600),
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'payment_type' => 'pelunasan',
                    'drive_file_id' => 'mock-pelunasan-file-id-456',
                ],
            ]);

        // Verify both DP and Pelunasan exist for this order
        $this->assertEquals(2, $this->order->paymentProofs()->count());
        $this->assertDatabaseHas('order_payment_proofs', [
            'order_id' => $this->order->id,
            'payment_type' => 'dp',
            'drive_file_id' => 'mock-dp-file-id-123',
        ]);
        $this->assertDatabaseHas('order_payment_proofs', [
            'order_id' => $this->order->id,
            'payment_type' => 'pelunasan',
            'drive_file_id' => 'mock-pelunasan-file-id-456',
        ]);
    }

    public function test_google_drive_failure_does_not_save_proof_in_database(): void
    {
        Sanctum::actingAs($this->admin);

        $this->mock(GoogleDriveService::class, function (MockInterface $mock) {
            $mock->shouldReceive('uploadPaymentProof')
                ->once()
                ->andThrow(new Exception('Google Drive API Connection Timeout'));
        });

        $response = $this->postJson("/api/v1/admin/orders/{$this->order->id}/payment-proof", [
            'payment_type' => 'dp',
            'file' => UploadedFile::fake()->image('bukti.jpg'),
        ]);

        $response->assertStatus(500)
            ->assertJson([
                'success' => false,
                'message' => 'Gagal mengupload bukti transfer ke Google Drive. Silakan coba lagi.',
            ]);

        $this->assertEquals(0, $this->order->paymentProofs()->count());
    }

    public function test_admin_can_view_proofs_and_delete_proof(): void
    {
        Sanctum::actingAs($this->admin);

        $proof = $this->order->paymentProofs()->create([
            'payment_type' => 'dp',
            'drive_file_id' => 'mock-delete-file-id-999',
            'drive_file_name' => 'bukti-transfer.webp',
            'drive_file_url' => 'https://drive.google.com/file/d/mock-delete-file-id-999/view',
            'uploaded_at' => now(),
        ]);

        // 1. Get proofs list
        $listResponse = $this->getJson("/api/v1/admin/orders/{$this->order->id}/payment-proofs");
        $listResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonCount(1, 'data');

        // 2. Order detail eager loads paymentProofs
        $showResponse = $this->getJson("/api/v1/admin/orders/{$this->order->id}");
        $showResponse->assertStatus(200)
            ->assertJsonPath('data.payment_proofs.0.drive_file_id', 'mock-delete-file-id-999');

        // 3. Delete proof
        $this->mock(GoogleDriveService::class, function (MockInterface $mock) {
            $mock->shouldReceive('deleteFile')
                ->with('mock-delete-file-id-999')
                ->once()
                ->andReturn(true);
        });

        $deleteResponse = $this->deleteJson("/api/v1/admin/orders/{$this->order->id}/payment-proofs/{$proof->id}");
        $deleteResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Bukti transfer berhasil dihapus.',
            ]);

        $this->assertDatabaseMissing('order_payment_proofs', [
            'id' => $proof->id,
        ]);
    }
}
