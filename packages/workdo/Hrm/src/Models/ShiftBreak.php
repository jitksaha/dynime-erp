<?php

namespace Workdo\Hrm\Models;

use Illuminate\Database\Eloquent\Model;

class ShiftBreak extends Model
{
    protected $fillable = [
        'shift_id',
        'break_name',
        'break_type',
        'start_time',
        'end_time',
        'duration_mins',
    ];

    protected $casts = [
        'duration_mins' => 'integer',
    ];

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }
}
