import React, { useState, useEffect } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useFormFields } from '@/hooks/useFormFields';
import { SalesInvoice, SalesInvoiceItem } from './types';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import InvoiceItemsTable from './components/InvoiceItemsTable';
import { useTaxCalculator, calculateLineItemAmounts } from './components/TaxCalculator';
import CurrencyConverter from '@/components/CurrencyConverter';
import { formatCurrency } from '@/utils/helpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InputError } from '@/components/ui/input-error';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Separator } from '@/components/ui/separator';
import { PAYMENT_STATUSES, OPERATIONAL_STATUSES, PROJECT_CATEGORIES, PROJECT_STATUS_MAP } from './utils';
import { CalendarDays, Package } from 'lucide-react';

interface EditProps {
    invoice: SalesInvoice;
    customers: Array<{id: number; name: string; email: string}>;
    warehouses: Array<{id: number; name: string; address: string}>;
    modules?: {recurringinvoicebill?: boolean};
    [key: string]: any;
}

export default function Edit() {
    const { t } = useTranslation();
    const { invoice, customers, warehouses, modules } = usePage<EditProps>().props;
    const [availableProducts, setAvailableProducts] = useState([]);


    const { data, setData, put, processing, errors } = useForm({
        ...invoice,
        customer_id: invoice.customer_id.toString(),
        warehouse_id: invoice.warehouse_id?.toString() || '',
        type: invoice.type || 'product',
        estimated_delivery_date: invoice.estimated_delivery_date || '',
        whats_included: (invoice.service_brief?.included_services || []).join('\n'),
        payment_method: invoice.service_brief?.payment_method || 'Bank Transfer',
        currency: invoice.service_brief?.currency || 'USD',
        payment_status: invoice.payment_status || 'Unpaid',
        operational_status: invoice.operational_status || 'Pending',
        project_category: invoice.project_category || '',
        project_status: invoice.project_status || '',
        items: (invoice.items || []).map(item => {
            const calculations = calculateLineItemAmounts(
                item.quantity,
                item.unit_price,
                item.discount_percentage,
                item.tax_percentage
            );
            return {
                ...item,
                taxes: item.taxes || [],
                discount_amount: calculations.discountAmount,
                tax_amount: calculations.taxAmount,
                total_amount: calculations.totalAmount
            };
        }) as SalesInvoiceItem[]
    });

    // Load products for the current warehouse on component mount
    useEffect(() => {
        if (data.type === 'product' && data.warehouse_id) {
            handleWarehouseChange(data.warehouse_id);
        } else if (data.type === 'service') {
            loadServices();
        }
    }, []);

    const handleWarehouseChange = async (warehouseId: string) => {
        setData('warehouse_id', warehouseId);

        if (warehouseId) {
            try {
                const response = await fetch(route('sales-invoices.warehouse.products') + `?warehouse_id=${warehouseId}`);
                const warehouseProducts = await response.json();
                setAvailableProducts(warehouseProducts);
            } catch (error) {
                console.error('Failed to fetch warehouse products:', error);
                setAvailableProducts([]);
            }
        } else {
            setAvailableProducts([]);
        }
    };

    const loadServices = async () => {
        try {
            const response = await fetch(route('sales-invoices.services'));
            const services = await response.json();
            setAvailableProducts(services);
        } catch (error) {
            console.error('Failed to fetch services:', error);
            setAvailableProducts([]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('sales-invoices.update', invoice.id));
    };

    const totals = useTaxCalculator(data.items);

    // Recurring fields hook
    const recurringFields = useFormFields('salesInvoiceEditFields', data, setData, errors, 'edit', invoice);
    
    // Commission plan fields hook
    const commissionFields = useFormFields('commissionPlanBtn', data, setData, errors, 'edit');
    
    // Sage fields hook
    const sageFields = useFormFields('salesInvoiceFields', data, setData, errors, 'edit', t);
    return (
        <AuthenticatedLayout
            breadcrumbs={[
                {label: t('Sales Invoice'), url: route('sales-invoices.index')},
                {label: t('Edit Sales Invoice')}
            ]}
            pageTitle={t('Edit Sales Invoice')}
            backUrl={route('sales-invoices.index')}
        >
            <Head title={t('Edit Sales Invoice')} />

            <div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <CalendarDays className="h-5 w-5" />
                                {t('Sales Invoice Details')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <Label htmlFor="invoice_date" required>
                                        {t('Invoice Date')}
                                    </Label>
                                    <DatePicker
                                        id="invoice_date"
                                        value={data.invoice_date}
                                        onChange={(value) => setData('invoice_date', value)}
                                        required
                                    />
                                    <InputError message={errors.invoice_date} />
                                </div>

                                <div>
                                    <Label htmlFor="due_date" required>
                                        {t('Due Date')}
                                    </Label>
                                    <DatePicker
                                        id="due_date"
                                        value={data.due_date}
                                        onChange={(value) => setData('due_date', value)}
                                        required
                                    />
                                    <InputError message={errors.due_date} />
                                </div>

                                <div>
                                    <Label htmlFor="customer_id" required>
                                        {t('Customer')}
                                    </Label>
                                    <Select value={data.customer_id} onValueChange={(value) => setData('customer_id', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('Select Customer')} />
                                        </SelectTrigger>
                                        <SelectContent searchable>
                                            {customers.map((customer) => (
                                                <SelectItem key={customer.id} value={customer.id.toString()}>
                                                    {customer.name} - {customer.email}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.customer_id} />
                                </div>

                                {data.type === 'product' && (
                                    <div>
                                        <Label htmlFor="warehouse_id" required>
                                            {t('Warehouse')}
                                        </Label>
                                        <Select value={data.warehouse_id} onValueChange={handleWarehouseChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('Select Warehouse')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {warehouses.map((warehouse) => (
                                                    <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                                        {warehouse.name} - {warehouse.address}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.warehouse_id} />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                                <div>
                                    <Label htmlFor="payment_terms">
                                        {t('Payment Terms')}
                                    </Label>
                                    <Input
                                        id="payment_terms"
                                        value={data.payment_terms}
                                        onChange={(e) => setData('payment_terms', e.target.value)}
                                        placeholder={t('e.g., Net 30')}
                                    />
                                    <InputError message={errors.payment_terms} />
                                </div>
                                <div>
                                    <Label htmlFor="estimated_delivery_date">
                                        {t('Estimated Delivery Date')}
                                    </Label>
                                    <DatePicker
                                        id="estimated_delivery_date"
                                        value={data.estimated_delivery_date}
                                        onChange={(value) => setData('estimated_delivery_date', value)}
                                    />
                                    <InputError message={errors.estimated_delivery_date} />
                                </div>

                                <div>
                                    <Label htmlFor="payment_method">
                                        {t('Payment Method')}
                                    </Label>
                                    <Select value={data.payment_method} onValueChange={(value) => setData('payment_method', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('Select Payment Method')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Bank Transfer">{t('Bank Transfer')}</SelectItem>
                                            <SelectItem value="Stripe">{t('Stripe')}</SelectItem>
                                            <SelectItem value="PayPal">{t('PayPal')}</SelectItem>
                                            <SelectItem value="Credit Card">{t('Credit Card')}</SelectItem>
                                            <SelectItem value="Cash">{t('Cash')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.payment_method} />
                                </div>

                                <div>
                                    <Label htmlFor="currency">
                                        {t('Currency')}
                                    </Label>
                                    <Select value={data.currency} onValueChange={(value) => setData('currency', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('Select Currency')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="USD">USD — US Dollar</SelectItem>
                                            <SelectItem value="BDT">BDT — Bangladeshi Taka</SelectItem>
                                            <SelectItem value="EUR">EUR — Euro</SelectItem>
                                            <SelectItem value="GBP">GBP — British Pound</SelectItem>
                                            <SelectItem value="AUD">AUD — Australian Dollar</SelectItem>
                                            <SelectItem value="CAD">CAD — Canadian Dollar</SelectItem>
                                            <SelectItem value="SGD">SGD — Singapore Dollar</SelectItem>
                                            <SelectItem value="INR">INR — Indian Rupee</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.currency} />
                                </div>

                                <div>
                                    <Label htmlFor="payment_status">
                                        {t('Payment Status')}
                                    </Label>
                                    <Select value={data.payment_status} onValueChange={(value) => setData('payment_status', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('Select Payment Status')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PAYMENT_STATUSES.map((status) => (
                                                <SelectItem key={status} value={status}>{t(status)}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.payment_status} />
                                </div>

                                <div>
                                    <Label htmlFor="operational_status">
                                        {t('Operational Status')}
                                    </Label>
                                    <Select value={data.operational_status} onValueChange={(value) => setData('operational_status', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('Select Operational Status')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {OPERATIONAL_STATUSES.map((status) => (
                                                <SelectItem key={status} value={status}>{t(status)}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.operational_status} />
                                </div>

                                <div>
                                    <Label htmlFor="project_category">
                                        {t('Project Category')}
                                    </Label>
                                    <Select 
                                        value={data.project_category} 
                                        onValueChange={(value) => {
                                            setData((prev) => ({
                                                ...prev,
                                                project_category: value,
                                                project_status: ''
                                            }));
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('Select Category (Optional)')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="N/A">{t('None')}</SelectItem>
                                            {PROJECT_CATEGORIES.map((cat) => (
                                                <SelectItem key={cat} value={cat}>{t(cat)}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.project_category} />
                                </div>

                                <div>
                                    <Label htmlFor="project_status">
                                        {t('Project Status')}
                                    </Label>
                                    <Select 
                                        value={data.project_status || ''} 
                                        onValueChange={(value) => setData('project_status', value)}
                                        disabled={!data.project_category || data.project_category === 'N/A' || data.project_category === ''}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('Select Project Status')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {data.project_category && PROJECT_STATUS_MAP[data.project_category] ? (
                                                PROJECT_STATUS_MAP[data.project_category].map((st) => (
                                                    <SelectItem key={st.label} value={st.label}>
                                                        <div className="flex flex-col text-left">
                                                            <span className="font-medium text-xs">{t(st.label)}</span>
                                                            <span className="text-[10px] text-muted-foreground">{t(st.desc)}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="N/A">{t('Select Category First')}</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.project_status} />
                                </div>

                                <div className="md:col-span-2 lg:col-span-4">
                                    <Label htmlFor="notes">
                                        {t('Notes')}
                                    </Label>
                                    <Textarea
                                        id="notes"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        rows={2}
                                        placeholder={t('Additional notes...')}
                                    />
                                    <InputError message={errors.notes} />
                                </div>
                            </div>

                            <div className="mt-4">
                                <Label htmlFor="whats_included">
                                    {t("What's Included (One item per line)")}
                                </Label>
                                <Textarea
                                    id="whats_included"
                                    value={data.whats_included}
                                    onChange={(e) => setData('whats_included', e.target.value)}
                                    rows={4}
                                    placeholder={t("Custom Website Design & Development\nFrontend Development\nBackend Development")}
                                />
                                <InputError message={errors.whats_included} />
                            </div>

                            {/* Recurring Sales Invoice */}
                            {modules?.recurringinvoicebill && (
                                <div className="mt-6">
                                    {recurringFields.map((field) => (
                                        <div key={field.id} className="mb-4">{field.component}</div>
                                    ))}
                                </div>
                            )}
                             {/* Commission Plan Fields */}
                             <div className="mt-6">
                                {commissionFields.map((field) => (
                                    <div key={field.id}>
                                        {field.component}
                                    </div>
                                ))}
                            </div>

                            {/* Sage Fields */}
                            <div className="mt-6">
                                {sageFields.map((field) => (
                                    <div key={field.id}>
                                        {field.component}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Package className="h-5 w-5" />
                                    {t('Sales Invoice Items')}
                                </CardTitle>
                                <Button
                                    type="button"
                                    onClick={() => {
                                        const newItem = {
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
                                        setData('items', [...data.items, newItem]);
                                    }}
                                    variant="default"
                                    size="sm"
                                >
                                    + {t('Add Item')}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <InvoiceItemsTable
                                items={data.items}
                                onChange={(items) => setData('items', items)}
                                errors={errors}
                                products={availableProducts}
                                showAddButton={false}
                                invoiceType={data.type}
                            />

                             {/* Currency Converter & Invoice Summary */}
                             <div className="mt-6 flex flex-col md:flex-row justify-between items-start gap-4">
                                 <CurrencyConverter
                                     items={data.items}
                                     onChange={(items) => setData('items', items)}
                                     calculateLineItemAmounts={calculateLineItemAmounts}
                                 />
                                 <div className="w-80 bg-muted/30 rounded-lg p-4">
                                     <h3 className="font-semibold mb-3">{t('Invoice Summary')}</h3>
                                    <div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">{t('Subtotal')}</span>
                                            <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">{t('Discount')}</span>
                                            <span className="font-medium text-red-600">-{formatCurrency(totals.discountAmount)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">{t('Tax')}</span>
                                            <span className="font-medium">{formatCurrency(totals.taxAmount)}</span>
                                        </div>
                                        <Separator className="my-2" />
                                        <div className="flex justify-between">
                                            <span className="font-semibold">{t('Total')}</span>
                                            <span className="font-bold text-lg">{formatCurrency(totals.total)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>



                    <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                            {data.items.length} {t('items added')}
                        </div>
                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => window.history.back()}
                            >
                                {t('Cancel')}
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing || data.items.length === 0}
                            >
                                {processing ? t('Updating...') : t('Update')}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
