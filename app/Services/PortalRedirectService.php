<?php

namespace App\Services;

use App\Models\User;

class PortalRedirectService
{
    /**
     * Get target subdomain URL for a user based on their role/type and environment.
     *
     * @param User|null $user
     * @return string
     */
    public static function getTargetUrlForUser(?User $user): string
    {
        if (!$user) {
            return route('login');
        }

        $type = strtolower(trim($user->type ?? ''));
        $appUrl = config('app.url', 'http://localhost');
        $parsedUrl = parse_url($appUrl);
        $host = $parsedUrl['host'] ?? 'localhost';

        // Local development fallback (localhost / 127.0.0.1 / .test)
        if ($host === 'localhost' || $host === '127.0.0.1' || str_ends_with($host, '.test')) {
            return route('dashboard');
        }

        // Extract root domain (e.g., dynime.com from app.dynime.com or auth.dynime.com)
        $domainParts = explode('.', $host);
        if (count($domainParts) >= 2) {
            $rootDomain = implode('.', array_slice($domainParts, -2));
        } else {
            $rootDomain = $host;
        }

        $scheme = $parsedUrl['scheme'] ?? 'https';
        $port = isset($parsedUrl['port']) ? ':' . $parsedUrl['port'] : '';

        // Role-based subdomain mapping
        if ($type === 'client') {
            $subdomain = 'portal';
        } elseif ($type === 'vendor') {
            $subdomain = 'vendor';
        } elseif (in_array($type, ['company', 'superadmin', 'super admin'])) {
            $subdomain = 'app';
        } else {
            // Employees, Staff, HR, etc. (HR Self Service)
            $subdomain = 'hrm';
        }

        return "{$scheme}://{$subdomain}.{$rootDomain}{$port}/dashboard";
    }
}
