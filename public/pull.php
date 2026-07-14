<?php
/**
 * Dynime ERP Self-Updater
 */
header('Content-Type: text/plain');
echo "=== DYNIME ERP SELF-UPDATER ===\n";

$files = [
    'public/deploy.php' => 'https://raw.githubusercontent.com/jitksaha/dynime-erp/main/public/deploy.php',
    'public/repair.php' => 'https://raw.githubusercontent.com/jitksaha/dynime-erp/main/public/repair.php',
    'routes/api.php' => 'https://raw.githubusercontent.com/jitksaha/dynime-erp/main/routes/api.php',
];

$baseDir = dirname(__DIR__);

foreach ($files as $localPath => $url) {
    echo "Fetching $localPath...\n";
    $content = @file_get_contents($url);
    if ($content === false) {
        echo "Error: Failed to fetch $url\n";
        continue;
    }
    
    $fullPath = $baseDir . '/' . $localPath;
    
    // Ensure directory exists
    $dir = dirname($fullPath);
    if (!file_exists($dir)) {
        @mkdir($dir, 0755, true);
    }
    
    if (file_put_contents($fullPath, $content) !== false) {
        echo "SUCCESS: Updated $localPath (" . round(strlen($content) / 1024, 2) . " KB)\n";
    } else {
        echo "Error: Failed to write to $localPath\n";
    }
}
