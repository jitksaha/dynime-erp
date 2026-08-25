<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('job_postings')) {
            Schema::table('job_postings', function (Blueprint $table) {
                if (!Schema::hasColumn('job_postings', 'department_id')) {
                    $table->foreignId('department_id')->nullable()->after('branch_id')->index();
                }
                if (!Schema::hasColumn('job_postings', 'designation_id')) {
                    $table->foreignId('designation_id')->nullable()->after('department_id')->index();
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('job_postings')) {
            Schema::table('job_postings', function (Blueprint $table) {
                if (Schema::hasColumn('job_postings', 'designation_id')) {
                    $table->dropColumn('designation_id');
                }
                if (Schema::hasColumn('job_postings', 'department_id')) {
                    $table->dropColumn('department_id');
                }
            });
        }
    }
};
