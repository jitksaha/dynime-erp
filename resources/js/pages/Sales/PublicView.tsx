import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
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
    RefreshCw,
    CreditCard,
    DollarSign
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
    paymentGateways?: {
        bkash_enabled?: string;
        sslcommerz_enabled?: string;
        stripe_onsite_enabled?: string;
        stripe_hosted_enabled?: string;
        keeal_enabled?: string;
        dodopayment_enabled?: string;
        bank_transfer_enabled?: string;
        bank_accounts?: any[];
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

export default function PublicView({ invoice, companySettings, paymentGateways }: PublicViewProps) {
    const [isDownloading, setIsDownloading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [selectedGateway, setSelectedGateway] = useState('bkash');
    const [paymentMode, setPaymentMode] = useState<'full' | 'partial'>('full');
    const [partialAmount, setPartialAmount] = useState('');
    
    // Currency Converter State
    const [rates, setRates] = useState<Record<string, number>>({ BDT: 123.24, USD: 1, EUR: 0.92, GBP: 0.78 });
    const [targetCurrency, setTargetCurrency] = useState("BDT");
    const [isFetchingRates, setIsFetchingRates] = useState(false);

    // Calculated Variables & Helpers
    const logoUrl = companySettings?.company_logo || 'https://cdn.dynime.com/media/KVhzkR7rCJFuzFxBU8ljBqFb2PItfQM5i3omxMNF.png';
    const companyName = companySettings?.company_name || 'Dynime Inc';
    const companyDomain = companySettings?.company_email ? companySettings.company_email.split('@')[1] : 'dynime.com';
    const companyEmail = companySettings?.company_email || 'billing@dynime.com';
    const companyPhone = companySettings?.company_telephone || '';
    const companyAddress = [
        companySettings?.company_address,
        companySettings?.company_city,
        companySettings?.company_state,
        companySettings?.company_country
    ].filter(Boolean).join(', ');

    const dateOfIssue = invoice.invoice_date || invoice.created_at ? new Date(invoice.invoice_date || invoice.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A';
    const dateDue = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A';
    const estDeliveryDate = invoice.estimated_delivery_date ? new Date(invoice.estimated_delivery_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : dateDue;

    const getStatusText = (status?: string) => {
        const s = (status || invoice.payment_status || 'unpaid').toString().toLowerCase();
        if (s.includes('paid') && !s.includes('unpaid') && !s.includes('partially')) return 'Payment Completed';
        if (s.includes('overdue')) return 'Payment Overdue';
        if (s.includes('partially')) return 'Partially Paid';
        return 'Payment Pending';
    };

    const getStatusBadgeStyles = (status?: string) => {
        const s = (status || invoice.payment_status || 'unpaid').toString().toLowerCase();
        if (s.includes('paid') && !s.includes('unpaid') && !s.includes('partially')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (s.includes('overdue')) return 'bg-rose-50 text-rose-700 border-rose-200';
        if (s.includes('partially')) return 'bg-amber-50 text-amber-700 border-amber-200';
        return 'bg-blue-50 text-blue-700 border-blue-200';
    };

    const getStatusIcon = (status?: string) => {
        const s = (status || invoice.payment_status || 'unpaid').toString().toLowerCase();
        if (s.includes('paid') && !s.includes('unpaid') && !s.includes('partially')) return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
        if (s.includes('overdue')) return <AlertCircle className="w-3.5 h-3.5 text-rose-600" />;
        if (s.includes('partially')) return <Clock className="w-3.5 h-3.5 text-amber-600" />;
        return <Clock className="w-3.5 h-3.5 text-blue-600" />;
    };

    const balanceDue = parseFloat((invoice.balance_amount || invoice.total_amount || 0).toString());
    const convertedAmount = balanceDue * (rates[targetCurrency] || 1);
    const includedServices = invoice.service_brief?.included_services || [];

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
        const num = parseFloat(String(amount || 0));
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
                const html2pdfModule = await import('html2pdf.js');
                const html2pdf = html2pdfModule.default || html2pdfModule;
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
        <div className="min-h-screen bg-[#1A1D23] pb-24 print:pb-0 print:bg-white">
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
            <div className="max-w-[850px] mx-auto mt-4 mb-4 px-4 sm:px-0 flex flex-col sm:flex-row justify-between items-center gap-3 print:hidden">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-500">Share Invoice URL</span>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                    {balanceDue > 0 && (
                        <Button
                            onClick={() => { setPaymentMode('full'); setPartialAmount(''); setIsPayModalOpen(true); }}
                            className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold shadow-lg shadow-indigo-500/25 rounded-xl px-5 transition-all duration-200"
                        >
                            <CreditCard className="h-4 w-4 mr-2" /> Pay Online ({formatCurrency(balanceDue)})
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={copyLink} className="bg-white/10 border-white/20 text-white/80 hover:bg-white/20 rounded-xl">
                        <Share2 className="h-4 w-4 mr-2 text-white/60" />
                        {copied ? 'Copied!' : 'Copy link'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadPDF} className="bg-white/10 border-white/20 text-white/80 hover:bg-white/20 rounded-xl">
                        <Download className="h-4 w-4 mr-2 text-white/60" />
                        Save PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePrint} className="bg-white/10 border-white/20 text-white/80 hover:bg-white/20 rounded-xl">
                        <Printer className="h-4 w-4 mr-2 text-white/60" />
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
                            <div className="sm:text-right flex flex-col items-end">
                                <img 
                                    src={logoUrl} 
                                    alt={companyName} 
                                    className="h-[32px] object-contain mb-1.5" 
                                />
                                <p className="text-slate-400 text-[11px]">{companyDomain}</p>
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
                        <div className={`status-banner-grid-print grid grid-cols-1 ${invoice.project_category && invoice.project_category !== 'N/A' ? 'sm:grid-cols-3 print:grid-cols-3' : 'sm:grid-cols-2 print:grid-cols-2'} gap-4 bg-gradient-to-br from-slate-50/80 to-slate-50/40 border border-slate-100 rounded-xl p-4 mb-6`}>
                            {/* Payment Status */}
                            <div className="flex items-center gap-3 bg-white/60 rounded-lg px-3 py-2.5">
                                <div className="shrink-0">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Payment status</span>
                                    <span className={getPaymentStatusBadgeClasses(invoice.payment_status || 'Unpaid')}>
                                        {invoice.payment_status || 'Unpaid'}
                                    </span>
                                </div>
                            </div>

                            {/* Operational Status */}
                            <div className="flex items-center gap-3 bg-white/60 rounded-lg px-3 py-2.5">
                                <div className="shrink-0">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Operational status</span>
                                    <span className={getOperationalStatusBadgeClasses(invoice.operational_status || 'Pending')}>
                                        {invoice.operational_status || 'Pending'}
                                    </span>
                                </div>
                            </div>

                            {/* Project Status */}
                            {invoice.project_category && invoice.project_category !== 'N/A' && (
                                <div className="flex items-start gap-3 bg-white/60 rounded-lg px-3 py-2.5">
                                    <div className="w-full">
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Project status</span>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={getProjectStatusBadgeClasses(invoice.project_status || '')}>
                                                {invoice.project_status || 'N/A'}
                                            </span>
                                        </div>
                                        {invoice.project_status && PROJECT_STATUS_MAP[invoice.project_category]?.find(x => x.label === invoice.project_status)?.desc && (
                                            <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
                                                {PROJECT_STATUS_MAP[invoice.project_category].find(x => x.label === invoice.project_status)?.desc}
                                            </p>
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
                                    {companyPhone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {companyPhone}</p>}
                                    <p className="flex items-center gap-2">
                                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" /> 
                                        <span className="leading-snug">{companyAddress}</span>
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
                                    {Number(invoice.paid_amount || 0) > 0 ? "BALANCE DUE" : "AMOUNT DUE"}
                                </span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-[30px] font-black text-slate-900 tracking-tight leading-none">
                                        {formatCurrency(Number(invoice.paid_amount || 0) > 0 ? invoice.balance_amount : invoice.total_amount)}
                                    </span>
                                    <span className="text-[13px] text-slate-400">due {dateDue}</span>
                                </div>
                                {Number(invoice.paid_amount || 0) > 0 && (
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
                                    {Number(invoice.paid_amount || 0) > 0 && (
                                        <div className="flex justify-between text-slate-600 text-[13px]">
                                            <span>Paid Amount</span>
                                            <span className="font-medium text-emerald-600">{formatCurrency(invoice.paid_amount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between border-t border-slate-200 pt-2 text-[14px] font-bold text-slate-900">
                                        <span>Balance Due</span>
                                        <span className={Number(invoice.balance_amount || 0) > 0 ? "text-indigo-600 font-extrabold" : "text-slate-900"}>{formatCurrency(invoice.balance_amount)}</span>
                                    </div>

                                    {/* Pay Full / Pay Partial Buttons */}
                                    {Number(invoice.balance_amount || 0) > 0 && (
                                        <div className="flex gap-2 mt-3 print:hidden">
                                            <button
                                                onClick={() => { setPaymentMode('full'); setPartialAmount(''); setIsPayModalOpen(true); }}
                                                className="flex-1 flex items-center justify-center gap-1.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[12px] font-bold py-2.5 px-3 rounded-xl transition-all duration-200 shadow-md shadow-indigo-500/20"
                                            >
                                                <CreditCard className="h-3.5 w-3.5" />
                                                Pay Full
                                            </button>
                                            <button
                                                onClick={() => { setPaymentMode('partial'); setPartialAmount(''); setIsPayModalOpen(true); }}
                                                className="flex-1 flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-[#4F46E5] border-2 border-[#4F46E5]/20 hover:border-[#4F46E5]/40 text-[12px] font-bold py-2.5 px-3 rounded-xl transition-all duration-200"
                                            >
                                                <DollarSign className="h-3.5 w-3.5" />
                                                Pay Partial
                                            </button>
                                        </div>
                                    )}
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
                                            {Number(invoice.paid_amount || 0) > 0 ? "Balance Due" : "Amount Due"}
                                        </span>
                                        <p className="text-[13.5px] font-bold text-slate-800">
                                            {formatCurrency(Number(invoice.paid_amount || 0) > 0 ? invoice.balance_amount : invoice.total_amount)}
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
                                    <img src={logoUrl} alt={companyName} className="h-6 object-contain" />
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
                    <p className="text-xs text-slate-500 font-medium">
                        Public link: <span className="text-[#4F46E5] font-semibold">https://billing.dynime.com/{invoice.invoice_number}</span>
                    </p>
                </div>

            </div>
            
            {/* Custom print styling to inject clean page break and custom page setup */}
            {/* ============================================================== */}
            {/* PAYMENT SELECTOR MODAL (Screen Only) */}
            {/* ============================================================== */}
            {isPayModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden" style={{animation: 'fadeInScale 0.2s ease-out'}}>
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                                    <CreditCard className="h-5 w-5 text-[#4F46E5]" /> Pay Invoice #{invoice.invoice_number}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">{paymentMode === 'partial' ? 'Enter partial payment amount' : 'Pay the full balance due'}</p>
                            </div>
                            <button
                                onClick={() => setIsPayModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            {/* Payment Mode Toggle */}
                            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                                <button
                                    type="button"
                                    onClick={() => { setPaymentMode('full'); setPartialAmount(''); }}
                                    className={`flex-1 py-2 px-3 rounded-lg text-[12px] font-bold transition-all duration-200 ${paymentMode === 'full' ? 'bg-[#4F46E5] text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
                                >
                                    Pay Full Amount
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentMode('partial')}
                                    className={`flex-1 py-2 px-3 rounded-lg text-[12px] font-bold transition-all duration-200 ${paymentMode === 'partial' ? 'bg-[#4F46E5] text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
                                >
                                    Pay Partial Amount
                                </button>
                            </div>

                            {/* Amount Display */}
                            <div className="bg-gradient-to-r from-indigo-50 to-slate-50 dark:from-indigo-950/30 dark:to-slate-800/50 p-4 rounded-xl border border-indigo-100/60 dark:border-indigo-900/40">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Balance Due</span>
                                    <span className="text-sm font-bold text-slate-600">{formatCurrency(balanceDue)}</span>
                                </div>
                                {paymentMode === 'partial' && (
                                    <div className="mt-3">
                                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Amount to Pay</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">{getSymbol(invoice.service_brief?.currency || 'USD')}</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                max={balanceDue}
                                                value={partialAmount}
                                                onChange={(e) => setPartialAmount(e.target.value)}
                                                placeholder={`Max ${balanceDue.toFixed(2)}`}
                                                className="w-full pl-8 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] outline-none transition-all"
                                            />
                                        </div>
                                        {partialAmount && parseFloat(partialAmount) > balanceDue && (
                                            <p className="text-[11px] text-rose-500 mt-1 font-medium">Amount cannot exceed balance due</p>
                                        )}
                                    </div>
                                )}
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-indigo-100/60 dark:border-indigo-900/40">
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">You will pay</span>
                                    <span className="text-xl font-extrabold text-[#4F46E5]">
                                        {formatCurrency(paymentMode === 'partial' && partialAmount ? Math.min(parseFloat(partialAmount) || 0, balanceDue) : balanceDue)}
                                    </span>
                                </div>
                            </div>

                            <form action={typeof window !== 'undefined' ? `${window.location.pathname.replace(/\/$/, '')}/pay` : `/invoice/${invoice.invoice_number}/pay`} method="POST" className="space-y-4">
                                <input type="hidden" name="_token" value={(document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || ''} />
                                <input type="hidden" name="gateway" value={selectedGateway} />
                                <input type="hidden" name="amount" value={paymentMode === 'partial' && partialAmount ? Math.min(parseFloat(partialAmount) || 0, balanceDue) : balanceDue} />

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Payment Method</label>

                                    {paymentGateways?.bkash_enabled === 'on' && (
                                        <label className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${selectedGateway === 'bkash' ? 'border-pink-500 bg-pink-50/50 dark:bg-pink-950/20 ring-2 ring-pink-500/20' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'}`}>
                                            <div className="flex items-center gap-3">
                                                <input type="radio" name="gateway_radio" checked={selectedGateway === 'bkash'} onChange={() => setSelectedGateway('bkash')} className="text-pink-600" />
                                                <div>
                                                    <div className="font-bold text-sm text-slate-900 dark:text-white">bKash Tokenized Checkout</div>
                                                    <div className="text-xs text-slate-500">Pay directly in BDT with instant OTP & PIN</div>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold px-2 py-0.5 bg-pink-100 text-pink-700 rounded-md">BDT ৳</span>
                                        </label>
                                    )}

                                    {paymentGateways?.sslcommerz_enabled === 'on' && (
                                        <label className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${selectedGateway === 'sslcommerz' ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'}`}>
                                            <div className="flex items-center gap-3">
                                                <input type="radio" name="gateway_radio" checked={selectedGateway === 'sslcommerz'} onChange={() => setSelectedGateway('sslcommerz')} className="text-emerald-600" />
                                                <div>
                                                    <div className="font-bold text-sm text-slate-900 dark:text-white">SSLCommerz (Bangladesh)</div>
                                                    <div className="text-xs text-slate-500">Cards, Mobile Banking & Net Banking</div>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md">Cards / MFS</span>
                                        </label>
                                    )}

                                    {paymentGateways?.stripe_onsite_enabled === 'on' && (
                                        <label className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${selectedGateway === 'stripe_express' ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 ring-2 ring-indigo-500/20' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'}`}>
                                            <div className="flex items-center gap-3">
                                                <input type="radio" name="gateway_radio" checked={selectedGateway === 'stripe_express'} onChange={() => setSelectedGateway('stripe_express')} className="text-indigo-600" />
                                                <div>
                                                    <div className="font-bold text-sm text-slate-900 dark:text-white">Direct Card & Express Pay</div>
                                                    <div className="text-xs text-slate-500">Apple Pay, Google Pay & On-site Card</div>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md">Stripe</span>
                                        </label>
                                    )}

                                    {paymentGateways?.keeal_enabled === 'on' && (
                                        <label className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${selectedGateway === 'keeal' ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20 ring-2 ring-purple-500/20' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'}`}>
                                            <div className="flex items-center gap-3">
                                                <input type="radio" name="gateway_radio" checked={selectedGateway === 'keeal'} onChange={() => setSelectedGateway('keeal')} className="text-purple-600" />
                                                <div>
                                                    <div className="font-bold text-sm text-slate-900 dark:text-white">PayPal & Cards (Keeal)</div>
                                                    <div className="text-xs text-slate-500">Hosted PayPal & Global Card Checkout</div>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md">PayPal</span>
                                        </label>
                                    )}

                                    {paymentGateways?.bank_transfer_enabled === 'on' && (
                                        <label className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${selectedGateway === 'bank_transfer' ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 ring-2 ring-amber-500/20' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'}`}>
                                            <div className="flex items-center gap-3">
                                                <input type="radio" name="gateway_radio" checked={selectedGateway === 'bank_transfer'} onChange={() => setSelectedGateway('bank_transfer')} className="text-amber-600" />
                                                <div>
                                                    <div className="font-bold text-sm text-slate-900 dark:text-white">Bank Transfer (Manual Deposit)</div>
                                                    <div className="text-xs text-slate-500">Direct wire transfer to company account</div>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md">Bank</span>
                                        </label>
                                    )}
                                </div>

                                {selectedGateway === 'bank_transfer' && (
                                    <div className="bg-amber-50/80 dark:bg-amber-950/30 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900 text-xs space-y-2">
                                        <div className="font-bold text-amber-900 dark:text-amber-300">Bank Wire Details:</div>
                                        <p className="text-amber-800 dark:text-amber-400">Account: Dynime Inc. | Bank of America</p>
                                        <p className="text-amber-800 dark:text-amber-400">A/C: 48301928471 | SWIFT: BOFAUS3N</p>
                                        <p className="text-slate-500 italic">Reference: #{invoice.invoice_number}</p>
                                    </div>
                                )}

                                <div className="pt-3">
                                    <Button
                                        type="submit"
                                        disabled={paymentMode === 'partial' && (!partialAmount || parseFloat(partialAmount) <= 0 || parseFloat(partialAmount) > balanceDue)}
                                        className="w-full bg-[#4F46E5] hover:bg-[#4338CA] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 text-sm rounded-xl shadow-lg shadow-indigo-500/20 transition-all duration-200"
                                    >
                                        <CreditCard className="h-4 w-4 mr-2" />
                                        {paymentMode === 'partial' ? `Pay ${partialAmount ? formatCurrency(Math.min(parseFloat(partialAmount) || 0, balanceDue)) : 'Partial Amount'}` : `Pay Full ${formatCurrency(balanceDue)}`}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

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

