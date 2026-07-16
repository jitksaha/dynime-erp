<?php
// Test script to check media database records

$host = 'srv2141.hstgr.io';
$db = 'u740731947_erpapp';
$user = 'u740731947_erpapp';
$pass = 'Pixel#@!194JkS';
$port = '3306';

try {
    $dsn = "mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    
    echo "Connected successfully to live database.\n\n";
    
    // Check latest 5 media items
    $stmt = $pdo->prepare("SELECT * FROM media ORDER BY id DESC LIMIT 5");
    $stmt->execute();
    $mediaItems = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "=== LATEST MEDIA ITEMS ===\n";
    foreach ($mediaItems as $item) {
        print_r($item);
        echo "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
