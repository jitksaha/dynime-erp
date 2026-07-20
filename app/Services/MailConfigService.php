<?php

namespace App\Services;

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Mail;

class MailConfigService
{
    public static function setDynamicConfig($userId = null)
    {
        if (empty($userId) && auth()->check()) {
            $userId = auth()->id();
        }

        $fromAddress = company_setting('email_fromAddress', $userId) ?: admin_setting('email_fromAddress') ?: 'noreply@example.com';
        $fromName = company_setting('email_fromName', $userId) ?: admin_setting('email_fromName') ?: config('app.name', 'Dynime');
        $replyTo = company_setting('email_replyTo', $userId) ?: admin_setting('email_replyTo') ?: '';

        if ($fromName === 'Dynime ERP') {
            $fromName = 'Dynime';
        }

        $settings = [
            'driver' => company_setting('email_driver', $userId) ?: admin_setting('email_driver') ?: 'smtp',
            'host' => company_setting('email_host', $userId) ?: admin_setting('email_host') ?: 'smtp.example.com',
            'port' => company_setting('email_port', $userId) ?: admin_setting('email_port') ?: '587',
            'username' => company_setting('email_username', $userId) ?: admin_setting('email_username') ?: '',
            'password' => company_setting('email_password', $userId) ?: admin_setting('email_password') ?: '',
            'encryption' => company_setting('email_encryption', $userId) ?: admin_setting('email_encryption') ?: 'tls',
            'fromAddress' => $fromAddress,
            'fromName' => $fromName,
            'replyTo' => $replyTo,
        ];

        Config::set([
            'mail.default' => $settings['driver'],
            'mail.mailers.smtp.host' => $settings['host'],
            'mail.mailers.smtp.port' => $settings['port'],
            'mail.mailers.smtp.encryption' => $settings['encryption'] === 'none' ? null : $settings['encryption'],
            'mail.mailers.smtp.username' => $settings['username'],
            'mail.mailers.smtp.password' => $settings['password'],
            'mail.from.address' => $settings['fromAddress'],
            'mail.from.name' => $settings['fromName'],
            'mail.reply_to' => [
                'address' => !empty($settings['replyTo']) ? $settings['replyTo'] : $settings['fromAddress'],
                'name' => $settings['fromName'],
            ],
        ]);

        Mail::purge();
    }
}