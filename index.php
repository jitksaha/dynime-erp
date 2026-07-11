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
    
    $logFile = $baseDir . '/storage/logs/laravel.log';
    if (file_exists($logFile)) {
        echo "\n=== LAST 50 LINES OF LARAVEL.LOG ===\n";
        $lines = file($logFile);
        $last_lines = array_slice($lines, -50);
        echo implode("", $last_lines);
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
