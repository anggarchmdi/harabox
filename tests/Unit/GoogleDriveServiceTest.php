<?php

namespace Tests\Unit;

use App\Models\Order;
use App\Services\GoogleDriveService;
use Google\Service\Drive;
use Google\Service\Drive\DriveFile;
use Google\Service\Drive\Resource\Files;
use Google\Service\Drive\Resource\Permissions;
use Illuminate\Http\UploadedFile;
use Mockery;
use Tests\TestCase;

class GoogleDriveServiceTest extends TestCase
{
    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_upload_payment_proof_creates_folders_with_order_code_then_customer_name(): void
    {
        config(['services.google_drive.root_folder_id' => 'root-folder-123']);

        $order = new Order;
        $order->id = 99;
        $order->order_code = 'ORD-2026-0001';
        $order->customers_name = 'Jane Doe';

        $file = UploadedFile::fake()->image('proof.jpg', 100, 100);

        /** @var GoogleDriveService&Mockery\MockInterface $service */
        $service = Mockery::mock(GoogleDriveService::class)->makePartial()->shouldAllowMockingProtectedMethods();

        $mockFilesResource = Mockery::mock(Files::class);
        $mockPermissionsResource = Mockery::mock(Permissions::class);
        $mockDriveService = Mockery::mock(Drive::class);
        $mockDriveService->files = $mockFilesResource;
        $mockDriveService->permissions = $mockPermissionsResource;

        $service->shouldReceive('getDriveService')->andReturn($mockDriveService);

        // 1. Hierarchy Check: Order Code folder inside Root folder
        $service->shouldReceive('findOrCreateFolder')
            ->with('ORD-2026-0001', 'root-folder-123')
            ->once()
            ->andReturn('folder-order-id');

        // 2. Hierarchy Check: Customer Name folder inside Order Code folder
        $service->shouldReceive('findOrCreateFolder')
            ->with('Jane Doe', 'folder-order-id')
            ->once()
            ->andReturn('folder-customer-id');

        // 3. Hierarchy Check: Payment Type folder inside Customer Name folder
        $service->shouldReceive('findOrCreateFolder')
            ->with('DP', 'folder-customer-id')
            ->once()
            ->andReturn('folder-payment-type-id');

        // 4. Hierarchy Check: Date folder inside Payment Type folder
        $service->shouldReceive('findOrCreateFolder')
            ->with(Mockery::type('string'), 'folder-payment-type-id')
            ->once()
            ->andReturn('folder-date-id');

        $service->shouldReceive('convertToWebp')->andReturn('fake-webp-content');
        $service->shouldReceive('resolveUniqueFileName')->andReturn('bukti-transfer.webp');

        $uploadedDriveFile = new DriveFile;
        $uploadedDriveFile->setId('uploaded-file-id-789');

        $mockFilesResource->shouldReceive('create')
            ->once()
            ->andReturn($uploadedDriveFile);

        $mockPermissionsResource->shouldReceive('create')->once();

        $result = $service->uploadPaymentProof($order, 'dp', $file);

        $this->assertEquals('uploaded-file-id-789', $result['file_id']);
        $this->assertEquals('bukti-transfer.webp', $result['file_name']);
    }
}
