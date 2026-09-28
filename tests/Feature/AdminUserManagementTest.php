<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminUserManagementTest extends TestCase
{
    use DatabaseTransactions;

    protected User $superAdmin;

    protected User $regularAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::create([
            'name' => 'Super Admin Test',
            'email' => 'superadmin_'.uniqid().'@test.com',
            'password' => 'password123',
            'role' => 'super_admin',
            'is_active' => true,
        ]);

        $this->regularAdmin = User::create([
            'name' => 'Regular Admin Test',
            'email' => 'admin_'.uniqid().'@test.com',
            'password' => 'password123',
            'role' => 'admin',
            'is_active' => true,
        ]);
    }

    public function test_guest_cannot_access_user_management(): void
    {
        $this->getJson('/api/v1/admin/users')->assertStatus(401);
        $this->postJson('/api/v1/admin/users', [])->assertStatus(401);
    }

    public function test_regular_admin_is_forbidden_from_user_management(): void
    {
        Sanctum::actingAs($this->regularAdmin);

        $response = $this->getJson('/api/v1/admin/users');
        $response->assertStatus(403);

        $createResponse = $this->postJson('/api/v1/admin/users', [
            'name' => 'New Staff',
            'email' => 'staff@test.com',
            'password' => 'password123',
            'role' => 'admin',
        ]);
        $createResponse->assertStatus(403);
    }

    public function test_super_admin_can_list_and_create_users(): void
    {
        Sanctum::actingAs($this->superAdmin);

        // List
        $listResponse = $this->getJson('/api/v1/admin/users');
        $listResponse->assertStatus(200)
            ->assertJsonPath('success', true);

        // Create
        $newEmail = 'newadmin_'.uniqid().'@test.com';
        $createResponse = $this->postJson('/api/v1/admin/users', [
            'name' => 'Admin Baru',
            'email' => $newEmail,
            'password' => 'password123',
            'role' => 'admin',
            'is_active' => true,
        ]);

        $createResponse->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.email', $newEmail)
            ->assertJsonPath('data.role', 'admin');

        $this->assertDatabaseHas('users', [
            'email' => $newEmail,
            'role' => 'admin',
            'is_active' => true,
        ]);
    }

    public function test_super_admin_can_toggle_status_and_reset_password(): void
    {
        Sanctum::actingAs($this->superAdmin);

        // Toggle status
        $toggleResponse = $this->patchJson("/api/v1/admin/users/{$this->regularAdmin->id}/toggle-status");
        $toggleResponse->assertStatus(200)
            ->assertJsonPath('data.is_active', false);

        $this->assertFalse($this->regularAdmin->fresh()->is_active);

        // Reset password
        $resetResponse = $this->patchJson("/api/v1/admin/users/{$this->regularAdmin->id}/reset-password", [
            'password' => 'newsecretpass123',
        ]);
        $resetResponse->assertStatus(200)
            ->assertJsonPath('success', true);

        // Login as deactivated admin should fail with 403
        $loginResponse = $this->postJson('/api/v1/admin/login', [
            'email' => $this->regularAdmin->email,
            'password' => 'newsecretpass123',
        ]);
        $loginResponse->assertStatus(403);
    }

    public function test_super_admin_cannot_deactivate_or_delete_self(): void
    {
        Sanctum::actingAs($this->superAdmin);

        $toggleResponse = $this->patchJson("/api/v1/admin/users/{$this->superAdmin->id}/toggle-status");
        $toggleResponse->assertStatus(422);

        $deleteResponse = $this->deleteJson("/api/v1/admin/users/{$this->superAdmin->id}");
        $deleteResponse->assertStatus(422);
    }
}
