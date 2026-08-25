<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to Dynime OS</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        .header { background: #4f46e5; color: #ffffff; padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
        .content { padding: 32px 24px; }
        .button-wrapper { text-align: center; margin: 28px 0; }
        .button { background-color: #4f46e5; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 600; display: inline-block; }
        .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Dynime OS</h1>
        </div>
        <div class="content">
            <p>Hello <strong>{{ $employee->user ? $employee->user->name : 'Team Member' }}</strong>,</p>
            <p>Welcome to Dynime OS. Before you begin using the platform, please complete your employee profile. This should only take a few minutes.</p>
            
            <div class="button-wrapper">
                <a href="{{ url('/hrm/onboarding') }}" class="button">Complete Profile Now</a>
            </div>

            <p style="font-size: 13px; color: #64748b;">If you have any questions, please reach out to your HR administrator.</p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} Dynime OS. All rights reserved.
        </div>
    </div>
</body>
</html>
