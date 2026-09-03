<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customers_name' => [
                'required',
                'string',
                'max:255',
            ],

            'customers_phone' => [
                'required',
                'string',
                'max:20',
                'regex:/^[0-9+\-\s]+$/'
            ],

            'event_date' => [
                'required',
                'date',
                'after_or_equal:today',
            ],

            'event_time' => [
                'nullable',
                'date_format:H:i',
            ],

            'delivery_address' => [
                'required',
                'string',
            ],

            'notes' => [
                'nullable',
                'string',
            ],

            // 'delivery_fee' => [
            //     'nullable',
            //     'numeric',
            //     'min:0',
            // ],

            'items' => [
                'required',
                'array',
                'min:1',
            ],

            'items.*.package_id' => [
                'required',
                'integer',
                'distinct',
            ],

            'items.*.quantity' => [
                'required',
                'integer',
                'min:1',
            ],

            'addons' => [
                'nullable',
                'array',
            ],

            'addons.*.addon_id' => [
                'required',
                'integer',
                'distinct',
                'exists:addons,id',
            ],

            'addons.*.quantity' => [
                'required',
                'integer',
                'min:1',
            ],
        ];
    }
}
