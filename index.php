<?php

if (isset($_GET['debug_deploy_token']) && $_GET['debug_deploy_token'] === 'deploy_token_7782') {
    header('Content-Type: text/plain');
    $baseDir = __DIR__;
    
    // Setup .env file action
    if (isset($_GET['action']) && $_GET['action'] === 'setup-env') {
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
    
    // Mark as installed action
    if (isset($_GET['action']) && $_GET['action'] === 'mark-installed') {
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
    
    // Read raw log action
    if (isset($_GET['action']) && $_GET['action'] === 'read-raw-log') {
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
    
    // Fix password action
    if (isset($_GET['action']) && $_GET['action'] === 'fix-password') {
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
                echo "Error: Failed to write .env file.\n";
            }
        } else {
            echo "Error: .env file not found.\n";
        }
        exit;
    }
    
    // Clear cache action
    if (isset($_GET['action']) && $_GET['action'] === 'clear-cache') {
        echo "=== CLEARING CONFIG CACHE ===\n";
        $configFile = $baseDir . '/bootstrap/cache/config.php';
        $routesFile = $baseDir . '/bootstrap/cache/routes-v7.php';
        $servicesFile = $baseDir . '/bootstrap/cache/services.php';
        $packagesFile = $baseDir . '/bootstrap/cache/packages.php';
        
        $files = [$configFile, $routesFile, $servicesFile, $packagesFile];
        foreach ($files as $file) {
            if (file_exists($file)) {
                if (@unlink($file)) {
                    echo "Success: Deleted cache file " . basename($file) . "\n";
                } else {
                    echo "Error: Failed to delete cache file " . basename($file) . "\n";
                }
            } else {
                echo "Info: Cache file " . basename($file) . " does not exist\n";
            }
        }
        exit;
    }
    
    // Fix storage symlink action
    if (isset($_GET['action']) && $_GET['action'] === 'fix-storage') {
        echo "=== FIXING STORAGE SYMLINK ===\n";
        $symlinkPath = $baseDir . '/public/storage';
        $target = '../storage/app/public';
        
        if (file_exists($symlinkPath)) {
            if (is_link($symlinkPath)) {
                if (unlink($symlinkPath)) {
                    echo "Success: Deleted existing broken/absolute symlink at $symlinkPath\n";
                } else {
                    echo "Error: Failed to delete existing symlink at $symlinkPath\n";
                    exit;
                }
            } else {
                $backupPath = $symlinkPath . '_old_' . time();
                if (rename($symlinkPath, $backupPath)) {
                    echo "Success: Moved existing directory to $backupPath\n";
                } else {
                    echo "Error: Failed to move existing directory at $symlinkPath\n";
                    exit;
                }
            }
        }
        
        if (symlink($target, $symlinkPath)) {
            echo "Success: Created relative storage symlink pointing to $target!\n";
        } else {
            echo "Error: Failed to create relative storage symlink.\n";
        }
        exit;
    }

    // Push DB action
    if (isset($_GET['action']) && $_GET['action'] === 'push-db') {
        echo "=== INITIATING DB SYNC: LOCAL -> LIVE ===\n";
        
        // Remote Hostinger Database credentials
        $remoteHost = 'srv2141.hstgr.io';
        $remoteDB = 'u740731947_erpapp';
        $remoteUser = 'u740731947_erpapp';
        $remotePass = 'Pixel#@!194JkS';

        // Load Local Database credentials from .env
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

        // Find mysql and mysqldump executable paths
        function findBinaryInIndex($name) {
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

            $path = null;
            if (strtoupper(substr(PHP_OS, 0, 3)) !== 'WIN') {
                $path = @exec("which $name");
            }
            if ($path && file_exists($path)) {
                return $path;
            }
            
            return $name;
        }

        $mysqldump = findBinaryInIndex('mysqldump');
        $mysql = findBinaryInIndex('mysql');

        echo "Source Local DB: $localDB on $localHost:$localPort\n";
        echo "Target Live DB:  $remoteDB on $remoteHost\n\n";

        $tempFile = $baseDir . '/storage/local_db_dump.sql';

        echo "Step 1: Dumping local database...\n";
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
            exit;
        }

        echo "Local dump successful! Dump size: " . round(filesize($tempFile) / 1024, 2) . " KB\n\n";

        echo "Step 2: Importing dump to Remote Hostinger Database...\n";
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
        @unlink($tempFile);

        if ($importStatus !== 0) {
            echo "Error: Import failed! Status: $importStatus\n";
            echo "Output: " . implode("\n", $importOutput) . "\n";
            exit;
        }

        echo "SUCCESS: Local database pushed to Remote successfully!\n";
        exit;
    }

    // Dump DB action (for fast pull)
    if (isset($_GET['action']) && $_GET['action'] === 'dump-db') {
        $dumpFile = $baseDir . '/public/storage/backup_temp.sql';
        
        // Find mysqldump executable path
        function findDumpBinary($name) {
            $path = null;
            if (strtoupper(substr(PHP_OS, 0, 3)) !== 'WIN') {
                $path = @exec("which $name");
            }
            if ($path && file_exists($path)) {
                return $path;
            }
            
            $commonPaths = [
                "/usr/bin/$name",
                "/usr/local/bin/$name",
                "/opt/homebrew/bin/$name"
            ];
            
            foreach ($commonPaths as $p) {
                if (file_exists($p)) {
                    return $p;
                }
            }
            return $name;
        }
        
        $mysqldump = findDumpBinary('mysqldump');
        
        exec(sprintf('"%s" -h 127.0.0.1 -u u740731947_erpapp -p\'Pixel#@!194JkS\' u740731947_erpapp > "%s" 2>&1', $mysqldump, $dumpFile), $output, $status);
        
        if ($status === 0) {
            echo "SUCCESS";
        } else {
            echo "FAILED: " . implode("\n", $output);
        }
        exit;
    }

    // Clean dump action (for security)
    if (isset($_GET['action']) && $_GET['action'] === 'clean-dump') {
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

    // Pull DB action (for fast local sync over HTTP)
    if (isset($_GET['action']) && $_GET['action'] === 'pull-db') {
        echo "=== INITIATING DB SYNC: LIVE -> LOCAL ===\n";
        
        // Remote Hostinger Database credentials
        $remoteHost = 'srv2141.hstgr.io';
        $remoteDB = 'u740731947_erpapp';
        $remoteUser = 'u740731947_erpapp';
        $remotePass = 'Pixel#@!194JkS';

        // Load Local Database credentials from .env
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

        // Find mysql and mysqldump executable paths
        function findBinaryInIndex($name) {
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

        $mysqldump = findBinaryInIndex('mysqldump');
        $mysql = findBinaryInIndex('mysql');

        echo "Source Live DB:  $remoteDB on $remoteHost\n";
        echo "Target Local DB: $localDB on $localHost:$localPort\n\n";

        // Step 1: Ensure local DB exists
        echo "Step 1/3: Ensuring local database exists...\n";
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
            echo "Warning: Database creation warning: " . implode("\n", $createDBOutput) . "\n";
        } else {
            echo "Local database is ready.\n";
        }

        $tempFile = $baseDir . '/storage/remote_db_dump.sql';
        $useHttp = false;

        // Step 2: Fetch Dump
        echo "\nStep 2/3: Fetching live database dump...\n";
        echo "Attempting high-speed HTTP dump method...\n";
        
        $context = stream_context_create([
            "http" => [
                "timeout" => 180,
                "ignore_errors" => true
            ]
        ]);
        $url = "https://app.dynime.com/index.php?debug_deploy_token=deploy_token_7782&action=dump-db";
        $response = @file_get_contents($url, false, $context);

        if ($response && strpos($response, "SUCCESS") !== false) {
            echo "Remote server successfully created dump locally!\n";
            echo "Downloading dump file...\n";
            $dumpData = @file_get_contents("https://app.dynime.com/storage/backup_temp.sql", false, $context);
            
            if ($dumpData) {
                file_put_contents($tempFile, $dumpData);
                echo "Download completed: " . round(filesize($tempFile) / 1024, 2) . " KB\n";
                
                // Clean up remote
                @file_get_contents("https://app.dynime.com/index.php?debug_deploy_token=deploy_token_7782&action=clean-dump", false, $context);
                $useHttp = true;
            } else {
                echo "Warning: Failed to download dump file. Falling back to direct CLI...\n";
            }
        } else {
            echo "Note: Remote server does not support HTTP dump yet or is not redeployed.\n";
            echo "Falling back to direct CLI dump over WAN (this may take a few minutes)...\n";
        }

        if (!$useHttp) {
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
                exit;
            }
            echo "Direct remote dump successful!\n";
        }

        // Step 3: Import Local
        echo "\nStep 3/3: Importing dump to local database...\n";
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
            echo "Error: Import failed! Status: $importStatus\n";
            echo "Output: " . implode("\n", $importOutput) . "\n";
            exit;
        }

        // Step 4: Update .env
        echo "\nStep 4: Updating local .env to local connection...\n";
        if (file_exists($envPath)) {
            $envContent = file_get_contents($envPath);
            $envContent = preg_replace('/^DB_HOST=.*$/m', 'DB_HOST=127.0.0.1', $envContent);
            $envContent = preg_replace('/^DB_PORT=.*$/m', 'DB_PORT=3306', $envContent);
            $envContent = preg_replace('/^DB_DATABASE=.*$/m', 'DB_DATABASE=' . $localDB, $envContent);
            $envContent = preg_replace('/^DB_USERNAME=.*$/m', 'DB_USERNAME=' . $localUser, $envContent);
            $envContent = preg_replace('/^DB_PASSWORD=.*$/m', 'DB_PASSWORD=""', $envContent);
            
            if (file_put_contents($envPath, $envContent) !== false) {
                echo "Success: Local .env updated successfully!\n";
                $configFile = $baseDir . '/bootstrap/cache/config.php';
                if (file_exists($configFile)) {
                    @unlink($configFile);
                }
            }
        }

        echo "--------------------------------------------------\n";
        echo "SUCCESS: Remote database pulled to Local successfully!\nAll tables and data are now locally active.\n";
        exit;
    }

    // Dump DB action (for fast pull)
    if (isset($_GET['action']) && $_GET['action'] === 'dump-db') {
        $dumpFile = $baseDir . '/public/storage/backup_temp.sql';
        
        // Find mysqldump executable path
        function findDumpBinary($name) {
            $path = null;
            if (strtoupper(substr(PHP_OS, 0, 3)) !== 'WIN') {
                $path = @exec("which $name");
            }
            if ($path && file_exists($path)) {
                return $path;
            }
            
            $commonPaths = [
                "/usr/bin/$name",
                "/usr/local/bin/$name",
                "/opt/homebrew/bin/$name"
            ];
            
            foreach ($commonPaths as $p) {
                if (file_exists($p)) {
                    return $p;
                }
            }
            return $name;
        }
        
        $mysqldump = findDumpBinary('mysqldump');
        
        exec(sprintf('"%s" -h 127.0.0.1 -u u740731947_erpapp -p\'Pixel#@!194JkS\' u740731947_erpapp > "%s" 2>&1', $mysqldump, $dumpFile), $output, $status);
        
        if ($status === 0) {
            echo "SUCCESS";
        } else {
            echo "FAILED: " . implode("\n", $output);
        }
        exit;
    }

    // Clean dump action (for security)
    if (isset($_GET['action']) && $_GET['action'] === 'clean-dump') {
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

    // Render HTML Control Dashboard
    $checks = [
        '.env' => $baseDir . '/.env',
        'vendor/autoload.php' => $baseDir . '/vendor/autoload.php',
        'public/index.php' => $baseDir . '/public/index.php',
        'public/build/manifest.json' => $baseDir . '/public/build/manifest.json',
        'storage/logs/laravel.log' => $baseDir . '/storage/logs/laravel.log',
    ];
    $checkResults = [];
    foreach ($checks as $name => $path) {
        $exists = file_exists($path);
        $writable = $exists && is_writable($path);
        $checkResults[$name] = [
            'exists' => $exists,
            'writable' => $writable,
            'size' => $exists ? round(filesize($path) / 1024, 2) . ' KB' : '0 KB'
        ];
    }

    // DB settings and connection tests
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
                    <div class="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-between p-2 shadow-lg shadow-indigo-600/20">
                        <svg class="h-full w-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <div>
                        <h1 class="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">Dynime ERP <span class="text-xs bg-indigo-500/10 text-indigo-400 font-semibold px-2 py-0.5 rounded border border-indigo-500/20">Control Panel</span></h1>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <span class="text-xs text-slate-400 flex items-center gap-1.5">
                        <span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Active Session
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
                            <h4 class="font-semibold text-sm text-slate-200 group-hover:text-white">Pull Database</h4>
                            <p class="text-xs text-slate-500 mt-1">Sync remote live database to local XAMPP</p>
                        </div>
                    </button>
                    
                    <button onclick="confirmPush()" class="group p-4 rounded-xl border border-amber-500/10 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/30 transition-all duration-200 text-left flex items-start gap-3">
                        <div class="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform duration-200">
                            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        </div>
                        <div>
                            <h4 class="font-semibold text-sm text-slate-200 group-hover:text-white">Push Database</h4>
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
                <div class="glass-card rounded-2xl flex-1 p-6 flex flex-col shadow-xl min-h-[300px] border border-white/5 relative overflow-hidden">
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
                fetch(`index.php?debug_deploy_token=${token}&action=${action}`)
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
}
}

/**
 * Laravel - A PHP Framework For Web Artisans
 *
 * @package  Laravel
 * @author   Taylor Otwell <taylor@laravel.com>
 */

$uri = urldecode(
    parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH)
);

// This file allows us to emulate Apache's "mod_rewrite" functionality from the
// built-in PHP web server. This provides a convenient way to test a Laravel
// application without having installed a "real" web server software here.
if ($uri !== '/' && file_exists(__DIR__.'/public'.$uri)) {
    return false;
}

require_once __DIR__.'/public/index.php';
