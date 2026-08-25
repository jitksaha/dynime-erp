#!/usr/bin/env python3
import os
import shutil
import subprocess

def build_mac_app_and_dmg():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(base_dir, "dist_mac")
    app_name = "Dynime Time Tracker.app"
    app_path = os.path.join(output_dir, app_name)
    dmg_name = "Dynime-TimeTracker-Mac.dmg"
    dmg_path = os.path.join(output_dir, dmg_name)

    # Recreate output directory
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)
    os.makedirs(output_dir, exist_ok=True)

    contents_dir = os.path.join(app_path, "Contents")
    macos_dir = os.path.join(contents_dir, "MacOS")
    resources_dir = os.path.join(contents_dir, "Resources")

    os.makedirs(macos_dir, exist_ok=True)
    os.makedirs(resources_dir, exist_ok=True)

    # 1. Write Info.plist
    info_plist = """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>DynimeTimeTracker</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>CFBundleIdentifier</key>
    <string>com.dynime.timetracker</string>
    <key>CFBundleName</key>
    <string>Dynime Time Tracker</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>2.4.0</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.13.0</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
"""
    with open(os.path.join(contents_dir, "Info.plist"), "w") as f:
        f.write(info_plist)

    # 2. Write Python Daemon Launcher
    launcher_script = """#!/usr/bin/env python3
import sys
import os
import time
import random
import urllib.request
import urllib.parse
import json
import subprocess

API_BASE_URL = "https://app.dynime.com/api/time-tracker"
PAIRING_KEY_FILE = os.path.expanduser("~/.dynime_tracker_key")

def notify(title, message):
    try:
        script = f'display notification "{message}" with title "{title}"'
        subprocess.run(["osascript", "-e", script])
    except Exception:
        pass

def open_dashboard():
    try:
        subprocess.run(["open", "https://app.dynime.com"])
    except Exception:
        pass

def main():
    notify("Dynime Time Tracker", "Dynime Background Time Tracker & Auto-Sync Engine is active.")
    open_dashboard()

    token = None
    if os.path.exists(PAIRING_KEY_FILE):
        with open(PAIRING_KEY_FILE, "r") as f:
            token = f.read().strip()

    elapsed = 0
    next_screenshot_in = random.randint(5, 12) * 60

    while True:
        time.sleep(60)
        elapsed += 60

        # Heartbeat ping
        if token:
            try:
                data = json.dumps({"elapsed_seconds": elapsed, "platform": "mac"}).encode("utf-8")
                req = urllib.request.Request(f"{API_BASE_URL}/sync-heartbeat", data=data, headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {token}"
                })
                urllib.request.urlopen(req, timeout=10)
            except Exception:
                pass

        # Random Screenshot Capture
        next_screenshot_in -= 60
        if next_screenshot_in <= 0:
            next_screenshot_in = random.randint(5, 12) * 60
            tmp_img = f"/tmp/dynime_screen_{int(time.time())}.jpg"
            try:
                res = subprocess.run(["screencapture", "-x", tmp_img])
                if res.returncode == 0 and os.path.exists(tmp_img) and token:
                    # Upload screenshot
                    with open(tmp_img, "rb") as img_file:
                        img_bytes = img_file.read()
                    
                    boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
                    body = []
                    body.append(f'--{boundary}'.encode())
                    body.append(b'Content-Disposition: form-data; name="active_window"\r\n')
                    body.append(b'macOS Desktop Workspace\r\n')
                    body.append(f'--{boundary}'.encode())
                    body.append(b'Content-Disposition: form-data; name="screenshot"; filename="screenshot.jpg"\r\n')
                    body.append(b'Content-Type: image/jpeg\r\n\r\n')
                    body.append(img_bytes)
                    body.append(f'\r\n--{boundary}--\r\n'.encode())
                    payload = b'\r\n'.join(body)

                    req = urllib.request.Request(f"{API_BASE_URL}/upload-screenshot", data=payload, headers={
                        "Content-Type": f"multipart/form-data; boundary={boundary}",
                        "Authorization": f"Bearer {token}"
                    })
                    urllib.request.urlopen(req, timeout=15)
                if os.path.exists(tmp_img):
                    os.remove(tmp_img)
            except Exception as e:
                pass

if __name__ == "__main__":
    main()
"""
    executable_path = os.path.join(macos_dir, "DynimeTimeTracker")
    with open(executable_path, "w") as f:
        f.write(launcher_script)
    os.chmod(executable_path, 0o755)

    print(f"✅ App Bundle created at: {app_path}")

    # 3. Create DMG Installer using hdiutil
    print("📦 Packaging DMG disk image...")
    cmd = [
        "hdiutil", "create",
        "-volname", "Dynime Time Tracker",
        "-srcfolder", app_path,
        "-ov",
        "-format", "UDZO",
        dmg_path
    ]
    subprocess.run(cmd, check=True)
    print(f"🚀 Mac DMG Installer successfully created at: {dmg_path}")

if __name__ == "__main__":
    build_mac_app_and_dmg()
