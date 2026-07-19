import React, { useState } from 'react';
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
    Check
} from 'lucide-react';
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
    const [isDownloading, setIsDownloading] = useState(false);
    const [copied, setCopied] = useState(false);

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
        return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

    // Fallback list of included services to display on Page 2 if not present in DB
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

    const includedServices = invoice.service_brief?.included_services || defaultInclusions;

    // Resolve Billed From details (using official details from mockup)
    const companyName = "Dynime LLC.";
    const companyDomain = "dynime.com";
    const companyEmail = "support@dynime.com";
    const companyPhone = "+1 (646) 884-0271";
    const companyAddress = "244 5th Ave, Suite #1964, New York, NY 10001, USA";
    const logoUrl = "https://cdn.dynime.com/media/KVhzkR7rCJFuzFxBU8ljBqFb2PItfQM5i3omxMNF.png";

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

    return (
        <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8 print:p-0 print:bg-white">
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
            <div className="max-w-[850px] mx-auto mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
                <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-700 text-lg tracking-tight flex items-center gap-1.5">
                        <span className="text-[#3B82F6] font-extrabold">dynime</span>
                        <span className="text-slate-400 font-light text-xs lowercase">complete business os</span>
                    </span>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                    <Button variant="outline" size="sm" onClick={copyLink} className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50">
                        <Share2 className="h-4 w-4 mr-2 text-slate-500" />
                        {copied ? 'Copied!' : 'Copy URL'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadPDF} className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50">
                        <Download className="h-4 w-4 mr-2 text-slate-500" />
                        Download PDF
                    </Button>
                    <Button variant="default" size="sm" onClick={handlePrint} className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
                        <Printer className="h-4 w-4 mr-2" />
                        Print Invoice
                    </Button>
                </div>
            </div>

            {/* Print Container */}
            <div className="invoice-card-container max-w-[850px] mx-auto space-y-8 print:space-y-0 print:max-w-full">
                
                {/* ============================================================== */}
                {/* PAGE 1: INVOICE DETAILS */}
                {/* ============================================================== */}
                <div className="bg-white shadow-xl rounded-2xl border border-slate-100 relative overflow-hidden p-8 sm:p-12 print:shadow-none print:border-none print:p-0 print:m-0 page-break-after-always break-after-page">
                    {/* Golden/Orange Accent top bar */}
                    <div className="absolute top-0 left-0 right-0 h-[6px] bg-[#E59700]" />

                    {/* Logo & Invoice Title Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8 mt-4">
                        <div>
                            <h1 className="text-[44px] font-extrabold tracking-tight text-slate-900 leading-none mb-4">Invoice</h1>
                            <div className="flex items-center gap-4">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeStyles(invoice.status)}`}>
                                    {getStatusIcon(invoice.status)}
                                    {getStatusText(invoice.status)}
                                </span>
                                <span className="text-slate-500 text-[14px]">Due {dateDue}</span>
                            </div>
                        </div>
                        <div className="sm:text-right">
                            <img 
                                src={logoUrl} 
                                alt={companyName} 
                                className="h-[28px] object-contain mb-3 sm:ml-auto" 
                            />
                            <p className="font-bold text-slate-800 text-[14px] leading-tight">{companyName}</p>
                            <p className="text-slate-500 text-[13px]">{companyDomain}</p>
                        </div>
                    </div>

                    {/* Meta Fields Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-4 border-t border-b border-slate-100 py-6 mb-8">
                        {/* Col 1 */}
                        <div className="space-y-3.5">
                            <div className="flex justify-between items-center text-[13px]">
                                <span className="text-slate-400">Invoice number</span>
                                <span className="font-bold text-slate-900">{invoice.invoice_number}</span>
                            </div>
                            <div className="flex justify-between items-center text-[13px]">
                                <span className="text-slate-400">Date of issue</span>
                                <span className="font-bold text-slate-900">{dateOfIssue}</span>
                            </div>
                            <div className="flex justify-between items-center text-[13px]">
                                <span className="text-slate-400">Payment method</span>
                                <span className="font-bold text-slate-900">Bank Transfer</span>
                            </div>
                        </div>
                        {/* Col 2 */}
                        <div className="space-y-3.5">
                            <div className="flex justify-between items-center text-[13px]">
                                <span className="text-slate-400">Currency</span>
                                <span className="font-bold text-slate-900">USD</span>
                            </div>
                            <div className="flex justify-between items-center text-[13px]">
                                <span className="text-slate-400">Date due</span>
                                <span className="font-bold text-slate-900">{dateDue}</span>
                            </div>
                            <div className="flex justify-between items-center text-[13px]">
                                <span className="text-slate-400">Est. Delivery Date</span>
                                <span className="font-bold text-[#4F46E5] flex items-center gap-1.5">
                                    <Truck className="h-4 w-4" />
                                    {estDeliveryDate}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* From & Billed To Addresses */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-8">
                        {/* FROM */}
                        <div>
                            <div className="text-[12px] font-extrabold uppercase tracking-wider text-slate-400 mb-3.5 flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5" />
                                FROM
                            </div>
                            <div className="space-y-2 text-[13px] text-slate-600">
                                <p className="font-bold text-slate-900 text-[14px]">{companyName}</p>
                                <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-slate-400" /> {companyEmail}</p>
                                <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-400" /> {companyPhone}</p>
                                <p className="flex items-start gap-2">
                                    <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5" /> 
                                    <span className="leading-tight">{companyAddress}</span>
                                </p>
                            </div>
                        </div>
                        {/* BILLED TO */}
                        <div>
                            <div className="text-[12px] font-extrabold uppercase tracking-wider text-slate-400 mb-3.5 flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5" />
                                BILLED TO
                            </div>
                            <div className="space-y-2 text-[13px] text-slate-600">
                                <p className="font-bold text-slate-900 text-[14px] flex items-center gap-2">
                                    <User className="h-3.5 w-3.5 text-slate-400" />
                                    {invoice.customer?.name}
                                </p>
                                <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-slate-400" /> {invoice.customer?.email}</p>
                                <p className="flex items-center gap-2"><Briefcase className="h-3.5 w-3.5 text-slate-400" /> Dew Butterflies</p>
                            </div>
                        </div>
                    </div>

                    {/* Amount Due banner block */}
                    <div className="mb-8">
                        <div className="border-t border-slate-100 pt-6 pb-2">
                            <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider block mb-1">AMOUNT DUE</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-[36px] font-extrabold text-slate-900 tracking-tight leading-none">
                                    {formatCurrency(invoice.total_amount)}
                                </span>
                                <span className="text-[14px] text-slate-400">due {dateDue}</span>
                            </div>
                        </div>

                        {/* Estimated delivery banner */}
                        <div className="bg-[#EEF2F6]/60 border border-slate-100 rounded-2xl p-4 flex items-center gap-3.5">
                            <div className="bg-white p-2.5 rounded-full shadow-sm text-[#4F46E5]">
                                <Truck className="h-5 w-5" />
                            </div>
                            <div>
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">ESTIMATED DELIVERY DATE</span>
                                <span className="text-[14px] font-bold text-[#4F46E5]">{estDeliveryDate}</span>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="mb-10 overflow-hidden">
                        <table className="w-full text-slate-700 border-collapse">
                            <thead>
                                <tr className="border-t-[1.5px] border-b-[1.5px] border-slate-900 text-[12px] font-bold uppercase text-slate-800">
                                    <th className="py-3.5 text-left font-bold w-3/5">DESCRIPTION</th>
                                    <th className="py-3.5 text-center font-bold">QTY</th>
                                    <th className="py-3.5 text-right font-bold">UNIT PRICE</th>
                                    <th className="py-3.5 text-right font-bold">AMOUNT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.items?.map((item, index) => (
                                    <tr key={index} className="border-b border-slate-100 text-[13.5px]">
                                        <td className="py-5 pr-4 text-slate-900">
                                            <div className="font-semibold leading-tight">{item.product?.name}</div>
                                            {item.product?.sku && (
                                                <div className="text-[11px] text-slate-400 mt-1 uppercase tracking-wide">SKU: {item.product.sku}</div>
                                            )}
                                        </td>
                                        <td className="py-5 text-center text-slate-700">{item.quantity}</td>
                                        <td className="py-5 text-right text-slate-600">{formatCurrency(item.unit_price)}</td>
                                        <td className="py-5 text-right font-bold text-slate-950">{formatCurrency(item.total_amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Table Totals aligned right */}
                    <div className="flex justify-end mb-4">
                        <div className="w-[320px] space-y-3.5 text-[13.5px]">
                            <div className="flex justify-between border-t border-slate-100 pt-3.5 text-slate-600">
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
                            <div className="flex justify-between border-t-[1.5px] border-slate-900 pt-3.5 text-[15px] font-bold text-slate-950">
                                <span>Total</span>
                                <span>{formatCurrency(invoice.total_amount)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ============================================================== */}
                {/* PAGE 2: WHAT'S INCLUDED & PROJECT BRIEF */}
                {/* ============================================================== */}
                <div className="bg-[#FAFBFD] shadow-xl rounded-2xl border border-slate-100 p-8 sm:p-12 relative overflow-hidden print:shadow-none print:border-none print:p-0 print:m-0 print:mt-10 break-before-page">
                    
                    {/* Top Right Black Amount Banner */}
                    <div className="absolute top-0 right-0 bg-[#0F172A] text-white px-6 py-4 rounded-bl-2xl font-bold flex items-center gap-6 shadow-sm print:hidden">
                        <span className="text-[11px] uppercase tracking-wider text-slate-400">AMOUNT DUE</span>
                        <span className="text-[18px] font-extrabold">{formatCurrency(invoice.total_amount)}</span>
                    </div>

                    {/* Inclusion title */}
                    <div className="mt-4 mb-8">
                        <h2 className="text-[12px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-slate-400" />
                            WHAT'S INCLUDED
                        </h2>
                    </div>

                    {/* 2-Column inclusions grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 mb-10 pb-10 border-b border-slate-100">
                        {includedServices.map((service: string, index: number) => (
                            <div key={index} className="flex items-start gap-3 text-[13px] text-slate-700 leading-tight">
                                <div className="bg-[#ECFDF5] border border-emerald-100 p-0.5 rounded-full mt-0.5 text-emerald-600">
                                    <Check className="h-3 w-3 stroke-[3]" />
                                </div>
                                <span>{service}</span>
                            </div>
                        ))}
                    </div>

                    {/* Project Brief Columns */}
                    <div className="mb-12">
                        <h3 className="text-[12px] font-extrabold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-slate-400" />
                            PROJECT BRIEF
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-1">
                                <span className="text-[12px] text-slate-400 uppercase font-semibold">Due Date</span>
                                <p className="text-[14px] font-bold text-slate-800">{invoice.due_date ? formatMockDate(invoice.due_date) : 'July 1, 2026'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[12px] text-slate-400 uppercase font-semibold">Amount Due</span>
                                <p className="text-[14px] font-bold text-slate-800">{invoice.total_amount}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[12px] text-slate-400 uppercase font-semibold">Estimated Delivery Date</span>
                                <p className="text-[14px] font-bold text-slate-800">{estDeliveryDate}</p>
                            </div>
                        </div>
                    </div>

                    {/* Page 2 Footer */}
                    <div className="border-t border-slate-100 pt-8 text-center space-y-5">
                        <div className="flex items-center justify-center gap-2 text-[14px] font-bold text-slate-800">
                            <img src={logoUrl} alt={companyName} className="h-5 object-contain" />
                            <span>{companyName}</span>
                        </div>
                        <p className="text-[13px] text-slate-600 font-medium">Thank you for choosing <span className="font-bold">Dynime</span>.</p>
                        <p className="text-[12px] text-slate-400">
                            Questions? Email <span className="text-slate-600 font-medium">{companyEmail}</span> · Reference #{invoice.invoice_number}
                        </p>
                        <p className="text-[11px] text-slate-300 font-semibold">{companyDomain}</p>
                    </div>

                </div>

            </div>
        </div>
    );
}
