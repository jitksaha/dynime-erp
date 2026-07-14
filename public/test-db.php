<?php
header('Content-Type: text/plain');
echo "=== DYNIME LIVE DIAGNOSTICS ===\n";

$baseDir = dirname(__DIR__);
echo "Base Directory: $baseDir\n";

// 1. Check if .env exists
$envPath = $baseDir . '/.env';
if (file_exists($envPath)) {
    echo ".env file found.\n";
    $envContent = file_get_contents($envPath);
    $lines = explode("\n", $envContent);
    foreach ($lines as $line) {
        if (strpos(trim($line), 'DB_') === 0) {
            echo "  $line\n";
        }
    }
} else {
    echo ".env file NOT found!\n";
}

// 2. Test DB Connection
echo "\nTesting Database Connection...\n";
$db_settings = [
    'DB_HOST' => '127.0.0.1',
    'DB_PORT' => '3306',
    'DB_DATABASE' => '',
    'DB_USERNAME' => '',
    'DB_PASSWORD' => '',
];
if (file_exists($envPath)) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $name = trim($parts[0]);
            $value = trim($parts[1], "\"' ");
            if (array_key_exists($name, $db_settings)) {
                $db_settings[$name] = $value;
            }
        }
    }
}

try {
    $dsn = "mysql:host=" . $db_settings['DB_HOST'] . ";port=" . $db_settings['DB_PORT'] . ";dbname=" . $db_settings['DB_DATABASE'];
    $pdo = new PDO($dsn, $db_settings['DB_USERNAME'], $db_settings['DB_PASSWORD'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 5
    ]);
    echo "SUCCESS: Database connection successful!\n";
} catch (Exception $e) {
    echo "ERROR: Database connection failed: " . $e->getMessage() . "\n";
}

// 3. Show Last Laravel Errors
echo "\nReading Last 20 lines of laravel.log...\n";
$logFile = $baseDir . '/storage/logs/laravel.log';
if (file_exists($logFile)) {
    $lines = file($logFile);
    $lastLines = array_slice($lines, -20);
    echo implode("", $lastLines);
} else {
    echo "No laravel.log found.\n";
}
