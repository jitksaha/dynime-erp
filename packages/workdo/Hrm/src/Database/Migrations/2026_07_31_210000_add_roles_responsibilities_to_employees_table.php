<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('employees') && !Schema::hasColumn('employees', 'roles_responsibilities')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->text('roles_responsibilities')->nullable()->after('whatsapp');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('employees') && Schema::hasColumn('employees', 'roles_responsibilities')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->dropColumn('roles_responsibilities');
            });
        }
    }
};
