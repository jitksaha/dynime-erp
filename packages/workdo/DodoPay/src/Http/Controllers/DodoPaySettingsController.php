<?php

namespace Workdo\DodoPay\Http\Controllers;

use App\Http\Controllers\Controller;
use Workdo\DodoPay\Http\Requests\UpdateDodoPaySettingsRequest;
use Illuminate\Support\Facades\Auth;

class DodoPaySettingsController extends Controller
{
    public function update(UpdateDodoPaySettingsRequest $request)
    {
        if (Auth::user()->can('edit-dodopay-settings')) {
            $validated = $request->validated();
            $settings = $validated['settings'];
            
            try {
                foreach ($settings as $key => $value) {
                    setSetting($key, $value, creatorId(), true);
                }
                if (isset($settings['dodopay_enabled'])) {
                    setSetting('dodopay_is_on', $settings['dodopay_enabled'], creatorId(), true);
                }

                \Illuminate\Support\Facades\Cache::forget('company_settings_' . creatorId());
                \Illuminate\Support\Facades\Cache::forget('company_settings_' . creatorId() . '_public');

                return redirect()->back()->with('success', __('DodoPay settings saved successfully.'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', __('Failed to update DodoPay settings: ') . $e->getMessage());
            }
        }
        return back()->with('error', __('Permission denied.'));
    }
}
