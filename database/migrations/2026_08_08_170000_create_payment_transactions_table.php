<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_id')->unique();
            $table->unsignedBigInteger('invoice_id');
            $table->unsignedBigInteger('customer_id')->nullable();
            $table->string('gateway_id');
            $table->string('gateway_transaction_id')->nullable();
            $table->string('checkout_session_id')->nullable();
            $table->decimal('amount', 15, 2);
            $table->string('currency', 10)->default('USD');
            $table->enum('status', [
                'INITIATED',
                'PENDING',
                'PROCESSING',
                'SUCCEEDED',
                'FAILED',
                'CANCELLED',
                'REFUNDED'
            ])->default('INITIATED');
            $table->string('payment_method')->nullable();
            $table->text('failure_reason')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->foreign('invoice_id')->references('id')->on('sales_invoices')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
    }
};
