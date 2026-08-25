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
        if (!Schema::hasTable('employee_onboarding_statuses')) {
            Schema::create('employee_onboarding_statuses', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('employee_id')->index();
                $table->integer('completion_percentage')->default(0);
                $table->enum('status', ['not_started', 'in_progress', 'completed'])->default('not_started');
                $table->json('completed_sections')->nullable();
                $table->timestamp('last_updated_at')->nullable();
                $table->timestamp('completed_at')->nullable();
                $table->timestamps();

                $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
            });
        }

        if (!Schema::hasTable('employee_devices')) {
            Schema::create('employee_devices', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('employee_id')->index();
                $table->enum('device_ownership', ['company_provided', 'byod'])->default('byod');
                $table->enum('device_category', ['desktop_laptop', 'mobile'])->default('desktop_laptop');
                $table->string('purchase_month_year')->nullable();
                $table->string('device_name')->nullable();
                $table->string('brand')->nullable();
                $table->string('model')->nullable();
                $table->string('serial_number')->nullable();
                $table->string('imei')->nullable();
                $table->string('mobile_number')->nullable();
                $table->string('operating_system')->nullable();
                $table->string('os_version')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_devices');
        Schema::dropIfExists('employee_onboarding_statuses');
    }
};
