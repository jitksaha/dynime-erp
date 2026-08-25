import os
import paramiko

def deploy_public_invoice_fix():
    host = "5.183.10.149"
    port = 65002
    username = "u740731947"
    password = "Pixel#@!194JkS"
    remote_base = "domains/app.dynime.com/public_html"

    print("Connecting to Hostinger SSH...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, port=port, username=username, password=password)

    sftp = ssh.open_sftp()
    print("SSH & SFTP connection established!")

    files_to_upload = [
        "resources/js/pages/Sales/Index.tsx",
        "resources/js/pages/Sales/PublicView.tsx",
        "resources/js/components/ui/select.tsx",
    ]

    for rel_path in files_to_upload:
        local_path = os.path.abspath(rel_path)
        remote_path = f"{remote_base}/{rel_path}"
        remote_dir = os.path.dirname(remote_path)

        dir_parts = remote_dir.split('/')
        current_path = ""
        for part in dir_parts:
            current_path = f"{current_path}/{part}" if current_path else part
            try:
                sftp.stat(current_path)
            except IOError:
                try:
                    sftp.mkdir(current_path)
                except Exception as e:
                    pass

        print(f"Uploading: {rel_path} -> {remote_path}")
        sftp.put(local_path, remote_path)

    print("Files uploaded successfully!")
    sftp.close()

    build_cmds = [
        f"cd ~/{remote_base}",
        "export PATH=/opt/alt/alt-nodejs20/root/usr/bin:$PATH",
        "./node_modules/.bin/vite build",
        "php artisan view:clear",
        "php artisan cache:clear",
        "php artisan route:clear"
    ]

    full_cmd = " && ".join(build_cmds)
    print("Executing Vite build and cache clear on Hostinger server...")
    stdin, stdout, stderr = ssh.exec_command(full_cmd)

    out = stdout.read().decode()
    err = stderr.read().decode()

    print("=== SERVER STDOUT ===")
    print(out)
    if err:
        print("=== SERVER STDERR ===")
        print(err)

    ssh.close()
    print("Deployment & Vite Build on live server completed successfully!")

if __name__ == '__main__':
    deploy_public_invoice_fix()
