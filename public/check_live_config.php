<?php
header('Content-Type: text/plain');

require_once dirname(__DIR__) . '/vendor/autoload.php';
$app = require_once dirname(__DIR__) . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "CACHE_DRIVER: " . env('CACHE_DRIVER') . "\n";
echo "Cache Default: " . config('cache.default') . "\n";
echo "FILESYSTEM_DISK: " . env('FILESYSTEM_DISK') . "\n";
echo "Filesystem Default: " . config('filesystems.default') . "\n";
echo "Image URL Prefix: " . getImageUrlPrefix() . "\n";
echo "Auth Status: " . (auth()->check() ? 'Yes' : 'No') . "\n";
