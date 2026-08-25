import paramiko

def check_employee():
    host = "5.183.10.149"
    port = 65002
    username = "u740731947"
    password = "Pixel#@!194JkS"

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, port=port, username=username, password=password)

    cmd = "cd ~/domains/app.dynime.com/public_html && php artisan tinker --execute=\"\$e = \\Workdo\\Hrm\\Models\\Employee::first(); dump(\$e?->effective_timezone);\""
    stdin, stdout, stderr = ssh.exec_command(cmd)

    out = stdout.read().decode()
    err = stderr.read().decode()

    print("=== EFFECTIVE TIMEZONE OUTPUT ===")
    print(out)
    if err:
        print("=== EFFECTIVE TIMEZONE ERR ===")
        print(err)

    ssh.close()

if __name__ == '__main__':
    check_employee()
