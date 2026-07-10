<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ServicePricing extends Model
{
    use HasFactory;

    protected $table = 'service_pricings';

    protected $fillable = [
        'service_slug',
        'service_title',
        'is_enabled',
        'tiers',
        'quote_settings',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'tiers' => 'array',
        'quote_settings' => 'array',
    ];
}
