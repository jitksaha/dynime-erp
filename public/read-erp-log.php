<?php
header('Content-Type: text/plain');
if (!isset($_GET['token']) || $_GET['token'] !== 'deploy_token_7782') {
    die('Unauthorized');
}

echo "=== DIAGNOSTICS ===\n";
echo "PHP Version: " . PHP_VERSION . "\n";
echo "Current directory: " . getcwd() . "\n";
echo "Document root: " . ($_SERVER['DOCUMENT_ROOT'] ?? 'not set') . "\n";

$baseDir = dirname(__DIR__);
echo "Base directory: $baseDir\n";

$checks = [
    '.env' => $baseDir . '/.env',
    'vendor/autoload.php' => $baseDir . '/vendor/autoload.php',
    'storage/logs/laravel.log' => $baseDir . '/storage/logs/laravel.log',
    'bootstrap/cache' => $baseDir . '/bootstrap/cache',
];

foreach ($checks as $name => $path) {
    if (file_exists($path)) {
        echo "[OK] $name exists (writable: " . (is_writable($path) ? 'yes' : 'no') . ")\n";
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

// Check php error log
$php_error_log = ini_get('error_log');
if ($php_error_log && file_exists($php_error_log)) {
    echo "\n=== LAST 30 LINES OF PHP ERROR LOG ($php_error_log) ===\n";
    $lines = file($php_error_log);
    $last_lines = array_slice($lines, -30);
    echo implode("", $last_lines);
}
