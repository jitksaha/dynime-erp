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
        Schema::create('usa_state_pricings', function (Blueprint $table) {
            $table->id();
            $table->string('state');
            $table->string('abbr');
            $table->decimal('llc_formation', 20, 6)->default(0.0);
            $table->decimal('corp_formation', 20, 6)->default(0.0);
            $table->decimal('llc_annual', 20, 6)->default(0.0);
            $table->string('llc_annual_label')->nullable();
            $table->decimal('corp_annual', 20, 6)->default(0.0);
            $table->string('corp_annual_label')->nullable();
            $table->decimal('llc_renewal', 20, 6)->default(0.0);
            $table->decimal('corp_renewal', 20, 6)->default(0.0);
            $table->text('state_tax_note')->nullable();
            $table->text('franchise_tax')->nullable();
            $table->text('notes')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('usa_state_pricings');
    }
};
