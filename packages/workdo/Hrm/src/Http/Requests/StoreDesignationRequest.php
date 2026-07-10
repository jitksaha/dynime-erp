<?php

namespace Workdo\Hrm\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDesignationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'designation_name' => 'required|max:100',
            'branch_id' => 'required|array',
            'branch_id.*' => 'exists:branches,id',
            'department_id' => 'required|array',
            'department_id.*' => 'exists:departments,id'
        ];
    }
}