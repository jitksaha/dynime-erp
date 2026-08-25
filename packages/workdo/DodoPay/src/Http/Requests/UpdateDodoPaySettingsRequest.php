<?php

namespace Workdo\DodoPay\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDodoPaySettingsRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'settings.dodopay_enabled' => 'required|string|in:on,off',
            'settings.dodopay_api_key' => 'required_if:settings.dodopay_enabled,on|nullable|string|max:255',
            'settings.dodopay_product_id' => 'nullable|string|max:255',
            'settings.dodopay_mode' => 'required_if:settings.dodopay_enabled,on|nullable|string|in:test,live',
            'settings.dodopay_display_name' => 'nullable|string|max:255',
            'settings.dodopay_description' => 'nullable|string|max:500',
            'settings.dodopay_badge' => 'nullable|string|max:100',
        ];
    }

    public function messages()
    {
        return [
            'settings.dodopay_api_key.required_if' => __('DodoPay API Key is required.'),
            'settings.dodopay_mode.required_if' => __('DodoPay mode is required.'),
            'settings.dodopay_enabled.in' => __('Invalid status value.'),
            'settings.dodopay_mode.in' => __('DodoPay mode must be either test or live.'),
        ];
    }
}
