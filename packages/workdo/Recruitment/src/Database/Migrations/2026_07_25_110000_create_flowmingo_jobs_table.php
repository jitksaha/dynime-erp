<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('flowmingo_jobs')) {
            Schema::create('flowmingo_jobs', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('created_by')->nullable()->index();
                $table->unsignedBigInteger('workspace')->nullable()->index();
                $table->string('flowmingo_job_id')->unique();
                $table->string('slug')->index();
                $table->string('title');
                $table->string('department')->nullable();
                $table->string('employment_type')->default('Full-time');
                $table->string('location')->default('Remote / On-site');
                $table->decimal('salary_min', 12, 2)->nullable();
                $table->decimal('salary_max', 12, 2)->nullable();
                $table->string('salary_currency')->default('USD');
                $table->string('salary_period')->default('year');
                $table->string('salary_range')->nullable();
                $table->longText('description')->nullable();
                $table->json('responsibilities')->nullable();
                $table->json('requirements')->nullable();
                $table->json('benefits')->nullable();
                $table->string('experience')->nullable();
                $table->boolean('remote')->default(true);
                $table->boolean('featured')->default(false);
                $table->string('status')->default('open'); // open, closed
                $table->string('apply_url')->nullable();
                $table->timestamp('published_at')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('flowmingo_jobs');
    }
};
