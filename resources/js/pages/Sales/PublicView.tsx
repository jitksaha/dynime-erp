import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import html2pdf from 'html2pdf.js';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { Button } from '@/components/ui/button';
import { Printer, Download, Share2, CheckCircle2, AlertCircle, Clock, FileText } from 'lucide-react';
import { SalesInvoice } from './types';

interface PublicViewProps {
    invoice: SalesInvoice;
    companySettings: {
        company_name: string;
        company_address: string;
        company_city: string;
        company_state: string;
        company_zipcode: string;
        company_country: string;
        company_telephone?: string;
        company_email?: string;
        company_logo?: string;
    };
}

export default function PublicView({ invoice, companySettings }: PublicViewProps) {
    const { t } = useTranslation();
    const [isDownloading, setIsDownloading] = useState(false);
    const [copied, setCopied] = useState(false);

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid':
                return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
            case 'overdue':
                return <AlertCircle className="h-5 w-5 text-rose-500" />;
            case 'pending':
            case 'sent':
            case 'posted':
                return <Clock className="h-5 w-5 text-amber-500" />;
            default:
                return <FileText className="h-5 w-5 text-slate-500" />;
        }
    };

    const getStatusBadgeClasses = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid':
                return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
            case 'overdue':
                return 'bg-rose-50 text-rose-700 border border-rose-200';
            case 'pending':
            case 'sent':
            case 'posted':
                return 'bg-amber-50 text-amber-700 border border-amber-200';
            default:
                return 'bg-slate-50 text-slate-700 border border-slate-200';
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadPDF = async () => {
        setIsDownloading(true);
        const printContent = document.querySelector('.invoice-card-container');
        if (printContent) {
            const opt = {
                margin: 0.4,
                filename: `Invoice-${invoice.invoice_number}.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' as const }
            };

            try {
                await html2pdf().set(opt).from(printContent as HTMLElement).save();
            } catch (error) {
                console.error('PDF generation failed:', error);
            }
        }
        setIsDownloading(false);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 print:p-0 print:bg-white">
            <Head title={`${t('Invoice')} ${invoice.invoice_number}`} />

            {isDownloading && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 print:hidden">
                    <div className="bg-white p-6 rounded-2xl shadow-xl flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                        <p className="text-lg font-semibold text-slate-700">{t('Generating PDF...')}</p>
                    </div>
                </div>
            )}

            {/* Top Navigation Bar / Quick Actions */}
            <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
                <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-700 text-lg tracking-tight flex items-center gap-1.5">
                        <span className="text-indigo-600 font-extrabold">dynime</span>
                        <span className="text-slate-400 font-light text-xs lowercase">complete business os</span>
                    </span>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                    <Button variant="outline" size="sm" onClick={copyLink} className="bg-white">
                        <Share2 className="h-4 w-4 mr-2 text-slate-500" />
                        {copied ? t('Copied!') : t('Copy URL')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadPDF} className="bg-white">
                        <Download className="h-4 w-4 mr-2 text-slate-500" />
                        {t('Download PDF')}
                    </Button>
                    <Button variant="default" size="sm" onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700">
                        <Printer className="h-4 w-4 mr-2" />
                        {t('Print Invoice')}
                    </Button>
                </div>
            </div>

            {/* Main Invoice Card */}
            <div className="invoice-card-container bg-white shadow-xl rounded-2xl border border-slate-100 max-w-4xl mx-auto overflow-hidden print:shadow-none print:border-none print:my-0">
                
                {/* Visual Accent Top Bar */}
                <div className="h-2 bg-indigo-600 print:hidden" />

                <div className="p-8 sm:p-12 print:p-0">
                    
                    {/* Header: Company and Invoice Details */}
                    <div className="flex flex-col md:flex-row justify-between items-start gap-8 border-b border-slate-100 pb-8 mb-8">
                        <div className="space-y-4">
                            {companySettings.company_logo ? (
                                <img 
                                    src={companySettings.company_logo} 
                                    alt={companySettings.company_name} 
                                    className="max-h-16 object-contain" 
                                />
                            ) : (
                                <h1 className="text-3xl font-extrabold tracking-tight text-indigo-600">{companySettings.company_name}</h1>
                            )}
                            <div className="text-slate-500 text-sm space-y-1">
                                <p className="font-semibold text-slate-700">{companySettings.company_name}</p>
                                <p>{companySettings.company_address}</p>
                                <p>{companySettings.company_city}, {companySettings.company_state} {companySettings.company_zipcode}</p>
                                <p className="uppercase">{companySettings.company_country}</p>
                                {companySettings.company_telephone && <p>{t('Phone')}: {companySettings.company_telephone}</p>}
                                {companySettings.company_email && <p>{t('Email')}: {companySettings.company_email}</p>}
                            </div>
                        </div>

                        <div className="md:text-right space-y-3 md:w-1/2">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getStatusBadgeClasses(invoice.status)}`}>
                                {getStatusIcon(invoice.status)}
                                {t(invoice.status.toUpperCase())}
                            </span>
                            <div>
                                <h2 className="text-slate-400 text-xs font-bold uppercase tracking-wider">{t('INVOICE')}</h2>
                                <p className="text-3xl font-extrabold text-slate-800">#{invoice.invoice_number}</p>
                            </div>
                            <div className="text-sm text-slate-500 space-y-1">
                                <p><span className="text-slate-400">{t('Date')}:</span> <span className="font-semibold text-slate-700">{formatDate(invoice.invoice_date)}</span></p>
                                <p><span className="text-slate-400">{t('Due')}:</span> <span className={`font-semibold ${invoice.display_status === 'overdue' ? 'text-rose-600' : 'text-slate-700'}`}>{formatDate(invoice.due_date)}</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Billing Addresses Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 pb-8 border-b border-slate-100">
                        <div>
                            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">{t('BILL TO')}</h3>
                            <div className="text-slate-600 text-sm space-y-1">
                                <p className="font-bold text-slate-800 text-base">{invoice.customer?.name}</p>
                                <p>{invoice.customer?.email}</p>
                                {invoice.customer_details?.billing_address && (
                                    <>
                                        <p>{invoice.customer_details.billing_address.name}</p>
                                        <p>{invoice.customer_details.billing_address.address_line_1}</p>
                                        <p>{invoice.customer_details.billing_address.city}, {invoice.customer_details.billing_address.state} {invoice.customer_details.billing_address.zip_code}</p>
                                    </>
                                )}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">{t('SHIP TO')}</h3>
                            <div className="text-slate-600 text-sm space-y-1">
                                {invoice.customer_details?.shipping_address ? (
                                    <>
                                        <p className="font-bold text-slate-800 text-base">{invoice.customer_details.shipping_address.name}</p>
                                        <p>{invoice.customer_details.shipping_address.address_line_1}</p>
                                        <p>{invoice.customer_details.shipping_address.city}, {invoice.customer_details.shipping_address.state} {invoice.customer_details.shipping_address.zip_code}</p>
                                    </>
                                ) : (
                                    <p className="text-slate-400 italic">{t('Same as billing address')}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Invoice Items Table */}
                    <div className="mb-10 overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-600">
                            <thead className="text-xs text-slate-400 uppercase bg-slate-50 rounded-lg print:bg-white">
                                <tr className="border-b border-slate-100">
                                    <th className="py-3 px-4 font-bold text-left">{t('ITEM')}</th>
                                    {invoice.type === 'product' && (
                                        <th className="py-3 px-4 font-bold text-center">{t('QTY')}</th>
                                    )}
                                    <th className="py-3 px-4 font-bold text-right">{t('PRICE')}</th>
                                    <th className="py-3 px-4 font-bold text-right">{t('DISCOUNT')}</th>
                                    <th className="py-3 px-4 font-bold text-right">{t('TAX')}</th>
                                    <th className="py-3 px-4 font-bold text-right">{t('TOTAL')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.items?.map((item, index) => (
                                    <tr key={index} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors duration-150 print:border-slate-100">
                                        <td className="py-4 px-4 font-medium text-slate-800">
                                            <div className="font-semibold">{item.product?.name}</div>
                                            {item.product?.sku && (
                                                <div className="text-xs text-slate-400">{t('SKU')}: {item.product.sku}</div>
                                            )}
                                        </td>
                                        {invoice.type === 'product' && (
                                            <td className="py-4 px-4 text-center">{item.quantity}</td>
                                        )}
                                        <td className="py-4 px-4 text-right">{formatCurrency(item.unit_price)}</td>
                                        <td className="py-4 px-4 text-right">
                                            {item.discount_percentage > 0 ? (
                                                <div className="space-y-0.5">
                                                    <div className="text-xs text-slate-400">{item.discount_percentage}%</div>
                                                    <div className="font-semibold text-rose-600">-{formatCurrency(item.discount_amount)}</div>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">0%</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            {item.taxes && item.taxes.length > 0 ? (
                                                <div className="space-y-0.5">
                                                    {item.taxes.map((tax, taxIndex) => (
                                                        <div key={taxIndex} className="text-xs text-slate-400">{tax.tax_name} ({tax.tax_rate}%)</div>
                                                    ))}
                                                    <div className="font-semibold text-slate-700">{formatCurrency(item.tax_amount)}</div>
                                                </div>
                                            ) : item.tax_percentage > 0 ? (
                                                <div className="space-y-0.5">
                                                    <div className="text-xs text-slate-400">{item.tax_percentage}%</div>
                                                    <div className="font-semibold text-slate-700">{formatCurrency(item.tax_amount)}</div>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">0%</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-4 text-right font-bold text-slate-900">{formatCurrency(item.total_amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals Section */}
                    <div className="flex justify-end mb-8 page-break-inside-avoid">
                        <div className="w-full sm:w-80">
                            <div className="border border-slate-100 rounded-xl bg-slate-50/50 p-6 space-y-3 print:bg-white print:border-slate-200">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">{t('Subtotal')}</span>
                                    <span className="font-semibold text-slate-700">{formatCurrency(invoice.subtotal)}</span>
                                </div>
                                {invoice.discount_amount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">{t('Discount')}</span>
                                        <span className="font-semibold text-rose-600">-{formatCurrency(invoice.discount_amount)}</span>
                                    </div>
                                )}
                                {invoice.tax_amount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">{t('Tax')}</span>
                                        <span className="font-semibold text-slate-700">{formatCurrency(invoice.tax_amount)}</span>
                                    </div>
                                )}
                                <div className="border-t border-slate-100 pt-3 mt-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-base font-extrabold text-slate-800">{t('TOTAL')}</span>
                                        <span className="text-xl font-extrabold text-indigo-600">{formatCurrency(invoice.total_amount)}</span>
                                    </div>
                                </div>
                                <div className="border-t border-slate-100 pt-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">{t('Paid')}</span>
                                        <span className="font-semibold text-emerald-600">{formatCurrency(invoice.paid_amount)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm mt-1">
                                        <span className="text-slate-500">{t('Balance Due')}</span>
                                        <span className="font-extrabold text-slate-900">{formatCurrency(invoice.balance_amount)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Terms and Notes Footer */}
                    <div className="border-t border-slate-100 pt-8 text-center space-y-4">
                        {invoice.payment_terms && (
                            <p className="text-slate-600 text-sm font-semibold">
                                {t('PAYMENT TERMS')}: {invoice.payment_terms}
                            </p>
                        )}
                        {invoice.notes && (
                            <div className="text-slate-400 text-xs max-w-lg mx-auto italic">
                                {invoice.notes}
                            </div>
                        )}
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                            {t('Thank you for choosing Dynime!')}
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
