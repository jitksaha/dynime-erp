<?php
/**
 * Dynime ERP Self-Updater (Zip-based Deployment)
 */
header('Content-Type: text/plain');
echo "=== DYNIME ERP SELF-UPDATER ===\n";

$baseDir = dirname(__DIR__);
$zipUrl = 'https://github.com/jitksaha/dynime-erp/archive/refs/heads/main.zip';
$tempZip = $baseDir . '/temp_update.zip';
$tempExtractDir = $baseDir . '/temp_extract';

// Step 1: Download the ZIP
echo "Downloading repository ZIP...\n";
$ch = curl_init($zipUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
$zipContent = curl_exec($ch);
if (curl_errno($ch)) {
    echo "Error downloading ZIP: " . curl_error($ch) . "\n";
    exit;
}
curl_close($ch);

if (file_put_contents($tempZip, $zipContent) === false) {
    echo "Error: Failed to write ZIP to $tempZip\n";
    exit;
}
echo "ZIP downloaded successfully (" . round(filesize($tempZip) / 1024 / 1024, 2) . " MB).\n";

// Step 2: Extract the ZIP
if (!class_exists('ZipArchive')) {
    echo "Error: ZipArchive class is not available in this PHP environment.\n";
    @unlink($tempZip);
    exit;
}

$zip = new ZipArchive();
if ($zip->open($tempZip) === true) {
    if (file_exists($tempExtractDir)) {
        deleteDir($tempExtractDir);
    }
    @mkdir($tempExtractDir, 0755, true);
    $zip->extractTo($tempExtractDir);
    $zip->close();
    echo "ZIP extracted to temporary directory.\n";
} else {
    echo "Error: Failed to open ZIP archive.\n";
    @unlink($tempZip);
    exit;
}

// Step 3: Find the extracted folder (GitHub wraps it in dynime-erp-main/)
$extractedSubDirs = glob($tempExtractDir . '/*', GLOB_ONLYDIR);
if (empty($extractedSubDirs)) {
    echo "Error: Extracted directory is empty.\n";
    cleanUp();
    exit;
}
$srcDir = $extractedSubDirs[0]; // e.g. /temp_extract/dynime-erp-main

// Step 4: Recursively copy files (excluding storage, .env, and other sensitive paths)
echo "Deploying files...\n";
$copyCount = 0;
$skipCount = 0;

function copyRecursive($src, $dst, &$copyCount, &$skipCount, $baseDir) {
    if (is_link($src)) return;
    
    // Relative path for exclusion checks
    $relPath = str_replace($src, '', $src);
    $fullDstPath = $dst . $relPath;
    
    // Exclude patterns
    $excludePatterns = [
        '/\.env$/i',
        '/\.git/i',
        '/^\\\\storage/i',
        '/^\\/storage/i',
        '/^\\\\node_modules/i',
        '/^\\/node_modules/i',
    ];
    
    $relativeToRoot = str_replace($baseDir, '', $fullDstPath);
    foreach ($excludePatterns as $pattern) {
        if (preg_match($pattern, $relativeToRoot)) {
            $skipCount++;
            return;
        }
    }

    if (is_dir($src)) {
        if (!file_exists($fullDstPath)) {
            @mkdir($fullDstPath, 0755, true);
        }
        $dir = @opendir($src);
        if (!$dir) return;
        while (($file = readdir($dir)) !== false) {
            if ($file === '.' || $file === '..') continue;
            copyRecursive($src . '/' . $file, $dst, $copyCount, $skipCount, $baseDir);
        }
        closedir($dir);
    } else {
        // Ensure directory of the file exists
        $parentDir = dirname($fullDstPath);
        if (!file_exists($parentDir)) {
            @mkdir($parentDir, 0755, true);
        }
        
        if (@copy($src, $fullDstPath)) {
            $copyCount++;
        } else {
            echo "Warning: Failed to copy to $fullDstPath\n";
        }
    }
}

copyRecursive($srcDir, $baseDir, $copyCount, $skipCount, $baseDir);
echo "Deployment finished. Copied $copyCount files, skipped $skipCount files/directories.\n";

// Step 5: Clean up temp files
cleanUp();

echo "\n=== UPDATE COMPLETED SUCCESSFULLY ===\n";

function deleteDir($dir) {
    if (!file_exists($dir)) return true;
    if (!is_dir($dir) || is_link($dir)) return @unlink($dir);
    foreach (scandir($dir) as $item) {
        if ($item == '.' || $item == '..') continue;
        if (!deleteDir($dir . DIRECTORY_SEPARATOR . $item)) return false;
    }
    return @rmdir($dir);
}

function cleanUp() {
    global $tempZip, $tempExtractDir;
    if (file_exists($tempZip)) {
        @unlink($tempZip);
    }
    if (file_exists($tempExtractDir)) {
        deleteDir($tempExtractDir);
    }
}
