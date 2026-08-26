import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';
import { SalesInvoice } from './types';

interface PublicPaymentProcessingProps {
    invoice: SalesInvoice;
    transaction?: {
        transaction_id: string;
        amount: number;
        currency: string;
    };
    companySettings?: {
        company_name?: string;
        company_logo?: string;
    };
}

export default function PublicPaymentProcessing({ invoice, transaction, companySettings }: PublicPaymentProcessingProps) {
    const logoUrl = companySettings?.company_logo || 'https://cdn.dynime.com/media/KVhzkR7rCJFuzFxBU8ljBqFb2PItfQM5i3omxMNF.png';
    const companyName = companySettings?.company_name || 'Dynime Inc';

    useEffect(() => {
        const body = document.body;
        body.classList.remove('dark');
        body.style.backgroundColor = '#f8fafc';
    }, []);

    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Head title={`Payment Processing - Invoice #${invoice.invoice_number}`} />

            <div className="bg-white max-w-md w-full rounded-xl shadow-xl border border-slate-200 p-8 text-center space-y-6 animate-in zoom-in-95 duration-300">
                {/* Logo */}
                <div className="flex justify-center mb-2">
                    <img src={logoUrl} alt={companyName} className="h-8 object-contain" />
                </div>

                {/* Animated Clock / Processing Icon */}
                <div className="w-16 h-16 bg-indigo-50 text-[#4F46E5] rounded-full flex items-center justify-center mx-auto shadow-inner relative">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                </div>

                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Verifying Payment...</h1>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Please wait while we confirm your transaction status with the gateway operator.</p>
                </div>

                {/* Info Card */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left space-y-2 text-xs">
                    <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Invoice:</span>
                        <span className="font-extrabold text-slate-900">#{invoice.invoice_number}</span>
                    </div>
                    {transaction?.transaction_id && (
                        <div className="flex justify-between">
                            <span className="text-slate-400 font-medium">Tx Ref:</span>
                            <span className="font-mono font-bold text-indigo-600">{transaction.transaction_id}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                        <span className="text-slate-400 font-medium">Status:</span>
                        <span className="font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md">Pending Verification</span>
                    </div>
                </div>

                <div className="space-y-2.5 pt-2">
                    <Button onClick={handleRefresh} className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white font-extrabold py-3.5 rounded-xl shadow-xl shadow-indigo-500/20">
                        <RefreshCw className="h-4 w-4 mr-2" /> Check Status Now
                    </Button>
                    <a href={`/invoice/${invoice.invoice_number}`} className="block">
                        <Button variant="outline" className="w-full border-slate-200 text-slate-700 font-bold rounded-xl">
                            Back to Invoice
                        </Button>
                    </a>
                </div>

                <p className="text-[11px] text-slate-400 font-medium flex items-center justify-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
                    Status will update automatically once verified by payment operator
                </p>
            </div>
        </div>
    );
}
