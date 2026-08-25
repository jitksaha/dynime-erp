<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $headline }}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; -webkit-font-smoothing: antialiased;">

    <div style="width: 100%; background-color: #f1f5f9; padding: 32px 12px; box-sizing: border-box;">
        <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; border: 1px solid #cbd5e1; box-shadow: 0 15px 35px rgba(15, 23, 42, 0.06); overflow: hidden;">
            
            <!-- HEADER HERO -->
            <div style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%); padding: 32px 24px; text-align: center;">
                <div style="display: inline-block; padding: 10px; background: rgba(255, 255, 255, 0.12); border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.2); margin-bottom: 10px;">
                    <img src="https://cdn.dynime.com/Dynime%20Logo/Favicon/dynime-favicon.png" style="width: 44px; height: 44px; vertical-align: middle; display: block;" alt="Dynime" />
                </div>
                <h1 style="font-size: 22px; font-weight: 800; color: #ffffff; margin: 0; letter-spacing: -0.02em;">Dtime Trace</h1>
                <div style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; font-size: 10px; font-weight: 800; padding: 4px 12px; border-radius: 999px; text-transform: uppercase; margin-top: 8px; letter-spacing: 0.08em; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">
                    BETA PHASE &bull; LIVE VERY SOON
                </div>
            </div>

            <!-- BODY CONTENT -->
            <div style="padding: 28px 24px;">
                
                <!-- CLEAN LIGHT SHIFT NOTIFICATION BANNER (NO DARK PURPLE BOX) -->
                <div style="background-color: #eef2ff; border: 1px solid #c7d2fe; border-radius: 14px; padding: 16px 20px; margin-bottom: 24px;">
                    <div style="font-size: 16px; font-weight: 800; color: #312e81; margin-bottom: 4px;">{{ $headline }}</div>
                    <div style="font-size: 13px; font-weight: 500; color: #4338ca; line-height: 1.5;">{{ $messageText }}</div>
                </div>

                <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 14px;">Hi {{ $userName }},</div>

                <!-- EMPLOYEE BADGE (NO AVATAR, CLEAN BADGES & PROPER MARGINS) -->
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px 20px; margin-bottom: 24px; box-sizing: border-box;">
                    <div style="font-size: 17px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0;">{{ $userName }}</div>
                    
                    <!-- Spacing & Margins Between Badges -->
                    <div style="margin-bottom: 8px;">
                        <span style="display: inline-block; background-color: #e0e7ff; color: #3730a3; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 6px; margin-right: 10px; margin-bottom: 6px;">
                            ID: {{ $employeeId }}
                        </span>
                        <span style="display: inline-block; background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 6px; margin-right: 10px; margin-bottom: 6px;">
                            Role: {{ $designation }}
                        </span>
                    </div>
                    
                    <div style="font-size: 13px; font-weight: 600; color: #475569; margin-top: 6px;">
                        <span style="color: #64748b; font-weight: 700;">Official Email:</span> <a href="mailto:{{ $officialEmail }}" style="color: #4f46e5; text-decoration: none; font-weight: 700;">{{ $officialEmail }}</a>
                    </div>
                </div>

                <!-- TIMEZONE DASHBOARD CARD -->
                <div style="background-color: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 18px; padding: 22px; margin-bottom: 26px; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.03);">
                    <div style="display: table; width: 100%; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 16px;">
                        <div style="display: table-cell; font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            Employee Shift & Timezone Dashboard
                        </div>
                        <div style="display: table-cell; text-align: right; font-size: 10px; font-weight: 800; color: #059669; background: #ecfdf5; padding: 3px 10px; border-radius: 999px; border: 1px solid #a7f3d0;">
                            LIVE SYNCED
                        </div>
                    </div>

                    <!-- Company Time (Denver, USA) -->
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; margin-bottom: 10px; display: table; width: 100%; box-sizing: border-box;">
                        <div style="display: table-cell; vertical-align: middle; font-size: 13px; font-weight: 700; color: #0f172a;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/><line x1="9" y1="14" x2="9" y2="14.01"/><line x1="15" y1="14" x2="15" y2="14.01"/></svg>
                            Company Standard Time (Denver, USA)
                            <div style="font-size: 11px; font-weight: 600; color: #64748b; margin-top: 3px;">Mountain Time Zone (MT)</div>
                        </div>
                        <div style="display: table-cell; text-align: right; vertical-align: middle;">
                            <div style="font-family: monospace; font-size: 15px; font-weight: 800; color: #0f172a;">{{ $compTime }}</div>
                            <div style="font-size: 11px; font-weight: 700; color: #4f46e5; margin-top: 2px;">Shift: 09:00 AM – 06:00 PM MT</div>
                        </div>
                    </div>

                    <!-- Universal Time (UTC) -->
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; margin-bottom: 10px; display: table; width: 100%; box-sizing: border-box;">
                        <div style="display: table-cell; vertical-align: middle; font-size: 13px; font-weight: 700; color: #0f172a;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                            Universal Time (UTC)
                            <div style="font-size: 11px; font-weight: 600; color: #64748b; margin-top: 3px;">Coordinated Universal Time (UTC+0)</div>
                        </div>
                        <div style="display: table-cell; text-align: right; vertical-align: middle;">
                            <div style="font-family: monospace; font-size: 15px; font-weight: 800; color: #0f172a;">{{ $utcTime }}</div>
                            <div style="font-size: 11px; font-weight: 700; color: #4f46e5; margin-top: 2px;">Shift: {{ $shiftUtc }}</div>
                        </div>
                    </div>

                    <!-- Employee Local Time -->
                    <div style="background-color: #f0fdf4; border: 1.5px solid #34d399; border-radius: 12px; padding: 14px 16px; display: table; width: 100%; box-sizing: border-box;">
                        <div style="display: table-cell; vertical-align: middle; font-size: 13px; font-weight: 700; color: #065f46;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="12" r="3"/></svg>
                            Your Local Country Time ({{ $country }})
                            <div style="font-size: 11px; font-weight: 600; color: #047857; margin-top: 3px;">{{ $empTimezone }}</div>
                        </div>
                        <div style="display: table-cell; text-align: right; vertical-align: middle;">
                            <div style="font-family: monospace; font-size: 15px; font-weight: 800; color: #064e3b;">{{ $empTime }}</div>
                            <div style="font-size: 11px; font-weight: 700; color: #059669; margin-top: 2px;">Shift: 09:00 AM – 06:00 PM Local</div>
                        </div>
                    </div>

                    <div style="font-size: 12px; color: #64748b; font-weight: 700; margin-top: 14px; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 12px;">
                        Off Days: <span style="color: #0f172a; font-weight: 800;">{{ $offDaysText }}</span> &bull; Daily Working Duty: 8 Hours
                    </div>
                </div>

                <!-- High-Impact CTA Button -->
                <div style="text-align: center; margin: 24px 0 10px 0;">
                    <a href="https://app.dynime.com/dashboard/hrm" style="display: block; width: 100%; padding: 18px 24px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; text-decoration: none; font-size: 16px; font-weight: 800; border-radius: 16px; box-shadow: 0 10px 25px rgba(16, 185, 129, 0.35); text-align: center; box-sizing: border-box;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px;"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        <span>Clock In Now on Dtime Trace</span>
                    </a>
                </div>

            </div>

            <!-- GLOBAL BRANDED FOOTER (DARK SLEEK DESIGN - MATCHING DYNIME ERP GLOBAL FOOTER) -->
            <div style="background-color: #0f172a; border-top: 1px solid #1e293b; padding: 28px 24px; text-align: center; color: #94a3b8; font-size: 12px; font-weight: 500; line-height: 1.6;">
                <div style="margin-bottom: 12px;">
                    <img src="https://cdn.dynime.com/Dynime%20Logo/Favicon/dynime-favicon.png" style="width: 28px; height: 28px; vertical-align: middle; display: inline-block;" alt="Dynime" />
                    <span style="font-size: 14px; font-weight: 800; color: #ffffff; margin-left: 8px; vertical-align: middle;">Dynime ERP</span>
                </div>
                <div style="color: #cbd5e1; margin-bottom: 12px; font-weight: 600;">
                    <a href="https://app.dynime.com/dashboard/hrm" style="color: #818cf8; text-decoration: none; font-weight: 700; margin: 0 8px;">HRM Portal</a> &bull;
                    <a href="https://dynime.com" style="color: #818cf8; text-decoration: none; font-weight: 700; margin: 0 8px;">Official Website</a> &bull;
                    <a href="https://app.dynime.com/downloads/Dtime-Trace-Mac.dmg" style="color: #818cf8; text-decoration: none; font-weight: 700; margin: 0 8px;">Download App</a>
                </div>
                <div style="font-size: 11px; color: #64748b; margin-top: 10px; border-top: 1px solid #1e293b; padding-top: 12px;">
                    &copy; {{ date('Y') }} Dynime Inc. All rights reserved. &bull; Dtime Trace Client (Beta Phase &bull; Live Very Soon)
                </div>
            </div>

        </div>
    </div>
</body>
</html>
