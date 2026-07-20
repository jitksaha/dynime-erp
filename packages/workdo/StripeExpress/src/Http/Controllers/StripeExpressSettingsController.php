<?php

namespace Workdo\StripeExpress\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StripeExpressSettingsController extends Controller
{
    public function updateSettings(Request $request)
    {
        if (Auth::user()->can('edit-system-settings')) {
            $request->validate([
                'stripe_onsite_enabled' => 'nullable|string',
                'stripe_sandbox' => 'nullable|string',
                'stripe_publishable_key' => 'nullable|string',
                'stripe_secret_key' => 'nullable|string',
                'stripe_test_publishable_key' => 'nullable|string',
                'stripe_test_secret_key' => 'nullable|string',
            ]);

            $post = [
                'stripe_onsite_enabled' => $request->stripe_onsite_enabled === 'on' ? 'on' : 'off',
                'stripe_sandbox' => $request->stripe_sandbox === 'on' ? 'on' : 'off',
                'stripe_publishable_key' => $request->stripe_publishable_key ?? '',
                'stripe_secret_key' => $request->stripe_secret_key ?? '',
                'stripe_test_publishable_key' => $request->stripe_test_publishable_key ?? '',
                'stripe_test_secret_key' => $request->stripe_test_secret_key ?? '',
            ];

            foreach ($post as $key => $data) {
                setSetting($key, $data);
            }

            return redirect()->back()->with('success', __('Stripe Express settings updated successfully.'));
        }

        return redirect()->back()->with('error', __('Permission denied.'));
    }
}
