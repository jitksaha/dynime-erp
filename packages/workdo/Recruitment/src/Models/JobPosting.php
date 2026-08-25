<?php

namespace Workdo\Recruitment\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Crypt;
use Workdo\Hrm\Models\Department;
use Workdo\Recruitment\Models\JobType;
use Workdo\Recruitment\Models\JobLocation;

class JobPosting extends Model
{
    use HasFactory;

    protected $table = 'job_postings';

    protected $fillable = [
        'code',
        'posting_code',
        'title',
        'slug',
        'position',
        'priority',
        'min_experience',
        'max_experience',
        'min_salary',
        'max_salary',
        'salary_rate',
        'description',
        'requirements',
        'skills',
        'benefits',
        'terms_condition',
        'show_terms_condition',
        'application_deadline',
        'is_published',
        'is_hiring',
        'publish_date',
        'is_featured',
        'status',
        'job_application',
        'posting_source',
        'application_url',
        'applicant',
        'visibility',
        'branch_id',
        'department_id',
        'designation_id',
        'job_type_id',
        'location_id',
        'custom_questions',
        'creator_id',
        'created_by',
    ];

    public static function generatePostingCode($user_id = null)
    {
        $user_id = $user_id ?? creatorId();
        $prefix = 'JP';
        $currentYear = date('Y');

        $lastPosting = self::where('created_by', $user_id)
            ->where('posting_code', 'LIKE', $prefix . $user_id . $currentYear . '%')
            ->orderBy('id', 'desc')
            ->first();

        if ($lastPosting) {
            $lastNumber = (int) substr($lastPosting->posting_code, strlen($prefix . $user_id . $currentYear));
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return $prefix . $user_id . $currentYear . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($posting) {
            if (empty($posting->posting_code)) {
                $posting->posting_code = static::generatePostingCode($posting->created_by);
            }
        });
    }

    protected function casts(): array
    {
        return [
            'min_salary' => 'decimal:2',
            'max_salary' => 'decimal:2',
            'is_published' => 'boolean',
            'is_hiring' => 'boolean',
            'is_featured' => 'boolean',
            'show_terms_condition' => 'boolean',
            'status' => 'string',
            'custom_questions' => 'array',
            'applicant' => 'array',
            'visibility' => 'array'
        ];
    }

    // Accessor for consistent relationship display
    public function getNameAttribute()
    {
        return $this->title;
    }

    public function jobType()
    {
        return $this->belongsTo(JobType::class);
    }

    public function location()
    {
        return $this->belongsTo(JobLocation::class);
    }

    public function department()
    {
        return $this->belongsTo(\Workdo\Hrm\Models\Department::class, 'department_id');
    }

    public function designation()
    {
        return $this->belongsTo(\Workdo\Hrm\Models\Designation::class, 'designation_id');
    }

    public function getSlugAttribute()
    {
        $baseSlug = \Illuminate\Support\Str::slug($this->title);
        return $baseSlug ? $baseSlug : "job-{$this->id}";
    }

    public function getSeoUrlAttribute()
    {
        return $this->slug;
    }

    public static function findBySlugOrId($slugOrId)
    {
        if (!$slugOrId) return null;

        // Try direct ID match first if numeric
        if (is_numeric($slugOrId)) {
            $job = static::find($slugOrId);
            if ($job) return $job;
        }

        // Try encrypted ID
        $job = static::findByEncryptedId($slugOrId);
        if ($job) return $job;

        // Match title slug or posting_code
        $all = static::all();
        foreach ($all as $item) {
            $itemSlug = \Illuminate\Support\Str::slug($item->title);
            if ($itemSlug === $slugOrId || $item->posting_code === $slugOrId || "{$itemSlug}-{$item->id}" === $slugOrId) {
                return $item;
            }
        }

        // Fallback match trailing ID if slug format like "some-job-title-2"
        if (preg_match('/-(\d+)$/', $slugOrId, $matches)) {
            return static::find($matches[1]);
        }

        return null;
    }

    public function getEncryptedIdAttribute()
    {
        return Crypt::encryptString($this->id);
    }

    public static function findByEncryptedId($encryptedId)
    {
        try {
            $id = Crypt::decryptString($encryptedId);
            return static::find($id);
        } catch (\Exception $e) {
            return null;
        }
    }
}
