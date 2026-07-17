<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $typeRule = auth()->user()->type === 'superadmin' ? 'nullable' : 'required|exists:roles,id';
        
        $rules = [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'mobile_no' => 'nullable|string|regex:/^\+\d{1,3}\d{9,13}$/',
            'password' => 'required|confirmed|min:6',
            'type' => $typeRule,
            'is_enable_login' => 'boolean',
            'avatar' => 'nullable',
        ];

        if ($this->hasFile('avatar')) {
            $rules['avatar'] = 'nullable|image|mimes:jpeg,png,jpg|max:2048';
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'type.required' => __('Role is required.'),
        ];
    }
}
