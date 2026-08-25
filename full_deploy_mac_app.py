import os
import subprocess
import paramiko

def full_deploy():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 0. Build native Mac app & DMG for Dtime Trace
    build_script = os.path.join(base_dir, "App Traker App", "build_mac.py")
    print(f"🔨 Executing Dtime Trace Mac build script: {build_script}...")
    subprocess.run(["python3", build_script], check=True)

    host = "5.183.10.149"
    port = 65002
    username = "u740731947"
    password = "Pixel#@!194JkS"
    remote_base = "domains/app.dynime.com/public_html"

    print("Connecting to Hostinger SSH...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, port=port, username=username, password=password)

    sftp = ssh.open_sftp()
    print("SSH & SFTP connection established!")

    # 1. Upload files
    files_map = {
        "routes/web.php": f"{remote_base}/routes/web.php",
        "routes/api.php": f"{remote_base}/routes/api.php",
        "app/Http/Controllers/Api/TimeTrackerApiController.php": f"{remote_base}/app/Http/Controllers/Api/TimeTrackerApiController.php",
        "app/Console/Commands/SendShiftNotifications.php": f"{remote_base}/app/Console/Commands/SendShiftNotifications.php",
        "app/Notifications/GenericPushNotification.php": f"{remote_base}/app/Notifications/GenericPushNotification.php",
        "app/Mail/ShiftReminderMail.php": f"{remote_base}/app/Mail/ShiftReminderMail.php",
        "resources/views/emails/shift_reminder.blade.php": f"{remote_base}/resources/views/emails/shift_reminder.blade.php",
        "resources/js/components/TimezoneDutyWidget.tsx": f"{remote_base}/resources/js/components/TimezoneDutyWidget.tsx",
        "packages/workdo/Hrm/src/Http/Controllers/DashboardController.php": f"{remote_base}/packages/workdo/Hrm/src/Http/Controllers/DashboardController.php",
        "packages/workdo/Hrm/src/Resources/js/Components/TimezoneDutyWidget.tsx": f"{remote_base}/packages/workdo/Hrm/src/Resources/js/Components/TimezoneDutyWidget.tsx",
        "packages/workdo/Hrm/src/Resources/js/Pages/Dashboard/company-dashboard.tsx": f"{remote_base}/packages/workdo/Hrm/src/Resources/js/Pages/Dashboard/company-dashboard.tsx",
        "packages/workdo/Hrm/src/Resources/js/Pages/TimeTrackerApp/Downloads.tsx": f"{remote_base}/packages/workdo/Hrm/src/Resources/js/Pages/TimeTrackerApp/Downloads.tsx",
        "app/Console/Commands/SeedFinancialCategories.php": f"{remote_base}/app/Console/Commands/SeedFinancialCategories.php",
        "packages/workdo/Account/src/Http/Controllers/RevenueCategoriesController.php": f"{remote_base}/packages/workdo/Account/src/Http/Controllers/RevenueCategoriesController.php",
        "packages/workdo/Account/src/Http/Controllers/ExpenseCategoriesController.php": f"{remote_base}/packages/workdo/Account/src/Http/Controllers/ExpenseCategoriesController.php",
        "packages/workdo/Account/src/Http/Controllers/RevenueController.php": f"{remote_base}/packages/workdo/Account/src/Http/Controllers/RevenueController.php",
        "packages/workdo/Account/src/Http/Controllers/ExpenseController.php": f"{remote_base}/packages/workdo/Account/src/Http/Controllers/ExpenseController.php",
        "packages/workdo/Account/src/Resources/js/Pages/Revenues/Create.tsx": f"{remote_base}/packages/workdo/Account/src/Resources/js/Pages/Revenues/Create.tsx",
        "packages/workdo/Account/src/Resources/js/Pages/Revenues/Edit.tsx": f"{remote_base}/packages/workdo/Account/src/Resources/js/Pages/Revenues/Edit.tsx",
        "packages/workdo/Account/src/Resources/js/Pages/Expenses/Create.tsx": f"{remote_base}/packages/workdo/Account/src/Resources/js/Pages/Expenses/Create.tsx",
        "packages/workdo/Account/src/Resources/js/Pages/Expenses/Edit.tsx": f"{remote_base}/packages/workdo/Account/src/Resources/js/Pages/Expenses/Edit.tsx",
        ".htaccess": f"{remote_base}/.htaccess",
        "public/images/apple-logo.svg": f"{remote_base}/public/images/apple-logo.svg",
        "packages/workdo/Hrm/src/Database/Migrations/2026_08_03_000001_create_enterprise_shifts_tables.php": f"{remote_base}/packages/workdo/Hrm/src/Database/Migrations/2026_08_03_000001_create_enterprise_shifts_tables.php",
        "packages/workdo/Hrm/src/Models/Shift.php": f"{remote_base}/packages/workdo/Hrm/src/Models/Shift.php",
        "packages/workdo/Hrm/src/Models/ShiftRule.php": f"{remote_base}/packages/workdo/Hrm/src/Models/ShiftRule.php",
        "packages/workdo/Hrm/src/Models/ShiftBreak.php": f"{remote_base}/packages/workdo/Hrm/src/Models/ShiftBreak.php",
        "packages/workdo/Hrm/src/Models/ShiftAssignment.php": f"{remote_base}/packages/workdo/Hrm/src/Models/ShiftAssignment.php",
        "packages/workdo/Hrm/src/Models/OvertimeRule.php": f"{remote_base}/packages/workdo/Hrm/src/Models/OvertimeRule.php",
        "packages/workdo/Hrm/src/Models/ShiftRotation.php": f"{remote_base}/packages/workdo/Hrm/src/Models/ShiftRotation.php",
        "packages/workdo/Hrm/src/Services/ShiftCalculator.php": f"{remote_base}/packages/workdo/Hrm/src/Services/ShiftCalculator.php",
        "packages/workdo/Hrm/src/Http/Requests/StoreEnterpriseShiftRequest.php": f"{remote_base}/packages/workdo/Hrm/src/Http/Requests/StoreEnterpriseShiftRequest.php",
        "packages/workdo/Hrm/src/Http/Requests/UpdateEnterpriseShiftRequest.php": f"{remote_base}/packages/workdo/Hrm/src/Http/Requests/UpdateEnterpriseShiftRequest.php",
        "packages/workdo/Hrm/src/Http/Controllers/ShiftController.php": f"{remote_base}/packages/workdo/Hrm/src/Http/Controllers/ShiftController.php",
        "packages/workdo/Hrm/src/Routes/web.php": f"{remote_base}/packages/workdo/Hrm/src/Routes/web.php",
        "packages/workdo/Hrm/src/Resources/js/Pages/Shifts/types.ts": f"{remote_base}/packages/workdo/Hrm/src/Resources/js/Pages/Shifts/types.ts",
        "packages/workdo/Hrm/src/Resources/js/Pages/Shifts/Index.tsx": f"{remote_base}/packages/workdo/Hrm/src/Resources/js/Pages/Shifts/Index.tsx",
        "packages/workdo/Hrm/src/Resources/js/Pages/Shifts/Create.tsx": f"{remote_base}/packages/workdo/Hrm/src/Resources/js/Pages/Shifts/Create.tsx",
        "packages/workdo/Hrm/src/Resources/js/Pages/Shifts/Edit.tsx": f"{remote_base}/packages/workdo/Hrm/src/Resources/js/Pages/Shifts/Edit.tsx",
        "packages/workdo/Hrm/src/Resources/js/Pages/Shifts/View.tsx": f"{remote_base}/packages/workdo/Hrm/src/Resources/js/Pages/Shifts/View.tsx",
        "packages/workdo/Hrm/src/Resources/js/Pages/Shifts/AssignModal.tsx": f"{remote_base}/packages/workdo/Hrm/src/Resources/js/Pages/Shifts/AssignModal.tsx",
        "app/Console/Commands/SendBirthdayWishesCommand.php": f"{remote_base}/app/Console/Commands/SendBirthdayWishesCommand.php",
        "app/Mail/EmployeeBirthdayMail.php": f"{remote_base}/app/Mail/EmployeeBirthdayMail.php",
        "resources/views/emails/employee_birthday.blade.php": f"{remote_base}/resources/views/emails/employee_birthday.blade.php",
        "app/Console/Kernel.php": f"{remote_base}/app/Console/Kernel.php",
    }

    for local_rel, remote_path in files_map.items():
        local_path = os.path.abspath(local_rel)
        if os.path.exists(local_path):
            # Ensure remote directory exists
            remote_dir = os.path.dirname(remote_path)
            parts = remote_dir.split('/')
            curr = ""
            for p in parts:
                curr = f"{curr}/{p}" if curr else p
                try:
                    sftp.stat(curr)
                except IOError:
                    try:
                        sftp.mkdir(curr)
                    except Exception:
                        pass

            print(f"Uploading {local_rel} -> {remote_path}...")
            sftp.put(local_path, remote_path)
            sftp.chmod(remote_path, 0o644)
            print(f"✅ Uploaded {local_rel}")

    # 2. Upload compiled Dtime Trace DMG installer
    local_dmg = os.path.join(base_dir, "App Traker App", "output", "Dtime-Trace-Mac.dmg")
    if os.path.exists(local_dmg):
        dmg_size = os.path.getsize(local_dmg)
        for target_dir in [f"{remote_base}/public/downloads", f"{remote_base}/downloads"]:
            parts = target_dir.split('/')
            curr = ""
            for p in parts:
                curr = f"{curr}/{p}" if curr else p
                try:
                    sftp.stat(curr)
                except IOError:
                    try:
                        sftp.mkdir(curr)
                    except Exception:
                        pass
            
            for dmg_name in ["Dtime-Trace-Mac.dmg", "Dynime-TimeTracker-Mac.dmg"]:
                remote_dmg = f"{target_dir}/{dmg_name}"
                print(f"Uploading DMG ({dmg_size} bytes / {dmg_size / (1024*1024):.2f} MB) -> {remote_dmg}...")
                sftp.put(local_dmg, remote_dmg)
                sftp.chmod(remote_dmg, 0o644)
                print(f"✅ Uploaded DMG to {remote_dmg}")

    sftp.close()

    # 3. Run Vite build on Hostinger & Clear caches & Run migrations
    print("Running Vite build and Database Migrations on Hostinger server...")
    build_cmd = (
        "export PATH=/opt/alt/alt-nodejs20/root/usr/bin:$PATH && "
        f"cd ~/{remote_base} && "
        "php artisan migrate --force && "
        "./node_modules/.bin/vite build && "
        "php artisan route:clear && "
        "php artisan view:clear && "
        "php artisan config:clear && "
        "php artisan cache:clear && "
        "php artisan account:seed-categories"
    )

    stdin, stdout, stderr = ssh.exec_command(build_cmd)
    out = stdout.read().decode()
    err = stderr.read().decode()

    print("=== SERVER OUTPUT ===")
    print(out)
    if err:
        print("=== SERVER ERRORS ===")
        print(err)

    ssh.close()
    print("🚀 FULL DEPLOYMENT COMPLETE!")

if __name__ == '__main__':
    full_deploy()
