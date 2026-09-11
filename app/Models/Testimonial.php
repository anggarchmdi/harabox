<?php

namespace App\Models;

use Database\Factories\TestimonialFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Testimonial extends Model
{
    /** @use HasFactory<TestimonialFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'institution',
        'rating',
        'order_quantity',
        'message',
        'is_displayed',
        'order_code',
    ];

    protected $casts = [
        'rating' => 'integer',
        'is_displayed' => 'boolean',
    ];

    /**
     * Scope a query to only include displayed testimonials.
     */
    public function scopeDisplayed($query)
    {
        return $query->where('is_displayed', true);
    }
}
