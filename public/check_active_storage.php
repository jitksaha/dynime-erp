<?php

// Bootstrap Laravel to access database and cache
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';

// Bootstrap service providers without dispatching HTTP routing
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

header('Content-Type: application/json');

try {
    $settings = getAdminAllSetting();
    $storageType = $settings['storageType'] ?? 'local';
    
    echo json_encode([
        'success' => true,
        'active_storage_type' => $storageType,
        'disk_name' => \App\Services\StorageConfigService::getActiveDisk(),
        'r2_s3_details' => [
            'endpoint' => $settings['awsEndpoint'] ?? '',
            'bucket' => $settings['awsBucket'] ?? '',
            'region' => $settings['awsDefaultRegion'] ?? '',
            'url' => $settings['awsUrl'] ?? '',
            'has_key' => !empty($settings['awsAccessKeyId']),
            'has_secret' => !empty($settings['awsSecretAccessKey']),
        ]
    ], JSON_PRETTY_PRINT);
} catch (\Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
