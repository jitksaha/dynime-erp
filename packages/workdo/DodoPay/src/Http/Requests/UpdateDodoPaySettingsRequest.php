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
            'settings.dodopay_product_id' => 'required_if:settings.dodopay_enabled,on|nullable|string|max:255',
            'settings.dodopay_mode' => 'required_if:settings.dodopay_enabled,on|nullable|string|in:test,live',
        ];
    }

    public function messages()
    {
        return [
            'settings.dodopay_api_key.required_if' => __('DodoPay API Key is required.'),
            'settings.dodopay_product_id.required_if' => __('DodoPay Product ID is required.'),
            'settings.dodopay_mode.required_if' => __('DodoPay mode is required.'),
            'settings.dodopay_enabled.in' => __('Invalid status value.'),
            'settings.dodopay_mode.in' => __('DodoPay mode must be either test or live.'),
        ];
    }
}
