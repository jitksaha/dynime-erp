<?php

namespace Workdo\Hrm\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\User;

class EmployeeShiftHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'shift_id',
        'shift_version',
        'effective_from',
        'effective_to',
        'notes',
        'assigned_by',
        'created_by',
    ];

    protected $casts = [
        'shift_version' => 'integer',
        'effective_from' => 'date',
        'effective_to' => 'date',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }

    public function assignedBy()
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }
}
