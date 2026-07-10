<?php

namespace Workdo\Hrm\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class IssuedDocument extends Model
{
    use HasFactory;

    protected $table = 'issued_documents';

    protected $fillable = [
        'employee_id',
        'document_type',
        'payload',
        'issued_date',
        'created_by'
    ];

    protected $casts = [
        'payload' => 'array',
        'issued_date' => 'date'
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }
}
