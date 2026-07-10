<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            try {
                $table->dropForeign(['branch_id']);
            } catch (\Exception $e) {
                // Already dropped or doesn't exist
            }
            $table->string('branch_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            $table->unsignedBigInteger('branch_id')->nullable()->change();
            $table->foreign('branch_id')->references('id')->on('branches')->onDelete('set null');
        });
    }
};
