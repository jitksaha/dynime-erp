import os
import paramiko

def deploy_payment_system():
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
        "database/migrations/2026_08_08_170000_create_payment_transactions_table.php",
        "app/Models/PaymentTransaction.php",
        "resources/js/pages/Sales/PublicCheckout.tsx",
        "resources/js/pages/Sales/PublicPaymentSuccess.tsx",
        "resources/js/pages/Sales/PublicPaymentFailed.tsx",
        "resources/js/pages/Sales/PublicPaymentProcessing.tsx",
        "resources/js/pages/Sales/PublicView.tsx",
        "app/Http/Controllers/SalesInvoiceController.php",
        "routes/web.php",
        "packages/workdo/DodoPay/src/Http/Requests/UpdateDodoPaySettingsRequest.php",
        "packages/workdo/DodoPay/src/Resources/js/settings/components/dodopay-settings.tsx",
        "database/migrations/2026_08_08_231700_add_agreement_builder_permissions.php",
        "app/Http/Controllers/RoleController.php",
        "app/Http/Controllers/AgreementBuilderController.php",
        "resources/js/utils/menus/company-menu.ts",
        "packages/workdo/Hrm/src/Resources/js/menus/company-menu.ts",
        "resources/js/components/nav-main.tsx",
        "resources/js/pages/AgreementBuilder/Index.tsx",
        "packages/workdo/Hrm/src/Resources/js/Components/TimezoneDutyWidget.tsx",
        "resources/js/components/TimezoneDutyWidget.tsx",
        "packages/workdo/Hrm/src/Resources/js/Pages/Dashboard/employee-dashboard.tsx",
        "packages/workdo/Hrm/src/Resources/js/Pages/TimeTrackerApp/Downloads.tsx",
        "packages/workdo/Recruitment/src/Resources/js/Components/FormattedJobText.tsx",
        "packages/workdo/Recruitment/src/Resources/js/Pages/JobPostings/Show.tsx",
        "packages/workdo/Recruitment/src/Resources/js/Pages/Frontend/JobDetails.tsx",
        "packages/workdo/Recruitment/src/Resources/js/Pages/HiringFlowmingo/Index.tsx",
        "packages/workdo/Recruitment/src/Models/JobPosting.php",
        "packages/workdo/Recruitment/src/Http/Controllers/FrontendController.php",
        "packages/workdo/Recruitment/src/Resources/js/Pages/JobPostings/Index.tsx",
        "packages/workdo/Recruitment/src/Http/Controllers/JobPostingController.php",
        "packages/workdo/Recruitment/src/Resources/js/Pages/Frontend/JobListings.tsx",
        "packages/workdo/Recruitment/src/Resources/js/Pages/Frontend/JobApply.tsx",
        "packages/workdo/Hrm/src/Http/Controllers/ResignationController.php",
        "packages/workdo/Hrm/src/Resources/js/Pages/Resignations/Create.tsx",
        "app/Http/Controllers/SalesInvoiceController.php",
        "app/Http/Controllers/PaymentLinkController.php",
        "packages/workdo/Bkash/src/Resources/js/settings/components/bkash-settings.tsx",
        "packages/workdo/Bkash/src/Http/Controllers/BkashSettingsController.php",
        "packages/workdo/Stripe/src/Resources/js/settings/components/stripe-settings.tsx",
        "packages/workdo/Stripe/src/Http/Controllers/StripeSettingsController.php",
        "packages/workdo/SSLCommerz/src/Resources/js/settings/components/sslcommerz-settings.tsx",
        "packages/workdo/SSLCommerz/src/Http/Controllers/SSLCommerzSettingsController.php",
        "packages/workdo/Keeal/src/Resources/js/settings/components/keeal-settings.tsx",
        "packages/workdo/Keeal/src/Http/Controllers/KeealSettingsController.php",
        "packages/workdo/DodoPay/src/Resources/js/settings/components/dodopay-settings.tsx",
        "resources/js/components/BankDetailsModal.tsx",
        "resources/js/pages/settings/components/bank-transfer-settings.tsx",
        "resources/js/pages/Sales/PublicCheckout.tsx",
        "resources/js/pages/Sales/PublicView.tsx",
        "resources/js/pages/PaymentLinks/PublicPay.tsx",
        "packages/workdo/Recruitment/src/Resources/js/Pages/JobPostings/Create.tsx",
        "packages/workdo/Recruitment/src/Resources/js/Pages/JobPostings/Edit.tsx",
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
    sftp.close()

    build_cmds = [
        f"cd ~/{remote_base}",
        "export PATH=/opt/alt/alt-nodejs20/root/usr/bin:$PATH",
        "php artisan migrate --force",
        "./node_modules/.bin/vite build",
        "php artisan view:clear",
        "php artisan cache:clear",
        "php artisan route:clear"
    ]

    full_cmd = " && ".join(build_cmds)
    print("Executing Artisan Migration & Vite build on Hostinger server...")
    stdin, stdout, stderr = ssh.exec_command(full_cmd)

    out = stdout.read().decode()
    err = stderr.read().decode()

    print("=== SERVER STDOUT ===")
    print(out)
    if err:
        print("=== SERVER STDERR ===")
        print(err)

    ssh.close()
    print("Full Payment Checkout System Deployed & Built Successfully!")

if __name__ == '__main__':
    deploy_payment_system()
