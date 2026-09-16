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
        Schema::create('capacity_overrides', function (Blueprint $table) {
            $table->id();
            $table->date('date')->unique()->index();
            $table->unsignedInteger('max_capacity')->default(500);
            $table->boolean('is_closed')->default(false);
            $table->string('note')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('capacity_overrides');
    }
};
