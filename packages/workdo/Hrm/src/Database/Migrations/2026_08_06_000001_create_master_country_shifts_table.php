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
        if (!Schema::hasTable('master_country_shifts')) {
            Schema::create('master_country_shifts', function (Blueprint $table) {
                $table->id();
                $table->string('country_name');
                $table->string('iso_code', 10);
                $table->json('working_days');
                $table->time('office_start_time')->default('09:00:00');
                $table->time('office_end_time')->default('17:30:00');
                $table->integer('break_duration_mins')->default(30);
                $table->decimal('weekly_working_hours', 5, 2)->default(40.00);
                $table->string('primary_timezone');
                $table->json('available_timezones')->nullable();
                $table->boolean('dst_supported')->default(true);
                $table->date('effective_date')->nullable();
                $table->integer('version')->default(1);
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master_country_shifts');
    }
};
