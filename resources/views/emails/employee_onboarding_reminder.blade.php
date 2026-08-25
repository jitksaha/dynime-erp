<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reminder: Complete Your Profile</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        .header { background: #d97706; color: #ffffff; padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
        .content { padding: 32px 24px; }
        .button-wrapper { text-align: center; margin: 28px 0; }
        .button { background-color: #d97706; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 600; display: inline-block; }
        .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Action Required: Profile Completion Reminder</h1>
        </div>
        <div class="content">
            <p>Hello <strong>{{ $employee->user ? $employee->user->name : 'Team Member' }}</strong>,</p>
            <p>Your Dynime ERP profile setup is still pending. Completing your profile ensures smooth payroll processing, asset tracking, and team communication.</p>
            
            <div class="button-wrapper">
                <a href="{{ url('/hrm/onboarding') }}" class="button">Continue Setup</a>
            </div>

            <p style="font-size: 13px; color: #64748b;">It only takes a few minutes to finish the remaining sections.</p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} Dynime OS. All rights reserved.
        </div>
    </div>
</body>
</html>
