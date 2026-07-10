<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('designations', function (Blueprint $table) {
            try {
                $table->dropForeign(['branch_id']);
            } catch (\Exception $e) {
                // Ignore
            }
            try {
                $table->dropForeign(['department_id']);
            } catch (\Exception $e) {
                // Ignore
            }
            $table->string('branch_id')->nullable()->change();
            $table->string('department_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('designations', function (Blueprint $table) {
            $table->unsignedBigInteger('branch_id')->nullable()->change();
            $table->unsignedBigInteger('department_id')->nullable()->change();
            $table->foreign('branch_id')->references('id')->on('branches')->onDelete('set null');
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('set null');
        });
    }
};
