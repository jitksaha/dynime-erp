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
        if (Schema::hasTable('employees')) {
            Schema::table('employees', function (Blueprint $table) {
                if (!Schema::hasColumn('employees', 'manager_id')) {
                    $table->unsignedBigInteger('manager_id')->nullable()->after('user_id');
                    $table->foreign('manager_id')->references('id')->on('employees')->onDelete('set null');
                }
                if (!Schema::hasColumn('employees', 'additional_branch_ids')) {
                    $table->json('additional_branch_ids')->nullable()->after('branch_id');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('employees')) {
            Schema::table('employees', function (Blueprint $table) {
                if (Schema::hasColumn('employees', 'manager_id')) {
                    $table->dropForeign(['manager_id']);
                    $table->dropColumn('manager_id');
                }
                if (Schema::hasColumn('employees', 'additional_branch_ids')) {
                    $table->dropColumn('additional_branch_ids');
                }
            });
        }
    }
};
