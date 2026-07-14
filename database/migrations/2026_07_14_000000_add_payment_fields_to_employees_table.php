<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            if (!Schema::hasColumn('employees', 'payment_method')) {
                $table->string('payment_method')->nullable()->default('bank_transfer')->after('emergency_contact_number');
            }
            if (!Schema::hasColumn('employees', 'payment_details')) {
                $table->json('payment_details')->nullable()->after('payment_method');
            }
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['payment_method', 'payment_details']);
        });
    }
};
