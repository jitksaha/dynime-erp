<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('user')->id;

        $rules = [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $userId,
            'mobile_no' => 'nullable|string|regex:/^\+\d{1,3}\d{9,13}$/',
            'is_enable_login' => 'boolean',
            'avatar' => 'nullable',
        ];

        if ($this->hasFile('avatar')) {
            $rules['avatar'] = 'nullable|image|mimes:jpeg,png,jpg|max:2048';
        }

        return $rules;
    }
}