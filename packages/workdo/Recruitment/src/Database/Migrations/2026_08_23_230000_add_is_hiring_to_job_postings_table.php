<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable("job_postings") && !Schema::hasColumn("job_postings", "is_hiring")) {
            Schema::table("job_postings", function (Blueprint $table) {
                $table->boolean("is_hiring")->default(true)->after("is_published");
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable("job_postings") && Schema::hasColumn("job_postings", "is_hiring")) {
            Schema::table("job_postings", function (Blueprint $table) {
                $table->dropColumn("is_hiring");
            });
        }
    }
};
