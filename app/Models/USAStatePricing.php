<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class USAStatePricing extends Model
{
    use HasFactory;

    protected $table = 'usa_state_pricings';

    protected $fillable = [
        'state',
        'abbr',
        'llc_formation',
        'corp_formation',
        'llc_annual',
        'llc_annual_label',
        'corp_annual',
        'corp_annual_label',
        'llc_renewal',
        'corp_renewal',
        'state_tax_note',
        'franchise_tax',
        'notes',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'llc_formation' => 'decimal:2',
        'corp_formation' => 'decimal:2',
        'llc_annual' => 'decimal:2',
        'corp_annual' => 'decimal:2',
        'llc_renewal' => 'decimal:2',
        'corp_renewal' => 'decimal:2',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];
}
