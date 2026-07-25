<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;

class InvitationCode extends Model
{
    use HasFactory;

    protected $table = 'invitation_codes';

    protected $fillable = [
        'code',
        'role',
        'is_used',
        'used_by_email',
        'created_by',
    ];

    protected $casts = [
        'is_used' => 'boolean',
    ];

    /**
     * Generate a new unique 6-character short invitation code for a role.
     */
    public static function generateCode(string $role, ?int $createdBy = null): self
    {
        $prefix = strtoupper(substr($role, 0, 3));
        $uniqueNum = rand(1000, 9999);
        $code = "{$prefix}-{$uniqueNum}";

        // Ensure uniqueness
        while (self::where('code', $code)->exists()) {
            $uniqueNum = rand(1000, 9999);
            $code = "{$prefix}-{$uniqueNum}";
        }

        return self::create([
            'code' => $code,
            'role' => strtolower($role),
            'is_used' => false,
            'created_by' => $createdBy,
        ]);
    }
}
