<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    /**
     * Get paginated list of activity logs with filters.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->input('per_page', 15), 5), 100);

        $query = ActivityLog::query()
            ->filter($request->only([
                'search',
                'action',
                'subject_type',
                'user_id',
                'start_date',
                'end_date',
            ]))
            ->latest('created_at');

        $logs = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Log aktivitas berhasil diambil.',
            'data' => $logs->items(),
            'current_page' => $logs->currentPage(),
            'last_page' => $logs->lastPage(),
            'per_page' => $logs->perPage(),
            'total' => $logs->total(),
        ]);
    }

    /**
     * Get aggregate statistics for activity logs.
     */
    public function stats(): JsonResponse
    {
        $totalLogs = ActivityLog::count();
        $todayLogs = ActivityLog::whereDate('created_at', now()->toDateString())->count();
        $deleteActions = ActivityLog::where('action', 'delete')->count();
        $uniqueAdmins = ActivityLog::distinct('user_name')->count('user_name');
        $oldestLog = ActivityLog::oldest('created_at')->first();

        return response()->json([
            'success' => true,
            'data' => [
                'total_logs' => $totalLogs,
                'today_logs' => $todayLogs,
                'delete_actions' => $deleteActions,
                'unique_admins' => $uniqueAdmins,
                'retention_days' => 60,
                'oldest_log_date' => $oldestLog?->created_at?->format('Y-m-d H:i') ?? null,
            ],
        ]);
    }

    /**
     * Manually prune logs older than specific days (default 60 days).
     */
    public function prune(Request $request): JsonResponse
    {
        $days = (int) $request->input('days', 60);
        if ($days < 7) {
            $days = 7; // Safety minimum: never accidentally delete younger than 7 days
        }

        $cutoffDate = now()->subDays($days);
        $deletedCount = ActivityLog::where('created_at', '<', $cutoffDate)->delete();

        return response()->json([
            'success' => true,
            'message' => "Berhasil membersihkan {$deletedCount} log aktivitas yang lebih lama dari {$days} hari.",
            'deleted_count' => $deletedCount,
        ]);
    }
}
