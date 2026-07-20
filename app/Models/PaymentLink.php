<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentLink extends Model
{
    use HasFactory;

    protected $fillable = [
        'link_code',
        'title',
        'description',
        'amount',
        'currency',
        'type',
        'billing_cycle',
        'customer_name',
        'customer_email',
        'status',
        'payments_count',
        'total_collected',
        'created_by',
    ];

    protected $casts = [
        'amount' => 'float',
        'total_collected' => 'float',
        'payments_count' => 'integer',
    ];
}
