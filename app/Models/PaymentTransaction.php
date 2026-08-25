<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentTransaction extends Model
{
    protected $fillable = [
        'transaction_id',
        'invoice_id',
        'customer_id',
        'gateway_id',
        'gateway_transaction_id',
        'checkout_session_id',
        'amount',
        'currency',
        'status',
        'payment_method',
        'failure_reason',
        'metadata',
        'completed_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'metadata' => 'array',
        'completed_at' => 'datetime',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(SalesInvoice::class, 'invoice_id');
    }

    public function isSucceeded(): bool
    {
        return $this->status === 'SUCCEEDED';
    }

    public function markAsSucceeded(?string $gatewayTxId = null, ?array $meta = null): void
    {
        $this->status = 'SUCCEEDED';
        if ($gatewayTxId) {
            $this->gateway_transaction_id = $gatewayTxId;
        }
        if ($meta) {
            $this->metadata = array_merge($this->metadata ?? [], $meta);
        }
        $this->completed_at = now();
        $this->save();
    }

    public function markAsFailed(string $reason, ?array $meta = null): void
    {
        $this->status = 'FAILED';
        $this->failure_reason = $reason;
        if ($meta) {
            $this->metadata = array_merge($this->metadata ?? [], $meta);
        }
        $this->save();
    }
}
