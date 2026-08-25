<?php

namespace Workdo\Hrm\Models;

use Illuminate\Database\Eloquent\Model;

class ShiftRule extends Model
{
    protected $fillable = [
        'shift_id',
        'grace_period_mins',
        'early_clock_in_mins',
        'late_clock_out_mins',
        'min_working_hours',
        'max_working_hours',
        'half_day_threshold_hours',
        'absent_threshold_hours',
        'auto_mark_late',
        'auto_mark_early_leave',
    ];

    protected $casts = [
        'grace_period_mins' => 'integer',
        'early_clock_in_mins' => 'integer',
        'late_clock_out_mins' => 'integer',
        'min_working_hours' => 'float',
        'max_working_hours' => 'float',
        'half_day_threshold_hours' => 'float',
        'absent_threshold_hours' => 'float',
        'auto_mark_late' => 'boolean',
        'auto_mark_early_leave' => 'boolean',
    ];

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }
}
