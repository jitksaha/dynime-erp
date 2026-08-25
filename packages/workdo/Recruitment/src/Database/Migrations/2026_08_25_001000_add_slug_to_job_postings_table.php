<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable("job_postings") && !Schema::hasColumn("job_postings", "slug")) {
            Schema::table("job_postings", function (Blueprint $table) {
                $table->string("slug")->nullable()->after("title");
            });

            // Populate slug from title for all existing jobs
            $jobs = DB::table("job_postings")->get();
            $usedSlugs = [];

            foreach ($jobs as $job) {
                $baseSlug = Str::slug($job->title);
                if (empty($baseSlug)) {
                    $baseSlug = "job-" . $job->id;
                }
                
                $slug = $baseSlug;
                $counter = 1;
                while (in_array($slug, $usedSlugs)) {
                    $slug = $baseSlug . "-" . $counter;
                    $counter++;
                }
                $usedSlugs[] = $slug;

                DB::table("job_postings")
                    ->where("id", $job->id)
                    ->update(["slug" => $slug]);
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable("job_postings") && Schema::hasColumn("job_postings", "slug")) {
            Schema::table("job_postings", function (Blueprint $table) {
                $table->dropColumn("slug");
            });
        }
    }
};
