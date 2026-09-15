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
        Schema::table('orders', function (Blueprint $table) {
            $table->string('payment_status', 20)->default('unpaid')->after('status');
            $table->decimal('paid_amount', 12, 2)->default(0)->after('payment_status');
            $table->string('payment_method', 50)->nullable()->after('paid_amount');
            $table->text('payment_note')->nullable()->after('payment_method');
            $table->timestamp('paid_at')->nullable()->after('payment_note');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'payment_status',
                'paid_amount',
                'payment_method',
                'payment_note',
                'paid_at',
            ]);
        });
    }
};
