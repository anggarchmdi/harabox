<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderPaymentProof extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'payment_type',
        'drive_file_id',
        'drive_file_name',
        'drive_file_url',
        'drive_web_view_link',
        'uploaded_at',
    ];

    protected $casts = [
        'uploaded_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
