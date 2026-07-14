<?php
/**
 * Dynime ERP Repair Script
 */
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$baseDir = dirname(__DIR__);

echo "=== DYNIME ERP LIVE REPAIR ===\n<pre>\n";

// 1. Recreate storage symlink
$publicStorage = $baseDir . '/public/storage';
if (!function_exists('deleteDir')) {
    function deleteDir($dir) {
        if (!file_exists($dir)) return true;
        if (!is_dir($dir) || is_link($dir)) return @unlink($dir);
        foreach (scandir($dir) as $item) {
            if ($item == '.' || $item == '..') continue;
            if (!deleteDir($dir . DIRECTORY_SEPARATOR . $item)) return false;
        }
        return @rmdir($dir);
    }
}
if (file_exists($publicStorage) || is_link($publicStorage)) {
    deleteDir($publicStorage);
    echo "Removed existing public/storage link.\n";
}
$target = $baseDir . '/storage/app/public';
if (@symlink($target, $publicStorage)) {
    echo "SUCCESS: Recreated symbolic link: public/storage -> storage/app/public\n";
} else {
    echo "FAILED to recreate symbolic link: " . json_encode(error_get_last()) . "\n";
}

// 2. Boot Laravel and clear cache
if (file_exists($baseDir . '/vendor/autoload.php')) {
    require_once $baseDir . '/vendor/autoload.php';
    
    // Check if routes/api.php is missing, create a placeholder if it is, so Laravel doesn't crash on boot!
    $apiRoutesFile = $baseDir . '/routes/api.php';
    if (!file_exists($apiRoutesFile)) {
        echo "routes/api.php was missing! Creating placeholder...\n";
        @file_put_contents($apiRoutesFile, "<?php\nuse Illuminate\Support\Facades\Route;\n");
    }
    
    try {
        $app = require_once $baseDir . '/bootstrap/app.php';
        $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
        $kernel->bootstrap();
        
        Illuminate\Support\Facades\Cache::flush();
        echo "SUCCESS: Cleared Laravel cache.\n";
        
        // Output new logo settings
        $logoLight = admin_setting('logo_light');
        $logoDark = admin_setting('logo_dark');
        echo "Current settings logo_light: $logoLight\n";
        echo "Current settings logo_dark: $logoDark\n";
    } catch (Throwable $e) {
        echo "Exception caught during Laravel boot/cache clear: " . $e->getMessage() . "\n";
    }
} else {
    echo "vendor/autoload.php not found.\n";
}
echo "</pre>\n";
