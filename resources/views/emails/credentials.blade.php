<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Credentials</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;-webkit-font-smoothing: antialiased;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 40px 10px;">
        <tr>
            <td align="center">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); overflow: hidden; border: 1px solid #e2e8f0;">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 40px 20px; color: #ffffff;">
                            <h1 style="margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.025em;">Welcome to {{ config('app.name') }}!</h1>
                            <p style="margin: 8px 0 0 0; font-size: 16px; color: #bfdbfe;">Your employee account has been successfully set up.</p>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #334155;">Hello <strong>{{ $user->name }}</strong>,</p>
                            <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #334155;">An administrator has configured your access to the {{ config('app.name') }} dashboard. Below are your secure login credentials to sign in.</p>

                            <!-- Credentials Box -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; border-radius: 8px; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td style="padding-bottom: 12px; font-size: 14px; color: #64748b; width: 30%;"><strong>Email Address:</strong></td>
                                                <td style="padding-bottom: 12px; font-size: 15px; color: #0f172a; font-family: monospace; font-weight: bold;">{{ $user->email }}</td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 14px; color: #64748b;"><strong>Password:</strong></td>
                                                <td style="font-size: 15px; color: #e11d48; font-family: monospace; font-weight: bold;">{{ $password }}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Call to Action -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="padding-bottom: 30px;">
                                        <a href="{{ $loginUrl }}" target="_blank" style="display: inline-block; padding: 14px 30px; font-size: 16px; font-weight: 600; color: #ffffff; background-color: #2563eb; border-radius: 6px; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">Access Dashboard</a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.6; color: #64748b; text-align: center;">For security reasons, we strongly recommend changing your password after your first login.</p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 30px; text-align: center; font-size: 13px; color: #94a3b8;">
                            <p style="margin: 0 0 4px 0;">This email was sent automatically. Please do not reply to this address.</p>
                            <p style="margin: 0;">&copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
