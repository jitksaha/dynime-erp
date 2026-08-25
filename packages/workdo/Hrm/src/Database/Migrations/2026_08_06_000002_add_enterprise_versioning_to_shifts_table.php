<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('shifts', function (Blueprint $table) {
            if (!Schema::hasColumn('shifts', 'master_country_shift_id')) {
                $table->unsignedBigInteger('master_country_shift_id')->nullable()->after('id');
            }
            if (!Schema::hasColumn('shifts', 'source_type')) {
                $table->string('source_type', 50)->default('custom')->after('master_country_shift_id'); // country_standard | custom
            }
            if (!Schema::hasColumn('shifts', 'version')) {
                $table->integer('version')->default(1)->after('source_type');
            }
            if (!Schema::hasColumn('shifts', 'effective_from')) {
                $table->date('effective_from')->nullable()->after('version');
            }
            if (!Schema::hasColumn('shifts', 'has_update_available')) {
                $table->boolean('has_update_available')->default(false)->after('effective_from');
            }
            if (!Schema::hasColumn('shifts', 'latest_master_version')) {
                $table->integer('latest_master_version')->default(1)->after('has_update_available');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shifts', function (Blueprint $table) {
            $table->dropColumn([
                'master_country_shift_id',
                'source_type',
                'version',
                'effective_from',
                'has_update_available',
                'latest_master_version',
            ]);
        });
    }
};
