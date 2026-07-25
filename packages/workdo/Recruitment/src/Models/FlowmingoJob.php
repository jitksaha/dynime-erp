<?php

namespace Workdo\Recruitment\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class FlowmingoJob extends Model
{
    use HasFactory;

    protected $table = 'flowmingo_jobs';

    protected $fillable = [
        'created_by',
        'workspace',
        'flowmingo_job_id',
        'slug',
        'title',
        'department',
        'employment_type',
        'location',
        'salary_min',
        'salary_max',
        'salary_currency',
        'salary_period',
        'salary_range',
        'description',
        'responsibilities',
        'requirements',
        'benefits',
        'experience',
        'remote',
        'featured',
        'status',
        'apply_url',
        'published_at',
    ];

    protected $casts = [
        'responsibilities' => 'array',
        'requirements' => 'array',
        'benefits' => 'array',
        'remote' => 'boolean',
        'featured' => 'boolean',
        'salary_min' => 'float',
        'salary_max' => 'float',
        'published_at' => 'datetime',
    ];
}
