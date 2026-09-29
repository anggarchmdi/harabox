<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'description',
        'package_items',
        'price',
        'minimum_order',
        'lead_time_days',
        'addons_enabled',
        'custom_nasi',
        'custom_sayur',
        'image',
        'is_active',
    ];

    protected $casts = [
        'package_items' => 'array',
        'price' => 'decimal:2',
        'minimum_order' => 'integer',
        'lead_time_days' => 'integer',
        'addons_enabled' => 'boolean',
        'custom_nasi' => 'array',
        'custom_sayur' => 'array',
        'is_active' => 'boolean',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function addonGroups(): BelongsToMany
    {
        return $this->belongsToMany(AddonGroup::class, 'product_addon_groups')
            ->withPivot('sort_order')
            ->orderByPivot('sort_order')
            ->withTimestamps();
    }
}
