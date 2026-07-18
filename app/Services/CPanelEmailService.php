<?php

namespace App\Services;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class CPanelEmailService
{
    /**
     * Create a new email account in cPanel.
     *
     * @param string $emailPrefix E.g., 'john.doe'
     * @param string $password
     * @param int $quota In MB (0 for unlimited)
     * @param int|null $userId Company creator ID to pull specific settings
     * @return array ['success' => bool, 'message' => string]
     */
    public static function createEmail(string $emailPrefix, string $password, int $quota = 0, $userId = null)
    {
        if (empty($userId)) {
            $userId = auth()->id();
        }

        $host = company_setting('cpanel_host', $userId);
        $username = company_setting('cpanel_username', $userId);
        $token = company_setting('cpanel_api_token', $userId);
        $domain = company_setting('cpanel_domain', $userId);
        $defaultQuota = company_setting('cpanel_quota', $userId) ?: 0;

        if (empty($host) || empty($username) || empty($token) || empty($domain)) {
            return [
                'success' => false,
                'message' => __('cPanel Integration is not configured. Please setup your cPanel settings first.')
            ];
        }

        // Standardize Host URL
        $host = trim($host);
        if (!str_starts_with($host, 'http://') && !str_starts_with($host, 'https://')) {
            $host = 'https://' . $host;
        }
        if (!str_contains($host, ':2083') && !str_contains($host, ':2087')) {
            $host = rtrim($host, '/') . ':2083';
        }

        $url = rtrim($host, '/') . '/execute/Email/add_pop';

        try {
            $client = new Client(['verify' => false]);
            $response = $client->post($url, [
                'headers' => [
                    'Authorization' => 'cpanel ' . $username . ':' . $token,
                ],
                'form_params' => [
                    'email' => $emailPrefix,
                    'password' => $password,
                    'domain' => $domain,
                    'quota' => $quota > 0 ? $quota : ($defaultQuota > 0 ? $defaultQuota : 0),
                ],
                'timeout' => 15
            ]);

            $body = json_decode($response->getBody()->getContents(), true);

            if (isset($body['status']) && $body['status'] == 1) {
                return [
                    'success' => true,
                    'message' => __('Email account created successfully in cPanel.')
                ];
            }

            $errorMsg = isset($body['errors']) && is_array($body['errors']) ? implode(', ', $body['errors']) : __('Unknown error');
            return [
                'success' => false,
                'message' => __('cPanel Error: ') . $errorMsg
            ];
        } catch (\Exception $e) {
            Log::error('cPanel Email Creation failed: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => __('Connection failed: ') . $e->getMessage()
            ];
        }
    }
}
