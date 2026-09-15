<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOrderPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'payment_status' => [
                'required',
                Rule::in(['unpaid', 'dp', 'paid']),
            ],
            'paid_amount' => [
                'nullable',
                'numeric',
                'min:0',
            ],
            'payment_method' => [
                'nullable',
                'string',
                'max:50',
            ],
            'payment_note' => [
                'nullable',
                'string',
                'max:500',
            ],
            'paid_at' => [
                'nullable',
                'date',
            ],
        ];
    }
}
