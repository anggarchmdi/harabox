<?php

namespace App\Console\Commands;

use App\Models\ActivityLog;
use Illuminate\Console\Command;

class PruneActivityLogsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'activity-logs:prune {--days=60 : Jumlah hari retensi log sebelum dihapus}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Menghapus log aktivitas admin yang lebih lama dari jumlah hari yang ditentukan (default 60 hari).';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $days = (int) $this->option('days');
        if ($days <= 0) {
            $days = 60;
        }

        $cutoffDate = now()->subDays($days);
        $deletedCount = ActivityLog::where('created_at', '<', $cutoffDate)->delete();

        $this->info("Berhasil menghapus {$deletedCount} log aktivitas yang lebih lama dari {$days} hari (sebelum {$cutoffDate->format('Y-m-d H:i:s')}).");

        return self::SUCCESS;
    }
}
