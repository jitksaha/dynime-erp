<?php

namespace Workdo\ProductService\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ProductServiceTax extends Model
{
    use HasFactory;

    protected $fillable = [
        'tax_name',
        'rate',
        'tax_type',
        'creator_id',
        'created_by',
    ];
}
