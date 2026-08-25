import paramiko

def get_db_mail_settings():
    host = "5.183.10.149"
    port = 65002
    username = "u740731947"
    password = "Pixel#@!194JkS"
    remote_base = "domains/app.dynime.com/public_html"

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, port=port, username=username, password=password)

    cmd = f'cd {remote_base} && php artisan tinker --execute="echo json_encode(DB::table(\'settings\')->where(\'key\', \'like\', \'%mail%\')->get());"'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8')
    print("=== DB SETTINGS ===")
    print(out)
    ssh.close()

if __name__ == "__main__":
    get_db_mail_settings()
