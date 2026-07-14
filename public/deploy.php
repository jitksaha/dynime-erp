<?php
/**
 * Dynime ERP Deployment & Database Sync Dashboard
 * Accessible via: http://127.0.0.1:8002/deploy.php?debug_deploy_token=deploy_token_7782
 */

if (!isset($_GET['debug_deploy_token']) || $_GET['debug_deploy_token'] !== 'deploy_token_7782') {
    header('HTTP/1.0 403 Forbidden');
    echo 'Unauthorized access.';
    exit;
}

$baseDir = dirname(__DIR__);
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

// Action: Dump DB (Only runs on live remote server to create fast dump)
if (isset($_GET['action']) && $_GET['action'] === 'dump-db') {
    header('Content-Type: text/plain');
    $dumpFile = $baseDir . '/public/storage/backup_temp.sql';
    $mysqldump = findSystemBinary('mysqldump');
    
    // Remote DB details on Hostinger
    exec(sprintf('"%s" -h 127.0.0.1 -u u740731947_erpapp -p\'Pixel#@!194JkS\' u740731947_erpapp > "%s" 2>&1', $mysqldump, $dumpFile), $output, $status);
    
    if ($status === 0) {
        echo "SUCCESS";
    } else {
        echo "FAILED: " . implode("\n", $output);
    }
    exit;
}

// Action: Clean Dump (Only runs on live remote server for cleanup)
if (isset($_GET['action']) && $_GET['action'] === 'clean-dump') {
    header('Content-Type: text/plain');
    $dumpFile = $baseDir . '/public/storage/backup_temp.sql';
    if (file_exists($dumpFile)) {
        if (@unlink($dumpFile)) {
            echo "CLEANED";
        } else {
            echo "FAILED_TO_DELETE";
        }
    } else {
        echo "NOT_FOUND";
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
        $dumpData = @file_get_contents("https://app.dynime.com/storage/backup_temp.sql", false, $context);
        
        if ($dumpData) {
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
    $targetFile = $baseDir . '/public/storage/upload_temp.sql';
    
    $rawData = file_get_contents('php://input');
    if ($rawData && file_put_contents($targetFile, $rawData)) {
        echo "UPLOAD_SUCCESS";
    } else {
        echo "UPLOAD_FAILED";
    }
    exit;
}

// Action: Import DB (Only runs on live remote server to import uploaded dump locally)
if (isset($_GET['action']) && $_GET['action'] === 'import-db') {
    header('Content-Type: text/plain');
    $tempFile = $baseDir . '/public/storage/upload_temp.sql';
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
    
    echo "All Laravel configuration and routing caches cleared successfully!\n";
    exit;
}

// Action: Fix Storage Symlinks
if (isset($_GET['action']) && $_GET['action'] === 'fix-storage') {
    header('Content-Type: text/plain');
    echo "=== RECREATING STORAGE SYMLINK ===\n";
    
    $publicStorage = $baseDir . '/public/storage';
    if (file_exists($publicStorage) || is_link($publicStorage)) {
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            @rmdir($publicStorage);
        } else {
            @unlink($publicStorage);
        }
        echo "Removed existing public/storage link.\n";
    }
    
    $target = $baseDir . '/storage/app/public';
    if (symlink($target, $publicStorage)) {
        echo "Successfully recreated symbolic link: public/storage -> storage/app/public\n";
    } else {
        echo "Failed to create symbolic link! Please check folder permissions.\n";
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
                <!-- SpinnerOverlay -->
                <div id="loading-overlay" class="absolute inset-0 bg-slate-950/80 hidden items-center justify-center backdrop-blur-sm transition-all duration-300 z-10">
                    <div class="flex flex-col items-center gap-3">
                        <div class="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
                        <span class="text-sm font-medium text-slate-300" id="loading-text">Executing Action...</span>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <footer class="border-t border-white/5 py-4 text-center text-xs text-slate-500">
        <p>&copy; <?php echo date('Y'); ?> Dynime ERP. Designed for modern pair-programming workflows.</p>
    </footer>

    <script>
        function runAction(action) {
            const consoleOutput = document.getElementById('console-output');
            const overlay = document.getElementById('loading-overlay');
            const loadingText = document.getElementById('loading-text');

            consoleOutput.textContent = `[System] Executing action: ${action}...\n`;
            overlay.classList.remove('hidden');
            overlay.classList.add('flex');
            
            if (action === 'pull-db') loadingText.textContent = "Pulling live DB (please wait)...";
            else if (action === 'push-db') loadingText.textContent = "Pushing local DB to live...";
            else loadingText.textContent = "Executing action...";

            const token = 'deploy_token_7782';
            fetch(`deploy.php?debug_deploy_token=${token}&action=${action}`)
                .then(response => response.text())
                .then(data => {
                    consoleOutput.textContent += data;
                    overlay.classList.add('hidden');
                    overlay.classList.remove('flex');
                })
                .catch(err => {
                    consoleOutput.textContent += `\nError: Failed to connect to server: ${err}`;
                    overlay.classList.add('hidden');
                    overlay.classList.remove('flex');
                });
        }

        function confirmPush() {
            if (confirm("⚠️ WARNING: This will overwrite the live remote database with all local tables and data! Are you absolutely sure you want to proceed?")) {
                runAction('push-db');
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
