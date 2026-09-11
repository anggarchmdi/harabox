<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTestimonialRequest;
use App\Models\Testimonial;
use Illuminate\Http\JsonResponse;

class TestimonialController extends Controller
{
    /**
     * Display a listing of displayed testimonials for homepage.
     */
    public function index(): JsonResponse
    {
        $testimonials = Testimonial::query()
            ->displayed()
            ->latest()
            ->get([
                'id',
                'name',
                'institution',
                'rating',
                'order_quantity',
                'message',
                'order_code',
                'created_at',
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Testimonials retrieved successfully',
            'data' => $testimonials,
        ]);
    }

    /**
     * Store a newly created testimonial submitted by customer.
     */
    public function store(StoreTestimonialRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Ensure new submissions are displayed by default or use provided
        $data['is_displayed'] = $data['is_displayed'] ?? true;

        $testimonial = Testimonial::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Terima kasih! Ulasan Anda berhasil dikirim.',
            'data' => $testimonial,
        ], 201);
    }
}
