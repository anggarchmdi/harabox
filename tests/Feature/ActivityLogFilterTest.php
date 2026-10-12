<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ActivityLogFilterTest extends TestCase
{
    use DatabaseTransactions;

    protected User $superAdmin;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::factory()->create([
            'role' => 'super_admin',
            'is_active' => true,
        ]);

        $this->admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);
    }

    public function test_super_admin_can_filter_logs_by_exact_date_range(): void
    {
        Sanctum::actingAs($this->superAdmin);

        // 1. Log created today
        $logToday = new ActivityLog();
        $logToday->user_id = $this->superAdmin->id;
        $logToday->user_name = $this->superAdmin->name;
        $logToday->user_role = 'super_admin';
        $logToday->action = 'create';
        $logToday->subject_type = 'product';
        $logToday->subject_name = 'Menu Hari Ini';
        $logToday->description = 'Menambahkan menu hari ini';
        $logToday->created_at = now();
        $logToday->save();

        // 2. Log created 10 days ago
        $logPast = new ActivityLog();
        $logPast->user_id = $this->superAdmin->id;
        $logPast->user_name = $this->superAdmin->name;
        $logPast->user_role = 'super_admin';
        $logPast->action = 'delete';
        $logPast->subject_type = 'product';
        $logPast->subject_name = 'Menu Sepuluh Hari Lalu';
        $logPast->description = 'Menghapus menu 10 hari lalu';
        $logPast->created_at = now()->subDays(10);
        $logPast->save();

        // Filter: today only
        $responseToday = $this->getJson('/api/v1/admin/activity-logs?start_date='.now()->toDateString().'&end_date='.now()->toDateString());
        $responseToday->assertStatus(200);

        $idsToday = collect($responseToday->json('data'))->pluck('id');
        $this->assertTrue($idsToday->contains($logToday->id));
        $this->assertFalse($idsToday->contains($logPast->id));

        // Filter: date range covering 10 days ago
        $responsePast = $this->getJson('/api/v1/admin/activity-logs?start_date='.now()->subDays(11)->toDateString().'&end_date='.now()->subDays(9)->toDateString());
        $responsePast->assertStatus(200);

        $idsPast = collect($responsePast->json('data'))->pluck('id');
        $this->assertTrue($idsPast->contains($logPast->id));
        $this->assertFalse($idsPast->contains($logToday->id));
    }

    public function test_non_super_admin_cannot_access_activity_logs(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson('/api/v1/admin/activity-logs');
        $response->assertStatus(403);
    }
}
