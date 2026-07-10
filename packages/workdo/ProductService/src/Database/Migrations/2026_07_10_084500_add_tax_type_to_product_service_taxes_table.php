<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_service_taxes', function (Blueprint $table) {
            if (!Schema::hasColumn('product_service_taxes', 'tax_type')) {
                $table->string('tax_type')->default('excluded')->after('rate');
            }
        });
    }

    public function down(): void
    {
        Schema::table('product_service_taxes', function (Blueprint $table) {
            if (Schema::hasColumn('product_service_taxes', 'tax_type')) {
                $table->dropColumn('tax_type');
            }
        });
    }
};
