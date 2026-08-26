#!/bin/bash
set -e

echo "=== 1. Syncing latest code from GitHub ==="
git fetch origin main
git reset --hard origin/main

echo "=== 2. Setting Node & NPM environment ==="
export PATH=/opt/alt/alt-nodejs20/root/usr/bin:$PATH

echo "=== 3. Ensuring Dependencies ==="
npm install --legacy-peer-deps

echo "=== 4. Building Production Assets ==="
node ./node_modules/vite/bin/vite.js build

echo "=== 5. Linking Assets & Storage ==="
ln -sfn public/build build
ln -sfn ../storage/app/public public/storage
if [ -d "/home/u740731947/domains/dynime.com/public_html" ]; then
    ln -sfn /home/u740731947/domains/app.dynime.com/public_html/public/build /home/u740731947/domains/dynime.com/public_html/build
fi

echo "=== 6. Setting Secure File Permissions ==="
chmod -R 755 public/build build storage bootstrap/cache
touch storage/installed && chmod 666 storage/installed

echo "=== 7. Clearing & Optimizing Laravel Caches ==="
php artisan view:clear
php artisan cache:clear
php artisan route:clear
php artisan config:clear
php artisan optimize:clear

echo "=== 8. Deployment Completed Successfully! ==="
