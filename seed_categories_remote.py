import paramiko

hostname = "147.93.109.206"
username = "root"
password = "r00tPassword!2026#Secure"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

print("Connecting to Hostinger SSH...")
client.connect(hostname, username=username, password=password)

cmd = "cd /home/u690184496/domains/app.dynime.com/public_html && php8.2 artisan account:seed-categories"
print(f"Executing: {cmd}")
stdin, stdout, stderr = client.exec_command(cmd)

out = stdout.read().decode('utf-8')
err = stderr.read().decode('utf-8')

print("=== OUTPUT ===")
print(out)
if err:
    print("=== ERRORS ===")
    print(err)

client.close()
