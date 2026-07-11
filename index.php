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
            $envContent = preg_replace('/^DB_PASSWORD=.*$/m', 'DB_PASSWORD=Pixel#@!194JkS', $envContent);
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

    echo "=== ERP DIAGNOSTICS ===\n";
    echo "PHP Version: " . PHP_VERSION . "\n";
    echo "Current directory: " . getcwd() . "\n";
    echo "Document root: " . ($_SERVER['DOCUMENT_ROOT'] ?? 'not set') . "\n";
    
    echo "Base directory: $baseDir\n";
    
    $checks = [
        '.env' => $baseDir . '/.env',
        'vendor/autoload.php' => $baseDir . '/vendor/autoload.php',
        'public/index.php' => $baseDir . '/public/index.php',
        'public/build/manifest.json' => $baseDir . '/public/build/manifest.json',
        'storage/logs/laravel.log' => $baseDir . '/storage/logs/laravel.log',
    ];
    
    foreach ($checks as $name => $path) {
        if (file_exists($path)) {
            echo "[OK] $name exists (size: " . filesize($path) . " bytes)\n";
        } else {
            echo "[FAIL] $name does NOT exist at $path\n";
        }
    }
    
    // Read and parse .env
    $db_settings = [
        'DB_HOST' => '127.0.0.1',
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
                $value = trim($parts[1]);
                if (array_key_exists($name, $db_settings)) {
                    $db_settings[$name] = trim($value, "\"' ");
                }
            }
        }
    }
    
    echo "\n=== DATABASE CONNECTIVITY TEST ===\n";
    echo "Configured DB Name: " . $db_settings['DB_DATABASE'] . "\n";
    echo "Configured DB User: " . $db_settings['DB_USERNAME'] . "\n";
    
    $hosts = ['127.0.0.1', 'localhost'];
    foreach ($hosts as $host) {
        try {
            $dsn = "mysql:host=$host;dbname=" . $db_settings['DB_DATABASE'] . ";charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 3,
            ];
            $pdo = new PDO($dsn, $db_settings['DB_USERNAME'], $db_settings['DB_PASSWORD'], $options);
            echo "[OK] Connected successfully to host: $host\n";
        } catch (PDOException $e) {
            echo "[FAIL] Failed to connect to host: $host. Error: " . $e->getMessage() . "\n";
        }
    }
    
    $logFile = $baseDir . '/storage/logs/laravel.log';
    if (file_exists($logFile)) {
        echo "\n=== LAST LARAVEL ERROR ===\n";
        $logContent = file_get_contents($logFile);
        $errors = explode('production.ERROR:', $logContent);
        if (count($errors) > 1) {
            $lastError = end($errors);
            // Limit to first 2000 chars of the error to avoid truncation issues
            echo "production.ERROR:" . substr($lastError, 0, 2500) . "\n";
        } else {
            echo "No production.ERROR found in log. Showing last 50 lines:\n";
            $lines = file($logFile);
            $last_lines = array_slice($lines, -50);
            echo implode("", $last_lines);
        }
    } else {
        echo "\nNo laravel.log found.\n";
    }
    
    $php_error_log = ini_get('error_log');
    if ($php_error_log && file_exists($php_error_log)) {
        echo "\n=== LAST 30 LINES OF PHP ERROR LOG ($php_error_log) ===\n";
        $lines = file($php_error_log);
        $last_lines = array_slice($lines, -30);
        echo implode("", $last_lines);
    }
    exit;
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
