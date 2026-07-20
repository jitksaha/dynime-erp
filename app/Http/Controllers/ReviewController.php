<?php

namespace App\Http\Controllers;

use App\Models\Review;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class ReviewController extends Controller
{
    /**
     * Display a listing of reviews for Admin.
     */
    public function index(Request $request)
    {
        $query = Review::query();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('position', 'like', "%{$search}%")
                  ->orWhere('business_name', 'like', "%{$search}%")
                  ->orWhere('review', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('rating') && $request->input('rating') !== 'all') {
            $query->where('rating', $request->input('rating'));
        }

        $reviews = $query->orderBy('created_at', 'desc')->paginate(15)->withQueryString();

        $stats = [
            'total' => Review::count(),
            'avg_rating' => round(Review::avg('rating') ?: 5, 1),
            'approved' => Review::where('status', 'approved')->count(),
            'pending' => Review::where('status', 'pending')->count(),
            'five_star' => Review::where('rating', 5)->count(),
        ];

        return Inertia::render('Reviews/Index', [
            'reviews' => $reviews,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status', 'rating']),
            'publicUrl' => route('reviews.public'),
        ]);
    }

    /**
     * Store a newly created review by Admin.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'position' => 'nullable|string|max:255',
            'business_name' => 'nullable|string|max:255',
            'rating' => 'required|integer|min:1|max:5',
            'review' => 'required|string|max:2000',
            'status' => 'required|string|in:approved,pending,rejected',
            'is_featured' => 'nullable|boolean',
        ]);

        $validated['creator_id'] = Auth::id();

        $review = Review::create($validated);

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'message' => __('Review created successfully.'), 'review' => $review]);
        }

        return redirect()->back()->with('success', __('Review created successfully.'));
    }

    /**
     * Update an existing review.
     */
    public function update(Request $request, Review $review)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'position' => 'nullable|string|max:255',
            'business_name' => 'nullable|string|max:255',
            'rating' => 'required|integer|min:1|max:5',
            'review' => 'required|string|max:2000',
            'status' => 'required|string|in:approved,pending,rejected',
            'is_featured' => 'nullable|boolean',
        ]);

        $review->update($validated);

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'message' => __('Review updated successfully.'), 'review' => $review]);
        }

        return redirect()->back()->with('success', __('Review updated successfully.'));
    }

    /**
     * Update review status (approve, pending, reject).
     */
    public function updateStatus(Request $request, Review $review)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:approved,pending,rejected',
        ]);

        $review->update(['status' => $validated['status']]);

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'message' => __('Review status updated successfully.'), 'review' => $review]);
        }

        return redirect()->back()->with('success', __('Review status updated successfully.'));
    }

    /**
     * Delete a review.
     */
    public function destroy(Request $request, Review $review)
    {
        $review->delete();

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'message' => __('Review deleted successfully.')]);
        }

        return redirect()->back()->with('success', __('Review deleted successfully.'));
    }

    /**
     * Display public review submission page (without login).
     */
    public function publicShow()
    {
        return Inertia::render('Reviews/PublicSubmit', [
            'appName' => config('app.name', 'Dynime ERP'),
        ]);
    }

    /**
     * Submit public review without login.
     */
    public function publicStore(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'position' => 'nullable|string|max:255',
            'business_name' => 'nullable|string|max:255',
            'rating' => 'required|integer|min:1|max:5',
            'review' => 'required|string|max:2000',
        ]);

        $validated['status'] = 'approved';

        $review = Review::create($validated);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => __('Thank you! Your review has been submitted successfully.'),
                'review' => $review
            ]);
        }

        return redirect()->back()->with('success', __('Thank you! Your review has been submitted successfully.'));
    }
}
