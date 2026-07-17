<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('app.name') }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #fff; 
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 30px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #eee;
        }
        .content {
            margin-bottom: 30px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #777;
            text-align: center;
        }
        a {
            color: #007bff;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Dynime</h2>
        </div>

        <div class="content">
            {!! $content !!}
        </div>

        <div class="footer">
            <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; text-align: center;">Follow us</p>
            <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 20px auto;">
                <tr>
                    <td style="padding: 0 6px;">
                        <a href="https://facebook.com/thedynime" target="_blank" style="display: inline-block; width: 32px; height: 32px; border-radius: 16px; background-color: #1e293b; text-align: center; text-decoration: none; vertical-align: middle;">
                            <img src="https://img.icons8.com/ios-filled/50/ffffff/facebook-new.png" width="16" height="16" style="display: block; margin: 8px auto; border: 0;" alt="Facebook">
                        </a>
                    </td>
                    <td style="padding: 0 6px;">
                        <a href="https://linkedin.com/company/thedynime" target="_blank" style="display: inline-block; width: 32px; height: 32px; border-radius: 16px; background-color: #1e293b; text-align: center; text-decoration: none; vertical-align: middle;">
                            <img src="https://img.icons8.com/ios-filled/50/ffffff/linkedin.png" width="16" height="16" style="display: block; margin: 8px auto; border: 0;" alt="LinkedIn">
                        </a>
                    </td>
                    <td style="padding: 0 6px;">
                        <a href="https://instagram.com/thedynime" target="_blank" style="display: inline-block; width: 32px; height: 32px; border-radius: 16px; background-color: #1e293b; text-align: center; text-decoration: none; vertical-align: middle;">
                            <img src="https://img.icons8.com/ios-filled/50/ffffff/instagram-new.png" width="16" height="16" style="display: block; margin: 8px auto; border: 0;" alt="Instagram">
                        </a>
                    </td>
                    <td style="padding: 0 6px;">
                        <a href="https://wa.me/thedynime" target="_blank" style="display: inline-block; width: 32px; height: 32px; border-radius: 16px; background-color: #1e293b; text-align: center; text-decoration: none; vertical-align: middle;">
                            <img src="https://img.icons8.com/ios-filled/50/ffffff/whatsapp.png" width="16" height="16" style="display: block; margin: 8px auto; border: 0;" alt="WhatsApp">
                        </a>
                    </td>
                </tr>
            </table>

            <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b; line-height: 1.4; text-align: center;">
                1209 Mountain Road Pl Ne Ste R, Albuquerque, NM, 87110
            </p>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #94a3b8; text-align: center;">This email was sent automatically. Please do not reply to this address.</p>
            <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">&copy; 2020 - {{ date('Y') }} Dynime LLC. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
