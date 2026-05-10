<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'mentee_name'            => 'required|string|max:255',
            'investment'             => 'required|numeric|min:0',
            'monthly_return'         => 'required|numeric|min:0',
            'success_prob'           => 'required|integer|min:1|max:100',
            'risk_factors'           => 'required|array',
            'risk_factors.market'    => 'required|integer|min:1|max:5',
            'risk_factors.team'      => 'required|integer|min:1|max:5',
            'risk_factors.technical' => 'required|integer|min:1|max:5',
            'risk_factors.external'  => 'required|integer|min:1|max:5',
            'stats'                  => 'required|array',
            'ai_analysis'            => 'nullable|string',
        ];
    }
}
