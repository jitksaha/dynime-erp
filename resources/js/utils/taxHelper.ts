/**
 * Calculate tax breakdown.
 * 
 * @param price The price input (total price if included, base price if excluded)
 * @param taxRate Percentage of tax (e.g. 5.125 for 5.125%)
 * @param isIncluded Whether tax is included in the price
 */
export function calculateTaxBreakdown(price: number, taxRate: number, isIncluded: boolean) {
    let basePrice = 0;
    let taxAmount = 0;
    let totalPrice = 0;

    if (isIncluded) {
        // Price is the total price paid by customer (base + tax)
        totalPrice = price;
        basePrice = price / (1 + (taxRate / 100));
        taxAmount = totalPrice - basePrice;
    } else {
        // Price is the base price of the product
        basePrice = price;
        taxAmount = price * (taxRate / 100);
        totalPrice = basePrice + taxAmount;
    }

    return {
        basePrice: Number(basePrice.toFixed(4)),
        taxAmount: Number(taxAmount.toFixed(4)),
        totalPrice: Number(totalPrice.toFixed(4)),
        formatted: {
            basePrice: basePrice.toFixed(2),
            taxAmount: taxAmount.toFixed(2),
            totalPrice: totalPrice.toFixed(2),
        }
    };
}
