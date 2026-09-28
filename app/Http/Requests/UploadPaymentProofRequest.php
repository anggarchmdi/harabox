<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UploadPaymentProofRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'payment_type' => [
                'required',
                'string',
                Rule::in(['dp', 'pelunasan']),
            ],
            'file' => [
                'required',
                'file',
                'image',
                'mimes:jpeg,jpg,png,webp',
                'max:10240',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'payment_type.required' => 'Jenis pembayaran wajib dipilih.',
            'payment_type.in' => 'Jenis pembayaran harus berupa DP atau Pelunasan.',
            'file.required' => 'File bukti transfer wajib diunggah.',
            'file.image' => 'File harus berupa gambar.',
            'file.mimes' => 'Format gambar harus berupa JPG, JPEG, PNG, atau WebP.',
            'file.max' => 'Ukuran file gambar tidak boleh melebihi 10MB.',
        ];
    }
}
