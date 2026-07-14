<?php
/**
 * Local Database Pull Script (Remote Live -> Local XAMPP)
 * Run this from terminal: php db-pull.php
 */

header('Content-Type: text/plain');

$baseDir = __DIR__;

// 1. Remote Hostinger Database credentials
$remoteHost = 'srv2141.hstgr.io';
$remoteDB = 'u740731947_erpapp';
$remoteUser = 'u740731947_erpapp';
$remotePass = 'Pixel#@!194JkS';

// 2. Local Database credentials (XAMPP default)
$localHost = '127.0.0.1';
$localPort = '3306';
$localDB = 'u740731947_erpapp';
$localUser = 'root';
$localPass = '';

// Find mysql and mysqldump executable paths
function findBinary($name) {
    // Check common directories first (XAMPP is prioritized to avoid Homebrew MySQL 9 native password issues)
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

    // Check system path next
    $path = null;
    if (strtoupper(substr(PHP_OS, 0, 3)) !== 'WIN') {
        $path = @exec("which $name");
    }
    if ($path && file_exists($path)) {
        return $path;
    }
    
    return $name; // Fallback
}

$mysqldump = findBinary('mysqldump');
$mysql = findBinary('mysql');

echo "=== STARTING DATABASE PULL: LIVE -> LOCAL ===\n";
echo "Source Live DB:  $remoteDB on $remoteHost\n";
echo "Target Local DB: $localDB on $localHost:$localPort\n";
echo "--------------------------------------------------\n";

// Step 1: Ensure local database exists
echo "Step 1/4: Ensuring local database exists...\n";
$createDBCmd = sprintf(
    '"%s" --host="%s" --port="%s" --user="%s" --password="%s" -e "CREATE DATABASE IF NOT EXISTS %s;" 2>&1',
    $mysql,
    $localHost,
    $localPort,
    $localUser,
    $localPass,
    $localDB
);

if ($localPass === '') {
    $createDBCmd = sprintf(
        '"%s" --host="%s" --port="%s" --user="%s" -e "CREATE DATABASE IF NOT EXISTS %s;" 2>&1',
        $mysql,
        $localHost,
        $localPort,
        $localUser,
        $localDB
    );
}

exec($createDBCmd, $createDBOutput, $createDBStatus);
if ($createDBStatus !== 0) {
    echo "Warning: Failed to create database via CLI, trying to continue anyway...\n";
} else {
    echo "Local database is ready.\n\n";
}

$tempFile = $baseDir . '/storage/remote_db_dump.sql';
$useHttp = false;

// Step 2: Dump Remote DB
echo "Step 2/4: Fetching live database dump...\n";

// Attempt high-speed HTTP dump method first
echo "Attempting high-speed HTTP dump method...\n";
$context = stream_context_create([
    "http" => [
        "timeout" => 180, // 3 minutes timeout
        "ignore_errors" => true
    ]
]);
$url = "https://app.dynime.com/index.php?debug_deploy_token=deploy_token_7782&action=dump-db";
$response = @file_get_contents($url, false, $context);

if ($response && strpos($response, "SUCCESS") !== false) {
    echo "Remote server successfully created dump locally in 1 second!\n";
    echo "Downloading dump file...\n";
    $dumpData = @file_get_contents("https://app.dynime.com/storage/backup_temp.sql", false, $context);
    
    if ($dumpData) {
        file_put_contents($tempFile, $dumpData);
        echo "Download completed: " . round(filesize($tempFile) / 1024, 2) . " KB\n";
        
        // Clean up live dump file immediately for security
        @file_get_contents("https://app.dynime.com/index.php?debug_deploy_token=deploy_token_7782&action=clean-dump", false, $context);
        $useHttp = true;
    } else {
        echo "Warning: Failed to download dump file over HTTP. Falling back to direct CLI...\n";
    }
} else {
    echo "Note: Remote server does not support HTTP dump yet or is not redeployed.\n";
    echo "Falling back to direct CLI dump over WAN (this may take a few minutes)...\n";
}

if (!$useHttp) {
    // Fallback: Direct CLI dump over WAN
    $dumpCmd = sprintf(
        '"%s" --host="%s" --user="%s" --password="%s" --add-drop-table --quick --single-transaction "%s" > "%s" 2>&1',
        $mysqldump,
        $remoteHost,
        $remoteUser,
        $remotePass,
        $remoteDB,
        $tempFile
    );

    exec($dumpCmd, $dumpOutput, $dumpStatus);

    if ($dumpStatus !== 0) {
        echo "Error: Remote dump failed! Status: $dumpStatus\n";
        echo "Output: " . implode("\n", $dumpOutput) . "\n";
        exit(1);
    }
    echo "Direct remote dump successful! Size: " . round(filesize($tempFile) / 1024, 2) . " KB\n\n";
}

// Step 3: Import into Local XAMPP DB
echo "Step 3/4: Importing dump to local database...\n";
$importCmd = sprintf(
    '"%s" --host="%s" --port="%s" --user="%s" --password="%s" "%s" < "%s" 2>&1',
    $mysql,
    $localHost,
    $localPort,
    $localUser,
    $localPass,
    $localDB,
    $tempFile
);

if ($localPass === '') {
    $importCmd = sprintf(
        '"%s" --host="%s" --port="%s" --user="%s" "%s" < "%s" 2>&1',
        $mysql,
        $localHost,
        $localPort,
        $localUser,
        $localDB,
        $tempFile
    );
}

exec($importCmd, $importOutput, $importStatus);
@unlink($tempFile);

if ($importStatus !== 0) {
    echo "Error: Importing to Local Database failed! Status: $importStatus\n";
    echo "Output: " . implode("\n", $importOutput) . "\n";
    exit(1);
}

echo "--------------------------------------------------\n";
echo "SUCCESS: Remote database pulled to Local successfully!\n\n";

// Step 4: Update local .env to point to local MySQL
echo "Step 4/4: Updating .env to use local database...\n";
$envPath = $baseDir . '/.env';
if (file_exists($envPath)) {
    $envContent = file_get_contents($envPath);
    
    $envContent = preg_replace('/^DB_HOST=.*$/m', 'DB_HOST=127.0.0.1', $envContent);
    $envContent = preg_replace('/^DB_PORT=.*$/m', 'DB_PORT=3306', $envContent);
    $envContent = preg_replace('/^DB_DATABASE=.*$/m', 'DB_DATABASE=' . $localDB, $envContent);
    $envContent = preg_replace('/^DB_USERNAME=.*$/m', 'DB_USERNAME=' . $localUser, $envContent);
    $envContent = preg_replace('/^DB_PASSWORD=.*$/m', 'DB_PASSWORD=""', $envContent);
    
    if (file_put_contents($envPath, $envContent) !== false) {
        echo "Success: Local .env updated successfully!\n";
        
        // Clear laravel config cache to make it active instantly
        $configFile = $baseDir . '/bootstrap/cache/config.php';
        if (file_exists($configFile)) {
            @unlink($configFile);
            echo "Success: Laravel configuration cache cleared.\n";
        }
    } else {
        echo "Error: Failed to write to .env file.\n";
    }
} else {
    echo "Error: .env file not found.\n";
}
