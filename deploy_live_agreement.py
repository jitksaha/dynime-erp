import os
import time
import paramiko

def get_ssh_client():
    host = "5.183.10.149"
    port = 65002
    username = "u740731947"
    password = "Pixel#@!194JkS"

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, port=port, username=username, password=password, timeout=30, banner_timeout=60)
    ssh.get_transport().set_keepalive(15)
    return ssh

def deploy_live():
    remote_base = "domains/app.dynime.com/public_html"

    print("Connecting to Hostinger SSH...")
    ssh = get_ssh_client()
    sftp = ssh.open_sftp()
    print("SSH & SFTP connection established!")

    files_to_upload = [
        "resources/js/pages/AgreementBuilder/Index.tsx",
        "routes/web.php",
        "packages/workdo/Hrm/src/Database/Migrations/2026_07_31_200000_add_whatsapp_to_employees_table.php",
        "packages/workdo/Hrm/src/Database/Migrations/2026_07_31_210000_add_roles_responsibilities_to_employees_table.php",
        "packages/workdo/Hrm/src/Database/Migrations/2026_07_31_220000_add_is_verified_to_employees_and_users.php",
        "app/Models/User.php",
        "app/Http/Controllers/UserController.php",
        "packages/workdo/Hrm/src/Routes/web.php",
        "packages/workdo/Hrm/src/Models/Employee.php",
        "packages/workdo/Hrm/src/Http/Requests/StoreEmployeeRequest.php",
        "packages/workdo/Hrm/src/Http/Requests/UpdateEmployeeRequest.php",
        "packages/workdo/Hrm/src/Http/Controllers/EmployeeController.php",
        "resources/js/components/ui/verified-badge.tsx",
        "resources/js/pages/users/types.ts",
        "resources/js/pages/users/index.tsx",
        "resources/js/pages/users/create.tsx",
        "resources/js/pages/users/edit.tsx",
        "packages/workdo/Hrm/src/Resources/js/Pages/Employees/types.ts",
        "packages/workdo/Hrm/src/Resources/js/Pages/Employees/Index.tsx",
        "packages/workdo/Hrm/src/Resources/js/Pages/Employees/Create.tsx",
        "packages/workdo/Hrm/src/Resources/js/Pages/Employees/Edit.tsx",
        "packages/workdo/Hrm/src/Resources/js/Pages/Employees/Show.tsx",
        "packages/workdo/Hrm/src/Database/Migrations/2026_07_31_230000_add_address_to_branches_table.php",
        "packages/workdo/Hrm/src/Models/Branch.php",
        "packages/workdo/Hrm/src/Http/Requests/StoreBranchRequest.php",
        "packages/workdo/Hrm/src/Http/Requests/UpdateBranchRequest.php",
        "packages/workdo/Hrm/src/Http/Controllers/BranchController.php",
        "packages/workdo/Hrm/src/Resources/js/Pages/SystemSetup/Branches/types.ts",
        "packages/workdo/Hrm/src/Resources/js/Pages/SystemSetup/Branches/Create.tsx",
        "packages/workdo/Hrm/src/Resources/js/Pages/SystemSetup/Branches/Edit.tsx",
        "packages/workdo/Hrm/src/Resources/js/Pages/SystemSetup/Branches/Index.tsx",
        "packages/workdo/Hrm/src/Resources/js/Pages/DocumentBuilder/Index.tsx",
        "packages/workdo/Quotation/src/Resources/js/menus/company-menu.ts",
        "packages/workdo/Hrm/src/Resources/js/settings/components/payroll-settings.tsx",
        "packages/workdo/Hrm/src/Database/Migrations/2026_08_01_000000_create_attendance_screenshots_table.php",
        "packages/workdo/Hrm/src/Models/AttendanceScreenshot.php",
        "packages/workdo/Hrm/src/Models/Attendance.php",
        "packages/workdo/Hrm/src/Http/Controllers/AttendanceController.php",
        "resources/js/components/ScreenTrackerManager.tsx",
        "resources/js/components/header-attendance.tsx",
        "resources/js/components/ui/phone-input.tsx",
        "packages/workdo/Hrm/src/Resources/js/Components/AttendanceScreenshotGalleryModal.tsx",
        "packages/workdo/Hrm/src/Resources/js/Pages/Attendances/Show.tsx",
        "packages/workdo/Hrm/src/Database/Migrations/2026_08_01_100000_add_rbac_scope_fields_to_employees_table.php",
        "packages/workdo/Hrm/src/Services/EmployeeScopeService.php",
        "packages/workdo/Hrm/src/Http/Controllers/DashboardController.php",
        "packages/workdo/Hrm/src/Http/Controllers/OfficialEmailController.php",
        "packages/workdo/Hrm/src/Resources/js/Pages/OfficialEmails/Index.tsx",
        "packages/workdo/Hrm/src/Resources/js/menus/company-menu.ts",
        "packages/workdo/Hrm/src/Routes/web.php",
        "app/Http/Controllers/Api/TimeTrackerApiController.php",
        "app/Services/PushNotificationService.php",
        "routes/api.php",
        "packages/workdo/Hrm/src/Resources/js/Pages/TimeTrackerApp/Downloads.tsx",
        "app/Console/Commands/CleanupOldScreenshots.php",
        "app/Console/Kernel.php",
        "public/downloads/Dynime-TimeTracker-Mac.dmg",
    ]

    for rel_path in files_to_upload:
        local_path = os.path.abspath(rel_path)
        remote_path = f"{remote_base}/{rel_path}"
        remote_dir = os.path.dirname(remote_path)

        for attempt in range(3):
            try:
                # Ensure remote directory exists
                dir_parts = remote_dir.split('/')
                current_path = ""
                for part in dir_parts:
                    current_path = f"{current_path}/{part}" if current_path else part
                    try:
                        sftp.stat(current_path)
                    except IOError:
                        try:
                            sftp.mkdir(current_path)
                        except Exception:
                            pass

                print(f"Uploading: {rel_path} -> {remote_path}")
                sftp.put(local_path, remote_path)
                break
            except Exception as e:
                print(f"Retry upload {rel_path} (attempt {attempt+1}): {e}")
                time.sleep(2)
                try:
                    sftp.close()
                    ssh.close()
                except Exception:
                    pass
                ssh = get_ssh_client()
                sftp = ssh.open_sftp()

    print("All files uploaded successfully!")

    print("\n--- Running Database Migrations ---")
    migrate_cmd = "cd ~/domains/app.dynime.com/public_html && php artisan migrate --force"
    stdin_m, stdout_m, stderr_m = ssh.exec_command(migrate_cmd)
    print("Migration Output:\n", stdout_m.read().decode())

    print("\n--- Running Vite Build on Server ---")
    build_cmd = "export PATH=/opt/alt/alt-nodejs20/root/usr/bin:$PATH && cd ~/domains/app.dynime.com/public_html && ./node_modules/.bin/vite build"
    stdin, stdout, stderr = ssh.exec_command(build_cmd)
    
    out = stdout.read().decode()
    err = stderr.read().decode()
    print("Vite Build Output:\n", out)
    if err:
        print("Vite Build Warnings/Errors:\n", err)

    print("\n--- Clearing Laravel Cache on Server ---")
    cache_cmd = "cd ~/domains/app.dynime.com/public_html && php artisan view:clear && php artisan config:clear && php artisan cache:clear && php artisan route:clear"
    stdin_c, stdout_c, stderr_c = ssh.exec_command(cache_cmd)
    print("Cache Clear Output:\n", stdout_c.read().decode())

    sftp.close()
    ssh.close()
    print("\n🚀 Live site deployment finished successfully!")

if __name__ == '__main__':
    deploy_live()
