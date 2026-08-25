<?php

namespace Workdo\Hrm\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEnterpriseShiftRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $shiftId = $this->route('shift')?->id ?? $this->input('id');
        $creatorId = function_exists('creatorId') ? creatorId() : 1;

        return [
            'shift_name' => 'required|string|max:255',
            'shift_code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('shifts', 'shift_code')->ignore($shiftId)->where(function ($query) use ($creatorId) {
                    return $query->where('created_by', $creatorId);
                })
            ],
            'shift_type' => 'required|string|in:fixed,flexible,rotational,split,on_call,weekend,night',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
            'country' => 'nullable|string|max:100',
            'region' => 'nullable|string|max:100',
            'timezone' => 'required|string|max:100',
            'start_time' => 'nullable|string',
            'end_time' => 'nullable|string',
            'required_working_hours' => 'nullable|numeric|min:0|max:24',
            'earliest_start_time' => 'nullable|string',
            'latest_start_time' => 'nullable|string',
            'latest_finish_time' => 'nullable|string',
            'on_call_standby_allowance' => 'nullable|numeric|min:0',
            'on_call_response_time_mins' => 'nullable|integer|min:0',
            
            // Rules
            'rules' => 'nullable|array',
            'rules.grace_period_mins' => 'nullable|integer|min:0',
            'rules.early_clock_in_mins' => 'nullable|integer|min:0',
            'rules.late_clock_out_mins' => 'nullable|integer|min:0',
            'rules.min_working_hours' => 'nullable|numeric|min:0|max:24',
            'rules.max_working_hours' => 'nullable|numeric|min:0|max:24',
            'rules.half_day_threshold_hours' => 'nullable|numeric|min:0|max:24',
            'rules.absent_threshold_hours' => 'nullable|numeric|min:0|max:24',
            'rules.auto_mark_late' => 'nullable|boolean',
            'rules.auto_mark_early_leave' => 'nullable|boolean',

            // Breaks
            'breaks' => 'nullable|array',
            'breaks.*.break_name' => 'required|string|max:100',
            'breaks.*.break_type' => 'required|string|in:paid,unpaid',
            'breaks.*.duration_mins' => 'required|integer|min:0',
            'breaks.*.start_time' => 'nullable|string',
            'breaks.*.end_time' => 'nullable|string',

            // Overtime
            'overtime' => 'nullable|array',
            'overtime.enable_ot' => 'nullable|boolean',
            'overtime.ot_starts_after_hours' => 'nullable|numeric|min:0|max:24',
            'overtime.max_ot_hours' => 'nullable|numeric|min:0|max:24',
            'overtime.approval_required' => 'nullable|boolean',
            'overtime.ot_multiplier' => 'nullable|numeric|min:1|max:5',

            // Assignments
            'assignments' => 'nullable|array',
            'assignments.assignee_type' => 'nullable|string|in:employee,department,team,role,country',
            'assignments.assignee_ids' => 'nullable|array',
        ];
    }
}
