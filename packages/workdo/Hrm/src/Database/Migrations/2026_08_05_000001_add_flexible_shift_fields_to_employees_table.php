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
        Schema::table('employees', function (Blueprint $table) {
            if (!Schema::hasColumn('employees', 'is_flexible_shift_allowed')) {
                $table->boolean('is_flexible_shift_allowed')->default(false);
            }
            if (!Schema::hasColumn('employees', 'current_shift_type')) {
                $table->string('current_shift_type', 20)->default('fixed');
            }
            if (!Schema::hasColumn('employees', 'flexible_shift_status')) {
                $table->string('flexible_shift_status', 20)->default('none');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $columns = [];
            if (Schema::hasColumn('employees', 'is_flexible_shift_allowed')) {
                $columns[] = 'is_flexible_shift_allowed';
            }
            if (Schema::hasColumn('employees', 'current_shift_type')) {
                $columns[] = 'current_shift_type';
            }
            if (Schema::hasColumn('employees', 'flexible_shift_status')) {
                $columns[] = 'flexible_shift_status';
            }
            if (!empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};
