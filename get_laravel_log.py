import paramiko

def fetch_log():
    host = "5.183.10.149"
    port = 65002
    username = "u740731947"
    password = "Pixel#@!194JkS"

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, port=port, username=username, password=password)

    # Search for the latest exception header
    cmd = "grep -n -E 'local.ERROR|production.ERROR' ~/domains/app.dynime.com/public_html/storage/logs/laravel.log | tail -n 5"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print("=== LATEST ERROR HEADERS ===")
    print(stdout.read().decode())

    # Get the last 200 lines unfiltered
    cmd = "tail -n 200 ~/domains/app.dynime.com/public_html/storage/logs/laravel.log"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print("=== LAST 200 LINES ===")
    lines = stdout.read().decode().splitlines()
    # Print lines that have ERROR or exception message
    for line in lines:
        if "ERROR" in line or "Exception" in line or "Error" in line or "DashboardController" in line:
            print(line[:250])

    ssh.close()

if __name__ == '__main__':
    fetch_log()
