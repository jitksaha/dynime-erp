import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import html2pdf from 'html2pdf.js';
import { Button } from '@/components/ui/button';
import { 
    Printer, 
    Download, 
    Share2, 
    CheckCircle2, 
    AlertCircle, 
    Clock, 
    Building2, 
    Mail, 
    Phone, 
    MapPin, 
    User, 
    Briefcase,
    Truck,
    CalendarCheck,
    Check,
    ArrowLeftRight,
    RefreshCw
} from 'lucide-react';
import { SalesInvoice } from './types';
import { getPaymentStatusBadgeClasses, getOperationalStatusBadgeClasses, getProjectStatusBadgeClasses, PROJECT_STATUS_MAP } from './utils';

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

const getSymbol = (currency: string): string => {
    const symbols: Record<string, string> = {
        USD: '$',
        EUR: '€',
        GBP: '£',
        AUD: 'A$',
        CAD: 'C$',
        JPY: '¥',
        SGD: 'S$',
        INR: '₹',
        AED: 'د.إ',
        SAR: 'ر.س',
        CHF: 'CHF',
        CNY: '¥',
        NZD: 'NZ$',
        HKD: 'HK$',
        SEK: 'kr',
        NOK: 'kr',
        DKK: 'kr',
        MYR: 'RM',
        THB: '฿',
        PHP: '₱',
        IDR: 'Rp',
        MXN: 'MX$',
        BRL: 'R$',
        ZAR: 'R',
        TRY: '₺',
        KRW: '₩',
        PLN: 'zł',
        KWD: 'د.ك',
        QAR: 'ر.ق',
        OMR: 'ر.ع.',
        BHD: '.د.ب',
        EGP: 'E£',
        PKR: '₨',
        LKR: 'Rs',
        NPR: 'Rs',
        VND: '₫',
        RUB: '₽',
        UAH: '₴',
        ILS: '₪',
        BDT: '৳'
    };
    return symbols[currency] || currency;
};

export default function PublicView({ invoice, companySettings }: PublicViewProps) {
    const [isDownloading, setIsDownloading] = useState(false);
    const [copied, setCopied] = useState(false);
    
    // Currency Converter State
    const [rates, setRates] = useState<Record<string, number>>({ BDT: 123.24, USD: 1, EUR: 0.92, GBP: 0.78 });
    const [targetCurrency, setTargetCurrency] = useState("BDT");
    const [isFetchingRates, setIsFetchingRates] = useState(false);

    useEffect(() => {
        setIsFetchingRates(true);
        const baseCurrency = invoice.service_brief?.currency || 'USD';
        fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.rates) {
                    setRates(data.rates);
                }
            })
            .catch(err => console.error("Exchange rate fetch failed, using default fallback rates:", err))
            .finally(() => setIsFetchingRates(false));
    }, [invoice.service_brief?.currency]);

    const formatMockDate = (dateStr: any) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount: any) => {
        const num = parseFloat(amount || 0);
        const baseCurrency = invoice.service_brief?.currency || 'USD';
        const symbol = getSymbol(baseCurrency);
        return symbol + ' ' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatConvertedCurrency = (amount: number, currency: string) => {
        if (currency === 'BDT') {
            const formatted = new Intl.NumberFormat('en-IN', {
                maximumFractionDigits: 0
            }).format(amount);
            
            const bengaliNums: Record<string, string> = {
                '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
                '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
            };
            return formatted.replace(/\d/g, (digit) => bengaliNums[digit] || digit);
        }
        return amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
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
                margin: 0,
                filename: `Invoice-${invoice.invoice_number}.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
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

    const defaultInclusions = [
        "Custom Website Design & Development",
        "Frontend Development",
        "Backend Development & Database Setup",
        "Admin Panel & Order Management System (OMS)",
        "Point of Sale (POS) Integration",
        "Responsive Design (Desktop, Tablet & Mobile)",
        "Cloud Storage Integration (S3 Compatible, if required)",
        "CDN Setup & Configuration",
        "Performance Optimization & Speed Enhancement",
        "Security & SSL Configuration",
        "Testing, Deployment & Go-Live Support",
        "Hostinger KVM 8 VPS Hosting (2 Years)",
        "Performance Target",
        "Fast-loading website architecture",
        "Optimized Core Web Vitals",
        "PageSpeed Performance Target: 90+ Desktop"
    ];

    const includedServices = invoice.service_brief?.included_services || [];

    // Resolve Billed From details dynamically
    const companyName = companySettings?.company_name || "Dynime LLC.";
    const companyEmail = companySettings?.company_email || "support@dynime.com";
    const companyPhone = companySettings?.company_telephone || "+1 (646) 884-0271";
    const companyDomain = companyEmail.split('@')[1] || "dynime.com";
    
    const addressParts = [
        companySettings?.company_address,
        companySettings?.company_city,
        companySettings?.company_state,
        companySettings?.company_zipcode,
        companySettings?.company_country
    ].filter(Boolean);
    const companyAddress = addressParts.length > 0 
        ? addressParts.join(', ') 
        : "244 5th Ave, Suite #1964, New York, NY 10001, USA";

    const rawLogo = companySettings?.company_logo;
    const logoUrl = rawLogo 
        ? (rawLogo.startsWith('http') ? rawLogo : `/storage/${rawLogo}`)
        : "https://cdn.dynime.com/media/KVhzkR7rCJFuzFxBU8ljBqFb2PItfQM5i3omxMNF.png";

    // Format dates
    const dateOfIssue = formatMockDate(invoice.invoice_date);
    const dateDue = formatMockDate(invoice.due_date);
    const estDeliveryDate = invoice.estimated_delivery_date ? formatMockDate(invoice.estimated_delivery_date) : 'Aug 10, 2026';

    const getStatusText = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid':
                return 'Payment Completed';
            case 'overdue':
                return 'Payment Overdue';
            default:
                return 'Payment Pending';
        }
    };

    const getStatusBadgeStyles = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'overdue':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            default:
                return 'bg-amber-50 text-amber-700 border-amber-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid':
                return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
            case 'overdue':
                return <AlertCircle className="h-4 w-4 text-rose-500" />;
            default:
                return <Clock className="h-4 w-4 text-amber-500" />;
        }
    };

    const convertedAmount = (invoice.total_amount || 0) * (rates[targetCurrency] || 123.24);

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 print:pb-0 print:bg-white">
            <Head title={`Invoice ${invoice.invoice_number}`} />

            {isDownloading && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 print:hidden">
                    <div className="bg-white p-6 rounded-2xl shadow-xl flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                        <p className="text-lg font-semibold text-slate-700">Generating PDF...</p>
                    </div>
                </div>
            )}

            {/* Quick Action bar (hidden in print) */}
            <div className="max-w-[850px] mx-auto mt-12 mb-6 px-4 sm:px-0 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-400">Share Invoice URL</span>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                    <Button variant="outline" size="sm" onClick={copyLink} className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl">
                        <Share2 className="h-4 w-4 mr-2 text-slate-500" />
                        {copied ? 'Copied!' : 'Copy link'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadPDF} className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl">
                        <Download className="h-4 w-4 mr-2 text-slate-500" />
                        Save PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePrint} className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl">
                        <Printer className="h-4 w-4 mr-2 text-slate-500" />
                        Print
                    </Button>
                </div>
            </div>

            {/* Print Container (Single Card on Web Screen, Split Page during Print) */}
            <div className="invoice-card-container max-w-[850px] mx-auto px-4 sm:px-0 print:p-0 print:max-w-full">
                
                <div className="bg-white shadow-xl rounded-2xl border border-slate-100 relative overflow-hidden print:shadow-none print:border-none print:p-0 print:m-0">
                    
                    {/* ============================================================== */}
                    {/* PAGE 1 CONTENT */}
                    {/* ============================================================== */}
                    <div className="p-6 sm:p-10 pb-4 print:p-0 print:pb-0">
                        {/* Golden/Orange Accent top bar */}
                        <div className="absolute top-0 left-0 right-0 h-[6px] bg-[#E59700]" />

                        {/* Logo & Invoice Title Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 mt-2">
                            <div>
                                <h1 className="text-[38px] font-extrabold tracking-tight text-slate-900 leading-none mb-3">Invoice</h1>
                                <div className="flex items-center gap-4">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeStyles(invoice.status)}`}>
                                        {getStatusIcon(invoice.status)}
                                        {getStatusText(invoice.status)}
                                    </span>
                                    <span className="text-slate-500 text-[13px]">Due {dateDue}</span>
                                </div>
                            </div>
                            <div className="sm:text-right">
                                {logoUrl ? (
                                    <>
                                        <img 
                                            src={logoUrl} 
                                            alt={companyName} 
                                            className="h-[26px] object-contain mb-1.5 sm:ml-auto" 
                                        />
                                        <p className="text-slate-500 text-[11px]">{companyDomain}</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="font-bold text-slate-800 text-[13px] leading-tight mb-0.5">{companyName}</p>
                                        <p className="text-slate-500 text-[11px]">{companyDomain}</p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Meta Fields Grid */}
                        <div className="meta-fields-grid-print grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-x-6 md:gap-x-12 gap-y-3 border-t border-b border-slate-100 py-4 mb-6">
                            {/* Col 1 */}
                            <div className="space-y-2.5">
                                <div className="flex justify-between items-center text-[12.5px]">
                                    <span className="text-slate-400">Invoice number</span>
                                    <span className="font-bold text-slate-900">{invoice.invoice_number}</span>
                                </div>
                                <div className="flex justify-between items-center text-[12.5px]">
                                    <span className="text-slate-400">Date of issue</span>
                                    <span className="font-bold text-slate-900">{dateOfIssue}</span>
                                </div>
                                <div className="flex justify-between items-center text-[12.5px]">
                                    <span className="text-slate-400">Payment method</span>
                                    <span className="font-bold text-slate-900">{invoice.service_brief?.payment_method || 'Bank Transfer'}</span>
                                </div>
                            </div>
                            {/* Col 2 */}
                            <div className="space-y-2.5">
                                <div className="flex justify-between items-center text-[12.5px]">
                                    <span className="text-slate-400">Currency</span>
                                    <span className="font-bold text-slate-900">{invoice.service_brief?.currency || 'USD'}</span>
                                </div>
                                <div className="flex justify-between items-center text-[12.5px]">
                                    <span className="text-slate-400">Date due</span>
                                    <span className="font-bold text-slate-900">{dateDue}</span>
                                </div>
                                <div className="flex justify-between items-center text-[12.5px]">
                                    <span className="text-slate-400">Est. Delivery Date</span>
                                    <span className="font-bold text-[#4F46E5] flex items-center gap-1.5">
                                        {(invoice.type === 'service' || !invoice.warehouse_id) ? <CalendarCheck className="h-4 w-4 shrink-0" /> : <Truck className="h-4 w-4 shrink-0" />}
                                        {estDeliveryDate}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Statuses Horizontal Banner */}
                        <div className={`status-banner-grid-print grid grid-cols-1 ${invoice.project_category && invoice.project_category !== 'N/A' ? 'sm:grid-cols-3 print:grid-cols-3' : 'sm:grid-cols-2 print:grid-cols-2'} gap-6 bg-slate-50/50 border border-slate-100 rounded-xl p-4 mb-6`}>
                            {/* Payment Status */}
                            <div className="space-y-1">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Payment status</span>
                                <div className="flex items-center">
                                    <span className={getPaymentStatusBadgeClasses(invoice.payment_status || 'Unpaid')}>
                                        {invoice.payment_status || 'Unpaid'}
                                    </span>
                                </div>
                            </div>

                            {/* Operational Status */}
                            <div className="space-y-1">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Operational status</span>
                                <div className="flex items-center">
                                    <span className={getOperationalStatusBadgeClasses(invoice.operational_status || 'Pending')}>
                                        {invoice.operational_status || 'Pending'}
                                    </span>
                                </div>
                            </div>

                            {/* Project Status */}
                            {invoice.project_category && invoice.project_category !== 'N/A' && (
                                <div className="space-y-1">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Project status</span>
                                    <div className="flex flex-col items-start">
                                        <span className={getProjectStatusBadgeClasses(invoice.project_status || '')}>
                                            {invoice.project_status || 'N/A'}
                                        </span>
                                        {invoice.project_status && PROJECT_STATUS_MAP[invoice.project_category]?.find(x => x.label === invoice.project_status)?.desc && (
                                            <span className="text-[11px] text-slate-500 mt-1 max-w-[280px] leading-tight block">
                                                {PROJECT_STATUS_MAP[invoice.project_category].find(x => x.label === invoice.project_status)?.desc}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* From & Billed To Addresses */}
                        <div className="addresses-grid-print grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-8 mb-6 print-avoid-break">
                            {/* FROM */}
                            <div>
                                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                                    FROM
                                </div>
                                <div className="space-y-1.5 text-[12.5px] text-slate-600">
                                    <p className="font-bold text-slate-900 text-[13.5px]">{companyName}</p>
                                    <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {companyEmail}</p>
                                    <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {companyPhone}</p>
                                    <p className="flex items-start gap-2">
                                        <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" /> 
                                        <span className="leading-tight">{companyAddress}</span>
                                    </p>
                                </div>
                            </div>
                            {/* BILLED TO */}
                            <div>
                                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                                    BILLED TO
                                </div>
                                <div className="space-y-1.5 text-[12.5px] text-slate-600">
                                    <p className="font-bold text-slate-900 text-[13.5px] flex items-center gap-2">
                                        <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                        {invoice.customer?.name}
                                    </p>
                                    <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {invoice.customer?.email}</p>
                                    <p className="flex items-center gap-2"><Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" /> Dew Butterflies</p>
                                </div>
                            </div>
                        </div>

                        {/* Amount Due & Delivery Date Block */}
                        <div className="amount-delivery-grid-print grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-6 border-t border-slate-100 pt-4 pb-4 mb-6">
                            {/* Amount / Balance Due */}
                            <div className="flex flex-col justify-center">
                                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                                    {parseFloat(invoice.paid_amount || 0) > 0 ? "BALANCE DUE" : "AMOUNT DUE"}
                                </span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-[30px] font-black text-slate-900 tracking-tight leading-none">
                                        {formatCurrency(parseFloat(invoice.paid_amount || 0) > 0 ? invoice.balance_amount : invoice.total_amount)}
                                    </span>
                                    <span className="text-[13px] text-slate-400">due {dateDue}</span>
                                </div>
                                {parseFloat(invoice.paid_amount || 0) > 0 && (
                                    <span className="text-[11px] text-slate-500 mt-1 font-medium">
                                        Total: {formatCurrency(invoice.total_amount)} · Paid: {formatCurrency(invoice.paid_amount)}
                                    </span>
                                )}
                            </div>

                            {/* Estimated Delivery Date */}
                            <div className="bg-[#EEF2F6]/60 border border-slate-100 rounded-xl p-3 flex items-center gap-3 print-avoid-break">
                                <div className="bg-white p-2 rounded-full shadow-sm text-[#4F46E5] shrink-0">
                                    {(invoice.type === 'service' || !invoice.warehouse_id) ? <CalendarCheck className="h-4.5 w-4.5" /> : <Truck className="h-4.5 w-4.5" />}
                                </div>
                                <div>
                                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">ESTIMATED DELIVERY DATE</span>
                                    <span className="text-[13px] font-bold text-[#4F46E5]">{estDeliveryDate}</span>
                                </div>
                            </div>
                        </div>

                        <div className="print-avoid-break">
                            {/* Items Table */}
                            <div className="mb-6 overflow-hidden">
                                <table className="w-full text-slate-700 border-collapse">
                                    <thead>
                                        <tr className="border-t-[1.5px] border-b-[1.5px] border-slate-900 text-[11px] font-bold uppercase text-slate-800">
                                            <th className="py-2.5 text-left font-bold w-3/5">DESCRIPTION</th>
                                            <th className="py-2.5 text-center font-bold">QTY</th>
                                            <th className="py-2.5 text-right font-bold">UNIT PRICE</th>
                                            <th className="py-2.5 text-right font-bold">AMOUNT</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoice.items?.map((item, index) => (
                                            <tr key={index} className="border-b border-slate-100 text-[13px]">
                                                <td className="py-3 pr-4 text-slate-900">
                                                    <div className="font-semibold leading-tight">{item.product?.name}</div>
                                                    {item.product?.sku && (
                                                        <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wide">SKU: {item.product.sku}</div>
                                                    )}
                                                </td>
                                                <td className="py-3 text-center text-slate-700">{item.quantity}</td>
                                                <td className="py-3 text-right text-slate-600">{formatCurrency(item.unit_price)}</td>
                                                <td className="py-3 text-right font-bold text-slate-950">{formatCurrency(item.total_amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Table Totals aligned right */}
                            <div className="flex justify-end mb-6">
                                <div className="w-[320px] space-y-2.5 text-[13px]">
                                    <div className="flex justify-between border-t border-slate-100 pt-2.5 text-slate-600">
                                        <span>Subtotal</span>
                                        <span className="font-medium text-slate-900">{formatCurrency(invoice.subtotal)}</span>
                                    </div>
                                    {invoice.discount_amount > 0 && (
                                        <div className="flex justify-between text-[#10B981] font-semibold">
                                            <span>Discount</span>
                                            <span>-{formatCurrency(invoice.discount_amount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-slate-600">
                                        <span>Total excluding tax</span>
                                        <span className="font-medium text-slate-900">{formatCurrency(invoice.total_amount)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Tax</span>
                                        <span className="font-medium text-slate-900">{formatCurrency(invoice.tax_amount)}</span>
                                    </div>
                                    <div className="flex justify-between border-t-[1.5px] border-slate-900 pt-2.5 text-[14.5px] font-black text-black">
                                        <span>Total</span>
                                        <span>{formatCurrency(invoice.total_amount)}</span>
                                    </div>
                                    {parseFloat(invoice.paid_amount || 0) > 0 && (
                                        <div className="flex justify-between text-slate-600 text-[13px]">
                                            <span>Paid Amount</span>
                                            <span className="font-medium text-emerald-600">{formatCurrency(invoice.paid_amount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between border-t border-slate-200 pt-2 text-[14px] font-bold text-slate-900">
                                        <span>Balance Due</span>
                                        <span className={parseFloat(invoice.balance_amount || 0) > 0 ? "text-indigo-600 font-extrabold" : "text-slate-900"}>{formatCurrency(invoice.balance_amount)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                            {/* ============================================================== */}
                    {/* LIVE CURRENCY CONVERTER (Screen Only) */}
                    {/* ============================================================== */}
                    <div className="px-6 sm:px-10 py-2.5 bg-[#FAFBFD] border-t border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden text-xs text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5">
                            <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Currency Converter:</span>
                            <span className="font-bold text-slate-800">{formatCurrency(invoice.total_amount)} {invoice.service_brief?.currency || 'USD'}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <span className="text-slate-500">is equivalent to</span>
                            <div className="flex items-center gap-1 bg-indigo-50/50 border border-indigo-100/60 rounded-lg py-1 px-2.5">
                                <span className="font-extrabold text-indigo-600 text-[13px] whitespace-nowrap">
                                    {targetCurrency === 'BDT' ? `৳ ${formatConvertedCurrency(convertedAmount, 'BDT')}` : `${getSymbol(targetCurrency)} ${formatConvertedCurrency(convertedAmount, targetCurrency)}`}
                                </span>
                                <select
                                    value={targetCurrency}
                                    onChange={(e) => setTargetCurrency(e.target.value)}
                                    className="bg-transparent border-none text-[11px] font-bold text-indigo-600 focus:outline-none focus:ring-0 cursor-pointer py-0 pl-1 pr-6 m-0"
                                    aria-label="Convert invoice total to currency"
                                >
                                <option value="BDT">BDT — Bangladeshi Taka</option>
                                <option value="USD">USD — US Dollar</option>
                                <option value="EUR">EUR — Euro</option>
                                <option value="GBP">GBP — British Pound</option>
                                <option value="AUD">AUD — Australian Dollar</option>
                                <option value="CAD">CAD — Canadian Dollar</option>
                                <option value="JPY">JPY — Japanese Yen</option>
                                <option value="SGD">SGD — Singapore Dollar</option>
                                <option value="INR">INR — Indian Rupee</option>
                                <option value="AED">AED — UAE Dirham</option>
                                <option value="SAR">SAR — Saudi Riyal</option>
                                <option value="CHF">CHF — Swiss Franc</option>
                                <option value="CNY">CNY — Chinese Yuan</option>
                                <option value="NZD">NZD — New Zealand Dollar</option>
                                <option value="HKD">HKD — Hong Kong Dollar</option>
                                <option value="SEK">SEK — Swedish Krona</option>
                                <option value="NOK">NOK — Norwegian Krone</option>
                                <option value="DKK">DKK — Danish Krone</option>
                                <option value="MYR">MYR — Malaysian Ringgit</option>
                                <option value="THB">THB — Thai Baht</option>
                                <option value="PHP">PHP — Philippine Peso</option>
                                <option value="IDR">IDR — Indonesian Rupiah</option>
                                <option value="MXN">MXN — Mexican Peso</option>
                                <option value="BRL">BRL — Brazilian Real</option>
                                <option value="ZAR">ZAR — South African Rand</option>
                                <option value="TRY">TRY — Turkish Lira</option>
                                <option value="KRW">KRW — South Korean Won</option>
                                <option value="PLN">PLN — Polish Zloty</option>
                                <option value="KWD">KWD — Kuwaiti Dinar</option>
                                <option value="QAR">QAR — Qatari Rial</option>
                                <option value="OMR">OMR — Omani Rial</option>
                                <option value="BHD">BHD — Bahraini Dinar</option>
                                <option value="EGP">EGP — Egyptian Pound</option>
                                <option value="PKR">PKR — Pakistani Rupee</option>
                                <option value="LKR">LKR — Sri Lankan Rupee</option>
                                <option value="NPR">NPR — Nepalese Rupee</option>
                                <option value="VND">VND — Vietnamese Dong</option>
                                <option value="RUB">RUB — Russian Ruble</option>
                                <option value="UAH">UAH — Ukrainian Hryvnia</option>
                                <option value="ILS">ILS — Israeli New Shekel</option>
                             </select>
                            </div>
                            {isFetchingRates && <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400 ml-1" />}
                        </div>
                    </div>

                    {/* ============================================================== */}
                    {/* PAGE 2 CONTENT (Prints on page 2 via page-break styling) */}
                    {/* ============================================================== */}
                    <div className="p-6 sm:p-10 pt-8 print:p-0 print:pt-8 print-page-break print-page-break-container border-t border-slate-50 print:border-none">
                        
                        {includedServices.length > 0 && (
                            <>
                                {/* Inclusion title */}
                                <div className="mb-4">
                                    <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-slate-400" />
                                        WHAT'S INCLUDED
                                    </h2>
                                </div>

                                {/* 2-Column inclusions grid */}
                                <div className="inclusions-grid-print grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-x-12 gap-y-3 mb-6 pb-6 border-b border-slate-100">
                                    {includedServices.map((service: string, index: number) => (
                                        <div key={index} className="flex items-start gap-3 text-[12.5px] text-slate-700 leading-tight">
                                            <div className="bg-[#ECFDF5] border border-emerald-100 p-0.5 rounded-full mt-0.5 text-emerald-600">
                                                <Check className="h-3 w-3 stroke-[3]" />
                                            </div>
                                            <span>{service}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        <div className="print-avoid-break">
                            {/* Project Brief Columns */}
                            <div className="mb-8">
                                <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                    <Briefcase className="h-4 w-4 text-slate-400" />
                                    PROJECT BRIEF
                                </h3>
                                <div className="project-brief-grid-print grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-6">
                                    <div className="space-y-0.5">
                                        <span className="text-[11px] text-slate-400 uppercase font-semibold">Due Date</span>
                                        <p className="text-[13.5px] font-bold text-slate-800">{invoice.due_date ? formatMockDate(invoice.due_date) : 'July 1, 2026'}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-[11px] text-slate-400 uppercase font-semibold">
                                            {parseFloat(invoice.paid_amount || 0) > 0 ? "Balance Due" : "Amount Due"}
                                        </span>
                                        <p className="text-[13.5px] font-bold text-slate-800">
                                            {formatCurrency(parseFloat(invoice.paid_amount || 0) > 0 ? invoice.balance_amount : invoice.total_amount)}
                                        </p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-[11px] text-slate-400 uppercase font-semibold">Estimated Delivery Date</span>
                                        <p className="text-[13.5px] font-bold text-slate-800">{estDeliveryDate}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Page 2 Footer / Signature */}
                            <div className="border-t border-slate-100 pt-6 text-center space-y-3.5">
                                <div className="flex items-center justify-center text-[13px] font-bold text-slate-800">
                                    {logoUrl ? (
                                        <img src={logoUrl} alt={companyName} className="h-6 object-contain" />
                                    ) : (
                                        <span>{companyName}</span>
                                    )}
                                </div>
                                <p className="text-[12.5px] text-slate-600 font-medium">Thank you for choosing <span className="font-bold">Dynime</span>.</p>
                                <p className="text-[11.5px] text-slate-400">
                                    Questions? Email <span className="text-slate-600 font-medium">{companyEmail}</span> · Reference #{invoice.invoice_number}
                                </p>
                                <p className="text-[10px] text-slate-300 font-semibold">{companyDomain}</p>
                            </div>
                        </div>

                    </div>

                </div>

                {/* Public Link Label under Card (hidden in print) */}
                <div className="mt-6 text-center print:hidden">
                    <p className="text-xs text-slate-400 font-medium">
                        Public link: <span className="text-[#4F46E5] font-semibold">https://billing.dynime.com/{invoice.invoice_number}</span>
                    </p>
                </div>

            </div>
            
            {/* Custom print styling to inject clean page break and custom page setup */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    @page {
                        size: auto;
                        margin: 0;
                    }
                    body {
                        background-color: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .invoice-card-container {
                        padding: 1.2cm 1.5cm !important;
                        max-width: 100% !important;
                        width: 100% !important;
                    }
                    .print-page-break-container {
                        page-break-before: always !important;
                        break-before: page !important;
                        margin-top: 1.5rem !important;
                        padding-top: 1.5rem !important;
                    }
                    .print-avoid-break {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                    .meta-fields-grid-print {
                        display: grid !important;
                        grid-template-columns: repeat(2, 1fr) !important;
                        gap: 1.5rem !important;
                    }
                    .status-banner-grid-print {
                        display: grid !important;
                        grid-template-columns: repeat(${invoice.project_category && invoice.project_category !== 'N/A' ? '3' : '2'}, 1fr) !important;
                        gap: 1.5rem !important;
                    }
                    .addresses-grid-print {
                        display: grid !important;
                        grid-template-columns: repeat(2, 1fr) !important;
                        gap: 2rem !important;
                    }
                    .amount-delivery-grid-print {
                        display: grid !important;
                        grid-template-columns: repeat(2, 1fr) !important;
                        gap: 1.5rem !important;
                    }
                    .inclusions-grid-print {
                        display: grid !important;
                        grid-template-columns: repeat(2, 1fr) !important;
                        gap: 1rem !important;
                    }
                    .project-brief-grid-print {
                        display: grid !important;
                        grid-template-columns: repeat(3, 1fr) !important;
                        gap: 1.5rem !important;
                    }
                }
            `}} />
        </div>
    );
}
