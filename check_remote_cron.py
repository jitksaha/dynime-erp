import paramiko

def check_cron():
    host = "5.183.10.149"
    port = 65002
    username = "u740731947"
    password = "Pixel#@!194JkS"
    remote_base = "domains/app.dynime.com/public_html"

    print("Connecting to Hostinger SSH...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, port=port, username=username, password=password)

    # 1. Check existing crontab
    stdin, stdout, stderr = ssh.exec_command("crontab -l")
    cron_out = stdout.read().decode('utf-8')
    print("=== CURRENT HOSTINGER CRONTAB ===")
    print(cron_out if cron_out else "(No crontab entries found)")

    # 2. Check if artisan schedule:run is testable
    cmd = f"cd {remote_base} && php artisan schedule:list"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    sched_out = stdout.read().decode('utf-8')
    print("=== LARAVEL SCHEDULE LIST ===")
    print(sched_out)

    ssh.close()

if __name__ == "__main__":
    check_cron()
