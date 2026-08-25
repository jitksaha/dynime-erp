<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable("job_postings") && !Schema::hasColumn("job_postings", "posting_source")) {
            Schema::table("job_postings", function (Blueprint $table) {
                $table->string("posting_source")->default("manual")->after("job_application");
            });

            // Update existing Flowmingo seeded jobs
            DB::table("job_postings")
                ->where("code", "LIKE", "FLOW-%")
                ->orWhere("posting_code", "LIKE", "FLOW-%")
                ->update(["posting_source" => "flowmingo_api"]);
        }
    }

    public function down(): void
    {
        if (Schema::hasTable("job_postings") && Schema::hasColumn("job_postings", "posting_source")) {
            Schema::table("job_postings", function (Blueprint $table) {
                $table->dropColumn("posting_source");
            });
        }
    }
};
