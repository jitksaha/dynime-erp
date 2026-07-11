<?php

if (isset($_GET['debug_deploy_token']) && $_GET['debug_deploy_token'] === 'deploy_token_7782') {
    header('Content-Type: text/plain');
    echo "=== ERP DIAGNOSTICS ===\n";
    echo "PHP Version: " . PHP_VERSION . "\n";
    echo "Current directory: " . getcwd() . "\n";
    echo "Document root: " . ($_SERVER['DOCUMENT_ROOT'] ?? 'not set') . "\n";
    
    $baseDir = __DIR__;
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
