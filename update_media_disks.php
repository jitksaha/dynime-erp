<?php
define('LARAVEL_START', microtime(true));
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Updating all media disks to s3...\n";
$count = \DB::table('media')->update(['disk' => 's3']);
echo "Updated {$count} rows to s3.\n";

// Clear cache to be safe
\DB::connection()->disconnect();
echo "Done!\n";
