<?php

namespace Workdo\SSLCommerz\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SSLCommerzSettingsController extends Controller
{
    public function updateSettings(Request $request)
    {
        if (Auth::user()->can('edit-system-settings')) {
            $request->validate([
                'sslcommerz_enabled' => 'nullable|string',
                'sslcommerz_sandbox' => 'nullable|string',
                'sslcommerz_store_id' => 'nullable|string',
                'sslcommerz_store_password' => 'nullable|string',
                'sslcommerz_test_store_id' => 'nullable|string',
                'sslcommerz_test_store_password' => 'nullable|string',
            ]);

            $post = [
                'sslcommerz_enabled' => $request->sslcommerz_enabled === 'on' ? 'on' : 'off',
                'sslcommerz_sandbox' => $request->sslcommerz_sandbox === 'on' ? 'on' : 'off',
                'sslcommerz_store_id' => $request->sslcommerz_store_id ?? '',
                'sslcommerz_store_password' => $request->sslcommerz_store_password ?? '',
                'sslcommerz_test_store_id' => $request->sslcommerz_test_store_id ?? '',
                'sslcommerz_test_store_password' => $request->sslcommerz_test_store_password ?? '',
            ];

            foreach ($post as $key => $data) {
                setSetting($key, $data);
            }

            return redirect()->back()->with('success', __('SSLCommerz settings updated successfully.'));
        }

        return redirect()->back()->with('error', __('Permission denied.'));
    }
}
