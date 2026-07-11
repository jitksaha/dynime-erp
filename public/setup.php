<?php
// Secure Web-Based Laravel .env Installer

$baseDir = dirname(__DIR__);
$envFile = $baseDir . '/.env';
$exampleFile = $baseDir . '/.env.example';

// Security Check: If .env already exists, disable setup immediately
if (file_exists($envFile)) {
    http_response_code(403);
    die("<h3>Security Alert:</h3> Setup is disabled because <code>.env</code> file already exists. If you need to reconfigure, delete the <code>.env</code> file first via Hostinger File Manager.");
}

$message = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $db_host = trim($_POST['db_host'] ?? '127.0.0.1');
    $db_name = trim($_POST['db_name'] ?? '');
    $db_user = trim($_POST['db_user'] ?? '');
    $db_pass = trim($_POST['db_pass'] ?? '');
    
    if (empty($db_name) || empty($db_user)) {
        $error = 'Database Name and Username are required.';
    } else {
        if (!file_exists($exampleFile)) {
            $error = '.env.example file not found in root directory.';
        } else {
            $envContent = file_get_contents($exampleFile);
            
            // Generate secure APP_KEY
            $secureKey = 'base64:' . base64_encode(random_bytes(32));
            $envContent = preg_replace('/^APP_KEY=.*$/m', 'APP_KEY=' . $secureKey, $envContent);
            
            // Update APP_URL to current host
            $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https://" : "http://";
            $currentHost = $protocol . $_SERVER['HTTP_HOST'];
            $envContent = preg_replace('/^APP_URL=.*$/m', 'APP_URL=' . $currentHost, $envContent);
            
            // Update Database config
            $envContent = preg_replace('/^DB_HOST=.*$/m', 'DB_HOST=' . $db_host, $envContent);
            $envContent = preg_replace('/^DB_DATABASE=.*$/m', 'DB_DATABASE=' . $db_name, $envContent);
            $envContent = preg_replace('/^DB_USERNAME=.*$/m', 'DB_USERNAME=' . $db_user, $envContent);
            $envContent = preg_replace('/^DB_PASSWORD=.*$/m', 'DB_PASSWORD=' . $db_pass, $envContent);
            
            if (file_put_contents($envFile, $envContent) !== false) {
                // Try to delete setup.php automatically for security
                @unlink(__FILE__);
                $message = "<strong>Success!</strong> <code>.env</code> file has been created and configured.<br/>The setup script has deleted itself for security.<br/><br/><a href='/' style='background:#4f46e5; color:white; padding:8px 16px; border-radius:6px; text-decoration:none; display:inline-block; margin-top:10px;'>Go to Homepage</a>";
            } else {
                $error = 'Failed to write .env file. Please check folder write permissions for the root directory.';
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dynime ERP Database Setup</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f3f4f6; color: #1f2937; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
        .card { background: white; padding: 32px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); width: 100%; max-width: 450px; }
        h2 { margin-top: 0; color: #111827; }
        p { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
        .form-group { margin-bottom: 16px; }
        label { display: block; font-weight: 500; font-size: 14px; margin-bottom: 6px; }
        input { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; box-sizing: border-box; font-size: 14px; }
        input:focus { outline: none; border-color: #4f46e5; ring: 2px #c7d2fe; }
        button { background: #4f46e5; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: 600; width: 100%; cursor: pointer; font-size: 14px; margin-top: 10px; }
        button:hover { background: #4338ca; }
        .alert { padding: 12px; border-radius: 8px; font-size: 14px; margin-bottom: 16px; }
        .alert-error { background: #fef2f2; color: #991b1b; border: 1px solid #fee2e2; }
        .alert-success { background: #ecfdf5; color: #065f46; border: 1px solid #d1fae5; line-height: 1.5; }
    </style>
</head>
<body>
    <div class="card">
        <h2>Database Setup</h2>
        <p>Enter your Hostinger MySQL database details below to configure the ERP.</p>
        
        <?php if ($error): ?>
            <div class="alert alert-error"><?php echo $error; ?></div>
        <?php endif; ?>
        
        <?php if ($message): ?>
            <div class="alert alert-success"><?php echo $message; ?></div>
        <?php else: ?>
            <form method="POST">
                <div class="form-group">
                    <label for="db_host">Database Host</label>
                    <input type="text" id="db_host" name="db_host" value="127.0.0.1" required>
                </div>
                <div class="form-group">
                    <label for="db_name">Database Name</label>
                    <input type="text" id="db_name" name="db_name" placeholder="e.g. u740731947_erpapp" required>
                </div>
                <div class="form-group">
                    <label for="db_user">Database Username</label>
                    <input type="text" id="db_user" name="db_user" placeholder="e.g. u740731947_erpapp" required>
                </div>
                <div class="form-group">
                    <label for="db_pass">Database Password</label>
                    <input type="password" id="db_pass" name="db_pass" placeholder="Enter DB Password" required>
                </div>
                <button type="submit">Generate .env & Connect</button>
            </form>
        <?php endif; ?>
    </div>
</body>
</html>
