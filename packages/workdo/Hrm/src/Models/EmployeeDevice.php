<?php

namespace Workdo\Hrm\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class EmployeeDevice extends Model
{
    use HasFactory;

    protected $table = 'employee_devices';

    protected $fillable = [
        'employee_id',
        'device_ownership',
        'device_category',
        'purchase_month_year',
        'device_name',
        'brand',
        'model',
        'serial_number',
        'imei',
        'mobile_number',
        'operating_system',
        'os_version',
        'notes',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
