<?php

namespace App\Http\Controllers;

use App\Models\USAStatePricing;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class USAStatePricingController extends Controller
{
    public function index()
    {
        $states = USAStatePricing::orderBy('sort_order', 'asc')->orderBy('state', 'asc')->get();
        return Inertia::render('USAStatePricing/Index', [
            'states' => $states
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'id' => 'nullable|integer',
            'state' => 'required|string|max:255',
            'abbr' => 'required|string|max:10',
            'llc_formation' => 'required|numeric',
            'corp_formation' => 'required|numeric',
            'llc_annual' => 'required|numeric',
            'llc_annual_label' => 'nullable|string',
            'corp_annual' => 'required|numeric',
            'corp_annual_label' => 'nullable|string',
            'llc_renewal' => 'required|numeric',
            'corp_renewal' => 'required|numeric',
            'state_tax_note' => 'nullable|string',
            'franchise_tax' => 'nullable|string',
            'notes' => 'nullable|string',
            'sort_order' => 'required|integer',
            'is_active' => 'required|boolean',
        ]);

        $state = USAStatePricing::updateOrCreate(
            ['abbr' => $validated['abbr']],
            $validated
        );

        $this->syncToLiveSite();

        return back()->with('success', __('State pricing saved and synced successfully.'));
    }

    private function syncToLiveSite()
    {
        try {
            $liveUrl = env('LIVE_SITE_URL', 'http://localhost:3000'); // or from config
            $states = USAStatePricing::all()->toArray();

            Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post("{$liveUrl}/api/v1/cms/sync/catalog", [
                'usa_state_pricings' => $states
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to sync USA state pricing to live site: ' . $e->getMessage());
        }
    }
}
