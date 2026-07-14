import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SalesInvoiceItem } from '../types';
import ProductSelector from './ProductSelector';
import { calculateLineItemAmounts } from './TaxCalculator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputError } from '@/components/ui/input-error';
import { Trash2 } from 'lucide-react';
import { formatCurrency } from '@/utils/helpers';

interface Props {
    items: SalesInvoiceItem[];
    onChange: (items: SalesInvoiceItem[]) => void;
    errors: any;
    products?: Array<{id: number | string; name: string; sale_price: number; unit?: string; stock_quantity?: number; taxes?: Array<{id: number; tax_name: string; rate: number}>}>;
    showAddButton?: boolean;
    invoiceType?: string;
}

/** Per-row discount type: 'percent' or 'fixed' */
type DiscountType = 'percent' | 'fixed';

export default function InvoiceItemsTable({ items, onChange, errors, products = [], showAddButton = true, invoiceType = 'product' }: Props) {
    const { t } = useTranslation();

    // Track discount type per row (defaults to 'percent')
    const [discountTypes, setDiscountTypes] = useState<DiscountType[]>(() =>
        items.map(() => 'percent')
    );

    const ensureDiscountTypes = (length: number, current: DiscountType[]) => {
        if (current.length >= length) return current;
        return [...current, ...Array(length - current.length).fill('percent') as DiscountType[]];
    };

    const addItem = () => {
        const newItem: SalesInvoiceItem = {
            product_id: 0,
            quantity: 1,
            unit_price: 0,
            discount_percentage: 0,
            discount_amount: 0,
            tax_percentage: 0,
            tax_amount: 0,
            total_amount: 0,
            taxes: []
        };
        onChange([...items, newItem]);
        setDiscountTypes(prev => [...prev, 'percent']);
    };

    const removeItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        onChange(newItems);
        setDiscountTypes(prev => prev.filter((_, i) => i !== index));
    };

    const toggleDiscountType = (index: number) => {
        const newTypes = [...discountTypes];
        const newType = newTypes[index] === 'percent' ? 'fixed' : 'percent';
        newTypes[index] = newType;
        setDiscountTypes(newTypes);

        // Recalculate with new type
        const newItems = [...items];
        const item = { ...newItems[index] };

        if (newType === 'fixed') {
            // Was percent → convert to fixed amount value
            const lineTotal = (item.quantity || 1) * (item.unit_price || 0);
            const fixedAmt = (lineTotal * (item.discount_percentage || 0)) / 100;
            item.discount_amount = fixedAmt;
            // Recalculate total with fixed discount
            const afterDiscount = lineTotal - fixedAmt;
            const taxAmount = (afterDiscount * (item.tax_percentage || 0)) / 100;
            item.tax_amount = taxAmount;
            item.total_amount = afterDiscount + taxAmount;
        } else {
            // Was fixed → convert back to percent
            const lineTotal = (item.quantity || 1) * (item.unit_price || 0);
            const pct = lineTotal > 0 ? (item.discount_amount / lineTotal) * 100 : 0;
            item.discount_percentage = parseFloat(pct.toFixed(4));
            const afterDiscount = lineTotal - item.discount_amount;
            const taxAmount = (afterDiscount * (item.tax_percentage || 0)) / 100;
            item.tax_amount = taxAmount;
            item.total_amount = afterDiscount + taxAmount;
        }

        newItems[index] = item;
        onChange(newItems);
    };

    const updateItem = (index: number, field: keyof SalesInvoiceItem, value: any) => {
        const newItems = [...items];
        const types = ensureDiscountTypes(newItems.length, discountTypes);
        newItems[index] = { ...newItems[index], [field]: value };

        const item = newItems[index];

        if (item.tax_percentage === 0 && item.product_id) {
            const product = products.find(p => p.id === item.product_id || p.id.toString() === item.product_id.toString());
            if (product?.taxes?.length) {
                item.tax_percentage = product.taxes.reduce((sum, tax) => sum + tax.rate, 0);
            }
        }

        const lineTotal = (item.quantity || 1) * (item.unit_price || 0);
        const isFixed = types[index] === 'fixed';

        if (isFixed) {
            // Fixed discount mode: discount_amount is the authoritative value
            const fixedAmt = isFixed && field === 'discount_amount'
                ? value
                : (item.discount_amount || 0);
            const afterDiscount = Math.max(0, lineTotal - fixedAmt);
            const taxAmount = (afterDiscount * (item.tax_percentage || 0)) / 100;
            item.discount_amount = fixedAmt;
            item.discount_percentage = lineTotal > 0 ? (fixedAmt / lineTotal) * 100 : 0;
            item.tax_amount = taxAmount;
            item.total_amount = afterDiscount + taxAmount;
        } else {
            // Percentage discount mode
            const calculations = calculateLineItemAmounts(
                item.quantity,
                item.unit_price,
                item.discount_percentage,
                item.tax_percentage
            );
            item.discount_amount = calculations.discountAmount;
            item.tax_amount = calculations.taxAmount;
            item.total_amount = calculations.totalAmount;
        }

        onChange(newItems);
    };

    const handleDiscountInput = (index: number, value: string) => {
        const types = ensureDiscountTypes(items.length, discountTypes);
        const isFixed = types[index] === 'fixed';
        const numVal = parseFloat(value) || 0;

        if (isFixed) {
            updateItem(index, 'discount_amount', numVal);
        } else {
            updateItem(index, 'discount_percentage', numVal);
        }
    };

    const handleProductSelect = (index: number, productId: number | string, product?: any) => {
        const newItems = [...items];
        const totalTaxRate = product?.taxes?.reduce((sum: number, tax: any) => sum + Number(tax.rate), 0) || 0;
        const taxes = product?.taxes?.map((tax: any) => ({
            tax_name: tax.tax_name,
            tax_rate: tax.rate
        })) || [];

        newItems[index] = {
            ...newItems[index],
            product_id: productId,
            unit_price: Number(product?.sale_price) || 0,
            tax_percentage: Number(totalTaxRate) || 0,
            taxes: taxes
        };

        const item = newItems[index];
        item.quantity = Number(item.quantity) || 1;
        item.discount_percentage = Number(item.discount_percentage) || 0;

        const calculations = calculateLineItemAmounts(
            item.quantity,
            item.unit_price,
            item.discount_percentage,
            item.tax_percentage
        );

        item.discount_amount = Number(calculations.discountAmount) || 0;
        item.tax_amount = Number(calculations.taxAmount) || 0;
        item.total_amount = Number(calculations.totalAmount) || 0;

        onChange(newItems);
    };

    const types = ensureDiscountTypes(items.length, discountTypes);

    return (
        <div className="space-y-4">
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                                {t('Product')} <span className="text-red-500">*</span>
                            </th>
                            {invoiceType === 'product' && (
                                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                                    {t('Qty')} <span className="text-red-500">*</span>
                                </th>
                            )}
                            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                                {t('Unit Price')} <span className="text-red-500">*</span>
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                                {t('Discount')}
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                                {t('Tax')}
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                                {t('Total')}
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">
                                {t('Action')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {items.map((item, index) => (
                            <tr key={index}>
                                <td className="px-4 py-4">
                                    <ProductSelector
                                        products={products}
                                        value={item.product_id}
                                        onChange={(productId, product) => handleProductSelect(index, productId, product)}
                                    />
                                    <InputError message={errors[`items.${index}.product_id`]} />
                                </td>
                                {invoiceType === 'product' && (
                                    <td className="px-4 py-4">
                                        {(() => {
                                            const product = products.find(p => p.id === item.product_id || p.id.toString() === item.product_id.toString());
                                            const maxQty = product?.stock_quantity || 999999;
                                            return (
                                                <div>
                                                    <Input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                                        className="w-20 text-sm"
                                                        min="1"
                                                        max={maxQty}
                                                        step="1"
                                                        required
                                                    />
                                                    {product && (
                                                        <div className="text-xs text-muted-foreground mt-1">
                                                            {t('Stock')}: {product.stock_quantity || 0}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                        <InputError message={errors[`items.${index}.quantity`]} />
                                    </td>
                                )}
                                <td className="px-4 py-4">
                                    <Input
                                        type="number"
                                        value={item.unit_price}
                                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                        className="w-24 text-sm"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                    <InputError message={errors[`items.${index}.unit_price`]} />
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-1">
                                        <Input
                                            type="number"
                                            value={types[index] === 'fixed'
                                                ? item.discount_amount
                                                : item.discount_percentage
                                            }
                                            onChange={(e) => handleDiscountInput(index, e.target.value)}
                                            className="w-20 text-sm"
                                            min="0"
                                            max={types[index] === 'percent' ? 100 : undefined}
                                            step="0.01"
                                        />
                                        {/* Toggle button: % / $ */}
                                        <button
                                            type="button"
                                            onClick={() => toggleDiscountType(index)}
                                            title={types[index] === 'percent'
                                                ? t('Switch to fixed amount')
                                                : t('Switch to percentage')
                                            }
                                            className={[
                                                'h-8 w-8 rounded border text-xs font-bold flex items-center justify-center transition-colors flex-shrink-0',
                                                types[index] === 'percent'
                                                    ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                                                    : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100',
                                            ].join(' ')}
                                        >
                                            {types[index] === 'percent' ? '%' : '$'}
                                        </button>
                                    </div>
                                    {types[index] === 'fixed' && item.discount_amount > 0 && (
                                        <div className="text-[10px] text-muted-foreground mt-0.5">
                                            ≈ {((item.discount_amount / Math.max(0.01, item.quantity * item.unit_price)) * 100).toFixed(1)}%
                                        </div>
                                    )}
                                    {types[index] === 'percent' && item.discount_percentage > 0 && (
                                        <div className="text-[10px] text-muted-foreground mt-0.5">
                                            ≈ {formatCurrency(item.discount_amount)}
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-4">
                                    {item.taxes && item.taxes.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {item.taxes.map((tax, taxIndex) => (
                                                <span key={taxIndex} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {tax.tax_name} ({tax.tax_rate}%)
                                                </span>
                                            ))}
                                        </div>
                                    ) : item.tax_percentage > 0 ? (
                                        <span className="text-sm text-blue-800">Tax ({item.tax_percentage}%)</span>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">No tax</span>
                                    )}
                                </td>
                                <td className="px-4 py-4">
                                    <span className="text-sm font-medium">
                                        {formatCurrency(item.total_amount)}
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeItem(index)}
                                        className="text-red-600 hover:text-red-800 h-8 w-8 p-0"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showAddButton && (
                <div className="flex justify-start">
                    <Button
                        type="button"
                        onClick={addItem}
                        variant="default"
                        size="sm"
                    >
                        + {t('Add Item')}
                    </Button>
                </div>
            )}

            <InputError message={errors.items} />
        </div>
    );
}