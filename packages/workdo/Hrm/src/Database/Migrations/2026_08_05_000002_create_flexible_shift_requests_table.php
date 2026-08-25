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
        if (!Schema::hasTable('flexible_shift_requests')) {
            Schema::create('flexible_shift_requests', function (Blueprint $table) {
                $table->id();
                $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->string('status', 20)->default('pending'); // pending, approved, rejected
                $table->text('reason')->nullable();
                $table->foreignId('reviewed_by')->nullable()->constrained('users')->onDelete('set null');
                $table->timestamp('reviewed_at')->nullable();
                $table->integer('created_by')->default(0);
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('flexible_shift_requests');
    }
};
