<?php

namespace Workdo\Keeal\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class KeealSettingsController extends Controller
{
    public function updateKeealSettings(Request $request)
    {
        if (Auth::user()->can('edit-system-settings')) {
            $request->validate([
                'keeal_enabled' => 'nullable|string',
                'keeal_mode' => 'nullable|string',
                'keeal_secret_key' => 'nullable|string',
                'keeal_test_secret_key' => 'nullable|string',
                'keeal_webhook_secret' => 'nullable|string',
                'keeal_currency' => 'nullable|string',
            ]);

            $post = [
                'keeal_enabled' => $request->keeal_enabled === 'on' ? 'on' : 'off',
                'keeal_mode' => $request->keeal_mode ?? 'sandbox',
                'keeal_secret_key' => $request->keeal_secret_key ?? '',
                'keeal_test_secret_key' => $request->keeal_test_secret_key ?? '',
                'keeal_webhook_secret' => $request->keeal_webhook_secret ?? '',
                'keeal_currency' => $request->keeal_currency ?? 'USD',
            ];

            foreach ($post as $key => $data) {
                setSetting($key, $data);
            }

            return redirect()->back()->with('success', __('Keeal settings updated successfully.'));
        }

        return redirect()->back()->with('error', __('Permission denied.'));
    }
}
