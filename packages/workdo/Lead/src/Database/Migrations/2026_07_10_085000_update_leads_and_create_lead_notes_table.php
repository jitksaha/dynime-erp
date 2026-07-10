<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Make email nullable and add project_value to leads table
        Schema::table('leads', function (Blueprint $table) {
            if (Schema::hasColumn('leads', 'email')) {
                DB::statement("ALTER TABLE `leads` MODIFY COLUMN `email` VARCHAR(255) NULL");
            }
            if (!Schema::hasColumn('leads', 'project_value')) {
                $table->decimal('project_value', 15, 4)->default(0.0000)->after('subject');
            }
        });

        // 2. Create lead_notes table
        if (!Schema::hasTable('lead_notes')) {
            Schema::create('lead_notes', function (Blueprint $table) {
                $table->id();
                $table->foreignId('lead_id')->constrained('leads')->onDelete('cascade');
                $table->text('note');
                $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_notes');

        Schema::table('leads', function (Blueprint $table) {
            if (Schema::hasColumn('leads', 'project_value')) {
                $table->dropColumn('project_value');
            }
            if (Schema::hasColumn('leads', 'email')) {
                DB::statement("ALTER TABLE `leads` MODIFY COLUMN `email` VARCHAR(255) NOT NULL");
            }
        });
    }
};
