import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    CreditCard, 
    ShieldCheck, 
    ArrowLeft, 
    Lock, 
    CheckCircle2, 
    AlertCircle, 
    Landmark, 
    Building2,
    Check,
    Copy,
    Globe,
    Search,
    DollarSign,
    QrCode,
    Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { SalesInvoice } from './types';
import BankDetailsModal from '@/components/BankDetailsModal';

interface PublicCheckoutProps {
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
        keeal_enabled?: string;
        dodopayment_enabled?: string;
        bank_transfer_enabled?: string;
        active_gateways?: any[];
    };
    flash?: {
        success?: string;
        error?: string;
    };
}

const getSymbol = (currency: string): string => {
    const symbols: Record<string, string> = {
        USD: '$', EUR: '€', GBP: '£', AUD: 'A$', CAD: 'C$', JPY: '¥', SGD: 'S$',
        INR: '₹', AED: 'د.إ', SAR: 'ر.س', CHF: 'CHF', CNY: '¥', NZD: 'NZ$', BDT: '৳'
    };
    return symbols[currency] || currency;
};

export default function PublicCheckout({ invoice, companySettings, paymentGateways, flash }: PublicCheckoutProps) {
    const balanceDue = parseFloat((invoice.balance_amount || invoice.total_amount || 0).toString());
    const [paymentMode, setPaymentMode] = useState<'full' | 'partial'>('full');
    const [partialAmount, setPartialAmount] = useState<string>('');
    const [selectedGateway, setSelectedGateway] = useState<string>('dodopay');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(flash?.error || null);
    const [copiedAccId, setCopiedAccId] = useState<string | null>(null);
    const [bankCountryFilter, setBankCountryFilter] = useState<string>('all');
    const [selectedBankModalAccount, setSelectedBankModalAccount] = useState<any | null>(null);
    const [isBankModalOpen, setIsBankModalOpen] = useState<boolean>(false);

    const logoUrl = companySettings?.company_logo || 'https://cdn.dynime.com/media/KVhzkR7rCJFuzFxBU8ljBqFb2PItfQM5i3omxMNF.png';
    const companyName = companySettings?.company_name || 'Dynime Inc';
    const currency = invoice.service_brief?.currency || 'USD';
    const currencySymbol = getSymbol(currency);

    const availableBankAccounts = React.useMemo(() => {
        const list = paymentGateways?.bank_accounts || [];
        if (list.length === 0) return [];

        if (bankCountryFilter === 'all') return list;

        const matched = list.filter((a: any) => (a.country || '').toLowerCase() === bankCountryFilter.toLowerCase());
        if (matched.length > 0) return matched;

        // Fallback: If no account matched for selected country, return primary USD, GBP, EUR, BDT accounts
        const primaryFallback = list.filter((a: any) => 
            ['USD', 'GBP', 'EUR', 'BDT'].includes((a.currency || '').toUpperCase()) || 
            ['United States', 'United Kingdom', 'Bangladesh'].includes(a.country || '')
        );

        return primaryFallback.length > 0 ? primaryFallback : list;
    }, [paymentGateways?.bank_accounts, bankCountryFilter]);

    const copyBankDetails = (acc: any, idx: number) => {
        const lines = [
            `Bank Name: ${acc.bank_name}`,
            `${acc.account_name_label || 'Account Name'}: ${acc.account_name}`,
            `${acc.account_number_label || 'Account Number / IBAN'}: ${acc.account_number}`,
        ];
        if (acc.swift_code) lines.push(`${acc.swift_code_label || 'SWIFT/BIC'}: ${acc.swift_code}`);
        if (acc.branch_routing) lines.push(`${acc.branch_routing_label || 'Branch/Routing'}: ${acc.branch_routing}`);
        if (acc.currency) lines.push(`Currency: ${acc.currency}`);
        if (acc.country) lines.push(`Country: ${acc.country}`);
        if (acc.custom_fields) {
            acc.custom_fields.forEach((cf: any) => lines.push(`${cf.label}: ${cf.value}`));
        }

        navigator.clipboard.writeText(lines.join('\n'));
        const accId = acc.id || `acc_${idx}`;
        setCopiedAccId(accId);
        toast.success('Bank deposit details copied to clipboard!');
        setTimeout(() => setCopiedAccId(null), 2500);
    };

    const activeGatewaysList = React.useMemo(() => {
        if (paymentGateways?.active_gateways && Array.isArray(paymentGateways.active_gateways) && paymentGateways.active_gateways.length > 0) {
            return paymentGateways.active_gateways;
        }

        const list: Array<{ id: string; name: string; description: string; badge: string; icon?: string }> = [];
        if (paymentGateways?.dodopayment_enabled === 'on') {
            list.push({ id: 'dodopay', name: 'Dodo Payments', description: 'Credit Cards, Apple Pay, Google Pay & Global Checkout', badge: 'Card / Apple Pay' });
        }
        if (paymentGateways?.stripe_onsite_enabled === 'on') {
            list.push({ id: 'stripe', name: 'Stripe Checkout', description: 'Cards, Apple Pay & Google Pay', badge: 'Stripe' });
        }
        if (paymentGateways?.bkash_enabled === 'on') {
            list.push({ id: 'bkash', name: 'bKash Tokenized Checkout', description: 'Pay directly in BDT with instant OTP & PIN', badge: 'BDT ৳' });
        }
        if (paymentGateways?.sslcommerz_enabled === 'on') {
            list.push({ id: 'sslcommerz', name: 'SSLCommerz (Bangladesh)', description: 'Cards, Mobile Banking & Net Banking', badge: 'Cards / MFS' });
        }
        if (paymentGateways?.keeal_enabled === 'on') {
            list.push({ id: 'keeal', name: 'PayPal & Cards (Keeal)', description: 'Hosted PayPal & Global Card Checkout', badge: 'PayPal' });
        }
        if (paymentGateways?.bank_transfer_enabled === 'on') {
            list.push({ id: 'bank_transfer', name: 'Bank Transfer (Manual Deposit)', description: 'Direct wire transfer to company bank account', badge: 'Bank Wire' });
        }
        return list;
    }, [paymentGateways]);

    useEffect(() => {
        if (activeGatewaysList.length > 0 && !activeGatewaysList.some(g => g.id === selectedGateway)) {
            setSelectedGateway(activeGatewaysList[0].id);
        }
    }, [activeGatewaysList]);

    // Force light mode on checkout
    useEffect(() => {
        const body = document.body;
        const html = document.documentElement;
        body.classList.remove('dark');
        html.classList.remove('dark');
        body.style.backgroundColor = '#ffffff';
    }, []);

    const payableAmount = paymentMode === 'partial' && partialAmount ? Math.min(parseFloat(partialAmount) || 0, balanceDue) : balanceDue;
    const isAmountInvalid = paymentMode === 'partial' && (!partialAmount || parseFloat(partialAmount) <= 0 || parseFloat(partialAmount) > balanceDue);

    const isBdtGateway = selectedGateway === 'bkash' || selectedGateway === 'sslcommerz';

    const formatCurrency = (amount: number) => {
        return currencySymbol + ' ' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    useEffect(() => {
        if (flash?.error) {
            setErrorMessage(flash.error);
            toast.error(flash.error);
        }
    }, [flash]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isAmountInvalid || isSubmitting) return;

        setIsSubmitting(true);
        setErrorMessage(null);

        router.post(`/invoice/${invoice.invoice_number}/pay`, {
            gateway: selectedGateway,
            amount: payableAmount,
        }, {
            onSuccess: (page) => {
                setIsSubmitting(false);
                const flashErr = (page.props.flash as any)?.error;
                if (flashErr) {
                    setErrorMessage(flashErr);
                    toast.error(flashErr);
                }
            },
            onError: (errors) => {
                setIsSubmitting(false);
                const msg = typeof errors === 'string' ? errors : (errors?.error || errors?.amount || 'Payment process failed. Please check your credentials and try again.');
                setErrorMessage(msg);
                toast.error(msg);
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    };

    const getGatewayIcon = (gw: any) => {
        if (gw.icon_url) {
            return <img src={gw.icon_url} alt={gw.name} className="h-6 max-w-[90px] object-contain shrink-0" />;
        }

        const id = (gw.id || '').toLowerCase();

        if (id.includes('stripe')) {
            return (
                <div className="flex items-center gap-1.5 shrink-0 bg-slate-900 text-white px-2.5 py-1 rounded-lg">
                    <span className="text-xs font-black tracking-wider text-[#635BFF]">STRIPE</span>
                    <span className="text-[10px] font-bold text-slate-300">VISA / MC</span>
                </div>
            );
        }
        if (id.includes('dodopay')) {
            return (
                <div className="flex items-center gap-1 shrink-0 bg-slate-950 text-white px-2.5 py-1 rounded-lg border border-slate-800">
                    <span className="text-xs font-extrabold tracking-wide text-indigo-400">DODO</span>
                    <span className="text-[10px] font-medium text-slate-300">Pay</span>
                </div>
            );
        }
        if (id.includes('bkash')) {
            return (
                <div className="flex items-center gap-1 shrink-0 bg-pink-50 px-2.5 py-1 rounded-lg border border-pink-200">
                    <span className="text-xs font-black text-pink-600">bKash</span>
                    <span className="text-[10px] font-bold text-pink-500">৳</span>
                </div>
            );
        }
        if (id.includes('sslcommerz')) {
            return (
                <div className="flex items-center gap-1 shrink-0 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                    <span className="text-xs font-black text-blue-700">SSLCommerz</span>
                </div>
            );
        }
        if (id.includes('keeal') || id.includes('paypal')) {
            return (
                <div className="flex items-center gap-1 shrink-0 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                    <span className="text-xs font-black italic text-[#003087]">Pay<span className="text-[#009CDE]">Pal</span></span>
                </div>
            );
        }
        if (id.includes('bank')) {
            return (
                <div className="flex items-center gap-1 shrink-0 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-emerald-700">
                    <Landmark className="h-3.5 w-3.5" />
                    <span className="text-xs font-extrabold">Bank Wire</span>
                </div>
            );
        }
        if (id.includes('razorpay')) {
            return (
                <div className="flex items-center gap-1 shrink-0 bg-blue-900 text-white px-2.5 py-1 rounded-lg">
                    <span className="text-xs font-black text-blue-400">Razorpay</span>
                </div>
            );
        }
        if (id.includes('paystack')) {
            return (
                <div className="flex items-center gap-1 shrink-0 bg-cyan-900 text-white px-2.5 py-1 rounded-lg">
                    <span className="text-xs font-black text-cyan-300">Paystack</span>
                </div>
            );
        }

        return (
            <span className="text-xs font-extrabold px-3 py-1 bg-indigo-100/80 text-indigo-700 rounded-lg shrink-0">
                {gw.badge || gw.name}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col">
            <Head title={`Checkout - Invoice #${invoice.invoice_number}`} />

            {/* Header Navbar */}
            <header className="border-b border-slate-200 py-4 px-6 sm:px-12 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img src={logoUrl} alt={companyName} className="h-8 object-contain" />
                    <div className="h-5 w-[1px] bg-slate-200 hidden sm:block" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 hidden sm:inline">Secure Checkout</span>
                </div>
                <a 
                    href={`/invoice/${invoice.invoice_number}`} 
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#4F46E5] transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Invoice
                </a>
            </header>

            {/* Main Shopify-Style 2-Column Split Checkout */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-65px)]">

                {/* LEFT COLUMN: Payment Interaction Area (White Background) */}
                <div className="lg:col-span-7 xl:col-span-7 bg-white p-6 sm:p-12 lg:pl-16 lg:pr-12 border-r border-slate-200">
                    <div className="max-w-xl mx-auto space-y-8">

                        {/* Top Security Indicator */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payment Checkout</h1>
                                <p className="text-xs text-slate-500 mt-1 font-medium">Select your preferred payment method to complete payment.</p>
                            </div>
                            <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 text-xs font-bold">
                                <Lock className="h-3.5 w-3.5" /> 256-Bit Encrypted
                            </div>
                        </div>

                        {/* Error Alert */}
                        {errorMessage && (
                            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold flex items-start gap-2.5 animate-in fade-in duration-200">
                                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-rose-900">Payment Error</p>
                                    <p className="mt-0.5">{errorMessage}</p>
                                </div>
                            </div>
                        )}

                        {/* Section 1: Payment Option (Full vs Partial) */}
                        <div className="space-y-3">
                            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block">1. Payment Amount Option</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setPaymentMode('full'); setPartialAmount(''); }}
                                    className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                                        paymentMode === 'full' 
                                            ? 'border-[#4F46E5] bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-sm' 
                                            : 'border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-bold text-slate-600">Pay Full Balance</span>
                                        {paymentMode === 'full' && <CheckCircle2 className="h-4 w-4 text-[#4F46E5]" />}
                                    </div>
                                    <p className="text-base font-black text-slate-900">{formatCurrency(balanceDue)}</p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPaymentMode('partial')}
                                    className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                                        paymentMode === 'partial' 
                                            ? 'border-[#4F46E5] bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-sm' 
                                            : 'border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-bold text-slate-600">Pay Partial Amount</span>
                                        {paymentMode === 'partial' && <CheckCircle2 className="h-4 w-4 text-[#4F46E5]" />}
                                    </div>
                                    <p className="text-xs font-semibold text-slate-500">Custom Installment</p>
                                </button>
                            </div>

                            {/* Partial Amount Input */}
                            {paymentMode === 'partial' && (
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 animate-in fade-in duration-200">
                                    <Label htmlFor="partialAmount" className="text-xs font-bold text-slate-700 block">
                                        Enter Amount to Pay ({currencySymbol})
                                    </Label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                                            {currencySymbol}
                                        </span>
                                        <Input
                                            id="partialAmount"
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            max={balanceDue}
                                            value={partialAmount}
                                            onChange={(e) => setPartialAmount(e.target.value)}
                                            placeholder={`Max ${balanceDue.toFixed(2)}`}
                                            className="pl-8 pr-4 py-3 border-slate-300 rounded-xl text-sm font-bold text-slate-900 bg-white"
                                        />
                                    </div>
                                    {partialAmount && parseFloat(partialAmount) > balanceDue && (
                                        <p className="text-xs text-rose-600 font-bold">Amount cannot exceed balance due of {formatCurrency(balanceDue)}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Section 2: Gateway Selection */}
                        <form onSubmit={handleFormSubmit} className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block">2. Select Payment Gateway</label>
                                <div className="space-y-2.5">
                                    {activeGatewaysList.length > 0 ? (
                                        activeGatewaysList.map((gw) => (
                                            <label
                                                key={gw.id}
                                                className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                                                    selectedGateway === gw.id
                                                        ? 'border-[#4F46E5] bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-sm'
                                                        : 'border-slate-200 hover:bg-slate-50'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3.5">
                                                    <input
                                                        type="radio"
                                                        name="gateway_radio"
                                                        checked={selectedGateway === gw.id}
                                                        onChange={() => setSelectedGateway(gw.id)}
                                                        className="h-4 w-4 text-[#4F46E5] focus:ring-[#4F46E5] border-slate-300"
                                                    />
                                                    <div>
                                                        <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                                                            {gw.name}
                                                        </div>
                                                        <div className="text-xs text-slate-500 font-medium">{gw.description}</div>
                                                    </div>
                                                </div>
                                                {getGatewayIcon(gw)}
                                            </label>
                                        ))
                                    ) : (
                                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-semibold">
                                            No active payment gateways are enabled. Please contact customer support.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Live USD to BDT Currency Conversion Banner */}
                            {isBdtGateway && (
                                <div className="p-4 bg-pink-50/90 border border-pink-200 rounded-xl text-xs space-y-1.5 text-pink-950 animate-in fade-in duration-200">
                                    <div className="flex items-center justify-between font-extrabold text-pink-950">
                                        <span className="flex items-center gap-1.5">
                                            <span className="h-2 w-2 rounded-full bg-pink-600 animate-pulse" />
                                            Converted BDT Payable Amount:
                                        </span>
                                        <span className="text-sm font-black text-pink-700">৳ {(payableAmount * (paymentGateways?.usd_to_bdt_rate || 122.00)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BDT</span>
                                    </div>
                                    <p className="text-[11px] text-pink-800 font-medium">
                                        Conversion Exchange Rate: <strong>1 USD = {paymentGateways?.usd_to_bdt_rate || 122.00} BDT</strong>. Transaction will process directly in BDT.
                                    </p>
                                </div>
                            )}

                            {/* Dynamic Wire / Bank Details Notice */}
                            {selectedGateway === 'bank_transfer' && (
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-3 text-slate-800 animate-in fade-in duration-200">
                                    <div className="font-extrabold text-slate-900 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Landmark className="h-4 w-4 text-indigo-600" /> 
                                            <span>Bank Wire Deposit Instructions:</span>
                                        </div>

                                        {/* Country Filter Selector for Customer */}
                                        {paymentGateways?.bank_accounts && paymentGateways.bank_accounts.length > 1 && (
                                            <div className="flex items-center gap-1.5">
                                                <Globe className="h-3.5 w-3.5 text-indigo-600" />
                                                <select
                                                    value={bankCountryFilter}
                                                    onChange={(e) => setBankCountryFilter(e.target.value)}
                                                    className="bg-white border border-slate-300 text-slate-900 rounded-lg px-2.5 py-1 text-xs font-extrabold outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500/20"
                                                >
                                                    <option value="all">All Countries ({paymentGateways.bank_accounts.length})</option>
                                                    {Array.from(new Set(paymentGateways.bank_accounts.map((a: any) => a.country).filter(Boolean))).map((c: any) => (
                                                        <option key={c} value={c}>{c}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    {/* Bank Account Selection Buttons / Launcher Cards */}
                                    {availableBankAccounts.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            {availableBankAccounts.map((acc: any, idx: number) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedBankModalAccount(acc);
                                                        setIsBankModalOpen(true);
                                                    }}
                                                    className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:shadow-md text-left transition-all group flex flex-col justify-between space-y-2"
                                                >
                                                    <div className="flex items-center justify-between w-full">
                                                        <p className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                                                            <span>{acc.bank_name}</span>
                                                            {acc.country && <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">({acc.country})</span>}
                                                        </p>
                                                        <span className="text-[10px] font-extrabold text-slate-400 group-hover:text-indigo-600">
                                                            {acc.currency || 'USD'}
                                                        </span>
                                                    </div>

                                                    <div className="text-[11px] text-slate-500 font-medium truncate">
                                                        <span>{acc.account_name_label || 'Recipient'}: </span>
                                                        <strong className="text-slate-800">{acc.account_name}</strong>
                                                    </div>

                                                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-indigo-600 group-hover:underline">
                                                        <span>Click to View Bank Wire Info & Copy Details</span>
                                                        <span>↗</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-3 bg-white border rounded-xl text-slate-600 font-medium">
                                            No local bank configured for this country. Defaulting to International USD SWIFT Transfer.
                                        </div>
                                    )}

                                    <div className="pt-2 text-[11px] text-slate-500 space-y-1 italic border-t border-slate-200/80">
                                        <p>• Please attach your invoice reference memo <strong>#{invoice.invoice_number}</strong> on transfer.</p>
                                        <p>• Send transfer receipt to your sales manager or mail to <strong>invoice@dynime.com</strong>.</p>
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="pt-4 border-t border-slate-100">
                                <Button
                                    type="submit"
                                    disabled={isAmountInvalid || isSubmitting || activeGatewaysList.length === 0}
                                    className="w-full bg-[#4F46E5] hover:bg-[#4338CA] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold py-3.5 text-sm rounded-xl shadow-xl shadow-indigo-500/25 transition-all duration-200"
                                >
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    {isSubmitting 
                                        ? 'Processing Payment...' 
                                        : isBdtGateway
                                            ? `Complete Payment (৳ ${(payableAmount * (paymentGateways?.usd_to_bdt_rate || 122.00)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BDT)`
                                            : `Complete Payment (${formatCurrency(payableAmount)})`
                                    }
                                </Button>
                                <p className="text-[11px] text-slate-400 text-center mt-3 font-medium flex items-center justify-center gap-1">
                                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                                    Guaranteed safe & secure direct operator checkout
                                </p>
                            </div>
                        </form>

                    </div>
                </div>

                {/* RIGHT COLUMN: Order Summary (Shopify Light Grey Background #f8fafc) */}
                <div className="lg:col-span-5 xl:col-span-5 bg-slate-50/80 p-6 sm:p-12 lg:pr-16 lg:pl-12 border-t lg:border-t-0 lg:border-l border-slate-200">
                    <div className="max-w-lg mx-auto space-y-6">

                        <div className="border-b border-slate-200 pb-4">
                            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Order Summary</h2>
                            <div className="flex items-baseline justify-between mt-2">
                                <span className="text-xl font-black text-slate-900">Invoice #{invoice.invoice_number}</span>
                                <span className="text-xs font-bold text-slate-500">Due {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-1 text-xs">
                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider mb-1.5">Billed To</p>
                            <p className="font-extrabold text-slate-900 text-sm">{invoice.customer?.name || invoice.customer_name || 'Client'}</p>
                            <p className="text-slate-600 font-medium">{invoice.customer?.email || 'client@dynime.com'}</p>
                            {invoice.customer?.phone && <p className="text-slate-600 font-medium">{invoice.customer.phone}</p>}
                        </div>

                        {/* Line Items Summary */}
                        <div className="space-y-3">
                            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Items</p>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                {invoice.items?.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-xs p-3 bg-white rounded-xl border border-slate-200/80">
                                        <div>
                                            <p className="font-bold text-slate-900">{item.item_name || item.name || item.product?.name || `Item #${idx + 1}`}</p>
                                            <p className="text-[11px] text-slate-500">Qty: {item.quantity} × {formatCurrency(item.unit_price)}</p>
                                        </div>
                                        <span className="font-extrabold text-slate-900">{formatCurrency(item.total_amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Breakdown Totals */}
                        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2.5 text-xs">
                            <div className="flex justify-between text-slate-600 font-medium">
                                <span>Subtotal</span>
                                <span>{formatCurrency(invoice.subtotal)}</span>
                            </div>
                            {invoice.discount_amount > 0 && (
                                <div className="flex justify-between text-emerald-600 font-bold">
                                    <span>Discount</span>
                                    <span>-{formatCurrency(invoice.discount_amount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-slate-600 font-medium">
                                <span>Tax</span>
                                <span>{formatCurrency(invoice.tax_amount)}</span>
                            </div>
                            <div className="flex justify-between text-slate-600 font-medium">
                                <span>Total Amount</span>
                                <span className="font-bold text-slate-900">{formatCurrency(invoice.total_amount)}</span>
                            </div>
                            {Number(invoice.paid_amount || 0) > 0 && (
                                <div className="flex justify-between text-emerald-600 font-bold">
                                    <span>Already Paid</span>
                                    <span>-{formatCurrency(invoice.paid_amount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between border-t border-slate-200 pt-2.5 text-sm font-extrabold text-slate-900">
                                <span>Balance Due</span>
                                <span className="text-indigo-600">{formatCurrency(balanceDue)}</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-200 pt-2.5 text-base font-black text-slate-950">
                                <span>Total Payable</span>
                                <span className="text-[#4F46E5]">{formatCurrency(payableAmount)}</span>
                            </div>
                        </div>

                    </div>
                </div>

            </div>

            {/* Bank Deposit Details Modal Popup (Screenshot 23 Inspired Design) */}
            <BankDetailsModal
                isOpen={isBankModalOpen}
                onClose={() => setIsBankModalOpen(false)}
                account={selectedBankModalAccount}
                allAccounts={availableBankAccounts}
                selectedCountry={bankCountryFilter}
                onSelectAccount={(acc) => setSelectedBankModalAccount(acc)}
                invoiceNumber={invoice.invoice_number}
                supportEmail="invoice@dynime.com"
            />
        </div>
    );
}
