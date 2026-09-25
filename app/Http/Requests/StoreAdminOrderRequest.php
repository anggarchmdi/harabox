<?php

namespace App\Http\Requests;

class StoreAdminOrderRequest extends StoreOrderRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'delivery_fee' => [
                'nullable',
                'numeric',
                'min:0',
            ],
            'status' => [
                'nullable',
                'string',
                'in:pending,confirmed,processing,completed,cancelled',
            ],
            'payment_status' => [
                'nullable',
                'string',
                'in:unpaid,dp,paid',
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
                'max:1000',
            ],
        ]);
    }
}
