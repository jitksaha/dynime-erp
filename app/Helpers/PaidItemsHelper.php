<?php

namespace App\Helpers;

use Workdo\ProductService\Models\ProductServiceItem;
use App\Models\ServicePricing;
use App\Models\USAStatePricing;
use Illuminate\Support\Str;

class PaidItemsHelper
{
    public static function getPaidItems($creatorId)
    {
        // 1. Fetch physical products / items
        $items = ProductServiceItem::where('is_active', true)
            ->where('created_by', $creatorId)
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id, // numeric ID for existing products
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'purchase_price' => $product->purchase_price,
                    'unit' => $product->unit,
                    'type' => $product->type,
                    'taxes' => $product->taxes->map(function ($tax) {
                        return [
                            'id' => $tax->id,
                            'tax_name' => $tax->tax_name,
                            'rate' => $tax->rate
                        ];
                    })
                ];
            })->toArray();

        // 2. Fetch service pricing tiers
        $services = [];
        $servicePricings = ServicePricing::where('is_enabled', true)->get();
        foreach ($servicePricings as $sp) {
            $tiers = $sp->tiers ?? [];
            foreach ($tiers as $tier) {
                $price = isset($tier['price_usd']) && $tier['price_usd'] !== '' ? (float)$tier['price_usd'] : 0.0;
                $tierId = $tier['id'] ?? uniqid();
                $services[] = [
                    'id' => 'service_' . $tierId,
                    'name' => $sp->service_title . ' - ' . ($tier['name'] ?? 'Tier'),
                    'sku' => 'SRV-' . strtoupper(substr(Str::slug($sp->service_title), 0, 3)) . '-' . strtoupper(substr($tierId, -4)),
                    'purchase_price' => $price,
                    'unit' => 'Service',
                    'type' => 'service',
                    'taxes' => []
                ];
            }
        }

        // 3. Fetch USA State Fees
        $stateFees = [];
        $states = USAStatePricing::where('is_active', true)->get();
        foreach ($states as $state) {
            $feeTypes = [
                'llc_formation' => 'LLC Formation Fee',
                'corp_formation' => 'Corp Formation Fee',
                'llc_annual' => 'LLC Annual Report Fee',
                'corp_annual' => 'Corp Annual Report Fee',
                'llc_renewal' => 'LLC Renewal Fee',
                'corp_renewal' => 'Corp Renewal Fee',
            ];

            foreach ($feeTypes as $field => $label) {
                $price = (float)($state->$field ?? 0.0);
                if ($price > 0) {
                    $feeId = $state->id . '_' . $field;
                    $stateFees[] = [
                        'id' => 'statefee_' . $feeId,
                        'name' => $state->state . ' (' . $state->abbr . ') ' . $label,
                        'sku' => 'STF-' . $state->abbr . '-' . strtoupper(substr($field, 0, 3)),
                        'purchase_price' => $price,
                        'unit' => 'Fee',
                        'type' => 'state_fee',
                        'taxes' => []
                    ];
                }
            }
        }

        return array_merge($items, $services, $stateFees);
    }

    public static function resolveProductId($id, $creatorId)
    {
        // If it's a numeric ID, it's already a real ProductServiceItem
        if (is_numeric($id)) {
            return (int)$id;
        }

        // If it starts with service_
        if (str_starts_with($id, 'service_')) {
            $tierId = substr($id, 8);
            
            // Find in ServicePricing
            $servicePricings = ServicePricing::where('is_enabled', true)->get();
            foreach ($servicePricings as $sp) {
                $tiers = $sp->tiers ?? [];
                foreach ($tiers as $tier) {
                    if (($tier['id'] ?? '') === $tierId) {
                        $price = isset($tier['price_usd']) && $tier['price_usd'] !== '' ? (float)$tier['price_usd'] : 0.0;
                        $name = $sp->service_title . ' - ' . ($tier['name'] ?? 'Tier');
                        $sku = 'SRV-' . strtoupper(substr(Str::slug($sp->service_title), 0, 3)) . '-' . strtoupper(substr($tierId, -4));
                        
                        return self::findOrCreateProduct($name, $sku, $price, 'service', $creatorId);
                    }
                }
            }
        }

        // If it starts with statefee_
        if (str_starts_with($id, 'statefee_')) {
            $parts = explode('_', substr($id, 9), 2);
            if (count($parts) === 2) {
                $stateId = $parts[0];
                $field = $parts[1];
                
                $state = USAStatePricing::find($stateId);
                if ($state) {
                    $feeTypes = [
                        'llc_formation' => 'LLC Formation Fee',
                        'corp_formation' => 'Corp Formation Fee',
                        'llc_annual' => 'LLC Annual Report Fee',
                        'corp_annual' => 'Corp Annual Report Fee',
                        'llc_renewal' => 'LLC Renewal Fee',
                        'corp_renewal' => 'Corp Renewal Fee',
                    ];
                    
                    $label = $feeTypes[$field] ?? 'Fee';
                    $price = (float)($state->$field ?? 0.0);
                    $name = $state->state . ' (' . $state->abbr . ') ' . $label;
                    $sku = 'STF-' . $state->abbr . '-' . strtoupper(substr($field, 0, 3));
                    
                    return self::findOrCreateProduct($name, $sku, $price, 'state_fee', $creatorId);
                }
            }
        }

        return null;
    }

    private static function findOrCreateProduct($name, $sku, $price, $type, $creatorId)
    {
        $product = ProductServiceItem::where('sku', $sku)
            ->where('created_by', $creatorId)
            ->first();

        if ($product) {
            // Update price if it changed
            if ((float)$product->purchase_price !== (float)$price || (float)$product->sale_price !== (float)$price) {
                $product->purchase_price = $price;
                $product->sale_price = $price;
                $product->save();
            }
            return $product->id;
        }

        // Create new virtual item
        $product = new ProductServiceItem();
        $product->name = $name;
        $product->sku = $sku;
        $product->sale_price = $price;
        $product->purchase_price = $price;
        $product->tax_ids = [];
        $product->category_id = null;
        $product->unit = null;
        $product->type = $type;
        $product->is_active = true;
        $product->creator_id = $creatorId;
        $product->created_by = $creatorId;
        $product->save();

        return $product->id;
    }
}
