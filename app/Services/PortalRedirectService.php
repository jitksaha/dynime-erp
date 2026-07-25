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

        // Check if subdomain routing is enabled (defaults to true if env ENABLE_SUBDOMAIN_ROUTING is true or SESSION_DOMAIN is set)
        $subdomainRoutingEnabled = env('ENABLE_SUBDOMAIN_ROUTING', true);
        if (!$subdomainRoutingEnabled) {
            return route('dashboard');
        }

        $type = strtolower(trim($user->type ?? ''));
        $appUrl = config('app.url', 'http://localhost');
        $parsedUrl = parse_url($appUrl);
        $host = request()->getHost() ?: ($parsedUrl['host'] ?? 'localhost');

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

        $scheme = request()->getScheme() ?: ($parsedUrl['scheme'] ?? 'https');
        $port = request()->getPort();
        $portString = ($port && !in_array($port, [80, 443])) ? ':' . $port : '';

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

        return "{$scheme}://{$subdomain}.{$rootDomain}{$portString}/dashboard";
    }
}
