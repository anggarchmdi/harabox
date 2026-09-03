<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_code',
        'customers_name',
        'customers_phone',
        'event_date',
        'event_time',
        'delivery_address',
        'notes',
        'subtotal',
        'delivery_fee',
        'total',
        'status',
    ];

    protected $casts = [
        'event_date' => 'date',
        'subtotal' => 'decimal:2',
        'delivery_fee' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function addons(): HasMany
    {
        return $this->hasMany(OrderAddon::class);
    }
}
