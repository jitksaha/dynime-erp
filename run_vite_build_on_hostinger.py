import paramiko

def build_on_hostinger():
    host = "5.183.10.149"
    port = 65002
    username = "u740731947"
    password = "Pixel#@!194JkS"

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, port=port, username=username, password=password)

    cmd = "export PATH=/opt/alt/alt-nodejs20/root/usr/bin:$PATH && cd ~/domains/app.dynime.com/public_html && ./node_modules/.bin/vite build"
    print("Executing ./node_modules/.bin/vite build on Hostinger server...")
    stdin, stdout, stderr = ssh.exec_command(cmd)

    out = stdout.read().decode()
    err = stderr.read().decode()

    print("=== BUILD STDOUT ===")
    print(out)
    if err:
        print("=== BUILD STDERR ===")
        print(err)

    # Clear artisan cache after build
    print("Clearing Laravel view and config cache...")
    stdin_c, stdout_c, stderr_c = ssh.exec_command("cd ~/domains/app.dynime.com/public_html && php artisan view:clear && php artisan config:clear && php artisan cache:clear")
    print(stdout_c.read().decode())

    ssh.close()
    print("Vite build on Hostinger server completed!")

if __name__ == '__main__':
    build_on_hostinger()
