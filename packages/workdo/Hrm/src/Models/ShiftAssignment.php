<?php

namespace Workdo\Hrm\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class ShiftAssignment extends Model
{
    protected $fillable = [
        'shift_id',
        'assignee_type',
        'assignee_id',
        'effective_from',
        'effective_to',
        'created_by',
    ];

    protected $casts = [
        'effective_from' => 'date',
        'effective_to' => 'date',
    ];

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
