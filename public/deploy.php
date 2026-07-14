<?php
/**
 * Dynime ERP Deployment & Database Sync Dashboard
 * Accessible via: http://127.0.0.1:8002/deploy.php?debug_deploy_token=deploy_token_7782
 */

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if (!isset($_GET['debug_deploy_token']) || $_GET['debug_deploy_token'] !== 'deploy_token_7782') {
    header('HTTP/1.0 403 Forbidden');
    echo 'Unauthorized access.';
    exit;
}

$baseDir = dirname(__DIR__);

// Helper to boot Laravel framework
function bootLaravel() {
    global $baseDir;
    if (!file_exists($baseDir . '/vendor/autoload.php')) {
        throw new Exception("vendor/autoload.php not found. Please run composer install.");
    }
    require_once $baseDir . '/vendor/autoload.php';
    $app = require_once $baseDir . '/bootstrap/app.php';
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();
    return $app;
}
$isLocal = ($_SERVER['REMOTE_ADDR'] === '127.0.0.1' || $_SERVER['REMOTE_ADDR'] === '::1' || $_SERVER['HTTP_HOST'] === '127.0.0.1:8002' || $_SERVER['HTTP_HOST'] === 'localhost:8002');

// Find executable binary utility helper
function findSystemBinary($name) {
    $commonPaths = [
        "/Applications/XAMPP/xamppfiles/bin/$name",
        "/usr/local/bin/$name",
        "/opt/homebrew/bin/$name",
        "/Applications/MAMP/Library/bin/$name",
        "/usr/bin/$name"
    ];
    
    foreach ($commonPaths as $p) {
        if (file_exists($p)) {
            return $p;
        }
    }
    return $name;
}

// --------------------------------------------------------------------
// ACTIONS
// --------------------------------------------------------------------

// Action: Setup .env file
if (isset($_GET['action']) && $_GET['action'] === 'setup-env') {
    header('Content-Type: text/plain');
    echo "=== SETTING UP .ENV FILE ===\n";
    $envPath = $baseDir . '/.env';
    $examplePath = $baseDir . '/.env.example';
    
    if (file_exists($envPath) && !isset($_GET['overwrite'])) {
        echo "Error: .env file already exists! Pass &overwrite=1 to overwrite.\n";
        exit;
    }
    
    if (!file_exists($examplePath)) {
        echo "Error: .env.example not found!\n";
        exit;
    }
    
    $envContent = file_get_contents($examplePath);
    
    // Generate secure APP_KEY
    $secureKey = 'base64:' . base64_encode(random_bytes(32));
    $envContent = preg_replace('/^APP_KEY=.*$/m', 'APP_KEY=' . $secureKey, $envContent);
    
    // Update URL
    $envContent = preg_replace('/^APP_URL=.*$/m', 'APP_URL=https://app.dynime.com', $envContent);
    
    // Update DB credentials if provided
    if (isset($_GET['db_name'])) {
        $envContent = preg_replace('/^DB_DATABASE=.*$/m', 'DB_DATABASE=' . trim($_GET['db_name']), $envContent);
    }
    if (isset($_GET['db_user'])) {
        $envContent = preg_replace('/^DB_USERNAME=.*$/m', 'DB_USERNAME=' . trim($_GET['db_user']), $envContent);
    }
    if (isset($_GET['db_pass'])) {
        $envContent = preg_replace('/^DB_PASSWORD=.*$/m', 'DB_PASSWORD=' . trim($_GET['db_pass']), $envContent);
    }
    
    if (file_put_contents($envPath, $envContent) !== false) {
        echo "Success: .env file created successfully!\n";
        echo "Generated APP_KEY: $secureKey\n";
        if (isset($_GET['db_name'])) echo "DB_DATABASE updated to: " . $_GET['db_name'] . "\n";
        if (isset($_GET['db_user'])) echo "DB_USERNAME updated to: " . $_GET['db_user'] . "\n";
        if (isset($_GET['db_pass'])) echo "DB_PASSWORD updated\n";
    } else {
        echo "Error: Failed to write .env file. Check folder permissions!\n";
    }
    exit;
}

// Action: Mark as installed
if (isset($_GET['action']) && $_GET['action'] === 'mark-installed') {
    header('Content-Type: text/plain');
    echo "=== MARKING AS INSTALLED ===\n";
    $installedFile = $baseDir . '/storage/installed';
    $content = "install " . date('Y-m-d H:i:s');
    if (file_put_contents($installedFile, $content) !== false) {
        echo "Success: storage/installed file created successfully!\n";
        echo "Content: $content\n";
    } else {
        echo "Error: Failed to create storage/installed file. Check storage folder permissions!\n";
    }
    exit;
}

// Action: Read raw log
if (isset($_GET['action']) && $_GET['action'] === 'read-raw-log') {
    header('Content-Type: text/plain');
    echo "=== LAST ERROR DETAILS ===\n";
    $logFile = $baseDir . '/storage/logs/laravel.log';
    if (file_exists($logFile)) {
        $content = file_get_contents($logFile);
        $errors = explode('production.ERROR:', $content);
        if (count($errors) > 1) {
            $lastError = end($errors);
            $lines = explode("\n", $lastError);
            // Print error message
            echo "ERROR MESSAGE:\n" . trim($lines[0]) . "\n\n";
            // Print top 20 stack trace lines
            echo "=== STACK TRACE ===\n";
            for ($i = 1; $i <= min(20, count($lines) - 1); $i++) {
                echo $lines[$i] . "\n";
            }
        } else {
            echo "No production.ERROR found in log.\n";
        }
    } else {
        echo "No laravel.log found.\n";
    }
    exit;
}

// Action: Fix password
if (isset($_GET['action']) && $_GET['action'] === 'fix-password') {
    header('Content-Type: text/plain');
    echo "=== FIXING DB PASSWORD ===\n";
    $envPath = $baseDir . '/.env';
    if (file_exists($envPath)) {
        $envContent = file_get_contents($envPath);
        $envContent = preg_replace('/^DB_PASSWORD=.*$/m', 'DB_PASSWORD="Pixel#@!194JkS"', $envContent);
        if (file_put_contents($envPath, $envContent) !== false) {
            echo "Success: DB_PASSWORD updated in .env successfully!\n";
            
            // Automatically clear Laravel cache
            $configFile = $baseDir . '/bootstrap/cache/config.php';
            if (file_exists($configFile)) {
                @unlink($configFile);
                echo "Success: Cleared configuration cache.\n";
            }
        } else {
            echo "Error: Failed to update DB_PASSWORD. Check folder permissions!\n";
        }
    } else {
        echo "Error: .env file not found!\n";
    }
    exit;
}

// Action: Dump DB (Only runs on live remote server to create fast dump)
if (isset($_GET['action']) && $_GET['action'] === 'dump-db') {
    header('Content-Type: text/plain');
    $dumpFile = $baseDir . '/public/storage/backup_temp.sql';
    $mysqldump = findSystemBinary('mysqldump');
    
    // Remote DB details on Hostinger
    exec(sprintf('"%s" -h 127.0.0.1 -u u740731947_erpapp -p\'Pixel#@!194JkS\' u740731947_erpapp > "%s" 2>&1', $mysqldump, $dumpFile), $output, $status);
    
    if ($status === 0) {
        if (file_exists($dumpFile)) {
            $sqlContent = file_get_contents($dumpFile);
            $gzipped = gzencode($sqlContent, 9);
            file_put_contents($dumpFile . '.gz', $gzipped);
            @unlink($dumpFile);
            echo "SUCCESS_GZ";
        } else {
            echo "FAILED: File not created";
        }
    } else {
        echo "FAILED: " . implode("\n", $output);
    }
    exit;
}

// Action: Clean Dump (Only runs on live remote server for cleanup)
if (isset($_GET['action']) && $_GET['action'] === 'clean-dump') {
    header('Content-Type: text/plain');
    $dumpFile = $baseDir . '/public/storage/backup_temp.sql';
    @unlink($dumpFile);
    @unlink($dumpFile . '.gz');
    echo "CLEANED";
    exit;
}

// Action: Run Laravel Migrations
if (isset($_GET['action']) && $_GET['action'] === 'migrate') {
    header('Content-Type: text/plain');
    echo "=== RUNNING DATABASE MIGRATIONS (migrate) ===\n";
    try {
        bootLaravel();
        $exitCode = Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
        echo "Artisan migrate completed with exit code: $exitCode\n";
        echo "Output:\n" . Illuminate\Support\Facades\Artisan::output() . "\n";
        echo "SUCCESS\n";
    } catch (Throwable $e) {
        echo "Exception caught during migration: " . $e->getMessage() . "\n";
        echo "Trace:\n" . $e->getTraceAsString() . "\n";
        echo "FAILED\n";
    }
    exit;
}

// Action: Migration status
if (isset($_GET['action']) && $_GET['action'] === 'migrate-status') {
    header('Content-Type: text/plain');
    echo "=== DATABASE MIGRATION STATUS (migrate:status) ===\n";
    try {
        bootLaravel();
        $exitCode = Illuminate\Support\Facades\Artisan::call('migrate:status');
        echo "Artisan migrate:status completed with exit code: $exitCode\n";
        echo "Output:\n" . Illuminate\Support\Facades\Artisan::output() . "\n";
    } catch (Throwable $e) {
        echo "Exception caught: " . $e->getMessage() . "\n";
        echo "Trace:\n" . $e->getTraceAsString() . "\n";
    }
    exit;
}

// Action: Migration rollback
if (isset($_GET['action']) && $_GET['action'] === 'migrate-rollback') {
    header('Content-Type: text/plain');
    echo "=== DATABASE MIGRATION ROLLBACK (migrate:rollback) ===\n";
    try {
        bootLaravel();
        $exitCode = Illuminate\Support\Facades\Artisan::call('migrate:rollback', ['--force' => true]);
        echo "Artisan migrate:rollback completed with exit code: $exitCode\n";
        echo "Output:\n" . Illuminate\Support\Facades\Artisan::output() . "\n";
    } catch (Throwable $e) {
        echo "Exception caught: " . $e->getMessage() . "\n";
        echo "Trace:\n" . $e->getTraceAsString() . "\n";
    }
    exit;
}

// Action: Database Seed
if (isset($_GET['action']) && $_GET['action'] === 'db-seed') {
    header('Content-Type: text/plain');
    echo "=== RUNNING DATABASE SEEDERS (db:seed) ===\n";
    try {
        bootLaravel();
        $exitCode = Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);
        echo "Artisan db:seed completed with exit code: $exitCode\n";
        echo "Output:\n" . Illuminate\Support\Facades\Artisan::output() . "\n";
        echo "SUCCESS\n";
    } catch (Throwable $e) {
        echo "Exception caught: " . $e->getMessage() . "\n";
        echo "Trace:\n" . $e->getTraceAsString() . "\n";
        echo "FAILED\n";
    }
    exit;
}

// Action: Pull Database (Runs locally to sync Live -> Local)
if (isset($_GET['action']) && $_GET['action'] === 'pull-db') {
    header('Content-Type: text/plain');
    echo "=== INITIATING DATABASE PULL: LIVE -> LOCAL ===\n";
    
    $remoteHost = 'srv2141.hstgr.io';
    $remoteDB = 'u740731947_erpapp';
    $remoteUser = 'u740731947_erpapp';
    $remotePass = 'Pixel#@!194JkS';

    $localHost = '127.0.0.1';
    $localPort = '3306';
    $localDB = 'u740731947_erpapp';
    $localUser = 'root';
    $localPass = '';

    // Load Local DB Details from .env
    $envPath = $baseDir . '/.env';
    if (file_exists($envPath)) {
        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            $parts = explode('=', $line, 2);
            if (count($parts) === 2) {
                $name = trim($parts[0]);
                $value = trim($parts[1], "\"' ");
                if ($name === 'DB_HOST') $localHost = $value;
                if ($name === 'DB_PORT') $localPort = $value;
                if ($name === 'DB_DATABASE') $localDB = $value;
                if ($name === 'DB_USERNAME') $localUser = $value;
                if ($name === 'DB_PASSWORD') $localPass = $value;
            }
        }
    }

    $mysql = findSystemBinary('mysql');
    $mysqldump = findSystemBinary('mysqldump');

    echo "Source Live DB:  $remoteDB on $remoteHost\n";
    echo "Target Local DB: $localDB on $localHost:$localPort\n";
    echo "--------------------------------------------------\n";

    // Step 1: Ensure Local DB Exists
    echo "Step 1/3: Ensuring local database exists...\n";
    $createDBCmd = sprintf('"%s" --host="%s" --port="%s" --user="%s" -e "CREATE DATABASE IF NOT EXISTS %s;" 2>&1', $mysql, $localHost, $localPort, $localUser, $localDB);
    if ($localPass !== '') {
        $createDBCmd = sprintf('"%s" --host="%s" --port="%s" --user="%s" --password="%s" -e "CREATE DATABASE IF NOT EXISTS %s;" 2>&1', $mysql, $localHost, $localPort, $localUser, $localPass, $localDB);
    }
    exec($createDBCmd, $out, $status);
    echo "Local database is ready.\n";

    $tempFile = $baseDir . '/storage/remote_db_dump.sql';
    $useHttp = false;

    // Step 2: Fetch Live DB Dump (Prefer fast HTTP method)
    echo "\nStep 2/3: Fetching live database dump...\n";
    echo "Attempting high-speed HTTP dump method...\n";
    $context = stream_context_create(["http" => ["timeout" => 180, "ignore_errors" => true]]);
    $url = "https://app.dynime.com/deploy.php?debug_deploy_token=deploy_token_7782&action=dump-db";
    $response = @file_get_contents($url, false, $context);

    if ($response && strpos($response, "SUCCESS") !== false) {
        echo "Remote server successfully created dump locally!\n";
        echo "Downloading dump file...\n";
        
        $isGz = (strpos($response, "SUCCESS_GZ") !== false);
        $downloadUrl = $isGz ? "https://app.dynime.com/storage/backup_temp.sql.gz" : "https://app.dynime.com/storage/backup_temp.sql";
        $dumpData = @file_get_contents($downloadUrl, false, $context);
        
        if ($dumpData) {
            if ($isGz) {
                $dumpData = gzdecode($dumpData);
            }
            file_put_contents($tempFile, $dumpData);
            echo "Download completed: " . round(filesize($tempFile) / 1024, 2) . " KB\n";
            @file_get_contents("https://app.dynime.com/deploy.php?debug_deploy_token=deploy_token_7782&action=clean-dump", false, $context);
            $useHttp = true;
        }
    }

    if (!$useHttp) {
        echo "Fallback: Downloading via direct CLI dump over WAN...\n";
        $dumpCmd = sprintf('"%s" --host="%s" --user="%s" --password="%s" --add-drop-table --quick --single-transaction "%s" > "%s" 2>&1', $mysqldump, $remoteHost, $remoteUser, $remotePass, $remoteDB, $tempFile);
        exec($dumpCmd, $dumpOutput, $dumpStatus);
        if ($dumpStatus !== 0) {
            echo "Error: Remote dump failed! Output: " . implode("\n", $dumpOutput) . "\n";
            exit;
        }
        echo "Direct remote dump completed successfully.\n";
    }

    // Step 3: Import locally
    echo "\nStep 3/3: Importing dump into local database...\n";
    $importCmd = sprintf('"%s" --host="%s" --port="%s" --user="%s" "%s" < "%s" 2>&1', $mysql, $localHost, $localPort, $localUser, $localDB, $tempFile);
    if ($localPass !== '') {
        $importCmd = sprintf('"%s" --host="%s" --port="%s" --user="%s" --password="%s" "%s" < "%s" 2>&1', $mysql, $localHost, $localPort, $localUser, $localPass, $localDB, $tempFile);
    }
    exec($importCmd, $importOutput, $importStatus);
    @unlink($tempFile);

    if ($importStatus !== 0) {
        echo "Error: Importing to Local Database failed! Status: $importStatus\n";
        echo "Output: " . implode("\n", $importOutput) . "\n";
        exit;
    }

    // Step 4: Update local .env
    echo "\nStep 4: Updating local .env connection...\n";
    if (file_exists($envPath)) {
        $envContent = file_get_contents($envPath);
        $envContent = preg_replace('/^DB_HOST=.*$/m', 'DB_HOST=127.0.0.1', $envContent);
        $envContent = preg_replace('/^DB_PORT=.*$/m', 'DB_PORT=3306', $envContent);
        $envContent = preg_replace('/^DB_DATABASE=.*$/m', 'DB_DATABASE=' . $localDB, $envContent);
        $envContent = preg_replace('/^DB_USERNAME=.*$/m', 'DB_USERNAME=' . $localUser, $envContent);
        $envContent = preg_replace('/^DB_PASSWORD=.*$/m', 'DB_PASSWORD=""', $envContent);
        file_put_contents($envPath, $envContent);
        
        $configFile = $baseDir . '/bootstrap/cache/config.php';
        if (file_exists($configFile)) {
            @unlink($configFile);
        }
    }

    echo "--------------------------------------------------\n";
    echo "SUCCESS: Remote database pulled to Local successfully!\n";
    exit;
}

// Action: Upload DB (Only runs on live remote server to receive dump)
if (isset($_GET['action']) && $_GET['action'] === 'upload-db') {
    header('Content-Type: text/plain');
    $targetFile = $baseDir . '/storage/upload_temp.sql';
    
    $rawData = file_get_contents('php://input');
    if ($rawData) {
        if (substr($rawData, 0, 2) === "\x1f\x8b") {
            $rawData = gzdecode($rawData);
        }
        if (file_put_contents($targetFile, $rawData)) {
            echo "UPLOAD_SUCCESS";
        } else {
            echo "UPLOAD_FAILED";
        }
    } else {
        echo "UPLOAD_EMPTY";
    }
    exit;
}

// Action: Import DB (Only runs on live remote server to import uploaded dump locally)
if (isset($_GET['action']) && $_GET['action'] === 'import-db') {
    header('Content-Type: text/plain');
    $tempFile = $baseDir . '/storage/upload_temp.sql';
    if (!file_exists($tempFile)) {
        echo "ERROR_FILE_NOT_FOUND";
        exit;
    }
    
    $mysql = findSystemBinary('mysql');
    
    // Import the file locally on Hostinger
    exec(sprintf('"%s" -h 127.0.0.1 -u u740731947_erpapp -p\'Pixel#@!194JkS\' u740731947_erpapp < "%s" 2>&1', $mysql, $tempFile), $output, $status);
    @unlink($tempFile);
    
    if ($status === 0) {
        echo "IMPORT_SUCCESS";
    } else {
        echo "IMPORT_FAILED: " . implode("\n", $output);
    }
    exit;
}

// Action: Push Database (Runs locally to sync Local -> Live)
if (isset($_GET['action']) && $_GET['action'] === 'push-db') {
    header('Content-Type: text/plain');
    echo "=== INITIATING DATABASE PUSH: LOCAL -> LIVE ===\n";
    
    $remoteHost = 'srv2141.hstgr.io';
    $remoteDB = 'u740731947_erpapp';
    $remoteUser = 'u740731947_erpapp';
    $remotePass = 'Pixel#@!194JkS';

    $localHost = '127.0.0.1';
    $localPort = '3306';
    $localDB = 'u740731947_erpapp';
    $localUser = 'root';
    $localPass = '';

    // Load Local DB details
    $envPath = $baseDir . '/.env';
    if (file_exists($envPath)) {
        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            $parts = explode('=', $line, 2);
            if (count($parts) === 2) {
                $name = trim($parts[0]);
                $value = trim($parts[1], "\"' ");
                if ($name === 'DB_HOST') $localHost = $value;
                if ($name === 'DB_PORT') $localPort = $value;
                if ($name === 'DB_DATABASE') $localDB = $value;
                if ($name === 'DB_USERNAME') $localUser = $value;
                if ($name === 'DB_PASSWORD') $localPass = $value;
            }
        }
    }

    $mysql = findSystemBinary('mysql');
    $mysqldump = findSystemBinary('mysqldump');

    echo "Source Local DB: $localDB on $localHost:$localPort\n";
    echo "Target Live DB:  $remoteDB on $remoteHost\n";
    echo "--------------------------------------------------\n";

    $tempFile = $baseDir . '/storage/local_db_dump.sql';
    
    // Dump local DB
    echo "Step 1/2: Dumping local database...\n";
    $dumpCmd = sprintf('"%s" --host="%s" --port="%s" --user="%s" --add-drop-table --quick --single-transaction "%s" > "%s" 2>&1', $mysqldump, $localHost, $localPort, $localUser, $localDB, $tempFile);
    if ($localPass !== '') {
        $dumpCmd = sprintf('"%s" --host="%s" --port="%s" --user="%s" --password="%s" --add-drop-table --quick --single-transaction "%s" > "%s" 2>&1', $mysqldump, $localHost, $localPort, $localUser, $localPass, $localDB, $tempFile);
    }
    exec($dumpCmd, $dumpOutput, $dumpStatus);

    if ($dumpStatus !== 0) {
        echo "Error: Local dump failed! Output: " . implode("\n", $dumpOutput) . "\n";
        exit;
    }
    echo "Local dump successful! Size: " . round(filesize($tempFile) / 1024, 2) . " KB\n";

    // Restore to Live DB via HTTP upload + import
    echo "\nStep 2/2: Pushing dump to Remote Hostinger Database...\n";
    echo "Uploading dump file to remote server...\n";
    $uploadUrl = "https://app.dynime.com/deploy.php?debug_deploy_token=deploy_token_7782&action=upload-db";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $uploadUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents($tempFile));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60);
    $uploadResponse = curl_exec($ch);
    curl_close($ch);
    
    $useHttpPush = false;
    if ($uploadResponse === 'UPLOAD_SUCCESS') {
        echo "Upload completed successfully!\nImporting database locally on remote server...\n";
        $importUrl = "https://app.dynime.com/deploy.php?debug_deploy_token=deploy_token_7782&action=import-db";
        
        $importResponse = file_get_contents($importUrl);
        if ($importResponse === 'IMPORT_SUCCESS') {
            echo "SUCCESS: Remote database imported successfully!\n";
            $useHttpPush = true;
        } else {
            echo "Warning: Remote import failed! Response: $importResponse\n";
        }
    } else {
        echo "Warning: Upload failed! Response: $uploadResponse. Falling back to direct CLI...\n";
    }

    if (!$useHttpPush) {
        echo "Falling back to direct CLI restoration over WAN (this may take a long time)...\n";
        $importCmd = sprintf('"%s" --host="%s" --user="%s" --password="%s" "%s" < "%s" 2>&1', $mysql, $remoteHost, $remoteUser, $remotePass, $remoteDB, $tempFile);
        exec($importCmd, $importOutput, $importStatus);
        if ($importStatus !== 0) {
            echo "Error: Importing to Live Database failed! Status: $importStatus\n";
            echo "Output: " . implode("\n", $importOutput) . "\n";
            @unlink($tempFile);
            exit;
        }
    }
    
    @unlink($tempFile);
    echo "--------------------------------------------------\n";
    echo "SUCCESS: Local database pushed to Remote successfully!\n";
    exit;
}

// Action: Clear Cache
if (isset($_GET['action']) && $_GET['action'] === 'clear-cache') {
    header('Content-Type: text/plain');
    echo "=== CLEARING LARAVEL CACHES ===\n";
    
    $configCache = $baseDir . '/bootstrap/cache/config.php';
    if (file_exists($configCache)) {
        @unlink($configCache);
        echo "Removed bootstrap/cache/config.php\n";
    }
    
    $routeCache = $baseDir . '/bootstrap/cache/routes-v7.php';
    if (file_exists($routeCache)) {
        @unlink($routeCache);
        echo "Removed bootstrap/cache/routes-v7.php\n";
    }
    
    try {
        bootLaravel();
        Illuminate\Support\Facades\Artisan::call('config:clear');
        echo "Config cache cleared via Artisan.\n";
        Illuminate\Support\Facades\Artisan::call('route:clear');
        echo "Route cache cleared via Artisan.\n";
        Illuminate\Support\Facades\Artisan::call('cache:clear');
        echo "App cache cleared via Artisan.\n";
        Illuminate\Support\Facades\Artisan::call('view:clear');
        echo "View cache cleared via Artisan.\n";
        echo "All Laravel configuration and routing caches cleared successfully!\n";
    } catch (Throwable $e) {
        echo "Exception caught during cache clearing: " . $e->getMessage() . "\n";
    }
    exit;
}

// Action: Minimal Repair
if (isset($_GET['action']) && $_GET['action'] === 'repair-minimal') {
    header('Content-Type: text/plain');
    echo "=== DYNIME ERP LIVE REPAIR (MINIMAL) ===\n";
    
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
        if (deleteDir($publicStorage)) {
            echo "SUCCESS: Cleaned up existing public/storage path.\n";
        } else {
            echo "WARNING: Failed to clean up existing public/storage path.\n";
        }
    }

    $target = $baseDir . '/storage/app/public';
    $symlinkSuccess = false;
    
    if (function_exists('symlink')) {
        try {
            if (@symlink($target, $publicStorage)) {
                echo "SUCCESS: Recreated symbolic link: public/storage -> storage/app/public\n";
                $symlinkSuccess = true;
            }
        } catch (Throwable $e) {}
    }
    
    if (!$symlinkSuccess) {
        echo "symlink() function is disabled or failed. Falling back to recursive directory copying...\n";
        if (!function_exists('copyDir')) {
            function copyDir($src, $dst) {
                if (is_link($src)) return;
                if (!file_exists($dst)) {
                    @mkdir($dst, 0755, true);
                }
                $dir = @opendir($src);
                if (!$dir) return;
                while (($file = readdir($dir)) !== false) {
                    if ($file === '.' || $file === '..') continue;
                    $srcPath = $src . DIRECTORY_SEPARATOR . $file;
                    $dstPath = $dst . DIRECTORY_SEPARATOR . $file;
                    if (is_dir($srcPath)) {
                        copyDir($srcPath, $dstPath);
                    } else {
                        @copy($srcPath, $dstPath);
                    }
                }
                closedir($dir);
            }
        }
        
        copyDir($target, $publicStorage);
        if (file_exists($publicStorage) && is_dir($publicStorage)) {
            echo "SUCCESS: Copied storage files recursively to public/storage!\n";
        } else {
            echo "FAILED to copy storage files.\n";
        }
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

    echo "\n=== REPAIR COMPLETED ===\n";
    exit;
}

// Action: Fix Storage Symlinks
if (isset($_GET['action']) && $_GET['action'] === 'fix-storage') {
    header('Content-Type: text/plain');
    echo "=== RECREATING STORAGE SYMLINK ===\n";
    
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
        echo "Removed existing public/storage path.\n";
    }
    
    $target = $baseDir . '/storage/app/public';
    $symlinkSuccess = false;
    
    if (function_exists('symlink')) {
        try {
            if (@symlink($target, $publicStorage)) {
                echo "SUCCESS: Created symbolic link successfully via PHP symlink().\n";
                $symlinkSuccess = true;
            }
        } catch (Throwable $e) {}
    }
    
    if (!$symlinkSuccess) {
        echo "symlink() function is disabled or failed. Falling back to recursive directory copying...\n";
        if (!function_exists('copyDir')) {
            function copyDir($src, $dst) {
                if (is_link($src)) return;
                if (!file_exists($dst)) {
                    @mkdir($dst, 0755, true);
                }
                $dir = @opendir($src);
                if (!$dir) return;
                while (($file = readdir($dir)) !== false) {
                    if ($file === '.' || $file === '..') continue;
                    $srcPath = $src . DIRECTORY_SEPARATOR . $file;
                    $dstPath = $dst . DIRECTORY_SEPARATOR . $file;
                    if (is_dir($srcPath)) {
                        copyDir($srcPath, $dstPath);
                    } else {
                        @copy($srcPath, $dstPath);
                    }
                }
                closedir($dir);
            }
        }
        
        copyDir($target, $publicStorage);
        if (file_exists($publicStorage) && is_dir($publicStorage)) {
            echo "SUCCESS: Copied storage files recursively to public/storage!\n";
        } else {
            echo "FAILED: Could not copy storage files.\n";
        }
    }
    exit;
}

// --------------------------------------------------------------------
// UI RENDERING
// --------------------------------------------------------------------

$checks = [
    '.env' => $baseDir . '/.env',
    'vendor/autoload.php' => $baseDir . '/vendor/autoload.php',
    'public/index.php' => $baseDir . '/public/index.php',
    'public/build/manifest.json' => $baseDir . '/public/build/manifest.json',
    'public/repair.php' => $baseDir . '/public/repair.php',
];

$checkResults = [];
foreach ($checks as $name => $path) {
    $exists = file_exists($path);
    $checkResults[$name] = [
        'exists' => $exists,
        'size' => $exists ? round(filesize($path) / 1024, 2) . ' KB' : '0 KB'
    ];
}

// Get DB settings
$db_settings = [
    'DB_HOST' => '127.0.0.1',
    'DB_PORT' => '3306',
    'DB_DATABASE' => '',
    'DB_USERNAME' => '',
    'DB_PASSWORD' => '',
];
$envPath = $baseDir . '/.env';
if (file_exists($envPath)) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $name = trim($parts[0]);
            if (array_key_exists($name, $db_settings)) {
                $db_settings[$name] = trim($parts[1], "\"' ");
            }
        }
    }
}

// Connections
$localDBStatus = false;
try {
    $dsn = "mysql:host=" . $db_settings['DB_HOST'] . ";port=" . $db_settings['DB_PORT'] . ";dbname=" . $db_settings['DB_DATABASE'] . ";charset=utf8mb4";
    $pdo = new PDO($dsn, $db_settings['DB_USERNAME'], $db_settings['DB_PASSWORD'], [PDO::ATTR_TIMEOUT => 2]);
    $localDBStatus = true;
} catch (Exception $e) {}

$remoteDBStatus = false;
try {
    $dsn = "mysql:host=srv2141.hstgr.io;dbname=u740731947_erpapp;charset=utf8mb4";
    $pdo = new PDO($dsn, "u740731947_erpapp", "Pixel#@!194JkS", [PDO::ATTR_TIMEOUT => 2]);
    $remoteDBStatus = true;
} catch (Exception $e) {}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dynime ERP - Control Panel</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Outfit', 'sans-serif'],
                        mono: ['JetBrains Mono', 'monospace'],
                    }
                }
            }
        }
    </script>
    <style>
        body {
            background-color: #0b0f19;
            background-image: radial-gradient(at 0% 0%, rgba(20, 30, 60, 0.4) 0, transparent 50%), radial-gradient(at 50% 0%, rgba(15, 23, 42, 0.6) 0, transparent 50%);
        }
        .glass-card {
            background: rgba(17, 24, 39, 0.7);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.05);
        }
    </style>
</head>
<body class="min-h-screen text-slate-100 flex flex-col justify-between antialiased">
    <header class="border-b border-white/5 py-4 px-6 glass-card sticky top-0 z-50">
        <div class="max-w-6xl mx-auto flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center p-2 shadow-lg shadow-indigo-600/20">
                    <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <div>
                    <h1 class="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">Dynime ERP <span class="text-xs bg-indigo-500/10 text-indigo-400 font-semibold px-2 py-0.5 rounded border border-indigo-500/20">Control Panel</span></h1>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <span class="text-xs text-slate-400 flex items-center gap-1.5">
                    <span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <?php echo $isLocal ? 'Local Server Active' : 'Live Server Active'; ?>
                </span>
            </div>
        </div>
    </header>

    <main class="max-w-6xl mx-auto w-full px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Side Status Cards -->
        <div class="lg:col-span-1 space-y-6">
            <!-- Database Connections -->
            <div class="glass-card rounded-2xl p-6 shadow-xl">
                <h3 class="text-sm font-semibold tracking-wide text-slate-400 uppercase mb-4">Database Services</h3>
                <div class="space-y-4">
                    <div class="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-white/5">
                        <div>
                            <h4 class="font-medium text-sm text-slate-200">Local DB (XAMPP)</h4>
                            <p class="text-xs text-slate-500"><?php echo $db_settings['DB_HOST'] . ':' . $db_settings['DB_PORT']; ?></p>
                        </div>
                        <?php if ($localDBStatus): ?>
                            <span class="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-full border border-emerald-500/20 font-medium">Connected</span>
                        <?php else: ?>
                            <span class="bg-rose-500/10 text-rose-400 text-xs px-2.5 py-1 rounded-full border border-rose-500/20 font-medium">Offline</span>
                        <?php endif; ?>
                    </div>
                    <div class="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-white/5">
                        <div>
                            <h4 class="font-medium text-sm text-slate-200">Live DB (Hostinger)</h4>
                            <p class="text-xs text-slate-500">srv2141.hstgr.io</p>
                        </div>
                        <?php if ($remoteDBStatus): ?>
                            <span class="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-full border border-emerald-500/20 font-medium">Connected</span>
                        <?php else: ?>
                            <span class="bg-rose-500/10 text-rose-400 text-xs px-2.5 py-1 rounded-full border border-rose-500/20 font-medium">Offline</span>
                        <?php endif; ?>
                    </div>
                </div>
            </div>

            <!-- Local File Checklist -->
            <div class="glass-card rounded-2xl p-6 shadow-xl">
                <h3 class="text-sm font-semibold tracking-wide text-slate-400 uppercase mb-4">File Diagnostics</h3>
                <div class="space-y-3">
                    <?php foreach ($checkResults as $name => $res): ?>
                        <div class="flex items-center justify-between text-sm py-1.5 border-b border-white/5 last:border-0">
                            <span class="font-mono text-xs text-slate-300"><?php echo $name; ?></span>
                            <div class="flex items-center gap-2">
                                <span class="text-[10px] text-slate-500 font-mono"><?php echo $res['size']; ?></span>
                                <?php if ($res['exists']): ?>
                                    <svg class="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <?php else: ?>
                                    <svg class="h-4 w-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <?php endif; ?>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>

        <!-- Right Side Interactive Console -->
        <div class="lg:col-span-2 space-y-6 flex flex-col">
            <!-- Action Cards -->
            <div class="glass-card rounded-2xl p-6 shadow-xl grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onclick="runAction('pull-db')" class="group p-4 rounded-xl border border-indigo-500/10 bg-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all duration-200 text-left flex items-start gap-3">
                    <div class="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:scale-105 transition-transform duration-200">
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </div>
                    <div>
                        <h4 class="font-semibold text-sm text-slate-200 group-hover:text-white">Pull Database (Live -> Local)</h4>
                        <p class="text-xs text-slate-500 mt-1">Sync remote database down to local XAMPP</p>
                    </div>
                </button>
                
                <button onclick="confirmPush()" class="group p-4 rounded-xl border border-amber-500/10 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/30 transition-all duration-200 text-left flex items-start gap-3">
                    <div class="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform duration-200">
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    </div>
                    <div>
                        <h4 class="font-semibold text-sm text-slate-200 group-hover:text-white">Push Database (Local -> Live)</h4>
                        <p class="text-xs text-slate-500 mt-1">Push local changes to live remote database</p>
                    </div>
                </button>

                <button onclick="runAction('fix-storage')" class="group p-4 rounded-xl border border-sky-500/10 bg-sky-500/5 hover:bg-sky-500/10 hover:border-sky-500/30 transition-all duration-200 text-left flex items-start gap-3">
                    <div class="p-2.5 rounded-lg bg-sky-500/10 text-sky-400 group-hover:scale-105 transition-transform duration-200">
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                    </div>
                    <div>
                        <h4 class="font-semibold text-sm text-slate-200 group-hover:text-white">Fix Symlink</h4>
                        <p class="text-xs text-slate-500 mt-1">Recreate relative storage symlinks</p>
                    </div>
                </button>

                <button onclick="runAction('clear-cache')" class="group p-4 rounded-xl border border-rose-500/10 bg-rose-500/5 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all duration-200 text-left flex items-start gap-3">
                    <div class="p-2.5 rounded-lg bg-rose-500/10 text-rose-400 group-hover:scale-105 transition-transform duration-200">
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </div>
                    <div>
                        <h4 class="font-semibold text-sm text-slate-200 group-hover:text-white">Clear Cache</h4>
                        <p class="text-xs text-slate-500 mt-1">Flush Laravel config & routing cache</p>
                    </div>
                </button>

                <button onclick="runAction('repair-minimal')" class="group p-4 rounded-xl border border-teal-500/10 bg-teal-500/5 hover:bg-teal-500/10 hover:border-teal-500/30 transition-all duration-200 text-left flex items-start gap-3">
                    <div class="p-2.5 rounded-lg bg-teal-500/10 text-teal-400 group-hover:scale-105 transition-transform duration-200">
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <div>
                        <h4 class="font-semibold text-sm text-slate-200 group-hover:text-white">Run Minimal Repair</h4>
                        <p class="text-xs text-slate-500 mt-1">Rebuild symlink & clear settings cache</p>
                    </div>
                </button>
            </div>

            <!-- Laravel Database Migrations Dashboard -->
            <div class="glass-card rounded-2xl p-6 shadow-xl space-y-4">
                <h3 class="text-sm font-semibold tracking-wide text-indigo-400 uppercase flex items-center gap-2">
                    <svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.58 4 8 4s8-1.79 8-4M4 7c0-2.21 3.58-4 8-4s8 1.79 8 4m0 5c0 2.21-3.58 4-8 4s-8-1.79-8-4" /></svg>
                    Laravel Database Migrations
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button onclick="runAction('migrate-status')" class="group p-4 rounded-xl border border-indigo-500/10 bg-slate-900/50 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all duration-200 text-left flex items-start gap-3">
                        <div class="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:scale-105 transition-transform duration-200">
                            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                        </div>
                        <div>
                            <h4 class="font-semibold text-sm text-slate-200 group-hover:text-white">Migration Status</h4>
                            <p class="text-xs text-slate-500 mt-1">Check executed & pending migrations</p>
                        </div>
                    </button>
                    
                    <button onclick="runAction('migrate')" class="group p-4 rounded-xl border border-emerald-500/10 bg-slate-900/50 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all duration-200 text-left flex items-start gap-3">
                        <div class="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform duration-200">
                            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <div>
                            <h4 class="font-semibold text-sm text-slate-200 group-hover:text-white">Run Migrations</h4>
                            <p class="text-xs text-slate-500 mt-1">Run pending migrations safely</p>
                        </div>
                    </button>

                    <button onclick="confirmRollback()" class="group p-4 rounded-xl border border-rose-500/10 bg-slate-900/50 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all duration-200 text-left flex items-start gap-3">
                        <div class="p-2.5 rounded-lg bg-rose-500/10 text-rose-400 group-hover:scale-105 transition-transform duration-200">
                            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                        </div>
                        <div>
                            <h4 class="font-semibold text-sm text-slate-200 group-hover:text-white">Rollback Migrations</h4>
                            <p class="text-xs text-slate-500 mt-1">Rollback the last batch of migrations</p>
                        </div>
                    </button>

                    <button onclick="runAction('db-seed')" class="group p-4 rounded-xl border border-amber-500/10 bg-slate-900/50 hover:bg-amber-500/10 hover:border-amber-500/30 transition-all duration-200 text-left flex items-start gap-3">
                        <div class="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform duration-200">
                            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <div>
                            <h4 class="font-semibold text-sm text-slate-200 group-hover:text-white">Run DB Seed</h4>
                            <p class="text-xs text-slate-500 mt-1">Seed database tables with default records</p>
                        </div>
                    </button>
                </div>
            </div>

            <!-- Console Box -->
            <div class="glass-card rounded-2xl flex-1 p-6 flex flex-col shadow-xl min-h-[350px] border border-white/5 relative overflow-hidden">
                <div class="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                    <div class="flex items-center gap-2">
                        <span class="h-3 w-3 rounded-full bg-rose-500"></span>
                        <span class="h-3 w-3 rounded-full bg-amber-500"></span>
                        <span class="h-3 w-3 rounded-full bg-emerald-500"></span>
                        <span class="text-xs font-mono text-slate-400 ml-2 font-medium">terminal.log</span>
                    </div>
                    <button onclick="clearConsole()" class="text-xs text-slate-500 hover:text-slate-300 font-medium">Clear Console</button>
                </div>
                <div id="console-output" class="flex-1 font-mono text-xs text-slate-300 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
                    Waiting for action to execute...
                </div>
                
                <!-- Redesigned Loader Overlay with Progress Bar and Timer -->
                <div id="loading-overlay" class="absolute inset-0 bg-slate-950/85 hidden flex-col items-center justify-center backdrop-blur-md transition-all duration-300 z-10 p-6">
                    <div class="flex flex-col items-center gap-4 text-center max-w-sm">
                        <div class="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500 border-t-transparent shadow-lg shadow-indigo-500/20"></div>
                        <div>
                            <h4 id="loading-text" class="text-sm font-semibold text-slate-100 uppercase tracking-wider">Executing Action...</h4>
                            <p id="estimated-time-el" class="text-xs text-slate-500 mt-1 font-mono">Est. Time Remaining: --s</p>
                        </div>
                        
                        <!-- Progress Bar Wrapper -->
                        <div class="w-64 bg-slate-900 rounded-full h-3 border border-white/5 overflow-hidden flex items-center px-0.5 mt-2">
                            <div id="progress-bar" class="bg-indigo-500 h-2 rounded-full transition-all duration-100" style="width: 0%"></div>
                        </div>
                        <span id="progress-percent" class="text-xs font-semibold text-indigo-400 font-mono">0%</span>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Success Modal -->
    <div id="success-modal" class="fixed inset-0 hidden items-center justify-center bg-slate-950/80 backdrop-blur-md z-50">
        <div class="glass-card max-w-md w-full p-8 rounded-3xl border border-emerald-500/20 text-center shadow-2xl relative mx-4">
            <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-6">
                <svg class="h-10 w-10 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <h3 class="text-2xl font-bold text-slate-100 mb-2">Operation Succeeded!</h3>
            <p class="text-sm text-slate-400 mb-6">The action has completed successfully and all changes are applied.</p>
            <button onclick="closeModal('success-modal')" class="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] transition-all text-sm font-semibold text-white shadow-lg shadow-emerald-500/20">
                Great, Thank You!
            </button>
        </div>
    </div>

    <!-- Failure Modal -->
    <div id="failure-modal" class="fixed inset-0 hidden items-center justify-center bg-slate-950/80 backdrop-blur-md z-50">
        <div class="glass-card max-w-md w-full p-8 rounded-3xl border border-rose-500/20 text-center shadow-2xl relative mx-4">
            <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 mb-6">
                <svg class="h-10 w-10 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>
            <h3 class="text-2xl font-bold text-slate-100 mb-2">Operation Failed</h3>
            <p class="text-sm text-slate-400 mb-6">Something went wrong during execution. Please check the terminal log below for more details.</p>
            <button onclick="closeModal('failure-modal')" class="w-full py-3 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 active:scale-[0.98] transition-all text-sm font-semibold text-white shadow-lg shadow-rose-500/20">
                Check Logs
            </button>
        </div>
    </div>

    <footer class="border-t border-white/5 py-4 text-center text-xs text-slate-500">
        <p>&copy; <?php echo date('Y'); ?> Dynime ERP. Designed for modern pair-programming workflows.</p>
    </footer>

    <script>
        const actionTimes = {
            'pull-db': 12,
            'push-db': 15,
            'migrate': 6,
            'migrate-status': 2,
            'migrate-rollback': 5,
            'db-seed': 6,
            'fix-storage': 3,
            'clear-cache': 2,
            'repair-minimal': 4
        };

        let progressInterval = null;
        let timeInterval = null;

        function runAction(action) {
            const consoleOutput = document.getElementById('console-output');
            const overlay = document.getElementById('loading-overlay');
            const loadingText = document.getElementById('loading-text');
            const progressBar = document.getElementById('progress-bar');
            const progressPercent = document.getElementById('progress-percent');
            const estimatedTimeEl = document.getElementById('estimated-time-el');
            
            // Reset modals
            document.getElementById('success-modal').classList.add('hidden');
            document.getElementById('success-modal').classList.remove('flex');
            document.getElementById('failure-modal').classList.add('hidden');
            document.getElementById('failure-modal').classList.remove('flex');

            consoleOutput.textContent = `[System] Executing action: ${action}...\n`;
            overlay.classList.remove('hidden');
            overlay.classList.add('flex');
            
            const estTime = actionTimes[action] || 5;
            let currentProgress = 0;
            let timeLeft = estTime;

            // Set text based on action
            let actionName = "Executing Action";
            if (action === 'pull-db') actionName = "Syncing Live DB to Local";
            else if (action === 'push-db') actionName = "Pushing Local DB to Live";
            else if (action === 'migrate') actionName = "Running Database Migrations";
            else if (action === 'migrate-status') actionName = "Checking Migration Status";
            else if (action === 'migrate-rollback') actionName = "Rolling Back Migrations";
            else if (action === 'db-seed') actionName = "Seeding Database Tables";
            else if (action === 'fix-storage') actionName = "Fixing Storage Directory Symlink";
            else if (action === 'clear-cache') actionName = "Clearing Laravel Cache Files";
            else if (action === 'repair-minimal') actionName = "Running Complete App Repair";

            loadingText.textContent = actionName;
            progressBar.style.width = "0%";
            progressPercent.textContent = "0%";
            estimatedTimeEl.textContent = `Est. Time Remaining: ${timeLeft}s`;

            // Clear previous timers
            clearInterval(progressInterval);
            clearInterval(timeInterval);

            // Ticking stopwatch
            timeInterval = setInterval(() => {
                if (timeLeft > 1) {
                    timeLeft--;
                    estimatedTimeEl.textContent = `Est. Time Remaining: ${timeLeft}s`;
                } else {
                    estimatedTimeEl.textContent = `Wrapping up execution...`;
                }
            }, 1000);

            // Progress bar tick
            const stepMs = (estTime * 1000) / 95; // Go to 95% over the estimated time
            progressInterval = setInterval(() => {
                if (currentProgress < 95) {
                    currentProgress += 1;
                    progressBar.style.width = `${currentProgress}%`;
                    progressPercent.textContent = `${currentProgress}%`;
                }
            }, stepMs);

            const token = 'deploy_token_7782';
            const startTime = Date.now();
            
            fetch(`deploy.php?debug_deploy_token=${token}&action=${action}`)
                .then(response => {
                    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                    clearInterval(progressInterval);
                    clearInterval(timeInterval);
                    
                    progressBar.style.width = "100%";
                    progressPercent.textContent = "100%";
                    estimatedTimeEl.textContent = `Completed in ${elapsed}s`;
                    
                    if (response.status === 200) {
                        return response.text().then(data => {
                            consoleOutput.textContent += data;
                            
                            // Check if the output contains "SUCCESS"
                            const isSuccess = data.toUpperCase().includes('SUCCESS');
                            
                            setTimeout(() => {
                                overlay.classList.add('hidden');
                                overlay.classList.remove('flex');
                                if (isSuccess) {
                                    showModal('success-modal');
                                } else {
                                    showModal('failure-modal');
                                }
                            }, 500);
                        });
                    } else {
                        return response.text().then(data => {
                            consoleOutput.textContent += `\nError: Server returned status code ${response.status}\n${data}`;
                            setTimeout(() => {
                                overlay.classList.add('hidden');
                                overlay.classList.remove('flex');
                                showModal('failure-modal');
                            }, 500);
                        });
                    }
                })
                .catch(err => {
                    clearInterval(progressInterval);
                    clearInterval(timeInterval);
                    consoleOutput.textContent += `\nError: Failed to connect to server: ${err}`;
                    setTimeout(() => {
                        overlay.classList.add('hidden');
                        overlay.classList.remove('flex');
                        showModal('failure-modal');
                    }, 500);
                });
        }

        function showModal(modalId) {
            const modal = document.getElementById(modalId);
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }

        function closeModal(modalId) {
            const modal = document.getElementById(modalId);
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }

        function confirmPush() {
            if (confirm("⚠️ WARNING: This will overwrite the live remote database with all local tables and data! Are you absolutely sure you want to proceed?")) {
                runAction('push-db');
            }
        }

        function confirmRollback() {
            if (confirm("⚠️ WARNING: This will rollback the last batch of database migrations! Are you sure you want to proceed?")) {
                runAction('migrate-rollback');
            }
        }

        function clearConsole() {
            document.getElementById('console-output').textContent = 'Console cleared. Ready.';
        }
    </script>
</body>
</html>
<?php
exit;

