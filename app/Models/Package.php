<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;


class Package extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'price',
        'minimum_order',
        'image',
        'is_active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'minimum_order' => 'integer',
        'is_active' =>'boolean',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(PackageItem::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}


