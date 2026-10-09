<?php

namespace App\Services;

use App\Models\Order;
use Exception;
use Google\Client;
use Google\Service\Drive;
use Google\Service\Drive\DriveFile;
use Google\Service\Drive\Permission;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Intervention\Image\Format;
use Intervention\Image\Laravel\Facades\Image;
use RuntimeException;

class GoogleDriveService
{
    protected ?Drive $driveService = null;

    /**
     * Get or initialize Google Drive API client.
     */
    public function getDriveService(): Drive
    {
        if ($this->driveService !== null) {
            return $this->driveService;
        }

        $clientId = config('services.google_drive.client_id');
        $clientSecret = config('services.google_drive.client_secret');
        $refreshToken = config('services.google_drive.refresh_token');

        $client = new Client;
        $client->setApplicationName(config('app.name', 'Harabox'));
        $client->addScope(Drive::DRIVE);

        // 1. Prioritaskan OAuth 2.0 User Refresh Token (menggunakan kuota 15GB akun Gmail personal)
        if (! empty($clientId) && ! empty($clientSecret) && ! empty($refreshToken)) {
            $client->setClientId($clientId);
            $client->setClientSecret($clientSecret);
            $tokenResult = $client->fetchAccessTokenWithRefreshToken($refreshToken);

            if (isset($tokenResult['error'])) {
                Log::error('Google Drive token refresh failed: '.($tokenResult['error_description'] ?? $tokenResult['error']));
                throw new RuntimeException('Google Drive token telah kedaluwarsa atau tidak valid: '.($tokenResult['error_description'] ?? $tokenResult['error']));
            }

            $this->driveService = new Drive($client);

            return $this->driveService;
        }

        // 2. Fallback ke Service Account Credentials JSON (untuk Shared Drive / Workspace)
        $credentialsPath = config('services.google_drive.credentials_path');
        if (! empty($credentialsPath)) {
            $fullPath = str_starts_with($credentialsPath, '/') ? $credentialsPath : base_path($credentialsPath);
            if (file_exists($fullPath)) {
                $client->setAuthConfig($fullPath);
                $this->driveService = new Drive($client);

                return $this->driveService;
            }
        }

        throw new RuntimeException('Kredensial Google Drive belum lengkap. Harap konfigurasi GOOGLE_DRIVE_REFRESH_TOKEN (OAuth 2.0) atau GOOGLE_DRIVE_CREDENTIALS (Service Account).');
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
        $rootFolderId = config('services.google_drive.root_folder_id');
        if (empty($rootFolderId)) {
            throw new RuntimeException('Google Drive root folder ID belum dikonfigurasi.');
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
        $dateFolderName = now()->setTimezone($appTimezone)->format('Y-m-d');
        $dateFolderId = $this->findOrCreateFolder($dateFolderName, $paymentTypeFolderId);

        // 5. Convert Image to WebP format
        $encodedWebp = $this->convertToWebp($file);

        // 6. Determine unique file name in the date folder
        $fileName = $this->resolveUniqueFileName('bukti-transfer.webp', $dateFolderId);

        // 7. Upload to Google Drive
        $fileMetadata = new DriveFile([
            'name' => $fileName,
            'parents' => [$dateFolderId],
        ]);

        $createdFile = $service->files->create($fileMetadata, [
            'data' => $encodedWebp,
            'mimeType' => 'image/webp',
            'uploadType' => 'multipart',
            'fields' => 'id, name, webViewLink, webContentLink',
            'supportsAllDrives' => true,
        ]);

        $fileId = $createdFile->getId();
        if (empty($fileId)) {
            throw new RuntimeException('Gagal mendapatkan file ID dari Google Drive.');
        }

        // 8. Attempt to set anyone with link as reader so preview works
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

        $response = $service->files->listFiles([
            'q' => $query,
            'spaces' => 'drive',
            'fields' => 'files(id, name)',
            'pageSize' => 1,
            'supportsAllDrives' => true,
            'includeItemsFromAllDrives' => true,
        ]);

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

        $folder = $service->files->create($folderMetadata, [
            'fields' => 'id',
            'supportsAllDrives' => true,
        ]);

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

        $response = $service->files->listFiles([
            'q' => $query,
            'spaces' => 'drive',
            'fields' => 'files(id, name)',
            'pageSize' => 1,
            'supportsAllDrives' => true,
            'includeItemsFromAllDrives' => true,
        ]);

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
            // Non-critical: file is still accessible by service account / owner
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
        } catch (Exception $e) {
            Log::error("Gagal menghapus file {$fileId} dari Google Drive: ".$e->getMessage());

            return false;
        }
    }
}
