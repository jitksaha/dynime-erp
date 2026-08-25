#!/usr/bin/env python3
import os
import shutil
import subprocess

def build():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    mac_src = os.path.join(base_dir, "time-tracker-mac", "main.m")
    build_dir = os.path.join(base_dir, "build_mac_output")
    app_path = os.path.join(build_dir, "Dynime Time Tracker.app")
    contents_dir = os.path.join(app_path, "Contents")
    macos_dir = os.path.join(contents_dir, "MacOS")
    resources_dir = os.path.join(contents_dir, "Resources")
    bin_path = os.path.join(macos_dir, "DynimeTimeTracker")
    dmg_file = os.path.join(base_dir, "public", "downloads", "Dynime-TimeTracker-Mac.dmg")

    # Clean build directory
    if os.path.exists(build_dir):
        shutil.rmtree(build_dir)
    os.makedirs(macos_dir, exist_ok=True)
    os.makedirs(resources_dir, exist_ok=True)
    os.makedirs(os.path.dirname(dmg_file), exist_ok=True)

    # 1. Compile native binary with clang
    print("🔨 Compiling native macOS App executable with clang...")
    clang_cmd = [
        "clang",
        "-framework", "Cocoa",
        "-framework", "WebKit",
        "-framework", "Foundation",
        "-O3",
        mac_src,
        "-o", bin_path
    ]
    subprocess.run(clang_cmd, check=True)
    os.chmod(bin_path, 0o755)

    # 2. Write Info.plist
    info_plist = """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>DynimeTimeTracker</string>
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

    # 3. Create Applications symlink inside build_dir for Drag and Drop
    apps_symlink = os.path.join(build_dir, "Applications")
    if os.path.exists(apps_symlink):
        os.remove(apps_symlink)
    os.symlink("/Applications", apps_symlink)

    print(f"✅ Native macOS App bundle created at: {app_path}")

    # 4. Remove old DMG if exists
    if os.path.exists(dmg_file):
        os.remove(dmg_file)

    # 5. Build standard HFS+ compressed DMG with hdiutil
    print(f"📦 Packaging valid DMG installer to {dmg_file}...")
    dmg_cmd = [
        "hdiutil", "create",
        "-volname", "Dynime Time Tracker",
        "-srcfolder", build_dir,
        "-ov",
        "-format", "UDZO",
        "-fs", "HFS+",
        dmg_file
    ]
    subprocess.run(dmg_cmd, check=True)

    size_bytes = os.path.getsize(dmg_file)
    print(f"🚀 SUCCESS: Native Mac DMG created! File size: {size_bytes} bytes ({size_bytes / (1024*1024):.2f} MB)")

if __name__ == "__main__":
    build()
