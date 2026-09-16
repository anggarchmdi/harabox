<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CapacityOverride extends Model
{
    use HasFactory;

    protected $fillable = [
        'date',
        'max_capacity',
        'is_closed',
        'note',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
        'max_capacity' => 'integer',
        'is_closed' => 'boolean',
    ];
}
