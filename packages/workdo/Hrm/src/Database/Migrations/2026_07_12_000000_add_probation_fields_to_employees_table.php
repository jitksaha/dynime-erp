<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->string('employment_status')->default('probation')->after('employment_type');
            $table->integer('probation_percentage')->default(70)->nullable()->after('employment_status');
            $table->integer('probation_period')->default(3)->nullable()->after('probation_percentage');
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['employment_status', 'probation_percentage', 'probation_period']);
        });
    }
};
