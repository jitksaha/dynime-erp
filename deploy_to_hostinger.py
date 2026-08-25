import os
import paramiko

def deploy():
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
        "packages/workdo/Hrm/src/Database/Migrations/2026_07_30_100000_add_timezone_to_employees_table.php",
        "packages/workdo/Hrm/src/Models/Employee.php",
        "packages/workdo/Hrm/src/Http/Controllers/DashboardController.php",
        "packages/workdo/Hrm/src/Resources/js/Pages/Dashboard/employee-dashboard.tsx",
        "app/Helpers/Helper.php",
        "app/Http/Controllers/Auth/PasswordResetLinkController.php",
        "app/Notifications/CustomResetPassword.php",
        "app/Models/User.php",
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

    # Update .env on server and run artisan commands
    env_update_cmds = [
        f"cd ~/{remote_base}",
        # Update .env with Stackmail SMTP & Dynime App branding
        "sed -i 's/APP_NAME=.*/APP_NAME=\"Dynime App\"/g' .env",
        "sed -i 's/VITE_APP_NAME=.*/VITE_APP_NAME=\"Dynime App\"/g' .env",
        "sed -i 's/MAIL_MAILER=.*/MAIL_MAILER=smtp/g' .env",
        "sed -i 's/MAIL_HOST=.*/MAIL_HOST=smtp.stackmail.com/g' .env",
        "sed -i 's/MAIL_PORT=.*/MAIL_PORT=587/g' .env",
        "sed -i 's/MAIL_USERNAME=.*/MAIL_USERNAME=app.notify@dynime.com/g' .env",
        "sed -i 's/MAIL_PASSWORD=.*/MAIL_PASSWORD=Pixel#@!194JkS/g' .env",
        "sed -i 's/MAIL_ENCRYPTION=.*/MAIL_ENCRYPTION=tls/g' .env",
        "sed -i 's/MAIL_FROM_ADDRESS=.*/MAIL_FROM_ADDRESS=\"app.notify@dynime.com\"/g' .env",
        "sed -i 's/MAIL_FROM_NAME=.*/MAIL_FROM_NAME=\"Dynime App\"/g' .env",
        "php artisan migrate --force",
        "php artisan config:clear",
        "php artisan cache:clear",
        "php artisan view:clear",
        "php artisan route:clear"
    ]

    full_cmd = " && ".join(env_update_cmds)
    print("Executing server update commands...")
    stdin, stdout, stderr = ssh.exec_command(full_cmd)

    out = stdout.read().decode()
    err = stderr.read().decode()

    print("STDOUT:\n", out)
    if err:
        print("STDERR:\n", err)

    sftp.close()
    ssh.close()
    print("Deployment to live server completed successfully!")

if __name__ == '__main__':
    deploy()
