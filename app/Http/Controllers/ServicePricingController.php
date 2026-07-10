<?php

namespace App\Http\Controllers;

use App\Models\ServicePricing;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ServicePricingController extends Controller
{
    public function index()
    {
        $pricings = ServicePricing::orderBy('service_title', 'asc')->get();
        return Inertia::render('ServicePricing/Index', [
            'pricings' => $pricings
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'service_slug' => 'required|string|max:255',
            'service_title' => 'required|string|max:255',
            'is_enabled' => 'required|boolean',
            'tiers' => 'nullable|array',
            'quote_settings' => 'nullable|array',
        ]);

        $pricing = ServicePricing::updateOrCreate(
            ['service_slug' => $validated['service_slug']],
            [
                'service_title' => $validated['service_title'],
                'is_enabled' => $validated['is_enabled'],
                'tiers' => $validated['tiers'] ?? [],
                'quote_settings' => $validated['quote_settings'] ?? [],
            ]
        );

        $this->syncToLiveSite();

        return back()->with('success', __('Service pricing saved and synced successfully.'));
    }

    private function syncToLiveSite()
    {
        try {
            $liveUrl = env('LIVE_SITE_URL', 'http://localhost:3000'); // or from config
            $pricings = ServicePricing::all()->map(function ($pricing) {
                return [
                    'slug' => $pricing->service_slug,
                    'name' => $pricing->service_title,
                    'is_active' => $pricing->is_enabled,
                    'tiers' => $pricing->tiers,
                    'quote_settings' => $pricing->quote_settings,
                ];
            })->toArray();

            Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post("{$liveUrl}/api/v1/cms/sync/catalog", [
                'services' => $pricings
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to sync service pricing to live site: ' . $e->getMessage());
        }
    }
}
