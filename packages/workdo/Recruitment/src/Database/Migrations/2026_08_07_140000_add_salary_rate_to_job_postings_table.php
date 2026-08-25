<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('job_postings') && !Schema::hasColumn('job_postings', 'salary_rate')) {
            Schema::table('job_postings', function (Blueprint $table) {
                $table->string('salary_rate')->default('yearly')->after('max_salary');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('job_postings') && Schema::hasColumn('job_postings', 'salary_rate')) {
            Schema::table('job_postings', function (Blueprint $table) {
                $table->dropColumn('salary_rate');
            });
        }
    }
};
