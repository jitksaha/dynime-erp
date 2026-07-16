<?php
/**
 * Dynime ERP Minimal Repair Script (No Laravel Boot)
 */
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$baseDir = dirname(__DIR__);

echo "=== DYNIME ERP LIVE REPAIR (MINIMAL) ===\n<pre>\n";

// Helper function to recursively delete files and directories
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

// 1. Recreate storage symlink
$publicStorage = $baseDir . '/public/storage';
if (file_exists($publicStorage) || is_link($publicStorage)) {
    if (deleteDir($publicStorage)) {
        echo "SUCCESS: Cleaned up existing public/storage path.\n";
    } else {
        echo "WARNING: Failed to clean up existing public/storage path.\n";
    }
}

$target = $baseDir . '/storage/app/public';
if (@symlink($target, $publicStorage)) {
    echo "SUCCESS: Recreated symbolic link: public/storage -> storage/app/public\n";
} else {
    echo "FAILED to recreate symbolic link. Error: " . json_encode(error_get_last()) . "\n";
}

// 2. Clear bootstrap/cache files
$bootstrapCacheDir = $baseDir . '/bootstrap/cache';
if (file_exists($bootstrapCacheDir)) {
    $files = ['config.php', 'routes-v7.php', 'packages.php', 'services.php'];
    foreach ($files as $file) {
        $filePath = $bootstrapCacheDir . '/' . $file;
        if (file_exists($filePath)) {
            if (@unlink($filePath)) {
                echo "SUCCESS: Deleted cached file: bootstrap/cache/$file\n";
            } else {
                echo "FAILED to delete: bootstrap/cache/$file\n";
            }
        }
    }
}

// 3. Clear file-based application cache
$appCacheDir = $baseDir . '/storage/framework/cache/data';
if (file_exists($appCacheDir)) {
    // Delete all files and subfolders inside cache/data
    $success = true;
    foreach (scandir($appCacheDir) as $item) {
        if ($item == '.' || $item == '..') continue;
        if (!deleteDir($appCacheDir . '/' . $item)) {
            $success = false;
        }
    }
    if ($success) {
        echo "SUCCESS: Flushed file-based application cache.\n";
    } else {
        echo "WARNING: Some cache files could not be cleared.\n";
    }
} else {
    echo "INFO: storage/framework/cache/data does not exist or cache is not using file driver.\n";
}

// 4. Update pull.php itself
$pullUrl = 'https://raw.githubusercontent.com/jitksaha/dynime-erp/main/public/pull.php';
$pullPath = $baseDir . '/public/pull.php';
echo "Updating pull.php...\n";
$pullContent = @file_get_contents($pullUrl);
if ($pullContent !== false) {
    if (file_put_contents($pullPath, $pullContent) !== false) {
        echo "SUCCESS: Self-updated pull.php to latest ZIP-based deployer!\n";
    } else {
        echo "FAILED to write to public/pull.php\n";
    }
} else {
    echo "FAILED to fetch pull.php from raw GitHub\n";
}

echo "\n=== REPAIR COMPLETED ===\n</pre>\n";
