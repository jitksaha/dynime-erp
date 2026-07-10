<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE `product_service_taxes` MODIFY COLUMN `rate` DECIMAL(8, 4)");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE `product_service_taxes` MODIFY COLUMN `rate` DECIMAL(5, 2)");
    }
};
