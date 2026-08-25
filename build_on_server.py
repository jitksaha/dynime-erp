import paramiko

def find_node():
    host = "5.183.10.149"
    port = 65002
    username = "u740731947"
    password = "Pixel#@!194JkS"

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, port=port, username=username, password=password)

    cmd = "find /home/u740731947 -name node -o -name npm 2>/dev/null"
    stdin, stdout, stderr = ssh.exec_command(cmd)

    out = stdout.read().decode()
    print("=== NODE / NPM PATHS ON HOSTINGER ===")
    print(out)

    ssh.close()

if __name__ == '__main__':
    find_node()
