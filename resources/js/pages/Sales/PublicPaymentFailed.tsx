import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, ArrowLeft, ShieldAlert } from 'lucide-react';
import { SalesInvoice } from './types';

interface PublicPaymentFailedProps {
    invoice: SalesInvoice;
    reason?: string;
    companySettings?: {
        company_name?: string;
        company_logo?: string;
    };
}

export default function PublicPaymentFailed({ invoice, reason, companySettings }: PublicPaymentFailedProps) {
    const logoUrl = companySettings?.company_logo || 'https://cdn.dynime.com/media/KVhzkR7rCJFuzFxBU8ljBqFb2PItfQM5i3omxMNF.png';
    const companyName = companySettings?.company_name || 'Dynime Inc';

    useEffect(() => {
        const body = document.body;
        body.classList.remove('dark');
        body.style.backgroundColor = '#f8fafc';
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Head title={`Payment Failed - Invoice #${invoice.invoice_number}`} />

            <div className="bg-white max-w-md w-full rounded-xl shadow-2xl border border-slate-200 p-8 text-center space-y-6 animate-in zoom-in-95 duration-300">
                {/* Logo */}
                <div className="flex justify-center mb-2">
                    <img src={logoUrl} alt={companyName} className="h-8 object-contain" />
                </div>

                {/* Red Failure Badge */}
                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <AlertCircle className="w-10 h-10 stroke-[2.5]" />
                </div>

                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payment Couldn't Be Completed</h1>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Your payment attempt was cancelled or declined by the payment provider.</p>
                </div>

                {/* Error Details Card */}
                <div className="bg-rose-50/80 rounded-xl p-4 border border-rose-200 text-left space-y-2 text-xs text-rose-900">
                    <p className="font-bold text-rose-950">Failure Details:</p>
                    <p className="font-medium text-rose-800 leading-relaxed">
                        {reason || 'The transaction was cancelled or declined by your card issuer/bank.'}
                    </p>
                    <p className="text-[11px] text-slate-500 pt-2 border-t border-rose-200/60">
                        Invoice #{invoice.invoice_number} remains unpaid. No funds were charged.
                    </p>
                </div>

                <div className="space-y-2.5 pt-2">
                    <a href={`/invoice/${invoice.invoice_number}/checkout`}>
                        <Button className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white font-extrabold py-3.5 rounded-xl shadow-xl shadow-indigo-500/20">
                            <RefreshCw className="h-4 w-4 mr-2" /> Try Paying Again
                        </Button>
                    </a>
                    <a href={`/invoice/${invoice.invoice_number}`} className="block">
                        <Button variant="outline" className="w-full border-slate-200 text-slate-700 font-bold rounded-xl">
                            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Invoice
                        </Button>
                    </a>
                </div>

                <p className="text-[11px] text-slate-400 font-medium flex items-center justify-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5 text-slate-400" />
                    If the problem persists, try another payment gateway or contact company support.
                </p>
            </div>
        </div>
    );
}
