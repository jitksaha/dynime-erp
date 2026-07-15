<?php
define('LARAVEL_START', microtime(true));
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;

// Log in company user so we get correct company settings prefix
$user = User::find(2);
if ($user) {
    auth()->login($user);
}

foreach (\DB::table('media')->get() as $m) {
    $url = getImageUrlPrefix() . '/' . $m->file_name;
    echo "ID: {$m->id} | Name: {$m->name} | Disk: {$m->disk} | URL: {$url}\n";
}
