import paramiko

def find_node():
    host = "5.183.10.149"
    port = 65002
    username = "u740731947"
    password = "Pixel#@!194JkS"

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, port=port, username=username, password=password)

    cmd = "ls -d /opt/alt/alt-nodejs*/root/usr/bin/node /usr/bin/node /usr/local/bin/node /usr/local/bin/npm 2>/dev/null"
    stdin, stdout, stderr = ssh.exec_command(cmd)

    out = stdout.read().decode()
    print("=== HOSTINGER NODE PATHS ===")
    print(out)

    # Try executing node -v with each found path
    for line in out.splitlines():
        node_path = line.strip()
        if node_path and "node" in node_path:
            stdin_n, stdout_n, stderr_n = ssh.exec_command(f"{node_path} -v")
            v = stdout_n.read().decode().strip()
            print(f"{node_path} version: {v}")

    ssh.close()

if __name__ == '__main__':
    find_node()
