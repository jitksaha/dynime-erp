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
        if (!Schema::hasTable('employee_shift_histories')) {
            Schema::create('employee_shift_histories', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('employee_id');
                $table->unsignedBigInteger('shift_id');
                $table->integer('shift_version')->default(1);
                $table->date('effective_from');
                $table->date('effective_to')->nullable();
                $table->string('notes')->nullable();
                $table->unsignedBigInteger('assigned_by')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();

                $table->index(['employee_id', 'effective_from', 'effective_to'], 'emp_shift_hist_idx');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_shift_histories');
    }
};
