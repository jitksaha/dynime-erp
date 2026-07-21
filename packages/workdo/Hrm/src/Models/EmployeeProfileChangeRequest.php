<?php

namespace Workdo\Hrm\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class EmployeeProfileChangeRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'requested_changes',
        'status',
        'admin_notes',
        'reviewed_by',
        'reviewed_at',
        'created_by',
    ];

    protected $casts = [
        'requested_changes' => 'array',
        'reviewed_at'        => 'datetime',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
