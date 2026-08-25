import paramiko

def ensure_crontab():
    host = "5.183.10.149"
    port = 65002
    username = "u740731947"
    password = "Pixel#@!194JkS"
    remote_base = "domains/app.dynime.com/public_html"

    print("Connecting to Hostinger SSH...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, port=port, username=username, password=password)

    cron_job = f"* * * * * cd /home/{username}/{remote_base} && php artisan schedule:run >> /dev/null 2>&1"

    # Get current crontab
    stdin, stdout, stderr = ssh.exec_command("crontab -l")
    current_crontab = stdout.read().decode('utf-8')

    if cron_job in current_crontab:
        print("✅ Hostinger crontab entry already exists!")
    else:
        new_crontab = current_crontab.strip() + f"\n{cron_job}\n"
        cmd = f'echo "{new_crontab}" | crontab -'
        ssh.exec_command(cmd)
        print("🚀 Added Laravel schedule:run crontab entry to Hostinger server!")

    # Verify updated crontab
    stdin, stdout, stderr = ssh.exec_command("crontab -l")
    print("=== UPDATED CRONTAB ===")
    print(stdout.read().decode('utf-8'))

    ssh.close()

if __name__ == "__main__":
    ensure_crontab()
