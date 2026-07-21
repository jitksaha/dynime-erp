<?php

namespace Workdo\Hrm\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class EmployeeDocumentRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'document_type',
        'reason',
        'employee_signature',
        'status',
        'admin_notes',
        'generated_document_path',
        'approved_by',
        'approved_at',
        'created_by',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
