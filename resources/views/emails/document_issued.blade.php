<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New HR Document Issued</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; -webkit-font-smoothing: antialiased;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 40px 10px;">
        <tr>
            <td align="center">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); overflow: hidden; border: 1px solid #e2e8f0;">
                    
                    <!-- Top Header -->
                    <tr>
                        <td align="center" style="background: linear-gradient(135deg, #1e293b, #0f172a); padding: 36px 20px;">
                            <img src="https://cdn.dynime.com/Dynime%20Logo/LOGO%20PNG/logo%20SVG/dynime-white-logo.svg" alt="Dynime" width="140" style="display: block; width: 140px; max-width: 140px; height: auto; margin-bottom: 16px; border: 0;" />
                            <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.025em; color: #ffffff !important;">New HR Document Issued</h1>
                            <p style="margin: 6px 0 0 0; font-size: 14px; color: #cbd5e1 !important;">An official document has been added to your profile.</p>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #334155;">Hello <strong>{{ $user->name }}</strong>,</p>
                            
                            <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #334155;">
                                A new official document (<strong style="color: #0f172a;">{{ $documentName }}</strong>) has been generated and issued to your account portal on <strong>{{ $issuedDate }}</strong>.
                            </p>

                            <!-- Document Details Box -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 28px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td style="padding-bottom: 10px; font-size: 13px; color: #64748b; width: 35%;"><strong>Document Type:</strong></td>
                                                <td style="padding-bottom: 10px; font-size: 14px; color: #0f172a; font-weight: bold;">{{ $documentName }}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding-bottom: 10px; font-size: 13px; color: #64748b;"><strong>Issue Date:</strong></td>
                                                <td style="padding-bottom: 10px; font-size: 14px; color: #0f172a;">{{ $issuedDate }}</td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 13px; color: #64748b;"><strong>Recipient:</strong></td>
                                                <td style="font-size: 14px; color: #0f172a;">{{ $user->name }} ({{ $user->email }})</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Call to Action Button -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="padding-bottom: 24px;">
                                        <a href="{{ $signUrl }}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600; color: #ffffff !important; background-color: #2563eb; border-radius: 8px; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.25);">
                                            View & Review Document
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569; text-align: center;">
                                Please log in to your portal to review and keep a copy for your records.
                            </p>

                            <!-- Signature Note Box (Small font) -->
                            <div style="background-color: #f1f5f9; border-left: 3px solid #64748b; padding: 12px 16px; border-radius: 0 6px 6px 0; margin-top: 10px;">
                                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #64748b;">
                                    <em>* Note: If any digital signature is required for this document, please complete the signature process in the portal. If already signed or completed, you may disregard this request.</em>
                                </p>
                            </div>

                        </td>
                    </tr>

                    <!-- Dark Footer -->
                    <tr>
                        <td style="padding: 0;">
                            @include('emails.partials.footer')
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
