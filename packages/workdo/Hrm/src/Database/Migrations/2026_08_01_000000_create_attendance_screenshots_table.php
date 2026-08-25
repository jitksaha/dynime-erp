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
        if (!Schema::hasTable('attendance_screenshots')) {
            Schema::create('attendance_screenshots', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('attendance_id')->index();
                $table->unsignedBigInteger('employee_id')->index();
                $table->string('image_path');
                $table->timestamp('captured_at')->nullable();
                $table->integer('activity_percentage')->default(100);
                $table->string('status')->default('active');
                $table->timestamps();

                $table->foreign('attendance_id')->references('id')->on('attendances')->onDelete('cascade');
                $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_screenshots');
    }
};
