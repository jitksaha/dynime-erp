<?php

namespace Workdo\Hrm\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayrollChangeRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'requested_payment_method',
        'requested_payment_details',
        'status',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'requested_payment_details' => 'array',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }
}
