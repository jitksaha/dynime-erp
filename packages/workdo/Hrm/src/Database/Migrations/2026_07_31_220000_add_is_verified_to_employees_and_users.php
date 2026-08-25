<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('employees') && !Schema::hasColumn('employees', 'is_verified')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->boolean('is_verified')->default(false)->after('roles_responsibilities');
            });
        }

        if (Schema::hasTable('users') && !Schema::hasColumn('users', 'is_verified')) {
            Schema::table('users', function (Blueprint $table) {
                $table->boolean('is_verified')->default(false)->after('avatar');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('employees') && Schema::hasColumn('employees', 'is_verified')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->dropColumn('is_verified');
            });
        }

        if (Schema::hasTable('users') && Schema::hasColumn('users', 'is_verified')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('is_verified');
            });
        }
    }
};
