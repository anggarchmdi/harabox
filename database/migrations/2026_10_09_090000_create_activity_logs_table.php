<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->string('user_name');
            $table->string('user_role')->default('admin');
            $table->string('action'); // create, update, delete, status_change, payment_update, etc.
            $table->string('subject_type'); // product, category, order, user, setting, addon, etc.
            $table->string('subject_id')->nullable();
            $table->string('subject_name')->nullable();
            $table->text('description');
            $table->json('properties')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            // Indexes for fast searching, filtering, and pruning
            $table->index('created_at');
            $table->index(['user_id', 'created_at']);
            $table->index(['subject_type', 'action']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
