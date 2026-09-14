<?php

namespace App\Http\Requests;

use App\Models\Product;
use Carbon\Carbon;
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
                'max:10',
            ],

            'delivery_address' => [
                'required',
                'string',
                'max:1000',
            ],

            'notes' => [
                'nullable',
                'string',
                'max:1000',
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
                'max:10000',
            ],

            'items.*.addons' => [
                'nullable',
                'array',
            ],

            'items.*.addons.*.addon_id' => [
                'required',
                'integer',
                'distinct',
                'exists:addons,id',
            ],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($this->filled('event_date') && $this->has('items') && is_array($this->items)) {
                $productIds = collect($this->items)->pluck('product_id')->filter()->unique();
                if ($productIds->isNotEmpty()) {
                    $products = Product::whereIn('id', $productIds)->get(['id', 'name', 'lead_time_days']);
                    $maxLeadDays = (int) ($products->max('lead_time_days') ?? 0);

                    if ($maxLeadDays > 0) {
                        try {
                            $minAllowedDate = now()->startOfDay()->addDays($maxLeadDays);
                            $eventDate = Carbon::parse($this->event_date)->startOfDay();

                            if ($eventDate->lt($minAllowedDate)) {
                                $formattedMinDate = $minAllowedDate->format('d/m/Y');
                                $validator->errors()->add(
                                    'event_date',
                                    "Untuk menu yang dipilih, pemesanan minimal dilakukan H-{$maxLeadDays} sebelum acara (paling cepat tanggal {$formattedMinDate})."
                                );
                            }
                        } catch (\Exception $e) {
                            // Date parsing error will be handled by standard 'date' rule
                        }
                    }
                }
            }
        });
    }
}
