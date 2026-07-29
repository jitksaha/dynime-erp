<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Test Email</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px 10px;
            background-color: #f8fafc;
        }
        .container {
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
            overflow: hidden;
        }
        .header {
            text-align: center;
            padding: 30px 20px;
            border-bottom: 1px solid #f1f5f9;
        }
        .content {
            padding: 36px 30px;
            font-size: 15px;
            color: #334155;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://cdn.dynime.com/Dynime%20Logo/LOGO%20PNG/logo%20PNG/logo.png" alt="Dynime" width="140">
        </div>
        
        <div class="content">
            <h2 style="margin-top: 0; color: #0f172a;">Test Email Configuration</h2>
            <p>Hello,</p>
            <p>This is a test email from <strong>{{ config('app.name') }}</strong> to confirm that your SMTP server settings are configured correctly and functioning properly.</p>
            <p>If you received this message, no further action is required.</p>
            <p style="margin-bottom: 0;">Best regards,<br><strong>Dynime Team</strong></p>
        </div>
        
        @include('emails.partials.footer')
    </div>
</body>
</html>