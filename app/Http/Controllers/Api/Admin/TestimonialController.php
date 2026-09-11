<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTestimonialRequest;
use App\Models\Testimonial;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TestimonialController extends Controller
{
    /**
     * Display a listing of all testimonials for admin with filtering and stats.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Testimonial::query();

        // Search
        if ($request->filled('search')) {
            $search = $request->string('search')->trim();
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('institution', 'like', "%{$search}%")
                    ->orWhere('message', 'like', "%{$search}%")
                    ->orWhere('order_quantity', 'like', "%{$search}%")
                    ->orWhere('order_code', 'like', "%{$search}%");
            });
        }

        // Filter by display status
        if ($request->has('is_displayed') && $request->input('is_displayed') !== '') {
            $query->where('is_displayed', $request->boolean('is_displayed'));
        }

        // Filter by rating
        if ($request->filled('rating')) {
            $query->where('rating', $request->integer('rating'));
        }

        $perPage = min(max($request->integer('per_page', 15), 1), 50);

        $testimonials = $query->latest()->paginate($perPage)->withQueryString();

        // Calculate summary counts for admin dashboard tabs
        $summary = [
            'total' => Testimonial::count(),
            'displayed' => Testimonial::where('is_displayed', true)->count(),
            'hidden' => Testimonial::where('is_displayed', false)->count(),
            'average_rating' => round((float) (Testimonial::avg('rating') ?? 5), 1),
        ];

        return response()->json([
            'success' => true,
            'message' => 'Testimonials retrieved successfully',
            'data' => $testimonials,
            'summary' => $summary,
        ]);
    }

    /**
     * Store a newly created testimonial by admin.
     */
    public function store(StoreTestimonialRequest $request): JsonResponse
    {
        $data = $request->validated();
        $testimonial = Testimonial::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Testimoni berhasil ditambahkan',
            'data' => $testimonial,
        ], 201);
    }

    /**
     * Toggle the displayed status of the testimonial.
     */
    public function toggle(Testimonial $testimonial): JsonResponse
    {
        $testimonial->is_displayed = ! $testimonial->is_displayed;
        $testimonial->save();

        $statusText = $testimonial->is_displayed ? 'ditampilkan di homepage' : 'disembunyikan dari homepage';

        return response()->json([
            'success' => true,
            'message' => "Testimoni berhasil {$statusText}",
            'data' => $testimonial,
        ]);
    }

    /**
     * Update the specified testimonial.
     */
    public function update(StoreTestimonialRequest $request, Testimonial $testimonial): JsonResponse
    {
        $data = $request->validated();
        $testimonial->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Testimoni berhasil diperbarui',
            'data' => $testimonial,
        ]);
    }

    /**
     * Remove the specified testimonial.
     */
    public function destroy(Testimonial $testimonial): JsonResponse
    {
        $testimonial->delete();

        return response()->json([
            'success' => true,
            'message' => 'Testimoni berhasil dihapus',
        ]);
    }
}
