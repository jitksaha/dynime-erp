<?php

namespace Workdo\Hrm\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\User;

class Shift extends Model
{
    use HasFactory;

    protected $fillable = [
        'shift_name',
        'shift_code',
        'shift_type',
        'description',
        'is_active',
        'country',
        'region',
        'timezone',
        'start_time',
        'end_time',
        'break_start_time',
        'break_end_time',
        'is_night_shift',
        'is_cross_midnight',
        'total_shift_hours',
        'net_working_hours',
        'required_working_hours',
        'earliest_start_time',
        'latest_start_time',
        'latest_finish_time',
        'split_segments',
        'on_call_standby_allowance',
        'on_call_response_time_mins',
        'master_country_shift_id',
        'source_type',
        'version',
        'effective_from',
        'has_update_available',
        'latest_master_version',
        'creator_id',
        'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_night_shift' => 'boolean',
        'is_cross_midnight' => 'boolean',
        'total_shift_hours' => 'float',
        'net_working_hours' => 'float',
        'required_working_hours' => 'float',
        'on_call_standby_allowance' => 'float',
        'on_call_response_time_mins' => 'integer',
        'version' => 'integer',
        'latest_master_version' => 'integer',
        'has_update_available' => 'boolean',
        'effective_from' => 'date',
        'split_segments' => 'array',
        'creator_id' => 'integer',
        'created_by' => 'integer',
    ];

    public function masterCountryShift()
    {
        return $this->belongsTo(MasterCountryShift::class, 'master_country_shift_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function rules()
    {
        return $this->hasOne(ShiftRule::class);
    }

    public function breaks()
    {
        return $this->hasMany(ShiftBreak::class);
    }

    public function assignments()
    {
        return $this->hasMany(ShiftAssignment::class);
    }

    public function overtimeRule()
    {
        return $this->hasOne(OvertimeRule::class);
    }

    public function rotation()
    {
        return $this->hasOne(ShiftRotation::class);
    }

    /**
     * Get count of employees assigned directly, via employee profile, or via department
     */
    public function getAssignedEmployeesCountAttribute(): int
    {
        $creatorId = creatorId();
        $employeeIds = [];

        // Direct assignments from shift_assignments table
        $directAssignments = $this->assignments()->where('assignee_type', 'employee')->pluck('assignee_id')->toArray();
        $employeeIds = array_merge($employeeIds, $directAssignments);

        // Employees assigned via employee.shift column
        $tableEmpIds = Employee::where('created_by', $creatorId)
            ->where('shift', $this->id)
            ->pluck('id')
            ->toArray();
        $employeeIds = array_merge($employeeIds, $tableEmpIds);

        // Department assignments
        $deptAssignments = $this->assignments()->where('assignee_type', 'department')->pluck('assignee_id')->toArray();
        if (!empty($deptAssignments)) {
            $deptEmpIds = Employee::where('created_by', $creatorId)
                ->whereIn('department_id', $deptAssignments)
                ->pluck('id')
                ->toArray();
            $employeeIds = array_merge($employeeIds, $deptEmpIds);
        }

        return count(array_unique(array_filter($employeeIds)));
    }
}