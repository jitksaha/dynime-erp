<?php
/**
 * Local-to-Live Database Push Script
 * Run this from terminal: php db-push.php
 */

header('Content-Type: text/plain');

$baseDir = __DIR__;

// 1. Remote Hostinger Database credentials
$remoteHost = 'srv2141.hstgr.io';
$remoteDB = 'u740731947_erpapp';
$remoteUser = 'u740731947_erpapp';
$remotePass = 'Pixel#@!194JkS';

// 2. Load Local Database credentials from .env
$envPath = $baseDir . '/.env';
$localHost = '127.0.0.1';
$localPort = '3306';
$localDB = 'u740731947_erpapp';
$localUser = 'root';
$localPass = '';

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

// 3. Find mysql and mysqldump executable paths
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

echo "=== STARTING DATABASE SYNC: LOCAL -> LIVE ===\n";
echo "Source Local DB: $localDB on $localHost:$localPort (User: $localUser)\n";
echo "Target Live DB:  $remoteDB on $remoteHost (User: $remoteUser)\n";
echo "--------------------------------------------------\n";

$tempFile = $baseDir . '/storage/local_db_dump.sql';

// Check write permissions on storage directory
if (!is_writable(dirname($tempFile))) {
    echo "Error: Storage directory is not writable. Cannot create temporary dump file.\n";
    exit(1);
}

// Step 1: Dump Local DB
echo "Step 1/2: Dumping local database...\n";
$dumpCmd = sprintf(
    '"%s" --host="%s" --port="%s" --user="%s" --password="%s" --add-drop-table --quick --single-transaction "%s" > "%s" 2>&1',
    $mysqldump,
    $localHost,
    $localPort,
    $localUser,
    $localPass,
    $localDB,
    $tempFile
);

// If local password is empty, omit password flag or pass empty string
if ($localPass === '') {
    $dumpCmd = sprintf(
        '"%s" --host="%s" --port="%s" --user="%s" --add-drop-table --quick --single-transaction "%s" > "%s" 2>&1',
        $mysqldump,
        $localHost,
        $localPort,
        $localUser,
        $localDB,
        $tempFile
    );
}

exec($dumpCmd, $dumpOutput, $dumpStatus);

if ($dumpStatus !== 0) {
    echo "Error: Local dump failed! Status: $dumpStatus\n";
    echo "Output: " . implode("\n", $dumpOutput) . "\n";
    exit(1);
}

if (!file_exists($tempFile) || filesize($tempFile) === 0) {
    echo "Error: Dump file is empty or was not created.\n";
    exit(1);
}

echo "Local dump successful! Dump size: " . round(filesize($tempFile) / 1024, 2) . " KB\n\n";

// Step 2: Push dump to Live Remote DB via HTTP upload + import
echo "Step 2/2: Pushing dump to Remote Hostinger Database...\n";
echo "Compressing dump file...\n";
$sqlContent = file_get_contents($tempFile);
$gzippedContent = gzencode($sqlContent, 9);
echo "Uploading compressed dump file (" . round(strlen($gzippedContent) / 1024, 2) . " KB) to remote server...\n";
$uploadUrl = "https://app.dynime.com/deploy.php?debug_deploy_token=deploy_token_7782&action=upload-db";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $uploadUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $gzippedContent);
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
    $importCmd = sprintf(
        '"%s" --host="%s" --user="%s" --password="%s" "%s" < "%s" 2>&1',
        $mysql,
        $remoteHost,
        $remoteUser,
        $remotePass,
        $remoteDB,
        $tempFile
    );
    exec($importCmd, $importOutput, $importStatus);
    if ($importStatus !== 0) {
        echo "Error: Pushing to Remote Database failed! Status: $importStatus\n";
        echo "Output: " . implode("\n", $importOutput) . "\n";
        @unlink($tempFile);
        exit(1);
    }
}

@unlink($tempFile);
echo "--------------------------------------------------\n";
echo "SUCCESS: Local database pushed to Remote successfully!\n";
echo "All tables and data are now live.\n";
