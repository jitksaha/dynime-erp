<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('invitation_codes')) {
            Schema::create('invitation_codes', function (Blueprint $table) {
                $table->id();
                $table->string('code')->unique()->index();
                $table->string('role')->default('staff');
                $table->boolean('is_used')->default(false)->index();
                $table->string('used_by_email')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('invitation_codes');
    }
};
