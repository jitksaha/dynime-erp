import os
import paramiko

def deploy_live():
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
        "packages/workdo/Hrm/src/Resources/js/Pages/Dashboard/employee-dashboard.tsx",
        "packages/workdo/Hrm/src/Resources/js/Pages/DocumentBuilder/documentUtils.ts",
        "packages/workdo/Hrm/src/Resources/js/Pages/Shifts/AssignModal.tsx",
        "packages/workdo/Hrm/src/Resources/js/Pages/Shifts/FlexibleRequests.tsx",
        "packages/workdo/Hrm/src/Resources/js/Components/TimezoneDutyWidget.tsx",
        "packages/workdo/Hrm/src/Resources/js/Components/AttendanceScreenshotGalleryModal.tsx",
        "packages/workdo/Hrm/src/Resources/js/Components/ImportCountryShiftModal.tsx",
        "packages/workdo/Hrm/src/Resources/js/Components/OnboardingBannerWidget.tsx",
        "resources/js/pages/users/index.tsx",
        "resources/js/pages/users/types.ts",
        "app/Http/Controllers/UserController.php",
        "resources/js/utils/menus/company-menu.ts",
        "resources/js/pages/AgreementBuilder/Index.tsx",
        "packages/workdo/Recruitment/src/Resources/js/menus/company-menu.ts",
        "packages/workdo/Recruitment/src/Routes/web.php",
        "routes/web.php",
        "bootstrap/app.php",
        "packages/workdo/Recruitment/src/Database/Migrations/2026_08_20_160000_add_department_and_designation_to_job_postings_table.php",
        "packages/workdo/Recruitment/src/Models/JobPosting.php",
        "packages/workdo/Recruitment/src/Http/Requests/StoreJobPostingRequest.php",
        "packages/workdo/Recruitment/src/Http/Requests/UpdateJobPostingRequest.php",
        "packages/workdo/Recruitment/src/Http/Controllers/JobPostingController.php",
        "packages/workdo/Recruitment/src/Http/Controllers/FrontendController.php",
        "packages/workdo/Recruitment/src/Resources/js/Pages/JobPostings/types.ts",
        "packages/workdo/Recruitment/src/Resources/js/Pages/JobPostings/Create.tsx",
        "packages/workdo/Recruitment/src/Resources/js/Pages/JobPostings/Edit.tsx",
        "packages/workdo/Recruitment/src/Resources/js/Pages/JobPostings/Index.tsx",
        "packages/workdo/Recruitment/src/Resources/js/Pages/JobPostings/Show.tsx",
        "packages/workdo/Recruitment/src/Resources/js/Pages/Frontend/JobListings.tsx",
        "packages/workdo/Recruitment/src/Resources/js/Pages/Frontend/JobApply.tsx",
        "packages/workdo/Recruitment/src/Resources/js/Pages/Frontend/JobDetails.tsx",
        "packages/workdo/Recruitment/src/Resources/js/Components/Frontend/FrontendFooter.tsx",
        "packages/workdo/Recruitment/src/Resources/js/Components/Frontend/FrontendHeader.tsx",
        "packages/workdo/Recruitment/src/Resources/js/Components/FormattedJobText.tsx",
        "packages/workdo/Recruitment/src/Database/Migrations/2026_08_20_180000_seed_flowmingo_all_14_job_postings.php",
        "packages/workdo/AIAssistant/src/Database/Seeders/AIPromptSeeder.php",
        "resources/js/components/BankDetailsModal.tsx",
        "resources/js/components/ScreenTrackerManager.tsx",
        "resources/js/components/TimezoneDutyWidget.tsx",
        "resources/js/components/ui/verified-badge.tsx",
        "resources/js/components/ui/searchable-country-select.tsx",
        "resources/js/components/ui/phone-input.tsx",
        "resources/js/components/ui/select.tsx",
        "resources/js/components/ui/avatar.tsx",
        "resources/js/components/ui/tooltip.tsx",
        "resources/js/components/header-attendance.tsx",
        "resources/js/components/header-clear-cache.tsx",
        "resources/js/components/header-company-clock.tsx",
        "resources/js/components/nav-main.tsx",
        "resources/js/layouts/authenticated-layout.tsx",
        "resources/js/app.tsx",
        "resources/js/pages/users/create.tsx",
        "resources/js/pages/users/edit.tsx",
        "resources/js/pages/Sales/Index.tsx",
        "resources/js/pages/Sales/PublicView.tsx",
        "resources/js/pages/Sales/PublicCheckout.tsx",
        "resources/js/pages/Sales/PublicPaymentFailed.tsx",
        "resources/js/pages/Sales/PublicPaymentProcessing.tsx",
        "resources/js/pages/Sales/PublicPaymentSuccess.tsx",
        "resources/js/pages/PaymentLinks/PublicPay.tsx",
        "resources/js/pages/settings/components/bank-transfer-settings.tsx",
        "resources/js/pages/settings/components/maintenance-mode-settings.tsx",
        "resources/js/pages/settings/components/timezone-duty-settings.tsx",
        "resources/js/utils/menus/company-setting.ts",
        "resources/js/utils/menus/superadmin-setting.ts",
        "resources/js/utils/settings-components.ts",
        "packages/workdo/SSLCommerz/src/Resources/js/settings/components/sslcommerz-settings.tsx",
        "packages/workdo/Stripe/src/Resources/js/settings/components/stripe-settings.tsx"
    ]

    for rel_path in files_to_upload:
        local_path = os.path.abspath(rel_path)
        remote_path = f"{remote_base}/{rel_path}"
        remote_dir = os.path.dirname(remote_path)

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
                except Exception as e:
                    pass

        print(f"Uploading: {rel_path} -> {remote_path}")
        sftp.put(local_path, remote_path)

    print("Files uploaded successfully!")

    # Build Vite assets remotely on Hostinger & clear Laravel caches
    build_and_clear_cmds = [
        f"cd ~/{remote_base}",
        "php artisan migrate --force",
        "export PATH=/opt/alt/alt-nodejs20/root/usr/bin:$PATH && (chmod -R 755 ./node_modules/@esbuild 2>/dev/null || true) && node ./node_modules/vite/bin/vite.js build",
        "php artisan view:clear",
        "php artisan config:clear",
        "php artisan cache:clear",
        "php artisan route:clear",
        "php artisan optimize:clear"
    ]

    full_cmd = " && ".join(build_and_clear_cmds)
    print("Running remote Vite build and clearing Laravel caches on Hostinger...")
    stdin, stdout, stderr = ssh.exec_command(full_cmd)

    out = stdout.read().decode()
    err = stderr.read().decode()

    print("STDOUT:\n", out)
    if err:
        print("STDERR:\n", err)

    sftp.close()
    ssh.close()
    print("Live SSH Deployment completed successfully!")

if __name__ == '__main__':
    deploy_live()
