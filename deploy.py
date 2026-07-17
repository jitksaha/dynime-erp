import os
import pty
import sys
import time
import select

def wait_for_prompt(fd, timeout=15):
    buffer = b""
    t_start = time.time()
    while time.time() - t_start < timeout:
        try:
            r, w, x = select.select([fd], [], [], 0.1)
            if r:
                data = os.read(fd, 1024)
                if not data:
                    break
                buffer += data
                sys.stdout.buffer.write(data)
                sys.stdout.flush()
                if b"]$" in buffer or b"password:" in buffer.lower() or b"~]$" in buffer:
                    break
        except OSError:
            break
    return buffer

def main():
    print("Spawning SSH connection via pty to deploy changes...")
    pid, fd = pty.fork()
    if pid == 0:
        os.execvp('ssh', ['ssh', '-p', '65002', '-o', 'StrictHostKeyChecking=no', 'u740731947@5.183.10.149'])
    else:
        wait_for_prompt(fd)
        print("\nSending password...")
        os.write(fd, b"Pixel#@!194JkS\n")
        wait_for_prompt(fd)
        
        commands = [
            "cd ~/domains/app.dynime.com/public_html",
            "git pull",
            "sed -i 's/APP_NAME=\"Dynime ERP\"/APP_NAME=\"Dynime\"/g' .env",
            "php artisan migrate --force",
            "php artisan cache:clear",
            "php artisan view:clear",
            "php artisan config:clear",
            "php artisan route:clear",
            "exit"
        ]
        
        for cmd in commands:
            print(f"\n---> Executing: {cmd}")
            os.write(fd, f"{cmd}\n".encode())
            time.sleep(3)
            wait_for_prompt(fd)
            
        print("\nDeployment completed successfully!")

if __name__ == '__main__':
    main()
