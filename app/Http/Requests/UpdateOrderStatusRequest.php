<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOrderStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('status')) {
            $status = strtolower((string) $this->status);
            $map = [
                'proses' => 'processing',
                'selesai' => 'completed',
                'canceled' => 'cancelled',
            ];
            if (isset($map[$status])) {
                $this->merge(['status' => $map[$status]]);
            }
        }
    }

    public function rules(): array
    {
        return [
            'status' => [
                'required',
                Rule::in([
                    'pending',
                    'confirmed',
                    'processing',
                    'completed',
                    'cancelled',
                ]),
            ],
        ];
    }
}
