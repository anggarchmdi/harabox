<?php

namespace App\Services;

use App\Exceptions\GoogleDriveAuthenticationException;
use App\Exceptions\GoogleDriveConfigurationException;
use App\Exceptions\GoogleDriveNetworkException;
use App\Models\Order;
use Exception;
use Google\Client;
use Google\Service\Drive;
use Google\Service\Drive\DriveFile;
use Google\Service\Drive\Permission;
use GuzzleHttp\Client as GuzzleClient;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Exception\RequestException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Intervention\Image\Format;
use Intervention\Image\Laravel\Facades\Image;
use RuntimeException;
use Throwable;

class GoogleDriveService
{
    protected ?Drive $driveService = null;

    /**
     * Reset the memoized Drive service instance.
     */
    public function resetService(): void
    {
        $this->driveService = null;
    }

    /**
     * Set a custom Drive service instance (useful for testing and dependency injection).
     */
    public function setDriveService(Drive $driveService): void
    {
        $this->driveService = $driveService;
    }

    /**
     * Create and configure the Google API client with proper HTTP timeouts.
     */
    public function createGoogleClient(): Client
    {
        $client = new Client;
        $client->setApplicationName((string) config('app.name', 'Harabox'));
        $client->addScope(Drive::DRIVE);

        $timeout = (int) config('services.google_drive.timeout', 30);
        $connectTimeout = (int) config('services.google_drive.connect_timeout', 10);

        $guzzle = new GuzzleClient([
            'timeout' => $timeout,
            'connect_timeout' => $connectTimeout,
            'http_errors' => false,
        ]);
        $client->setHttpClient($guzzle);

        return $client;
    }

    /**
     * Get or initialize Google Drive API client.
     *
     * @throws GoogleDriveConfigurationException
     * @throws GoogleDriveAuthenticationException
     * @throws GoogleDriveNetworkException
     */
    public function getDriveService(): Drive
    {
        if ($this->driveService !== null) {
            return $this->driveService;
        }

        $clientId = config('services.google_drive.client_id');
        $clientSecret = config('services.google_drive.client_secret');
        $refreshToken = config('services.google_drive.refresh_token');

        // 1. Prioritaskan OAuth 2.0 User Refresh Token
        if (empty($clientId) || empty($clientSecret)) {
            // Check if service account is explicitly configured without OAuth
            $credentialsPath = config('services.google_drive.credentials_path');
            if (! empty($credentialsPath)) {
                $fullPath = str_starts_with($credentialsPath, '/') ? $credentialsPath : base_path($credentialsPath);
                if (file_exists($fullPath)) {
                    $client = $this->createGoogleClient();
                    $client->setAuthConfig($fullPath);
                    $this->driveService = new Drive($client);

                    return $this->driveService;
                }
            }

            throw new GoogleDriveConfigurationException(
                'Konfigurasi Google Drive belum lengkap: GOOGLE_DRIVE_CLIENT_ID atau GOOGLE_DRIVE_CLIENT_SECRET belum diatur.'
            );
        }

        if (empty($refreshToken)) {
            throw new GoogleDriveConfigurationException(
                'Google Drive Refresh Token belum tersedia. Administrator perlu menghubungkan akun Google Drive melalui panel admin.'
            );
        }

        $client = $this->createGoogleClient();
        $client->setClientId($clientId);
        $client->setClientSecret($clientSecret);

        // Fetch fresh access token using the refresh token
        try {
            $tokenResult = $client->fetchAccessTokenWithRefreshToken($refreshToken);
        } catch (ConnectException $e) {
            Log::error('Google Drive API connection timeout saat refresh token: '.$e->getMessage());
            throw new GoogleDriveNetworkException('Google Drive API Connection Timeout: Gagal terhubung ke server Google OAuth (timeout).', 0, $e);
        } catch (RequestException $e) {
            $msg = $e->getMessage();
            if (str_contains(strtolower($msg), 'timeout') || str_contains(strtolower($msg), 'timed out') || str_contains(strtolower($msg), 'curl error 28')) {
                Log::error('Google Drive API timeout saat refresh token: '.$msg);
                throw new GoogleDriveNetworkException('Google Drive API Connection Timeout: '.$msg, 0, $e);
            }
            Log::error('Google Drive HTTP error saat refresh token: '.$msg);
            throw new GoogleDriveNetworkException('Gagal menghubungi Google Drive API: '.$msg, 0, $e);
        } catch (Throwable $e) {
            $msg = $e->getMessage();
            if (str_contains(strtolower($msg), 'timeout') || str_contains(strtolower($msg), 'timed out') || str_contains(strtolower($msg), 'curl error 28')) {
                throw new GoogleDriveNetworkException('Google Drive API Connection Timeout: '.$msg, 0, $e);
            }
            Log::error('Google Drive token refresh failed with unexpected exception: '.$msg);
            throw new GoogleDriveAuthenticationException('Gagal menyegarkan access token Google Drive: '.$msg, 0, $e);
        }

        // Validate token response
        if (isset($tokenResult['error'])) {
            $errorCode = $tokenResult['error'];
            $errorDesc = $tokenResult['error_description'] ?? $errorCode;

            Log::error("Google Drive token refresh failed [{$errorCode}]: {$errorDesc}");

            if ($errorCode === 'invalid_grant') {
                throw new GoogleDriveAuthenticationException(
                    'Google Drive token telah kedaluwarsa atau dicabut (invalid_grant). Administrator perlu melakukan otorisasi ulang (reconnect).',
                    401
                );
            }

            if ($errorCode === 'invalid_client') {
                throw new GoogleDriveConfigurationException(
                    'Kredensial Google Drive Client ID atau Client Secret tidak valid (invalid_client).',
                    401
                );
            }

            throw new GoogleDriveAuthenticationException(
                "Google Drive token refresh gagal [{$errorCode}]: {$errorDesc}",
                400
            );
        }

        $accessToken = $client->getAccessToken();
        if (empty($accessToken) || empty($accessToken['access_token'])) {
            Log::error('Google Drive token refresh returned empty access token.');
            throw new GoogleDriveAuthenticationException('Google Drive tidak mengembalikan access token yang valid.');
        }

        $this->driveService = new Drive($client);

        return $this->driveService;
    }

    /**
     * Upload payment proof to Google Drive.
     *
     * Hierarchy:
     * Bukti Transfer (Root)
     *  └── Invoice / Order Code
     *      └── Nama Customer
     *          └── DP / Pelunasan
     *              └── YYYY-MM-DD
     *                  └── bukti-transfer.webp (or bukti-transfer-<uniq>.webp)
     *
     * @return array{file_id: string, file_name: string, file_url: string}
     */
    public function uploadPaymentProof(Order $order, string $paymentType, UploadedFile $file): array
    {
        $encodedWebp = $this->convertToWebp($file);

        return $this->uploadPaymentProofContent($order, $paymentType, $encodedWebp);
    }

    /**
     * Upload an existing payment proof binary/WebP content directly to Google Drive.
     * Useful for re-uploading / syncing proofs that were saved locally due to Drive outage.
     *
     * @return array{file_id: string, file_name: string, file_url: string}
     */
    public function uploadPaymentProofContent(
        Order $order,
        string $paymentType,
        string $fileContent,
        ?string $originalFileName = null,
        ?string $date = null
    ): array {
        $rootFolderId = config('services.google_drive.root_folder_id');
        if (empty($rootFolderId)) {
            throw new GoogleDriveConfigurationException('Google Drive root folder ID belum dikonfigurasi (GOOGLE_DRIVE_FOLDER_ID).');
        }

        $service = $this->getDriveService();

        // 1. Resolve & create Invoice / Order Code Folder
        $invoiceCode = trim((string) $order->order_code);
        if ($invoiceCode === '') {
            $invoiceCode = 'ORD-'.$order->id;
        }
        $invoiceFolderId = $this->findOrCreateFolder($invoiceCode, $rootFolderId);

        // 2. Resolve & create Customer Folder
        $customerName = trim((string) $order->customers_name);
        if ($customerName === '') {
            $customerName = 'Customer Tanpa Nama';
        }
        $customerFolderId = $this->findOrCreateFolder($customerName, $invoiceFolderId);

        // 3. Resolve & create Payment Type Folder (DP / Pelunasan)
        $paymentTypeFolderName = match (strtolower(trim($paymentType))) {
            'dp' => 'DP',
            'pelunasan' => 'Pelunasan',
            default => throw new RuntimeException("Tipe pembayaran '{$paymentType}' tidak valid. Hanya menerima 'dp' atau 'pelunasan'."),
        };
        $paymentTypeFolderId = $this->findOrCreateFolder($paymentTypeFolderName, $customerFolderId);

        // 4. Resolve & create Date Folder (YYYY-MM-DD in app timezone)
        $appTimezone = config('app.timezone', 'Asia/Jakarta');
        $dateFolderName = $date ?: now()->setTimezone($appTimezone)->format('Y-m-d');
        $dateFolderId = $this->findOrCreateFolder($dateFolderName, $paymentTypeFolderId);

        // 5. Determine unique file name in the date folder
        $fileName = $this->resolveUniqueFileName($originalFileName ?: 'bukti-transfer.webp', $dateFolderId);

        // 6. Upload to Google Drive
        $fileMetadata = new DriveFile([
            'name' => $fileName,
            'parents' => [$dateFolderId],
        ]);

        try {
            $createdFile = $service->files->create($fileMetadata, [
                'data' => $fileContent,
                'mimeType' => 'image/webp',
                'uploadType' => 'multipart',
                'fields' => 'id, name, webViewLink, webContentLink',
                'supportsAllDrives' => true,
            ]);
        } catch (\Google\Service\Exception $e) {
            if ($e->getCode() === 401) {
                throw new GoogleDriveAuthenticationException('Sesi otorisasi Google Drive ditolak (401 Unauthorized). Silakan otorisasi ulang.', 401, $e);
            }
            if ($e->getCode() === 403) {
                throw new RuntimeException('Akses Google Drive ditolak (403 Forbidden). Pastikan kuota atau izin folder akun Google mencukupi.', 403, $e);
            }
            throw $e;
        } catch (ConnectException $e) {
            throw new GoogleDriveNetworkException('Google Drive API Connection Timeout: '.$e->getMessage(), 0, $e);
        } catch (RequestException $e) {
            if (str_contains(strtolower($e->getMessage()), 'timeout') || str_contains(strtolower($e->getMessage()), 'curl error 28')) {
                throw new GoogleDriveNetworkException('Google Drive API Connection Timeout: '.$e->getMessage(), 0, $e);
            }
            throw $e;
        }

        $fileId = $createdFile->getId();
        if (empty($fileId)) {
            throw new RuntimeException('Gagal mendapatkan file ID dari Google Drive.');
        }

        // 7. Attempt to set anyone with link as reader so preview works
        $this->setAnyoneReaderPermission($fileId);

        $fileUrl = $createdFile->getWebViewLink() ?: "https://drive.google.com/file/d/{$fileId}/view?usp=sharing";

        return [
            'file_id' => $fileId,
            'file_name' => $fileName,
            'file_url' => $fileUrl,
        ];
    }

    /**
     * Convert an uploaded image to WebP string format using Intervention Image.
     */
    protected function convertToWebp(UploadedFile $file): string
    {
        try {
            $image = Image::decode($file);

            return (string) $image->encodeUsingFormat(Format::WEBP, quality: 85);
        } catch (Exception $e) {
            Log::error('Gagal mengonversi gambar bukti transfer ke WebP: '.$e->getMessage(), [
                'exception' => $e,
            ]);
            throw new RuntimeException('Gagal mengonversi file gambar ke format WebP.');
        }
    }

    /**
     * Find an existing folder with the given name inside parentId, or create it.
     */
    public function findOrCreateFolder(string $folderName, string $parentId): string
    {
        $service = $this->getDriveService();

        $safeName = str_replace(['\\', "'"], ['\\\\', "\\'"], $folderName);
        $query = "name = '{$safeName}' and '{$parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false";

        try {
            $response = $service->files->listFiles([
                'q' => $query,
                'spaces' => 'drive',
                'fields' => 'files(id, name)',
                'pageSize' => 1,
                'supportsAllDrives' => true,
                'includeItemsFromAllDrives' => true,
            ]);
        } catch (\Google\Service\Exception $e) {
            if ($e->getCode() === 401) {
                throw new GoogleDriveAuthenticationException('Sesi otorisasi Google Drive ditolak (401 Unauthorized): '.$e->getMessage(), 401, $e);
            }
            throw $e;
        } catch (ConnectException $e) {
            throw new GoogleDriveNetworkException('Google Drive API Connection Timeout: '.$e->getMessage(), 0, $e);
        } catch (RequestException $e) {
            if (str_contains(strtolower($e->getMessage()), 'timeout') || str_contains(strtolower($e->getMessage()), 'curl error 28')) {
                throw new GoogleDriveNetworkException('Google Drive API Connection Timeout: '.$e->getMessage(), 0, $e);
            }
            throw $e;
        }

        $files = $response->getFiles();
        if (! empty($files) && count($files) > 0) {
            return $files[0]->getId();
        }

        // Create folder
        $folderMetadata = new DriveFile([
            'name' => $folderName,
            'mimeType' => 'application/vnd.google-apps.folder',
            'parents' => [$parentId],
        ]);

        try {
            $folder = $service->files->create($folderMetadata, [
                'fields' => 'id',
                'supportsAllDrives' => true,
            ]);
        } catch (\Google\Service\Exception $e) {
            if ($e->getCode() === 401) {
                throw new GoogleDriveAuthenticationException('Sesi otorisasi Google Drive ditolak (401 Unauthorized): '.$e->getMessage(), 401, $e);
            }
            throw $e;
        } catch (ConnectException $e) {
            throw new GoogleDriveNetworkException('Google Drive API Connection Timeout: '.$e->getMessage(), 0, $e);
        } catch (RequestException $e) {
            if (str_contains(strtolower($e->getMessage()), 'timeout') || str_contains(strtolower($e->getMessage()), 'curl error 28')) {
                throw new GoogleDriveNetworkException('Google Drive API Connection Timeout: '.$e->getMessage(), 0, $e);
            }
            throw $e;
        }

        return $folder->getId();
    }

    /**
     * Check if a file already exists in folderId. If so, generate a unique filename.
     */
    protected function resolveUniqueFileName(string $defaultName, string $folderId): string
    {
        $service = $this->getDriveService();

        $safeName = str_replace(['\\', "'"], ['\\\\', "\\'"], $defaultName);
        $query = "name = '{$safeName}' and '{$folderId}' in parents and trashed = false";

        try {
            $response = $service->files->listFiles([
                'q' => $query,
                'spaces' => 'drive',
                'fields' => 'files(id, name)',
                'pageSize' => 1,
                'supportsAllDrives' => true,
                'includeItemsFromAllDrives' => true,
            ]);
        } catch (\Google\Service\Exception $e) {
            if ($e->getCode() === 401) {
                throw new GoogleDriveAuthenticationException('Sesi otorisasi Google Drive ditolak (401 Unauthorized): '.$e->getMessage(), 401, $e);
            }
            throw $e;
        } catch (ConnectException $e) {
            throw new GoogleDriveNetworkException('Google Drive API Connection Timeout: '.$e->getMessage(), 0, $e);
        } catch (RequestException $e) {
            if (str_contains(strtolower($e->getMessage()), 'timeout') || str_contains(strtolower($e->getMessage()), 'curl error 28')) {
                throw new GoogleDriveNetworkException('Google Drive API Connection Timeout: '.$e->getMessage(), 0, $e);
            }
            throw $e;
        }

        $files = $response->getFiles();
        if (empty($files) || count($files) === 0) {
            return $defaultName;
        }

        // Already exists, create unique name
        $uniq = Str::lower(Str::random(6));

        return "bukti-transfer-{$uniq}.webp";
    }

    /**
     * Set anyone with link as reader for the uploaded file.
     */
    protected function setAnyoneReaderPermission(string $fileId): void
    {
        try {
            $service = $this->getDriveService();
            $permission = new Permission([
                'type' => 'anyone',
                'role' => 'reader',
            ]);

            $service->permissions->create($fileId, $permission, [
                'supportsAllDrives' => true,
            ]);
        } catch (Exception $e) {
            // Non-critical: file is still accessible by owner
            Log::warning("Tidak dapat mengatur public reader permission untuk file {$fileId}: ".$e->getMessage());
        }
    }

    /**
     * Delete a file from Google Drive (e.g. for rollback if DB transaction fails).
     */
    public function deleteFile(string $fileId): bool
    {
        try {
            $service = $this->getDriveService();
            $service->files->delete($fileId, [
                'supportsAllDrives' => true,
            ]);

            return true;
        } catch (GoogleDriveAuthenticationException $e) {
            Log::error("Gagal menghapus file {$fileId} dari Google Drive karena masalah otorisasi: ".$e->getMessage());

            return false;
        } catch (Throwable $e) {
            Log::error("Gagal menghapus file {$fileId} dari Google Drive: ".$e->getMessage());

            return false;
        }
    }
}
