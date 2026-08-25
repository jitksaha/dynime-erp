<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('employees') && !Schema::hasColumn('employees', 'whatsapp')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->string('whatsapp', 50)->nullable()->after('official_email');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('employees') && Schema::hasColumn('employees', 'whatsapp')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->dropColumn('whatsapp');
            });
        }
    }
};
