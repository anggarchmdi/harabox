<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Request;

class ActivityLogger
{
    /**
     * Log an admin activity safely.
     *
     * @param string $action (create, update, delete, status_change, payment_update, etc.)
     * @param string $subjectType (product, category, order, user, setting, addon, etc.)
     * @param string $description (Human readable explanation, e.g. "Menghapus produk 'Rendang'")
     * @param string|null $subjectName (e.g. "Rendang Daging", "Bento Katsu", "#ORD-123")
     * @param string|int|null $subjectId (e.g. ID of the product or order code)
     * @param array|null $properties (Optional additional details)
     */
    public static function log(
        string $action,
        string $subjectType,
        string $description,
        ?string $subjectName = null,
        string|int|null $subjectId = null,
        ?array $properties = null
    ): ?ActivityLog {
        try {
            $user = Auth::user();

            return ActivityLog::create([
                'user_id' => $user?->id,
                'user_name' => $user?->name ?? 'Sistem / Anonim',
                'user_role' => $user?->role ?? 'admin',
                'action' => $action,
                'subject_type' => $subjectType,
                'subject_id' => $subjectId !== null ? (string) $subjectId : null,
                'subject_name' => $subjectName,
                'description' => $description,
                'properties' => $properties,
                'ip_address' => Request::ip(),
                'user_agent' => Request::header('User-Agent'),
            ]);
        } catch (\Throwable $e) {
            // Fail gracefully so logging error never breaks the main administrative action
            Log::error('Failed to write activity log: ' . $e->getMessage(), [
                'action' => $action,
                'subject_type' => $subjectType,
                'description' => $description,
            ]);

            return null;
        }
    }
}
