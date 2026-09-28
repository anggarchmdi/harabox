<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UploadPaymentProofRequest;
use App\Models\Order;
use App\Models\OrderPaymentProof;
use App\Services\GoogleDriveService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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

        // 1. Upload to Google Drive
        try {
            $driveResult = $this->driveService->uploadPaymentProof($order, $paymentType, $uploadedFile);
        } catch (Throwable $e) {
            Log::error('Gagal mengunggah bukti transfer ke Google Drive: '.$e->getMessage(), [
                'order_id' => $order->id,
                'order_code' => $order->order_code,
                'payment_type' => $paymentType,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengupload bukti transfer ke Google Drive. Silakan coba lagi.',
            ], 500);
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

            // Cleanup Google Drive file to avoid orphaned files
            $this->driveService->deleteFile($driveResult['file_id']);

            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan catatan bukti transfer. File di Google Drive telah dibatalkan.',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Bukti transfer berhasil diupload.',
            'data' => $proof,
        ], 201);
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

        // Remove from Google Drive
        if (! empty($paymentProof->drive_file_id)) {
            $this->driveService->deleteFile($paymentProof->drive_file_id);
        }

        $paymentProof->delete();

        return response()->json([
            'success' => true,
            'message' => 'Bukti transfer berhasil dihapus.',
        ]);
    }
}
