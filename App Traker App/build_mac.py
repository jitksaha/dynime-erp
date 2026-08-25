#!/usr/bin/env python3
import os
import shutil
import subprocess

def build():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    mac_dir = os.path.join(base_dir, "mac")
    mac_src = os.path.join(mac_dir, "main.m")
    icns_src = os.path.join(mac_dir, "AppIcon.icns")
    
    build_dir = os.path.join(base_dir, "build_tmp")
    app_path = os.path.join(build_dir, "Dtime Trace.app")
    contents_dir = os.path.join(app_path, "Contents")
    macos_dir = os.path.join(contents_dir, "MacOS")
    resources_dir = os.path.join(contents_dir, "Resources")
    bin_path = os.path.join(macos_dir, "DtimeTrace")
    
    output_dir = os.path.join(base_dir, "output")
    dmg_output = os.path.join(output_dir, "Dtime-Trace-Mac.dmg")
    
    root_dir = os.path.abspath(os.path.join(base_dir, ".."))
    public_dmg = os.path.join(root_dir, "public", "downloads", "Dtime-Trace-Mac.dmg")
    fallback_dmg = os.path.join(root_dir, "public", "downloads", "Dynime-TimeTracker-Mac.dmg")

    # Clean tmp & output dirs
    if os.path.exists(build_dir):
        shutil.rmtree(build_dir)
    os.makedirs(macos_dir, exist_ok=True)
    os.makedirs(resources_dir, exist_ok=True)
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(os.path.dirname(public_dmg), exist_ok=True)

    # 1. Compile native binary with clang
    print("🔨 Compiling Dtime Trace macOS App executable with clang...")
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

    # 2. Copy AppIcon.icns
    if os.path.exists(icns_src):
        shutil.copy(icns_src, os.path.join(resources_dir, "AppIcon.icns"))
        print("🎨 Copied official Dynime AppIcon.icns to app bundle resources")

    # 3. Write Info.plist
    info_plist = """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>DtimeTrace</string>
    <key>CFBundleIdentifier</key>
    <string>com.dynime.dtimetrace</string>
    <key>CFBundleName</key>
    <string>Dtime Trace</string>
    <key>CFBundleDisplayName</key>
    <string>Dtime Trace</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>4.0.0</string>
    <key>CFBundleVersion</key>
    <string>4.0.0</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>NSPrincipalClass</key>
    <string>NSApplication</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.13.0</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
"""
    with open(os.path.join(contents_dir, "Info.plist"), "w") as f:
        f.write(info_plist)

    # 4. Ad-hoc Code Signing for macOS Gatekeeper
    print("🔏 Performing ad-hoc code signing on Dtime Trace App bundle...")
    try:
        subprocess.run(["codesign", "--force", "--deep", "--sign", "-", app_path], check=True)
        print("✅ Ad-hoc code signing complete!")
    except Exception as e:
        print(f"⚠️ Code signing warning: {e}")

    # 5. Add /Applications symlink inside build folder
    apps_symlink = os.path.join(build_dir, "Applications")
    if os.path.exists(apps_symlink):
        os.remove(apps_symlink)
    os.symlink("/Applications", apps_symlink)

    # 6. Package DMG
    if os.path.exists(dmg_output):
        os.remove(dmg_output)

    print(f"📦 Packaging valid DMG installer to {dmg_output}...")
    dmg_cmd = [
        "hdiutil", "create",
        "-volname", "Dtime Trace",
        "-srcfolder", build_dir,
        "-ov",
        "-format", "UDZO",
        "-fs", "HFS+",
        dmg_output
    ]
    subprocess.run(dmg_cmd, check=True)

    # Copy output to public/downloads/
    shutil.copy(dmg_output, public_dmg)
    shutil.copy(dmg_output, fallback_dmg)

    size_bytes = os.path.getsize(dmg_output)
    print(f"🚀 SUCCESS: Dtime Trace Mac DMG created! Size: {size_bytes} bytes ({size_bytes / (1024*1024):.2f} MB)")
    print(f"📁 Output DMG: {dmg_output}")
    print(f"🔗 Linked Public DMG: {public_dmg}")

if __name__ == "__main__":
    build()
