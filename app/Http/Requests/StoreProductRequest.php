<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('addons') && is_string($this->addons)) {
            $decoded = json_decode($this->addons, true);
            if (is_array($decoded)) {
                $this->merge(['addons' => $decoded]);
            }
        }
    }

    public function rules(): array
    {
        return [
            'addons' => [
                'nullable',
                'array',
            ],
            'category_id' => [
                'required',
                'integer',
                'exists:categories,id',
            ],

            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'slug' => [
                'string',
                'max:255',
                'unique:products,slug',
            ],

            'description' => [
                'nullable',
                'string',
            ],

            'price' => [
                'required',
                'numeric',
                'min:0',
            ],

            'minimum_order' => [
                'required',
                'integer',
                'min:1',
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
