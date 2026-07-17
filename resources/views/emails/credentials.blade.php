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
                        <td align="center" style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 40px 20px;">
                            <h1 style="margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.025em; color: #ffffff !important;">Welcome to Dynime!</h1>
                            <p style="margin: 8px 0 0 0; font-size: 16px; color: #ffffff !important; opacity: 0.9;">Your employee account has been successfully set up.</p>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #334155;">Hello <strong>{{ $user->name }}</strong>,</p>
                            <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #334155;">An administrator has configured your access to the Dynime dashboard. Below are your secure login credentials to sign in.</p>

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
                                        <a href="{{ $loginUrl }}" target="_blank" style="display: inline-block; padding: 14px 30px; font-size: 16px; font-weight: 600; color: #ffffff !important; background-color: #2563eb; border-radius: 6px; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">Access Dashboard</a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.6; color: #64748b; text-align: center;">For security reasons, we strongly recommend changing your password after your first login.</p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 32px 30px; text-align: center;">
                            <!-- Follow Us -->
                            <p style="margin: 0 0 16px 0; font-size: 13px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">Follow us</p>
                            <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 24px auto;">
                                <tr>
                                    <td style="padding: 0 6px;">
                                        <a href="https://facebook.com/thedynime" target="_blank" style="display: inline-block; width: 36px; height: 36px; border-radius: 18px; background-color: #1e293b; text-align: center; text-decoration: none; vertical-align: middle;">
                                            <img src="https://img.icons8.com/ios-filled/50/ffffff/facebook-new.png" width="18" height="18" style="display: block; margin: 9px auto; border: 0;" alt="Facebook">
                                        </a>
                                    </td>
                                    <td style="padding: 0 6px;">
                                        <a href="https://linkedin.com/company/thedynime" target="_blank" style="display: inline-block; width: 36px; height: 36px; border-radius: 18px; background-color: #1e293b; text-align: center; text-decoration: none; vertical-align: middle;">
                                            <img src="https://img.icons8.com/ios-filled/50/ffffff/linkedin.png" width="18" height="18" style="display: block; margin: 9px auto; border: 0;" alt="LinkedIn">
                                        </a>
                                    </td>
                                    <td style="padding: 0 6px;">
                                        <a href="https://instagram.com/thedynime" target="_blank" style="display: inline-block; width: 36px; height: 36px; border-radius: 18px; background-color: #1e293b; text-align: center; text-decoration: none; vertical-align: middle;">
                                            <img src="https://img.icons8.com/ios-filled/50/ffffff/instagram-new.png" width="18" height="18" style="display: block; margin: 9px auto; border: 0;" alt="Instagram">
                                        </a>
                                    </td>
                                    <td style="padding: 0 6px;">
                                        <a href="https://wa.me/thedynime" target="_blank" style="display: inline-block; width: 36px; height: 36px; border-radius: 18px; background-color: #1e293b; text-align: center; text-decoration: none; vertical-align: middle;">
                                            <img src="https://img.icons8.com/ios-filled/50/ffffff/whatsapp.png" width="18" height="18" style="display: block; margin: 9px auto; border: 0;" alt="WhatsApp">
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Address & Copyright -->
                            <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b; line-height: 1.4;">
                                1209 Mountain Road Pl Ne Ste R, Albuquerque, NM, 87110
                            </p>
                            <p style="margin: 0 0 4px 0; font-size: 13px; color: #94a3b8;">This email was sent automatically. Please do not reply to this address.</p>
                            <p style="margin: 0; font-size: 13px; color: #94a3b8;">&copy; 2020 - {{ date('Y') }} Dynime LLC. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
