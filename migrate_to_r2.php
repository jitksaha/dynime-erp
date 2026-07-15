<?php
// Initialize Laravel framework
define('LARAVEL_START', microtime(true));
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Storage;
use App\Services\DynamicStorageService;
use App\Models\User;

echo "Starting migration script...\n";

// Query the settings table for R2 configurations
$r2Settings = \DB::table('settings')->where('value', 'aws_s3')->get();

if ($r2Settings->isEmpty()) {
    echo "No companies are configured to use Cloudflare R2 (aws_s3).\n";
    exit;
}

foreach ($r2Settings as $setting) {
    echo "\n--------------------------------------------------\n";
    echo "Found storage setting for created_by user ID: {$setting->created_by}\n";
    
    // Log in this company user to context so DynamicStorageService loads their settings
    $user = User::find($setting->created_by);
    if ($user) {
        echo "Logging in user: {$user->name} (Email: {$user->email}, ID: {$user->id})\n";
        auth()->login($user);
        
        // Clear configuration and query caches to ensure fresh database query
        \App\Services\StorageConfigService::clearCache();
        
        // Configure dynamic disks for this logged in user
        DynamicStorageService::configureDynamicDisks();
        
        $publicDisk = Storage::disk('public');
        $s3Disk = Storage::disk('s3');
        
        echo "Listing all files in local public storage under 'media' directory...\n";
        try {
            $allFiles = $publicDisk->allFiles('media');
            echo "Found " . count($allFiles) . " local files to process.\n";
            
            $successCount = 0;
            $existCount = 0;
            $failCount = 0;
            
            foreach ($allFiles as $file) {
                // Ensure target key on R2 is identical (e.g. 'media/uploads/logo/logo.png')
                echo "Processing: {$file} ... ";
                try {
                    if (!$s3Disk->exists($file)) {
                        $content = $publicDisk->get($file);
                        $s3Disk->put($file, $content, 'public');
                        echo "SUCCESS (Uploaded to R2)\n";
                        $successCount++;
                    } else {
                        echo "ALREADY EXISTS (On R2)\n";
                        $existCount++;
                    }
                } catch (\Exception $e) {
                    echo "FAILED: " . $e->getMessage() . "\n";
                    $failCount++;
                }
            }
            
            echo "\nSummary for User ID {$user->id}:\n";
            echo "- Successfully migrated: {$successCount}\n";
            echo "- Already existed: {$existCount}\n";
            echo "- Failed: {$failCount}\n";
            
        } catch (\Exception $e) {
            echo "Failed to process files: " . $e->getMessage() . "\n";
        }
    } else {
        echo "User with ID {$setting->created_by} not found.\n";
    }
}

echo "\nMigration script completed!\n";
