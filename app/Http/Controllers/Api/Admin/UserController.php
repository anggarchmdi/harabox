<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Display a listing of admin users.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::query()
            ->select(['id', 'name', 'email', 'role', 'is_active', 'created_at', 'updated_at']);

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($role = $request->query('role')) {
            $query->where('role', $role);
        }

        if ($request->has('status') && $request->query('status') !== 'all') {
            $isActive = $request->query('status') === 'active';
            $query->where('is_active', $isActive);
        }

        $users = $query->orderByRaw("CASE WHEN role = 'super_admin' THEN 0 ELSE 1 END")
            ->orderBy('name', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    /**
     * Store a newly created admin user.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'role' => ['required', Rule::in(['super_admin', 'admin'])],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        ActivityLogger::log(
            action: 'create',
            subjectType: 'user',
            description: "Menambahkan akun admin baru '{$user->name}' ({$user->role})",
            subjectName: $user->name,
            subjectId: $user->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Admin baru berhasil ditambahkan.',
            'data' => $user->only(['id', 'name', 'email', 'role', 'is_active', 'created_at']),
        ], 201);
    }

    /**
     * Display the specified admin user.
     */
    public function show(User $user): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $user->only(['id', 'name', 'email', 'role', 'is_active', 'created_at', 'updated_at']),
        ]);
    }

    /**
     * Update the specified admin user.
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'role' => ['sometimes', 'required', Rule::in(['super_admin', 'admin'])],
            'is_active' => ['sometimes', 'required', 'boolean'],
            'password' => ['nullable', 'string', 'min:6'],
        ]);

        $currentUser = $request->user();

        // Safeguard: Cannot demote or deactivate oneself
        if ($currentUser && $currentUser->id === $user->id) {
            if (isset($validated['role']) && $validated['role'] !== 'super_admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak dapat menurunkan role akun sendiri.',
                ], 422);
            }
            if (isset($validated['is_active']) && ! $validated['is_active']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak dapat menonaktifkan akun sendiri.',
                ], 422);
            }
        }

        // Safeguard: Demoting the last super admin
        if ($user->role === 'super_admin' && isset($validated['role']) && $validated['role'] !== 'super_admin') {
            $otherSuperAdminsCount = User::where('role', 'super_admin')
                ->where('id', '!=', $user->id)
                ->where('is_active', true)
                ->count();

            if ($otherSuperAdminsCount === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Harus ada minimal 1 akun Super Admin yang aktif.',
                ], 422);
            }
        }

        if (! empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        ActivityLogger::log(
            action: 'update',
            subjectType: 'user',
            description: "Memperbarui data akun admin '{$user->name}'",
            subjectName: $user->name,
            subjectId: $user->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Data admin berhasil diperbarui.',
            'data' => $user->only(['id', 'name', 'email', 'role', 'is_active', 'updated_at']),
        ]);
    }

    /**
     * Toggle the active status of an admin user.
     */
    public function toggleStatus(Request $request, User $user): JsonResponse
    {
        $currentUser = $request->user();

        if ($currentUser && $currentUser->id === $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak dapat menonaktifkan akun Anda sendiri.',
            ], 422);
        }

        // Safeguard: Cannot deactivate the last active super admin
        if ($user->role === 'super_admin' && $user->is_active) {
            $activeSuperAdminsCount = User::where('role', 'super_admin')
                ->where('is_active', true)
                ->where('id', '!=', $user->id)
                ->count();

            if ($activeSuperAdminsCount === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak dapat menonaktifkan Super Admin terakhir.',
                ], 422);
            }
        }

        $newStatus = ! $user->is_active;
        $user->update(['is_active' => $newStatus]);

        // If deactivated, revoke all their active tokens immediately
        if (! $newStatus) {
            $user->tokens()->delete();
        }

        $statusText = $newStatus ? 'diaktifkan' : 'dinonaktifkan';

        ActivityLogger::log(
            action: 'status_change',
            subjectType: 'user',
            description: "Mengubah status akun admin '{$user->name}' menjadi " . ($newStatus ? 'Aktif' : 'Nonaktif'),
            subjectName: $user->name,
            subjectId: $user->id
        );

        return response()->json([
            'success' => true,
            'message' => "Akun admin {$user->name} berhasil {$statusText}.",
            'data' => $user->only(['id', 'name', 'email', 'role', 'is_active']),
        ]);
    }

    /**
     * Reset the password for the specified admin user.
     */
    public function resetPassword(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'password' => ['required', 'string', 'min:6'],
        ]);

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        ActivityLogger::log(
            action: 'update',
            subjectType: 'user',
            description: "Mereset password untuk akun admin '{$user->name}'",
            subjectName: $user->name,
            subjectId: $user->id
        );

        // Revoke active sessions except the caller if resetting own password
        $currentUser = $request->user();
        if ($currentUser && $currentUser->id === $user->id) {
            // Keep current token
        } else {
            $user->tokens()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => "Password untuk {$user->name} berhasil diubah.",
        ]);
    }

    /**
     * Remove the specified admin user.
     */
    public function destroy(Request $request, User $user): JsonResponse
    {
        $currentUser = $request->user();

        if ($currentUser && $currentUser->id === $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak dapat menghapus akun Anda sendiri.',
            ], 422);
        }

        if ($user->role === 'super_admin') {
            $superAdminsCount = User::where('role', 'super_admin')
                ->where('id', '!=', $user->id)
                ->count();

            if ($superAdminsCount === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak dapat menghapus Super Admin terakhir.',
                ], 422);
            }
        }

        $userName = $user->name;
        $userId = $user->id;

        $user->tokens()->delete();
        $user->delete();

        ActivityLogger::log(
            action: 'delete',
            subjectType: 'user',
            description: "Menghapus akun admin '{$userName}'",
            subjectName: $userName,
            subjectId: $userId
        );

        return response()->json([
            'success' => true,
            'message' => 'Akun admin berhasil dihapus.',
        ]);
    }
}
