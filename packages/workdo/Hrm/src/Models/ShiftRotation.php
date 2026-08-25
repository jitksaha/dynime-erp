<?php

namespace Workdo\Hrm\Models;

use Illuminate\Database\Eloquent\Model;

class ShiftRotation extends Model
{
    protected $fillable = [
        'shift_id',
        'rotation_type',
        'sequence_pattern',
        'cycle_days',
    ];

    protected $casts = [
        'sequence_pattern' => 'array',
        'cycle_days' => 'integer',
    ];

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }
}
