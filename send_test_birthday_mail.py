import paramiko

def run_test():
    host = "5.183.10.149"
    port = 65002
    username = "u740731947"
    password = "Pixel#@!194JkS"
    remote_base = "domains/app.dynime.com/public_html"

    print("Connecting to Hostinger SSH...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, port=port, username=username, password=password)

    cmd = f"cd {remote_base} && php artisan config:clear && php artisan cache:clear && php artisan hrm:send-birthday-wishes --test=mail.jitsaha@gmail.com"
    print(f"Executing remote command: {cmd}")
    
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8')
    err = stderr.read().decode('utf-8')

    print("=== STDOUT ===")
    print(out)
    if err:
        print("=== STDERR ===")
        print(err)

    ssh.close()

if __name__ == "__main__":
    run_test()
