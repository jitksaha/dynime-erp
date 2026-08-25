<?php

namespace Workdo\Hrm\Models;

use Illuminate\Database\Eloquent\Model;

class OvertimeRule extends Model
{
    protected $fillable = [
        'shift_id',
        'enable_ot',
        'ot_starts_after_hours',
        'max_ot_hours',
        'approval_required',
        'ot_multiplier',
    ];

    protected $casts = [
        'enable_ot' => 'boolean',
        'ot_starts_after_hours' => 'float',
        'max_ot_hours' => 'float',
        'approval_required' => 'boolean',
        'ot_multiplier' => 'float',
    ];

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }
}
