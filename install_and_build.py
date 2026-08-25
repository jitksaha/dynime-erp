import os
import paramiko

def install_and_build():
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

    files_to_upload = [
        "packages/workdo/Hrm/src/Http/Controllers/AttendanceController.php",
        "packages/workdo/Hrm/src/Http/Controllers/DashboardController.php",
        "packages/workdo/Hrm/src/Resources/js/Pages/Dashboard/employee-dashboard.tsx",
        "resources/js/pages/settings/components/timezone-duty-settings.tsx",
        "resources/js/components/header-clear-cache.tsx",
        "resources/js/layouts/authenticated-layout.tsx",
        "app/Http/Controllers/SettingController.php",
        "resources/js/components/ui/time-picker.tsx",
        "resources/js/components/ui/searchable-country-select.tsx",
        "resources/js/components/ui/phone-input.tsx",
        "resources/js/components/ui/tooltip.tsx",
        "resources/js/utils/menus/company-setting.ts",
        "resources/js/utils/settings-components.ts",
        "packages/workdo/Hrm/src/Models/Employee.php",
        "packages/workdo/Hrm/src/Models/FlexibleShiftRequest.php",
        "packages/workdo/Hrm/src/Http/Controllers/FlexibleShiftController.php",
        "packages/workdo/Hrm/src/Http/Controllers/AttendanceController.php",
        "packages/workdo/Hrm/src/Http/Controllers/DashboardController.php",
        "packages/workdo/Hrm/src/Http/Controllers/EmployeeController.php",
        "packages/workdo/Hrm/src/Http/Requests/UpdateEmployeeRequest.php",
        "packages/workdo/Hrm/src/Routes/web.php",
        "packages/workdo/Hrm/src/Database/Migrations/2026_08_05_000001_add_flexible_shift_fields_to_employees_table.php",
        "packages/workdo/Hrm/src/Database/Migrations/2026_08_05_000002_create_flexible_shift_requests_table.php",
        "packages/workdo/Hrm/src/Resources/js/Components/TimezoneDutyWidget.tsx",
        "resources/js/components/TimezoneDutyWidget.tsx",
        "packages/workdo/Hrm/src/Resources/js/Pages/Shifts/FlexibleRequests.tsx",
        "packages/workdo/Hrm/src/Resources/js/Pages/Employees/Edit.tsx",
        "packages/workdo/Hrm/src/Resources/js/Pages/Employees/types.ts",
        "packages/workdo/Hrm/src/Resources/js/menus/company-menu.ts",
        "packages/workdo/Hrm/src/Resources/js/Pages/DocumentBuilder/Index.tsx",
        "packages/workdo/Hrm/src/Http/Controllers/DocumentBuilderController.php",
        "resources/js/pages/settings/components/maintenance-mode-settings.tsx",
        "resources/js/utils/menus/superadmin-setting.ts",
        "app/Http/Middleware/CheckMaintenanceMode.php",
        "resources/views/maintenance.blade.php",
        "bootstrap/app.php",
        "routes/web.php",
        "packages/workdo/Hrm/src/Database/Migrations/2026_08_06_000001_create_master_country_shifts_table.php",
        "packages/workdo/Hrm/src/Database/Migrations/2026_08_06_000002_add_enterprise_versioning_to_shifts_table.php",
        "packages/workdo/Hrm/src/Database/Migrations/2026_08_06_000003_create_employee_shift_histories_table.php",
        "packages/workdo/Hrm/src/Database/Seeders/MasterCountryShiftSeeder.php",
        "packages/workdo/Hrm/src/Models/MasterCountryShift.php",
        "packages/workdo/Hrm/src/Models/EmployeeShiftHistory.php",
        "packages/workdo/Hrm/src/Models/Shift.php",
        "packages/workdo/Hrm/src/Http/Controllers/ShiftController.php",
        "packages/workdo/Hrm/src/Http/Controllers/EmployeeController.php",
        "packages/workdo/Hrm/src/Routes/web.php",
        "packages/workdo/Hrm/src/Resources/js/Components/ImportCountryShiftModal.tsx",
        "packages/workdo/Hrm/src/Resources/js/Pages/Shifts/Index.tsx",
        "packages/workdo/Hrm/src/Resources/js/Pages/Employees/Edit.tsx",
        "app/Http/Controllers/UserController.php",
        "packages/workdo/Recruitment/src/Database/Migrations/2026_08_07_140000_add_salary_rate_to_job_postings_table.php",
        "packages/workdo/Recruitment/src/Models/JobPosting.php",
        "packages/workdo/Recruitment/src/Http/Requests/StoreJobPostingRequest.php",
        "packages/workdo/Recruitment/src/Http/Requests/UpdateJobPostingRequest.php",
        "packages/workdo/Recruitment/src/Resources/js/Pages/JobPostings/Create.tsx",
        "packages/workdo/Recruitment/src/Resources/js/Pages/JobPostings/Edit.tsx",
        "packages/workdo/Recruitment/src/Resources/js/Pages/JobPostings/Index.tsx",
        "packages/workdo/Recruitment/src/Http/Controllers/JobPostingController.php",
        "packages/workdo/Recruitment/src/Http/Controllers/FrontendController.php",
        "packages/workdo/Recruitment/src/Routes/web.php",
        "routes/web.php",
        "app/Http/Middleware/HandleInertiaRequests.php",
        "packages/workdo/Recruitment/src/Http/Middleware/RecruitmentSharedDataMiddleware.php",
        "packages/workdo/Recruitment/src/Resources/js/Pages/Frontend/JobDetails.tsx",
        "packages/workdo/Recruitment/src/Resources/js/Pages/Frontend/JobListings.tsx",
        "packages/workdo/Recruitment/src/Resources/js/Components/Frontend/FrontendHeader.tsx",
        "packages/workdo/Hrm/src/Resources/js/Pages/DocumentBuilder/documentUtils.ts",
        "packages/workdo/Hrm/src/Resources/js/Pages/DocumentBuilder/Sign.tsx",
        "packages/workdo/Hrm/src/Resources/js/Pages/DocumentBuilder/Index.tsx",
        "packages/workdo/Hrm/src/Resources/js/Components/TimezoneDutyWidget.tsx",
        "resources/js/components/header-company-clock.tsx",
        "resources/js/layouts/authenticated-layout.tsx",
        "resources/js/app.tsx",
    ]

    for rel_path in files_to_upload:
        local_path = os.path.abspath(rel_path)
        remote_path = f"{remote_base}/{rel_path}"
        remote_dir = os.path.dirname(remote_path)

        dir_parts = remote_dir.split('/')
        current_path = ""
        for part in dir_parts:
            current_path = f"{current_path}/{part}" if current_path else part
            try:
                sftp.stat(current_path)
            except IOError:
                try:
                    sftp.mkdir(current_path)
                except Exception as e:
                    pass

        print(f"Uploading: {rel_path} -> {remote_path}")
        sftp.put(local_path, remote_path)

    print("Files uploaded successfully!")

    cmd = "export PATH=/opt/alt/alt-nodejs20/root/usr/bin:$PATH && cd ~/domains/app.dynime.com/public_html && ./node_modules/.bin/vite build"
    print("Executing Vite build on Hostinger server...")
    stdin, stdout, stderr = ssh.exec_command(cmd)

    out = stdout.read().decode()
    err = stderr.read().decode()

    print("=== BUILD STDOUT ===")
    print(out)
    if err:
        print("=== BUILD STDERR ===")
        print(err)

    ssh.exec_command('cd ~/domains/app.dynime.com/public_html && php artisan migrate --force && php artisan db:seed --class="Workdo\\\\Hrm\\\\Database\\\\Seeders\\\\MasterCountryShiftSeeder" --force && php artisan view:clear && php artisan config:clear && php artisan cache:clear && php artisan route:clear')
    sftp.close()
    ssh.close()
    print("Deployment and Vite build completed!")

if __name__ == '__main__':
    install_and_build()
