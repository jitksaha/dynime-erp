<?php

// Bootstrap Laravel
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Workdo\Hrm\Models\IssuedDocument;

$docs = IssuedDocument::all();
$count = 0;

$replacements = [
    'â€”' => '—',
    'Â·' => '·',
    'Â©' => '©',
    'Â¢' => '¢',
    'Â' => '',
];

foreach ($docs as $doc) {
    $payload = $doc->payload;
    if (!is_array($payload)) {
        continue;
    }

    $jsonStr = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $replaced = false;
    
    foreach ($replacements as $search => $replace) {
        if (strpos($jsonStr, $search) !== false) {
            $jsonStr = str_replace($search, $replace, $jsonStr);
            $replaced = true;
        }
    }

    if ($replaced) {
        $doc->payload = json_decode($jsonStr, true);
        $doc->save();
        $count++;
        echo "Cleaned document ID: {$doc->id}\n";
    }
}

echo "Cleaned {$count} database document entries successfully!\n";
