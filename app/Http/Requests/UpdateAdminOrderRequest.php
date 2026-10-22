<?php

namespace App\Http\Requests;

class UpdateAdminOrderRequest extends StoreAdminOrderRequest
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
        $rules = parent::rules();

        // Admin can update an order without being blocked by after_or_equal:today (e.g. today's event or retroactive admin edit)
        $rules['event_date'] = [
            'required',
            'date',
        ];

        $rules['force'] = [
            'nullable',
            'boolean',
        ];

        return $rules;
    }
}
