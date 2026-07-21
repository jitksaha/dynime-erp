import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, DollarSign, CheckCircle2, Calculator, AlertCircle, X } from 'lucide-react';
import { SalesInvoice } from '../types';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: SalesInvoice | null;
    onSuccess: (data: any) => void;
}

export default function PaymentModal({ isOpen, onClose, invoice, onSuccess }: PaymentModalProps) {
    const [paymentMode, setPaymentMode] = useState<'set' | 'add'>('set');
    const [amountInput, setAmountInput] = useState<string>('');
    const [paymentStatus, setPaymentStatus] = useState<string>('Partially Paid');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (invoice) {
            setAmountInput(invoice.paid_amount ? invoice.paid_amount.toString() : '0');
            setPaymentStatus(invoice.payment_status || 'Unpaid');
            setPaymentMode('set');
            setErrorMsg('');
        }
    }, [invoice, isOpen]);

    if (!isOpen || !invoice) return null;

    const totalAmount = parseFloat(invoice.total_amount as any) || 0;
    const currentPaid = parseFloat(invoice.paid_amount as any) || 0;
    const currentBalance = parseFloat(invoice.balance_amount as any) || Math.max(0, totalAmount - currentPaid);

    const calculatedPaid = paymentMode === 'add'
        ? currentPaid + (parseFloat(amountInput) || 0)
        : (parseFloat(amountInput) || 0);

    const calculatedBalance = Math.max(0, totalAmount - calculatedPaid);

    const handleQuickSet = (amount: number, status?: string) => {
        setPaymentMode('set');
        setAmountInput(amount.toFixed(2));
        if (status) {
            setPaymentStatus(status);
        } else if (amount >= totalAmount) {
            setPaymentStatus('Paid');
        } else if (amount > 0) {
            setPaymentStatus('Partially Paid');
        } else {
            setPaymentStatus('Unpaid');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMsg('');

        try {
            const payload: any = {};
            if (paymentMode === 'add') {
                payload.add_amount = parseFloat(amountInput) || 0;
            } else {
                payload.paid_amount = parseFloat(amountInput) || 0;
                payload.payment_status = paymentStatus;
            }

            const response = await fetch(route('sales-invoices.update-status', invoice.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || ''
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (result.success) {
                onSuccess(result.data);
                onClose();
            } else {
                setErrorMsg(result.message || 'Failed to update payment');
            }
        } catch (err: any) {
            setErrorMsg('An error occurred while saving payment');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 to-slate-50/50 dark:from-indigo-950/20 dark:to-slate-900">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-[#4F46E5]/10 text-[#4F46E5] rounded-xl">
                            <CreditCard className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-base">Record & Edit Payment</h3>
                            <p className="text-xs text-slate-500 font-mono">Invoice #{invoice.invoice_number}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Financial Summary */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                        <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total</span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">${totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="border-x border-slate-200 dark:border-slate-700">
                            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Paid</span>
                            <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">${calculatedPaid.toFixed(2)}</span>
                        </div>
                        <div>
                            <span className="text-[10px] uppercase font-bold text-rose-500 block">Balance</span>
                            <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400">${calculatedBalance.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Mode Toggle: Set Total vs Add Payment */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
                        <button
                            type="button"
                            onClick={() => {
                                setPaymentMode('set');
                                setAmountInput(invoice.paid_amount ? invoice.paid_amount.toString() : '0');
                            }}
                            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                                paymentMode === 'set' ? 'bg-white dark:bg-slate-700 text-[#4F46E5] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Set Total Paid
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setPaymentMode('add');
                                setAmountInput('');
                            }}
                            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                                paymentMode === 'add' ? 'bg-white dark:bg-slate-700 text-[#4F46E5] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            + Add Payment
                        </button>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex gap-1.5">
                        <button
                            type="button"
                            onClick={() => handleQuickSet(totalAmount, 'Paid')}
                            className="flex-1 py-1 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 text-[11px] font-bold rounded-lg border border-emerald-200/60 transition-colors"
                        >
                            Full (${totalAmount.toFixed(2)})
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickSet(Math.round((totalAmount / 2) * 100) / 100, 'Partially Paid')}
                            className="flex-1 py-1 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 text-[11px] font-bold rounded-lg border border-indigo-200/60 transition-colors"
                        >
                            50% (${(totalAmount / 2).toFixed(2)})
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickSet(0, 'Unpaid')}
                            className="flex-1 py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300 text-[11px] font-bold rounded-lg transition-colors"
                        >
                            Unpaid ($0)
                        </button>
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            {paymentMode === 'add' ? 'Add Partial Payment Amount ($)' : 'Total Paid Amount ($)'}
                        </Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max={paymentMode === 'add' ? currentBalance : totalAmount}
                                value={amountInput}
                                onChange={(e) => {
                                    setAmountInput(e.target.value);
                                    const val = parseFloat(e.target.value) || 0;
                                    if (paymentMode === 'set') {
                                        if (val >= totalAmount) setPaymentStatus('Paid');
                                        else if (val > 0) setPaymentStatus('Partially Paid');
                                        else setPaymentStatus('Unpaid');
                                    }
                                }}
                                placeholder="0.00"
                                className="pl-7 font-bold text-sm h-10 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-[#4F46E5]/20"
                            />
                        </div>
                    </div>

                    {/* Payment Status Dropdown */}
                    {paymentMode === 'set' && (
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Payment Status</Label>
                            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                                <SelectTrigger className="h-10 text-xs font-bold border-slate-200 dark:border-slate-700">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Unpaid">Unpaid</SelectItem>
                                    <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                                    <SelectItem value="Paid">Paid (Full)</SelectItem>
                                    <SelectItem value="Authorized">Authorized</SelectItem>
                                    <SelectItem value="Refunded">Refunded</SelectItem>
                                    <SelectItem value="Failed">Failed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {errorMsg && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 flex items-center gap-2 font-medium">
                            <AlertCircle className="h-4 w-4 shrink-0" /> {errorMsg}
                        </div>
                    )}

                    <div className="pt-2 flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 h-10 text-xs font-bold"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 h-10 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs shadow-md shadow-indigo-500/20"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Payment'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
