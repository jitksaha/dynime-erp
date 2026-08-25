<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CheckMaintenanceMode
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        // Fetch global settings
        $settings = getCompanyAllSetting();
        $isMaintenanceOn = ($settings['maintenance_mode'] ?? 'off') === 'on';

        if (!$isMaintenanceOn) {
            return $next($request);
        }

        // Whitelisted routes/patterns that must always remain accessible
        if (
            $request->is('bypass-maintenance/*') ||
            $request->is('login') ||
            $request->is('logout') ||
            $request->is('build/*') ||
            $request->is('assets/*') ||
            $request->is('storage/*') ||
            $request->is('up')
        ) {
            return $next($request);
        }

        // 1. Owner / Superadmin / Company (Creator) Always Has Full Access
        if (Auth::check()) {
            $user = Auth::user();
            if (
                $user->type === 'superadmin' || 
                $user->type === 'company' || 
                (method_exists($user, 'hasRole') && ($user->hasRole('superadmin') || $user->hasRole('company')))
            ) {
                return $next($request);
            }
        }

        // 2. Secret Bypass Token Cookie or Query Access
        $secretToken = $settings['maintenance_secret_token'] ?? '';
        $cookieToken = $request->cookie('maintenance_bypass_token');
        $queryToken = $request->query('bypass_token');

        if (!empty($secretToken) && ($cookieToken === $secretToken || $queryToken === $secretToken)) {
            return $next($request);
        }

        // Otherwise block non-owners & render Maintenance Screen
        $title = $settings['maintenance_title'] ?? 'System Under Maintenance';
        $message = $settings['maintenance_message'] ?? 'We are currently conducting scheduled system maintenance. Public access is temporarily paused. Owner login and special bypass link holders can continue.';

        return response()->view('maintenance', [
            'title' => $title,
            'message' => $message,
            'settings' => $settings,
        ], 503);
    }
}
