import paramiko

def fetch_errors():
    host = "5.183.10.149"
    port = 65002
    username = "u740731947"
    password = "Pixel#@!194JkS"

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, port=port, username=username, password=password)

    cmd = "grep 'production.ERROR' ~/domains/app.dynime.com/public_html/storage/logs/laravel.log | tail -n 10"
    stdin, stdout, stderr = ssh.exec_command(cmd)

    out = stdout.read().decode()
    print("=== PRODUCTION ERROR LINES ===")
    print(out)

    ssh.close()

if __name__ == '__main__':
    fetch_errors()
