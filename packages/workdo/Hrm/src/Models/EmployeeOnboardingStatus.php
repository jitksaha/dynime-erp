<?php

namespace Workdo\Hrm\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class EmployeeOnboardingStatus extends Model
{
    use HasFactory;

    protected $table = 'employee_onboarding_statuses';

    protected $fillable = [
        'employee_id',
        'completion_percentage',
        'status',
        'completed_sections',
        'last_updated_at',
        'completed_at',
    ];

    protected $casts = [
        'completed_sections' => 'array',
        'last_updated_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
