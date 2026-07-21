import React, { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { SalesInvoice } from './types';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { getStatusBadgeClasses } from './utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FileText, Download, Share2, Pencil, CreditCard } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePageButtons } from '@/hooks/usePageButtons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PAYMENT_STATUSES, OPERATIONAL_STATUSES, PROJECT_CATEGORIES, PROJECT_STATUS_MAP, getPaymentStatusBadgeClasses, getOperationalStatusBadgeClasses, getProjectStatusBadgeClasses } from './utils';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import PaymentModal from './components/PaymentModal';

interface ViewProps {
    invoice: SalesInvoice;
    auth: any;
    [key: string]: any;
}

export default function View() {
    const { t } = useTranslation();
    const { invoice, auth } = usePage<ViewProps>().props;
    const [localInvoice, setLocalInvoice] = useState(invoice);
    const [copied, setCopied] = useState(false);
    const [paidAmountInput, setPaidAmountInput] = useState(invoice.paid_amount?.toString() || '0');
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    React.useEffect(() => {
        setPaidAmountInput(localInvoice.paid_amount?.toString() || '0');
    }, [localInvoice.paid_amount]);

    const pageButtons = usePageButtons('zatcaQRCodeBtn', localInvoice);

    const signatureStatusButtons = usePageButtons('signatureViewBtn', {
        invoice: localInvoice,
        invoiceType: 'sales'
    });

    const updateInvoiceStatus = async (updatedFields: any) => {
        try {
            const response = await fetch(route('sales-invoices.update-status', localInvoice.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || ''
                },
                body: JSON.stringify(updatedFields)
            });
            const result = await response.json();
            if (result.success) {
                setLocalInvoice(prev => ({
                    ...prev,
                    ...result.data
                }));
                toast.success(result.message || t('Invoice status updated successfully.'));
            } else {
                toast.error(result.message || t('Failed to update status.'));
            }
        } catch (error) {
            console.error('Failed to update status:', error);
            toast.error(t('An error occurred while updating status.'));
        }
    };

    const handleSavePaidAmount = () => {
        const amount = parseFloat(paidAmountInput);
        if (isNaN(amount) || amount < 0) {
            toast.error(t('Please enter a valid amount.'));
            return;
        }
        updateInvoiceStatus({ 
            payment_status: 'Partially Paid',
            paid_amount: amount 
        });
    };

    const downloadPDF = () => {
        const printUrl = route('sales-invoices.print', localInvoice.id) + '?download=pdf';
        window.open(printUrl, '_blank');
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                {label: t('Sales Invoice'), url: route('sales-invoices.index')},
                {label: t('Sales Invoice Details')}
            ]}
            pageTitle={`${t('Sales Invoice')} #${localInvoice.invoice_number}`}
            backUrl={route('sales-invoices.index')}
        >
            <Head title={`${t('Sales Invoice')} #${localInvoice.invoice_number}`} />

            <div className="space-y-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <p className="text-lg text-muted-foreground">#{localInvoice.invoice_number}</p>
                            </div>
                            <div className="flex flex-wrap md:flex-nowrap items-center gap-6">
                                <div className="flex flex-wrap items-center gap-4 md:gap-6 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground font-medium">{t('Payment')}:</span>
                                        {auth.user?.permissions?.includes('edit-sales-invoices') ? (
                                            <div className="flex items-center gap-2">
                                                <Select
                                                    value={localInvoice.payment_status || 'Unpaid'}
                                                    onValueChange={(value) => {
                                                        if (value === 'Partially Paid') {
                                                            setIsPaymentModalOpen(true);
                                                        } else {
                                                            updateInvoiceStatus({ payment_status: value });
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger className="w-[130px] h-8 text-xs font-semibold capitalize border border-slate-200 bg-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {PAYMENT_STATUSES.map((status) => (
                                                            <SelectItem key={status} value={status}>{t(status)}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setIsPaymentModalOpen(true)}
                                                    className="h-8 text-xs font-bold gap-1 border-indigo-200 bg-indigo-50/50 text-[#4F46E5] hover:bg-indigo-100"
                                                >
                                                    <CreditCard className="h-3.5 w-3.5" />
                                                    {t('Record / Edit Payment')}
                                                </Button>
                                            </div>
                                        ) : (
                                            <span className={getPaymentStatusBadgeClasses(localInvoice.payment_status || 'Unpaid')}>
                                                {t(localInvoice.payment_status || 'Unpaid')}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground font-medium">{t('Operational')}:</span>
                                        {auth.user?.permissions?.includes('edit-sales-invoices') ? (
                                            <Select
                                                value={localInvoice.operational_status || 'Pending'}
                                                onValueChange={(value) => {
                                                    updateInvoiceStatus({ operational_status: value });
                                                }}
                                            >
                                                <SelectTrigger className="w-[130px] h-8 text-xs font-semibold capitalize border border-slate-200 bg-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {OPERATIONAL_STATUSES.map((status) => (
                                                        <SelectItem key={status} value={status}>{t(status)}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <span className={getOperationalStatusBadgeClasses(localInvoice.operational_status || 'Pending')}>
                                                {t(localInvoice.operational_status || 'Pending')}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground font-medium">{t('Category')}:</span>
                                        {auth.user?.permissions?.includes('edit-sales-invoices') ? (
                                            <Select
                                                value={localInvoice.project_category || 'N/A'}
                                                onValueChange={(value) => {
                                                    updateInvoiceStatus({ project_category: value });
                                                }}
                                            >
                                                <SelectTrigger className="w-[150px] h-8 text-xs font-semibold capitalize border border-slate-200 bg-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="N/A">{t('None')}</SelectItem>
                                                    {PROJECT_CATEGORIES.map((cat) => (
                                                        <SelectItem key={cat} value={cat}>{t(cat)}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 border border-slate-200">
                                                {localInvoice.project_category ? t(localInvoice.project_category) : t('None')}
                                            </span>
                                        )}
                                    </div>

                                    {localInvoice.project_category && localInvoice.project_category !== 'N/A' && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground font-medium">{t('Stage')}:</span>
                                            {auth.user?.permissions?.includes('edit-sales-invoices') ? (
                                                <Select
                                                    value={localInvoice.project_status || ''}
                                                    onValueChange={(value) => {
                                                        updateInvoiceStatus({ project_status: value });
                                                    }}
                                                >
                                                    <SelectTrigger className="w-[170px] h-8 text-xs font-semibold capitalize border border-slate-200 bg-white">
                                                        <SelectValue placeholder={t('Select Stage')}>
                                                            {localInvoice.project_status ? t(localInvoice.project_status) : ''}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {PROJECT_STATUS_MAP[localInvoice.project_category]?.map((st) => (
                                                            <SelectItem key={st.label} value={st.label}>
                                                                <div className="flex flex-col text-left">
                                                                    <span className="font-medium text-xs">{t(st.label)}</span>
                                                                    <span className="text-[9px] text-muted-foreground">{t(st.desc)}</span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <span className={getProjectStatusBadgeClasses(localInvoice.project_status || '')}>
                                                    {t(localInvoice.project_status || 'N/A')}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold">{formatCurrency(localInvoice.total_amount)}</div>
                                    <div className="text-sm text-muted-foreground">{t('Total Amount')}</div>
                                </div>
                            </div>
                        </div>

                        <div className={`grid grid-cols-1 gap-6 ${pageButtons.length > 0 ? (localInvoice.customer_details?.billing_address || localInvoice.customer_details?.shipping_address ? 'md:grid-cols-4' : 'md:grid-cols-3') : (localInvoice.customer_details?.billing_address || localInvoice.customer_details?.shipping_address ? 'md:grid-cols-3' : 'md:grid-cols-2')}`}>
                            <div>
                                <h3 className="font-semibold mb-2">{t('CUSTOMER')}</h3>
                                <div className="text-sm space-y-1">
                                    <div className="font-medium">{localInvoice.customer?.name}</div>
                                    <div className="text-muted-foreground">{localInvoice.customer?.email}</div>
                                </div>
                                {localInvoice.customer_details?.billing_address && (
                                    <div className="mt-3">
                                        <div className="font-medium text-sm mb-1">{t('Billing Address')}</div>
                                        <div className="text-sm text-muted-foreground space-y-1">
                                            <div>{localInvoice.customer_details.billing_address.name}</div>
                                            <div>{localInvoice.customer_details.billing_address.address_line_1}</div>
                                            <div>{localInvoice.customer_details.billing_address.city}, {localInvoice.customer_details.billing_address.state} {localInvoice.customer_details.billing_address.zip_code}</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {localInvoice.customer_details?.shipping_address && (
                                <div>
                                    <h3 className="font-semibold mb-2">{t('SHIPPING ADDRESS')}</h3>
                                    <div className="text-sm text-muted-foreground space-y-1">
                                        <div>{localInvoice.customer_details.shipping_address.name}</div>
                                        <div>{localInvoice.customer_details.shipping_address.address_line_1}</div>
                                        <div>{localInvoice.customer_details.shipping_address.city}, {localInvoice.customer_details.shipping_address.state} {localInvoice.customer_details.shipping_address.zip_code}</div>
                                    </div>
                                </div>
                            )}
                            {pageButtons.length > 0 && pageButtons.map((button, index) => (
                                <div key={`${button.id}-${index}`}>{button.component}</div>
                            ))}
                            <div>
                                <h3 className="font-semibold mb-2">{t('DETAILS')}</h3>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{t('Invoice Date')}</span>
                                        <span>{formatDate(localInvoice.invoice_date)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{t('Due Date')}</span>
                                        <span className={new Date(localInvoice.due_date) < new Date() ? 'text-red-600' : ''}>
                                            {formatDate(localInvoice.due_date)}
                                        </span>
                                    </div>
                                    {localInvoice.type === 'product' && localInvoice.warehouse && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">{t('Warehouse')}</span>
                                            <span>{localInvoice.warehouse.name}</span>
                                        </div>
                                    )}
                                    {localInvoice.payment_terms && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">{t('Terms')}</span>
                                            <span>{localInvoice.payment_terms}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    {auth.user?.permissions?.includes('print-sales-invoices') && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={downloadPDF}
                                        >
                                            <Printer className="h-4 w-4 mr-2" />
                                            {t('Print PDF')}
                                        </Button>
                                    )}
                                    {auth.user?.permissions?.includes('edit-sales-invoices') && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.get(route('sales-invoices.edit', localInvoice.id))}
                                        >
                                            <Pencil className="h-4 w-4 mr-2" />
                                            {t('Edit Invoice')}
                                        </Button>
                                    )}
                                    {auth.user?.permissions?.includes('view-sales-invoices') && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const shareUrl = 'https://billing.dynime.com/' + localInvoice.invoice_number;
                                                navigator.clipboard.writeText(shareUrl);
                                                setCopied(true);
                                                setTimeout(() => setCopied(false), 2000);
                                            }}
                                        >
                                            <Share2 className="h-4 w-4 mr-2" />
                                            {copied ? t('Copied!') : t('Copy Share Link')}
                                        </Button>
                                    )}
                                    {localInvoice.status === 'draft' && auth.user?.permissions?.includes('post-sales-invoices') && (
                                        <TooltipProvider>
                                            <Tooltip delayDuration={0}>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => router.post(route('sales-invoices.post', localInvoice.id), {}, {
                                                            onSuccess: () => {
                                                                router.reload();
                                                            }
                                                        })}
                                                    >
                                                        <FileText className="h-4 w-4 mr-2" />
                                                        {t('Post Invoice')}
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{t('Post invoice to finalize and create journal entries')}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-bold text-blue-600">{formatCurrency(localInvoice.balance_amount)}</div>
                                    <div className="text-xs text-muted-foreground">{t('Balance Due')}</div>
                                </div>
                            </div>
                        </div>

                        {localInvoice.notes && (
                            <div className="mt-4 pt-4 border-t">
                                <span className="font-medium text-sm">{t('Notes')}:</span>
                                <span className="text-sm text-muted-foreground ml-2">{localInvoice.notes}</span>
                            </div>
                        )}

                        {/* Signature Status */}
                        {signatureStatusButtons.length > 0 && signatureStatusButtons.map((button) => (
                                <div key={button.id} className="mt-4 pt-4 border-t">{button.component}</div>
                        ))}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold">
                            {t('Invoice Items')}
                        </h3>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="px-4 py-3 text-left text-sm font-semibold">{t('Product')}</th>
                                        {localInvoice.type === 'product' && (
                                            <th className="px-4 py-3 text-right text-sm font-semibold">{t('Qty')}</th>
                                        )}
                                        <th className="px-4 py-3 text-right text-sm font-semibold">{t('Unit Price')}</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold">{t('Discount')}</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold">{t('Tax')}</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold">{t('Total')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {localInvoice.items?.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-4">
                                                <div className="font-medium">{item.product?.name}</div>
                                                {item.product?.sku && (
                                                    <div className="text-sm text-muted-foreground">SKU: {item.product.sku}</div>
                                                )}
                                                {item.product?.description && (
                                                    <div className="text-sm text-muted-foreground mt-1">{item.product.description}</div>
                                                )}
                                            </td>
                                            {localInvoice.type === 'product' && (
                                                <td className="px-4 py-4 text-right">{item.quantity}</td>
                                            )}
                                            <td className="px-4 py-4 text-right">{formatCurrency(item.unit_price)}</td>
                                            <td className="px-4 py-4 text-right">
                                                {item.discount_percentage > 0 ? (
                                                    <div>
                                                        <div>{item.discount_percentage}%</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            -{formatCurrency(item.discount_amount)}
                                                        </div>
                                                    </div>
                                                ) : '-'}
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                {item.taxes && item.taxes.length > 0 ? (
                                                    <div>
                                                        {item.taxes.map((tax, taxIndex) => (
                                                            <div key={taxIndex} className="text-sm">{tax.tax_name} ({tax.tax_rate}%)</div>
                                                        ))}
                                                        <div className="text-sm text-muted-foreground">
                                                            {formatCurrency(item.tax_amount)}
                                                        </div>
                                                    </div>
                                                ) : item.tax_percentage > 0 ? (
                                                    <div>
                                                        <div>{item.tax_percentage}%</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {formatCurrency(item.tax_amount)}
                                                        </div>
                                                    </div>
                                                ) : '-'}
                                            </td>
                                            <td className="px-4 py-4 text-right font-semibold">
                                                {formatCurrency(item.total_amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <div className="w-80 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{t('Subtotal')}</span>
                                    <span className="font-medium">{formatCurrency(localInvoice.subtotal)}</span>
                                </div>
                                {localInvoice.discount_amount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">{t('Discount')}</span>
                                        <span className="font-medium text-red-600">-{formatCurrency(localInvoice.discount_amount)}</span>
                                    </div>
                                )}
                                {localInvoice.tax_amount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">{t('Tax')}</span>
                                        <span className="font-medium">{formatCurrency(localInvoice.tax_amount)}</span>
                                    </div>
                                )}
                                <div className="border-t pt-3">
                                    <div className="flex justify-between">
                                        <span className="font-semibold">{t('Total Amount')}</span>
                                        <span className="font-bold text-lg">{formatCurrency(localInvoice.total_amount)}</span>
                                    </div>
                                </div>
                                {localInvoice.paid_amount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">{t('Paid Amount')}</span>
                                        <span className="font-medium text-green-600">{formatCurrency(localInvoice.paid_amount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="font-semibold">{t('Balance Due')}</span>
                                    <span className="font-bold text-lg">{formatCurrency(localInvoice.balance_amount)}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                invoice={localInvoice}
                onSuccess={(data) => {
                    setLocalInvoice(prev => ({
                        ...prev,
                        ...data
                    }));
                    toast.success(t('Invoice payment updated successfully!'));
                }}
            />
        </AuthenticatedLayout>
    );
}
