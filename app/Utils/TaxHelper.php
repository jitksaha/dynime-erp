<?php

namespace App\Utils;

class TaxHelper
{
    /**
     * Calculate tax breakdown.
     * 
     * @param float $price The price input (total price if included, base price if excluded)
     * @param float $taxRate Percentage of tax (e.g. 5.125 for 5.125%)
     * @param bool $isIncluded Whether tax is included in the price
     * @return array
     */
    public static function calculateBreakdown(float $price, float $taxRate, bool $isIncluded): array
    {
        if ($isIncluded) {
            // Price is the total price paid by customer (base + tax)
            $totalPrice = $price;
            $basePrice = $price / (1 + ($taxRate / 100));
            $taxAmount = $totalPrice - $basePrice;
        } else {
            // Price is the base price of the product
            $basePrice = $price;
            $taxAmount = $price * ($taxRate / 100);
            $totalPrice = $basePrice + $taxAmount;
        }

        return [
            'base_price'  => round($basePrice, 4),
            'tax_amount'  => round($taxAmount, 4),
            'total_price' => round($totalPrice, 4),
            'formatted'   => [
                'base_price'  => number_format($basePrice, 2),
                'tax_amount'  => number_format($taxAmount, 2),
                'total_price' => number_format($totalPrice, 2),
            ]
        ];
    }
}
