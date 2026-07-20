import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, CheckCircle2, CreditCard, Globe, Smartphone, Lock, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface PublicPayProps {
  paymentLink: {
    link_code: string;
    title: string;
    description?: string;
    amount: number;
    currency: string;
    type: 'one_time' | 'recurring';
    billing_cycle?: string;
    customer_name?: string;
    customer_email?: string;
    status: string;
  };
  companySettings: {
    company_name: string;
    company_email: string;
    company_telephone: string;
    company_logo: string;
  };
  paymentGateways: {
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

export default function PublicPay({ paymentLink, companySettings, paymentGateways }: PublicPayProps) {
  const [selectedGateway, setSelectedGateway] = useState('bkash');
  const [payerName, setPayerName] = useState(paymentLink.customer_name || '');
  const [payerEmail, setPayerEmail] = useState(paymentLink.customer_email || '');

  const formatCurrency = (val: number, curr: string) => {
    const symbols: Record<string, string> = { USD: '$', BDT: '৳', EUR: '€', GBP: '£' };
    return (symbols[curr] || curr) + ' ' + val.toLocaleString(undefined, { minimumFractionDigits: 2 });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8">
      <Head title={`Pay - ${paymentLink.title}`} />

      {/* Header Branding */}
      <header className="max-w-2xl mx-auto w-full flex items-center justify-between py-4 border-b border-slate-800/80 mb-8">
        <div className="flex items-center gap-3">
          {companySettings.company_logo ? (
            <img src={companySettings.company_logo} alt={companySettings.company_name} className="h-8 object-contain" />
          ) : (
            <span className="font-bold text-lg text-white">{companySettings.company_name}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>256-Bit SSL Encrypted</span>
        </div>
      </header>

      {/* Main Payment Container */}
      <main className="max-w-2xl mx-auto w-full space-y-6">
        <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-2xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-900/80 border-b border-slate-800 pb-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  {paymentLink.type === 'recurring' ? `Recurring Subscription (${paymentLink.billing_cycle})` : 'One-Time Payment'}
                </span>
                <CardTitle className="text-xl font-bold text-white mt-1">{paymentLink.title}</CardTitle>
                {paymentLink.description && (
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">{paymentLink.description}</p>
                )}
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Amount to Pay</span>
                <span className="text-2xl font-black text-emerald-400">
                  {formatCurrency(paymentLink.amount, paymentLink.currency)}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {paymentLink.status === 'paid' && paymentLink.type === 'one_time' ? (
              <div className="bg-emerald-950/40 border border-emerald-800/60 p-6 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-lg font-bold text-emerald-300">Payment Already Completed</h4>
                <p className="text-sm text-slate-400">This payment link has already been settled. Thank you!</p>
              </div>
            ) : (
              <form action={typeof window !== 'undefined' ? `${window.location.pathname.replace(/\/$/, '')}` : `/pay/${paymentLink.link_code}`} method="POST" className="space-y-6">
                <input type="hidden" name="_token" value={(document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || ''} />
                <input type="hidden" name="gateway" value={selectedGateway} />

                {/* Payer Information */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Your Contact Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="payer_name" className="text-xs font-semibold text-slate-300">Your Full Name *</Label>
                      <Input
                        id="payer_name"
                        name="payer_name"
                        value={payerName}
                        onChange={(e) => setPayerName(e.target.value)}
                        placeholder="John Doe"
                        required
                        className="bg-slate-950 border-slate-800 text-slate-100"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="payer_email" className="text-xs font-semibold text-slate-300">Your Email Address *</Label>
                      <Input
                        id="payer_email"
                        name="payer_email"
                        type="email"
                        value={payerEmail}
                        onChange={(e) => setPayerEmail(e.target.value)}
                        placeholder="john@example.com"
                        required
                        className="bg-slate-950 border-slate-800 text-slate-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Gateways Selector */}
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Select Payment Method</h4>

                  {paymentGateways.bkash_enabled === 'on' && (
                    <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${selectedGateway === 'bkash' ? 'border-pink-500 bg-pink-950/20 ring-1 ring-pink-500' : 'border-slate-800 bg-slate-950 hover:border-slate-700'}`}>
                      <div className="flex items-center gap-3">
                        <input type="radio" name="gateway_radio" checked={selectedGateway === 'bkash'} onChange={() => setSelectedGateway('bkash')} className="text-pink-500" />
                        <div>
                          <div className="font-bold text-sm text-white">bKash Tokenized Checkout</div>
                          <div className="text-xs text-slate-400">Instant OTP & PIN verification in BDT</div>
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 bg-pink-950 text-pink-300 border border-pink-800 rounded-md">bKash</span>
                    </label>
                  )}

                  {paymentGateways.sslcommerz_enabled === 'on' && (
                    <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${selectedGateway === 'sslcommerz' ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500' : 'border-slate-800 bg-slate-950 hover:border-slate-700'}`}>
                      <div className="flex items-center gap-3">
                        <input type="radio" name="gateway_radio" checked={selectedGateway === 'sslcommerz'} onChange={() => setSelectedGateway('sslcommerz')} className="text-emerald-500" />
                        <div>
                          <div className="font-bold text-sm text-white">SSLCommerz (Bangladesh)</div>
                          <div className="text-xs text-slate-400">Cards, Net Banking & Mobile Wallets</div>
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-md">SSLCommerz</span>
                    </label>
                  )}

                  {paymentGateways.stripe_onsite_enabled === 'on' && (
                    <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${selectedGateway === 'stripe_express' ? 'border-indigo-500 bg-indigo-950/20 ring-1 ring-indigo-500' : 'border-slate-800 bg-slate-950 hover:border-slate-700'}`}>
                      <div className="flex items-center gap-3">
                        <input type="radio" name="gateway_radio" checked={selectedGateway === 'stripe_express'} onChange={() => setSelectedGateway('stripe_express')} className="text-indigo-500" />
                        <div>
                          <div className="font-bold text-sm text-white">Credit Card & Express Pay</div>
                          <div className="text-xs text-slate-400">Apple Pay, Google Pay, Visa & Mastercard</div>
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-md">Stripe</span>
                    </label>
                  )}

                  {paymentGateways.keeal_enabled === 'on' && (
                    <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${selectedGateway === 'keeal' ? 'border-purple-500 bg-purple-950/20 ring-1 ring-purple-500' : 'border-slate-800 bg-slate-950 hover:border-slate-700'}`}>
                      <div className="flex items-center gap-3">
                        <input type="radio" name="gateway_radio" checked={selectedGateway === 'keeal'} onChange={() => setSelectedGateway('keeal')} className="text-purple-500" />
                        <div>
                          <div className="font-bold text-sm text-white">PayPal & International Cards</div>
                          <div className="text-xs text-slate-400">Pay securely via Keeal Hosted Checkout</div>
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 bg-purple-950 text-purple-300 border border-purple-800 rounded-md">PayPal</span>
                    </label>
                  )}

                  {paymentGateways.bank_transfer_enabled === 'on' && (
                    <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${selectedGateway === 'bank_transfer' ? 'border-amber-500 bg-amber-950/20 ring-1 ring-amber-500' : 'border-slate-800 bg-slate-950 hover:border-slate-700'}`}>
                      <div className="flex items-center gap-3">
                        <input type="radio" name="gateway_radio" checked={selectedGateway === 'bank_transfer'} onChange={() => setSelectedGateway('bank_transfer')} className="text-amber-500" />
                        <div>
                          <div className="font-bold text-sm text-white">Bank Wire Deposit</div>
                          <div className="text-xs text-slate-400">Manual wire transfer to company bank account</div>
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 bg-amber-950 text-amber-300 border border-amber-800 rounded-md">Bank</span>
                    </label>
                  )}
                </div>

                <div className="pt-4">
                  <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black py-4 text-base rounded-xl shadow-lg shadow-emerald-500/20">
                    Pay {formatCurrency(paymentLink.amount, paymentLink.currency)}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="max-w-2xl mx-auto w-full text-center py-6 text-xs text-slate-500 border-t border-slate-900 mt-8 space-y-1">
        <p>Powered by <span className="font-bold text-slate-300">{companySettings.company_name}</span></p>
        <p>Need help? Contact <span className="text-slate-400">{companySettings.company_email}</span></p>
      </footer>
    </div>
  );
}
