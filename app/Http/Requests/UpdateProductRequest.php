<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('custom_nasi') && is_string($this->custom_nasi)) {
            $decoded = json_decode($this->custom_nasi, true);
            if (is_array($decoded)) {
                $this->merge(['custom_nasi' => $decoded]);
            }
        }

        if ($this->has('custom_sayur') && is_string($this->custom_sayur)) {
            $decoded = json_decode($this->custom_sayur, true);
            if (is_array($decoded)) {
                $this->merge(['custom_sayur' => $decoded]);
            }
        }

        if ($this->has('addons') && is_string($this->addons)) {
            $decoded = json_decode($this->addons, true);
            if (is_array($decoded)) {
                $this->merge(['addons' => $decoded]);
            }
        }
    }

    public function rules(): array
    {
        $product = $this->route('product');

        return [
            'custom_nasi' => [
                'nullable',
                'array',
            ],
            'custom_sayur' => [
                'nullable',
                'array',
            ],
            'addons' => [
                'nullable',
                'array',
            ],
            'category_id' => [
                'sometimes',
                'integer',
                'exists:categories,id',
            ],

            'name' => [
                'sometimes',
                'string',
                'max:255',
            ],

            'slug' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('products', 'slug')->ignore($product),
            ],

            'description' => [
                'nullable',
                'string',
            ],

            'price' => [
                'sometimes',
                'numeric',
                'min:0',
            ],

            'minimum_order' => [
                'sometimes',
                'integer',
                'min:1',
            ],

            'lead_time_days' => [
                'sometimes',
                'integer',
                'min:0',
                'max:60',
            ],

            'image' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
            ],

            'is_active' => [
                'sometimes',
                'boolean',
            ],

            'addons_enabled' => [
                'sometimes',
                'boolean',
            ],

            'addon_group_ids' => [
                'nullable',
                'array',
            ],

            'addon_group_ids.*' => [
                'integer',
                'exists:addon_groups,id',
            ],
        ];
    }
}
