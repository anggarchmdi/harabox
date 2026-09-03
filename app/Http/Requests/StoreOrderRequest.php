<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('items') && is_array($this->items)) {
            $items = array_map(function ($item) {
                if (is_array($item)) {
                    if (! isset($item['product_id']) && isset($item['package_id'])) {
                        $item['product_id'] = $item['package_id'];
                    }
                }

                return $item;
            }, $this->items);

            $this->merge(['items' => $items]);
        }
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
                'regex:/^[0-9+\-\s]+$/',
            ],

            'event_date' => [
                'required',
                'date',
                'after_or_equal:today',
            ],

            'event_time' => [
                'nullable',
                'string',
            ],

            'delivery_address' => [
                'required',
                'string',
            ],

            'notes' => [
                'nullable',
                'string',
            ],

            'items' => [
                'required',
                'array',
                'min:1',
            ],

            'items.*.product_id' => [
                'required',
                'integer',
                'exists:products,id',
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
