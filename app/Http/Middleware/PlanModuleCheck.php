<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\Response;

class PlanModuleCheck
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next,$moduleName = null): Response
    {
        $user = Auth::user();
        if (!$user) {
            return $next($request);
        }

        // Skip check for superadmin
        if ($user->hasRole('superadmin')) {
            return $next($request);
        } elseif ($user->hasRole('company')) {
            // Plan checks disabled for internal ERP setup
        } else {
            // Sub-user plan checks disabled for internal ERP setup
        }

        if($moduleName != null)
        {
            $moduleName =  explode('-',$moduleName);
            $status = false;
            foreach($moduleName as $m)
            {
                $status = module_is_active($m);
                if($status == true)
                {
                    $response = $next($request);
                    return $response;
                }
            }
            return redirect()->route('dashboard')->with('error', __('Permission denied '));
        }

        $response = $next($request);
        return $response;
    }
}
