import os
import paramiko

def deploy_dmg():
    host = "5.183.10.149"
    port = 65002
    username = "u740731947"
    password = "Pixel#@!194JkS"
    remote_base = "domains/app.dynime.com/public_html"

    local_dmg = os.path.abspath("public/downloads/Dynime-TimeTracker-Mac.dmg")
    if not os.path.exists(local_dmg):
        print(f"❌ Error: Local DMG file not found at {local_dmg}")
        return

    print(f"Connecting to Hostinger SSH ({host}:{port})...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, port=port, username=username, password=password)

    sftp = ssh.open_sftp()
    print("SSH & SFTP connection established!")

    # Destinations to upload
    target_dirs = [
        f"{remote_base}/public/downloads",
        f"{remote_base}/downloads"
    ]

    for target_dir in target_dirs:
        # Ensure target directory exists
        parts = target_dir.split('/')
        curr = ""
        for p in parts:
            curr = f"{curr}/{p}" if curr else p
            try:
                sftp.stat(curr)
            except IOError:
                try:
                    sftp.mkdir(curr)
                    print(f"Created remote dir: {curr}")
                except Exception:
                    pass

        remote_dmg = f"{target_dir}/Dynime-TimeTracker-Mac.dmg"
        print(f"Uploading DMG ({os.path.getsize(local_dmg)} bytes) -> {remote_dmg}...")
        sftp.put(local_dmg, remote_dmg)
        sftp.chmod(remote_dmg, 0o644)
        print(f"✅ Uploaded to {remote_dmg}")

    sftp.close()

    # Clear LiteSpeed cache / PHP cache if necessary
    print("Clearing server caches...")
    stdin, stdout, stderr = ssh.exec_command(f"cd ~/{remote_base} && php artisan cache:clear && php artisan route:clear")
    out = stdout.read().decode()
    print(out)

    ssh.close()
    print("🚀 DMG deployed to app.dynime.com successfully!")

if __name__ == '__main__':
    deploy_dmg()
