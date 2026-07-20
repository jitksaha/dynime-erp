<?php

namespace Workdo\Bkash\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BkashSettingsController extends Controller
{
    public function updateSettings(Request $request)
    {
        if (Auth::user()->can('edit-system-settings')) {
            $request->validate([
                'bkash_enabled' => 'nullable|string',
                'bkash_sandbox' => 'nullable|string',
                'bkash_app_key' => 'nullable|string',
                'bkash_app_secret' => 'nullable|string',
                'bkash_username' => 'nullable|string',
                'bkash_password' => 'nullable|string',
                'bkash_test_app_key' => 'nullable|string',
                'bkash_test_app_secret' => 'nullable|string',
                'bkash_test_username' => 'nullable|string',
                'bkash_test_password' => 'nullable|string',
            ]);

            $post = [
                'bkash_enabled' => $request->bkash_enabled === 'on' ? 'on' : 'off',
                'bkash_sandbox' => $request->bkash_sandbox === 'on' ? 'on' : 'off',
                'bkash_app_key' => $request->bkash_app_key ?? '',
                'bkash_app_secret' => $request->bkash_app_secret ?? '',
                'bkash_username' => $request->bkash_username ?? '',
                'bkash_password' => $request->bkash_password ?? '',
                'bkash_test_app_key' => $request->bkash_test_app_key ?? '',
                'bkash_test_app_secret' => $request->bkash_test_app_secret ?? '',
                'bkash_test_username' => $request->bkash_test_username ?? '',
                'bkash_test_password' => $request->bkash_test_password ?? '',
            ];

            foreach ($post as $key => $data) {
                setSetting($key, $data);
            }

            return redirect()->back()->with('success', __('bKash settings updated successfully.'));
        }

        return redirect()->back()->with('error', __('Permission denied.'));
    }
}
