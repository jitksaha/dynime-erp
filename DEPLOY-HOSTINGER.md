# 🚀 Hostinger Deployment Guide — Dynime ERP

This ERP project is a Laravel application using Inertia React. It is a client-side SPA and **does not use Server-Side Rendering (SSR)**.

> [!IMPORTANT]
> **You do NOT need to install or run a Node.js Application on Hostinger for the ERP.**
> Running `npm run build` on Hostinger shared hosting or VPS will fail with Out of Memory (OOM) errors because compiling large React/TypeScript assets requires more RAM than Hostinger's Node installer provides.

---

## The Correct Deployment Workflow

Instead of building on the server, you must build the assets locally on your Mac and upload the compiled files.

### 1. Build the Frontend Locally (on your Mac)
Open your terminal in the `Dynime ERP` directory and run:
```bash
npm install
npm run build
```
This will compile all React and TypeScript files into static assets and save them in the `public/build/` directory.

### 2. Prepare the Database on Hostinger
1. Go to Hostinger **hPanel → Databases → MySQL Databases**.
2. Create a new database (e.g., `dynime_erp`) and a user with a strong password.
3. Export your local ERP database:
   ```bash
   mysqldump -u root dynime_erp > erp_backup.sql
   ```
4. Import `erp_backup.sql` into the newly created Hostinger database via **phpMyAdmin** or SSH.

### 3. Upload ERP Files to Hostinger
Upload all files in the `Dynime ERP` directory to the server (e.g., to a folder like `public_html` or a subdirectory/subdomain root), **including the `public/build/` folder**.

> [!WARNING]
> **Do NOT upload the `node_modules/` folder** to the server. It is not needed in production.
> Also, make sure to run `composer install --no-dev --optimize-autoloader` locally before zipping/uploading if you cannot run Composer on the server.

### 4. Configure the `.env` File on Hostinger
Create or update the `.env` file in the ERP root directory on the server with production values:
```env
APP_NAME="Dynime ERP"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://erp.dynime.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=dynime_erp
DB_USERNAME=dynime_erp_user
DB_PASSWORD=your_secure_password
```

### 5. Clear Caches
Once files are uploaded, clear the Laravel application cache to apply the new configurations:
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```
*(If SSH is not available, you can visit the site and it will read the `.env` directly, but caching is recommended for speed).*
