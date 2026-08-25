import paramiko

def deploy_and_test():
    host = "5.183.10.149"
    port = 65002
    username = "u740731947"
    password = "Pixel#@!194JkS"
    remote_base = "domains/app.dynime.com/public_html"

    print("Connecting to Hostinger SSH/SFTP...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, port=port, username=username, password=password)

    sftp = ssh.open_sftp()
    
    files = [
        ("app/Console/Commands/SendBirthdayWishesCommand.php", "app/Console/Commands/SendBirthdayWishesCommand.php"),
        ("app/Mail/EmployeeBirthdayMail.php", "app/Mail/EmployeeBirthdayMail.php"),
        ("resources/views/emails/employee_birthday.blade.php", "resources/views/emails/employee_birthday.blade.php"),
        ("routes/console.php", "routes/console.php"),
        ("app/Console/Kernel.php", "app/Console/Kernel.php"),
    ]

    base_local = "/Users/jitkumarsaha/Dynime Inc/ERP GO SAAS/Dynime ERP"

    for rel_local, rel_remote in files:
        local_path = f"{base_local}/{rel_local}"
        remote_path = f"{remote_base}/{rel_remote}"
        print(f"Uploading {rel_local} -> {rel_remote}")
        sftp.put(local_path, remote_path)

    sftp.close()

    cmd = f"cd {remote_base} && php artisan config:clear && php artisan cache:clear && php artisan schedule:list"
    print(f"Executing remote command: {cmd}")
    
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8')
    err = stderr.read().decode('utf-8')

    print("=== SCHEDULE LIST OUTPUT ===")
    print(out)
    if err:
        print("=== STDERR ===")
        print(err)

    ssh.close()

if __name__ == "__main__":
    deploy_and_test()
