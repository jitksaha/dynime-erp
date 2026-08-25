<?php

namespace Workdo\Hrm\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\User;
use Workdo\Hrm\Models\Employee;

class FlexibleShiftRequest extends Model
{
    use HasFactory;

    protected $table = 'flexible_shift_requests';

    protected $fillable = [
        'employee_id',
        'user_id',
        'status',
        'reason',
        'reviewed_by',
        'reviewed_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'reviewed_at' => 'datetime',
        ];
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
