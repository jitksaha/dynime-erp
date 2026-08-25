<?php

namespace Workdo\Hrm\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AttendanceScreenshot extends Model
{
    use HasFactory;

    protected $fillable = [
        'attendance_id',
        'employee_id',
        'image_path',
        'captured_at',
        'activity_percentage',
        'status',
    ];

    protected $casts = [
        'captured_at' => 'datetime',
    ];

    public function attendance()
    {
        return $this->belongsTo(Attendance::class, 'attendance_id');
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }
}
