<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sales_invoices', function (Blueprint $table) {
            $table->string('payment_status')->default('Unpaid')->after('status');
            $table->string('operational_status')->default('Pending')->after('payment_status');
            $table->string('project_category')->nullable()->after('operational_status');
            $table->string('project_status')->nullable()->after('project_category');
        });

        // Populate initial values based on existing status
        DB::table('sales_invoices')->where('status', 'paid')->update([
            'payment_status' => 'Paid',
            'operational_status' => 'Completed'
        ]);

        DB::table('sales_invoices')->where('status', 'partial')->update([
            'payment_status' => 'Partially Paid',
            'operational_status' => 'Processing'
        ]);

        DB::table('sales_invoices')->where('status', 'overdue')->update([
            'payment_status' => 'Unpaid',
            'operational_status' => 'Action Required'
        ]);

        DB::table('sales_invoices')->where('status', 'posted')->update([
            'payment_status' => 'Unpaid',
            'operational_status' => 'Pending'
        ]);

        DB::table('sales_invoices')->where('status', 'draft')->update([
            'payment_status' => 'Unpaid',
            'operational_status' => 'Pending'
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_invoices', function (Blueprint $table) {
            $table->dropColumn(['payment_status', 'operational_status', 'project_category', 'project_status']);
        });
    }
};
