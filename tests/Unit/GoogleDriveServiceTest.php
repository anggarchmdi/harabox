<?php

namespace Tests\Unit;

use App\Exceptions\GoogleDriveAuthenticationException;
use App\Exceptions\GoogleDriveConfigurationException;
use App\Exceptions\GoogleDriveNetworkException;
use App\Models\Order;
use App\Services\GoogleDriveService;
use Google\Client;
use Google\Service\Drive;
use Google\Service\Drive\DriveFile;
use Google\Service\Drive\Resource\Files;
use Google\Service\Drive\Resource\Permissions;
use GuzzleHttp\Exception\ConnectException;
use Illuminate\Http\UploadedFile;
use Mockery;
use Psr\Http\Message\RequestInterface;
use Tests\TestCase;

class GoogleDriveServiceTest extends TestCase
{
    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_throws_configuration_exception_when_client_credentials_missing(): void
    {
        config([
            'services.google_drive.client_id' => null,
            'services.google_drive.client_secret' => null,
            'services.google_drive.credentials_path' => null,
        ]);

        $service = new GoogleDriveService;

        $this->expectException(GoogleDriveConfigurationException::class);
        $this->expectExceptionMessage('GOOGLE_DRIVE_CLIENT_ID atau GOOGLE_DRIVE_CLIENT_SECRET belum diatur');

        $service->getDriveService();
    }

    public function test_throws_configuration_exception_when_refresh_token_missing(): void
    {
        config([
            'services.google_drive.client_id' => 'mock-client-id',
            'services.google_drive.client_secret' => 'mock-client-secret',
            'services.google_drive.refresh_token' => null,
        ]);

        $service = new GoogleDriveService;

        $this->expectException(GoogleDriveConfigurationException::class);
        $this->expectExceptionMessage('Google Drive Refresh Token belum tersedia');

        $service->getDriveService();
    }

    public function test_valid_refresh_token_fetches_access_token_and_initializes_drive(): void
    {
        config([
            'services.google_drive.client_id' => 'mock-client-id',
            'services.google_drive.client_secret' => 'mock-client-secret',
            'services.google_drive.refresh_token' => 'mock-refresh-token',
        ]);

        $mockClient = Mockery::mock(Client::class);
        $mockClient->shouldReceive('setClientId')->with('mock-client-id')->once();
        $mockClient->shouldReceive('setClientSecret')->with('mock-client-secret')->once();
        $mockClient->shouldReceive('fetchAccessTokenWithRefreshToken')
            ->with('mock-refresh-token')
            ->once()
            ->andReturn([
                'access_token' => 'mock-fresh-access-token',
                'expires_in' => 3600,
            ]);
        $mockClient->shouldReceive('getAccessToken')
            ->once()
            ->andReturn(['access_token' => 'mock-fresh-access-token']);

        /** @var GoogleDriveService&Mockery\MockInterface $service */
        $service = Mockery::mock(GoogleDriveService::class)->makePartial();
        $service->shouldReceive('createGoogleClient')->once()->andReturn($mockClient);

        $drive = $service->getDriveService();

        $this->assertInstanceOf(Drive::class, $drive);
    }

    public function test_throws_authentication_exception_when_google_returns_invalid_grant(): void
    {
        config([
            'services.google_drive.client_id' => 'mock-client-id',
            'services.google_drive.client_secret' => 'mock-client-secret',
            'services.google_drive.refresh_token' => 'revoked-refresh-token',
        ]);

        $mockClient = Mockery::mock(Client::class);
        $mockClient->shouldReceive('setClientId')->with('mock-client-id')->once();
        $mockClient->shouldReceive('setClientSecret')->with('mock-client-secret')->once();
        $mockClient->shouldReceive('fetchAccessTokenWithRefreshToken')
            ->with('revoked-refresh-token')
            ->once()
            ->andReturn([
                'error' => 'invalid_grant',
                'error_description' => 'Token has been expired or revoked.',
            ]);

        /** @var GoogleDriveService&Mockery\MockInterface $service */
        $service = Mockery::mock(GoogleDriveService::class)->makePartial();
        $service->shouldReceive('createGoogleClient')->once()->andReturn($mockClient);

        $this->expectException(GoogleDriveAuthenticationException::class);
        $this->expectExceptionMessage('invalid_grant');

        $service->getDriveService();
    }

    public function test_throws_network_exception_when_google_api_times_out(): void
    {
        config([
            'services.google_drive.client_id' => 'mock-client-id',
            'services.google_drive.client_secret' => 'mock-client-secret',
            'services.google_drive.refresh_token' => 'mock-refresh-token',
        ]);

        $mockClient = Mockery::mock(Client::class);
        $mockClient->shouldReceive('setClientId')->with('mock-client-id')->once();
        $mockClient->shouldReceive('setClientSecret')->with('mock-client-secret')->once();

        $mockRequest = Mockery::mock(RequestInterface::class);
        $mockClient->shouldReceive('fetchAccessTokenWithRefreshToken')
            ->with('mock-refresh-token')
            ->once()
            ->andThrow(new ConnectException('cURL error 28: Connection timed out after 10000 milliseconds', $mockRequest));

        /** @var GoogleDriveService&Mockery\MockInterface $service */
        $service = Mockery::mock(GoogleDriveService::class)->makePartial();
        $service->shouldReceive('createGoogleClient')->once()->andReturn($mockClient);

        $this->expectException(GoogleDriveNetworkException::class);
        $this->expectExceptionMessage('Connection Timeout');

        $service->getDriveService();
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

    public function test_delete_file_handles_authentication_failure_gracefully(): void
    {
        $mockFilesResource = Mockery::mock(Files::class);
        $mockFilesResource->shouldReceive('delete')
            ->with('file-xyz-123', ['supportsAllDrives' => true])
            ->once()
            ->andThrow(new GoogleDriveAuthenticationException('Token revoked'));

        $mockDriveService = Mockery::mock(Drive::class);
        $mockDriveService->files = $mockFilesResource;

        $service = new GoogleDriveService;
        $service->setDriveService($mockDriveService);

        $result = $service->deleteFile('file-xyz-123');

        $this->assertFalse($result);
    }
}
