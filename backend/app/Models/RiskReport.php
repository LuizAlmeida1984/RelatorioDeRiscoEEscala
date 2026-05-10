<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RiskReport extends Model
{
    protected $fillable = [
        'mentee_name',
        'investment',
        'monthly_return',
        'success_prob',
        'risk_factors',
        'stats',
        'ai_analysis',
    ];

    protected $casts = [
        'investment'    => 'float',
        'monthly_return' => 'float',
        'success_prob'  => 'integer',
        'risk_factors'  => 'array',
        'stats'         => 'array',
    ];
}
