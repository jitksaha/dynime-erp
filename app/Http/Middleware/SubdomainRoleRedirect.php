<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Services\PortalRedirectService;
use Symfony\Component\HttpFoundation\Response;

class SubdomainRoleRedirect
{
    /**
     * Handle an incoming request to ensure user is on the correct subdomain for their role.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (env('ENABLE_SUBDOMAIN_ROUTING', true) && Auth::check()) {
            $user = Auth::user();
            $targetUrl = PortalRedirectService::getTargetUrlForUser($user);
            $targetHost = parse_url($targetUrl, PHP_URL_HOST);
            $currentHost = $request->getHost();

            // Enforce subdomain routing when on live subdomains (not localhost/127.0.0.1)
            if (
                $targetHost &&
                $currentHost &&
                $targetHost !== 'localhost' &&
                $targetHost !== '127.0.0.1' &&
                !str_ends_with($currentHost, '.test') &&
                $targetHost !== $currentHost
            ) {
                if ($request->header('X-Inertia')) {
                    return \Inertia\Inertia::location($targetUrl);
                }
                return redirect()->away($targetUrl);
            }
        }

        return $next($request);
    }
}
