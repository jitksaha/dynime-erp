import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, ShieldCheck, FileText, Landmark } from 'lucide-react';
import { SalesInvoice } from './types';

interface PublicPaymentSuccessProps {
    invoice: SalesInvoice;
    transaction?: {
        transaction_id: string;
        amount: number;
        currency: string;
        payment_method?: string;
        completed_at?: string;
    };
    companySettings?: {
        company_name?: string;
        company_logo?: string;
    };
}

export default function PublicPaymentSuccess({ invoice, transaction, companySettings }: PublicPaymentSuccessProps) {
    const logoUrl = companySettings?.company_logo || 'https://cdn.dynime.com/media/KVhzkR7rCJFuzFxBU8ljBqFb2PItfQM5i3omxMNF.png';
    const companyName = companySettings?.company_name || 'Dynime Inc';

    useEffect(() => {
        const body = document.body;
        body.classList.remove('dark');
        body.style.backgroundColor = '#f8fafc';
    }, []);

    const amountPaid = transaction?.amount || invoice.paid_amount || invoice.total_amount;
    const currency = transaction?.currency || invoice.service_brief?.currency || 'USD';

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Head title={`Payment Successful - Invoice #${invoice.invoice_number}`} />

            <div className="bg-white max-w-md w-full rounded-xl shadow-2xl border border-slate-200 p-8 text-center space-y-6 animate-in zoom-in-95 duration-300">
                {/* Logo */}
                <div className="flex justify-center mb-2">
                    <img src={logoUrl} alt={companyName} className="h-8 object-contain" />
                </div>

                {/* Green Success Badge */}
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                </div>

                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payment Successful!</h1>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Thank you. Your payment has been processed and confirmed.</p>
                </div>

                {/* Receipt Card */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 text-left space-y-2.5 text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                        <span className="text-slate-500 font-semibold">Invoice Number</span>
                        <span className="font-extrabold text-slate-900">#{invoice.invoice_number}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-semibold">Amount Paid</span>
                        <span className="font-black text-emerald-600 text-sm">{currency} {amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {transaction?.transaction_id && (
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-semibold">Transaction ID</span>
                            <span className="font-mono font-bold text-slate-700 text-[11px]">{transaction.transaction_id}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-semibold">Payment Status</span>
                        <span className="font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">Paid</span>
                    </div>
                </div>

                <div className="pt-2">
                    <a href={`/invoice/${invoice.invoice_number}`}>
                        <Button className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white font-extrabold py-3.5 rounded-xl shadow-xl shadow-indigo-500/20">
                            <FileText className="h-4 w-4 mr-2" /> View Complete Invoice
                        </Button>
                    </a>
                </div>

                <p className="text-[11px] text-slate-400 font-medium flex items-center justify-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    Verified transaction recorded in Dynime ERP
                </p>
            </div>
        </div>
    );
}
