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
        if (Schema::hasTable('branches') && !Schema::hasColumn('branches', 'branch_address')) {
            Schema::table('branches', function (Blueprint $table) {
                $table->text('branch_address')->nullable()->after('branch_name');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('branches') && Schema::hasColumn('branches', 'branch_address')) {
            Schema::table('branches', function (Blueprint $table) {
                $table->dropColumn('branch_address');
            });
        }
    }
};
