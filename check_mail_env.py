import paramiko

def check_env():
    host = "5.183.10.149"
    port = 65002
    username = "u740731947"
    password = "Pixel#@!194JkS"
    remote_base = "domains/app.dynime.com/public_html"

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, port=port, username=username, password=password)

    cmd = f"cd {remote_base} && grep MAIL .env"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print("=== ENV MAIL SETTINGS ===")
    print(stdout.read().decode('utf-8'))
    ssh.close()

if __name__ == "__main__":
    check_env()
