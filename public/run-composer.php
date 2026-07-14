<?php
// Temporary script to run composer install on Hostinger live server
header('Content-Type: text/plain');

$baseDir = dirname(__DIR__);
$composer = $baseDir . '/composer.phar';

if (!file_exists($composer)) {
    die("Error: composer.phar not found at $composer\n");
}

echo "=== RUNNING COMPOSER INSTALL ON HOSTINGER ===\n";
exec("php composer.phar install --no-dev --optimize-autoloader 2>&1", $output, $status);
echo implode("\n", $output) . "\n";
echo $status === 0 ? "SUCCESS\n" : "FAILED\n";
