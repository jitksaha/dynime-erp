<?php

namespace Workdo\Hrm\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class MasterCountryShift extends Model
{
    use HasFactory;

    protected $fillable = [
        'country_name',
        'iso_code',
        'working_days',
        'office_start_time',
        'office_end_time',
        'break_duration_mins',
        'weekly_working_hours',
        'primary_timezone',
        'available_timezones',
        'dst_supported',
        'effective_date',
        'version',
    ];

    protected $casts = [
        'working_days' => 'array',
        'available_timezones' => 'array',
        'dst_supported' => 'boolean',
        'weekly_working_hours' => 'float',
        'break_duration_mins' => 'integer',
        'version' => 'integer',
    ];
}
