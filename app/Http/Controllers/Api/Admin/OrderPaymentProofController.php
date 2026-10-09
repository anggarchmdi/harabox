<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UploadPaymentProofRequest;
use App\Models\Order;
use App\Models\OrderPaymentProof;
use App\Services\ActivityLogger;
use App\Services\GoogleDriveService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Format;
use Intervention\Image\Laravel\Facades\Image;
use Throwable;

class OrderPaymentProofController extends Controller
{
    public function __construct(
        protected GoogleDriveService $driveService
    ) {}

    /**
     * Display a listing of payment proofs for the specified order.
     */
    public function index(Order $order): JsonResponse
    {
        $proofs = $order->paymentProofs()
            ->latest('uploaded_at')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar bukti transfer berhasil diambil',
            'data' => $proofs,
        ]);
    }

    /**
     * Upload and store a new payment proof for the specified order.
     * Automatically falls back to local server storage if Google Drive is unavailable or expired.
     */
    public function store(UploadPaymentProofRequest $request, Order $order): JsonResponse
    {
        $user = $request->user();
        if (! $user || ! in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Fitur ini hanya dapat diakses oleh Admin.',
            ], 403);
        }

        if (! $user->isActive()) {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda dinonaktifkan. Silakan hubungi Super Admin.',
            ], 403);
        }

        $paymentType = (string) $request->validated('payment_type');
        $uploadedFile = $request->file('file');
        $isLocalFallback = false;

        // 1. Upload to Google Drive, fallback to local storage if Drive fails/expired
        try {
            $driveResult = $this->driveService->uploadPaymentProof($order, $paymentType, $uploadedFile);
        } catch (Throwable $e) {
            Log::warning('Google Drive upload gagal atau token kedaluwarsa. Mengalihkan ke penyimpanan lokal server: '.$e->getMessage(), [
                'order_id' => $order->id,
                'order_code' => $order->order_code,
                'payment_type' => $paymentType,
            ]);

            try {
                $driveResult = $this->uploadToLocalFallback($order, $paymentType, $uploadedFile);
                $isLocalFallback = true;
            } catch (Throwable $fallbackError) {
                Log::error('Gagal menyimpan bukti transfer ke penyimpanan lokal: '.$fallbackError->getMessage());

                return response()->json([
                    'success' => false,
                    'message' => 'Gagal mengupload bukti transfer baik ke Google Drive maupun penyimpanan lokal server: '.$fallbackError->getMessage(),
                ], 500);
            }
        }

        // 2. Save metadata to database with rollback protection
        try {
            $proof = DB::transaction(function () use ($order, $paymentType, $driveResult) {
                return $order->paymentProofs()->create([
                    'payment_type' => $paymentType,
                    'drive_file_id' => $driveResult['file_id'],
                    'drive_file_name' => $driveResult['file_name'],
                    'drive_file_url' => $driveResult['file_url'],
                    'drive_web_view_link' => $driveResult['file_url'],
                    'uploaded_at' => now(),
                ]);
            });
        } catch (Throwable $e) {
            Log::error('Gagal menyimpan metadata bukti transfer ke database: '.$e->getMessage(), [
                'order_id' => $order->id,
                'drive_file_id' => $driveResult['file_id'],
            ]);

            // Cleanup orphaned file
            if ($isLocalFallback) {
                $relativePath = substr($driveResult['file_id'], 6);
                Storage::disk('public')->delete($relativePath);
            } else {
                $this->driveService->deleteFile($driveResult['file_id']);
            }

            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan bukti transfer ke database: '.$e->getMessage(),
            ], 500);
        }

        ActivityLogger::log(
            action: 'create',
            subjectType: 'payment_proof',
            description: "Mengunggah bukti pembayaran baru untuk pesanan #{$order->order_code}".($isLocalFallback ? ' (Penyimpanan Lokal)' : ' (Google Drive)'),
            subjectName: $order->order_code,
            subjectId: $order->id
        );

        $successMsg = $isLocalFallback
            ? 'Bukti transfer berhasil disimpan di server (Google Drive offline/token kedaluwarsa).'
            : 'Bukti transfer berhasil diupload.';

        return response()->json([
            'success' => true,
            'message' => $successMsg,
            'data' => $proof,
        ], 201);
    }

    /**
     * Fallback to save payment proof to local public storage.
     *
     * @return array{file_id: string, file_name: string, file_url: string}
     */
    protected function uploadToLocalFallback(Order $order, string $paymentType, UploadedFile $file): array
    {
        $appTimezone = config('app.timezone', 'Asia/Jakarta');
        $date = now()->setTimezone($appTimezone)->format('Y-m-d');
        $orderCode = $order->order_code ?: ('ORD-'.$order->id);
        $cleanType = strtolower(trim($paymentType));

        $image = Image::decode($file);
        $encodedWebp = (string) $image->encodeUsingFormat(Format::WEBP, quality: 85);

        $folderPath = "payment-proofs/{$orderCode}/{$cleanType}/{$date}";
        $fileName = 'bukti-transfer-'.Str::random(10).'.webp';
        $fullPath = "{$folderPath}/{$fileName}";

        Storage::disk('public')->put($fullPath, $encodedWebp);

        $url = asset('storage/'.$fullPath);

        return [
            'file_id' => 'local:'.$fullPath,
            'file_name' => $fileName,
            'file_url' => $url,
        ];
    }

    /**
     * Remove the specified payment proof from storage and Google Drive.
     */
    public function destroy(Order $order, OrderPaymentProof $paymentProof): JsonResponse
    {
        $user = request()->user();
        if (! $user || ! in_array($user->role, ['admin', 'super_admin']) || ! $user->isActive()) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Fitur ini hanya dapat diakses oleh Admin aktif.',
            ], 403);
        }

        if ($paymentProof->order_id !== $order->id) {
            return response()->json([
                'success' => false,
                'message' => 'Bukti transfer tidak ditemukan untuk pesanan ini.',
            ], 404);
        }

        // Remove from local storage or Google Drive
        if (! empty($paymentProof->drive_file_id)) {
            if (str_starts_with($paymentProof->drive_file_id, 'local:')) {
                $relativePath = substr($paymentProof->drive_file_id, 6);
                Storage::disk('public')->delete($relativePath);
            } else {
                try {
                    $this->driveService->deleteFile($paymentProof->drive_file_id);
                } catch (Throwable $e) {
                    Log::warning('Gagal menghapus file bukti dari Google Drive: '.$e->getMessage());
                }
            }
        }

        $paymentProof->delete();

        ActivityLogger::log(
            action: 'delete',
            subjectType: 'payment_proof',
            description: "Menghapus bukti transfer pembayaran untuk pesanan #{$order->order_code}",
            subjectName: $order->order_code,
            subjectId: $order->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Bukti transfer berhasil dihapus.',
        ]);
    }
}
