<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserRequest extends Model
{
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'company_id',
        'questions',
        'status',
    ];

    protected $casts = [
        'questions' => 'array',
    ];

    public function company()
    {
        return $this->belongsTo(User::class, 'company_id');
    }
}
