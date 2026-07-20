import React, { useState } from 'react';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { Head, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link2, Plus, Copy, Check, ExternalLink, Trash2, DollarSign, Repeat, UserCheck, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentLinkItem {
  id: number;
  link_code: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  type: 'one_time' | 'recurring';
  billing_cycle?: 'monthly' | 'yearly';
  customer_name?: string;
  customer_email?: string;
  status: string;
  payments_count: number;
  total_collected: number;
  created_at: string;
}

interface IndexProps {
  paymentLinks: PaymentLinkItem[];
}

export default function Index({ paymentLinks }: IndexProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data, setData, post, processing, reset, errors } = useForm({
    title: '',
    description: '',
    amount: '',
    currency: 'USD',
    type: 'one_time',
    billing_cycle: 'monthly',
    customer_name: '',
    customer_email: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('payment-links.store'), {
      onSuccess: () => {
        setIsModalOpen(false);
        reset();
        toast.success('Payment link generated successfully!');
      }
    });
  };

  const copyToClipboard = (code: string) => {
    const isBillingDomain = window.location.hostname.includes('dynime.com');
    const baseUrl = isBillingDomain ? 'https://billing.dynime.com' : window.location.origin;
    const url = `${baseUrl}/pay/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedId(code);
    toast.success('Payment link copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this payment link?')) {
      router.delete(route('payment-links.destroy', id), {
        onSuccess: () => toast.success('Payment link deleted!'),
      });
    }
  };

  return (
    <AuthenticatedLayout
      breadcrumbs={[{ label: 'Payment Links' }]}
      pageTitle="Payment Link Generator & Subscriptions"
    >
      <Head title="Payment Links" />

      <div className="space-y-6">
        {/* Header banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Link2 className="w-5 h-5 text-emerald-400" />
              Payment Link Generator
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Create instant payment links & service subscriptions for non-users or clients without requiring an account.
            </p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold shadow-lg rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Payment Link
          </Button>
        </div>

        {/* Payment Links List */}
        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span>Active Payment Links ({paymentLinks.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentLinks.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Link2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-semibold text-slate-600">No payment links created yet.</p>
                <p className="text-xs mt-1">Click "Create Payment Link" above to generate your first link for non-users.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase border-b">
                    <tr>
                      <th className="py-3 px-4">Title / Code</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Collected</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-700 font-medium">
                    {paymentLinks.map((link) => (
                      <tr key={link.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{link.title}</div>
                          <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                            <span>{link.link_code}</span>
                            {link.customer_name && <span className="text-slate-500">• {link.customer_name}</span>}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {link.type === 'recurring' ? (
                            <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full text-xs font-bold border border-purple-200">
                              <Repeat className="w-3 h-3" /> Subscription ({link.billing_cycle})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-bold">
                              One-Time
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {link.currency} {link.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-emerald-600">
                          {link.currency} {link.total_collected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          <span className="text-xs text-slate-400 font-normal block">{link.payments_count} payments</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${link.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                            {link.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(link.link_code)}
                            className="rounded-lg text-xs"
                          >
                            {copiedId === link.link_code ? (
                              <>
                                <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 mr-1 text-slate-500" /> Copy Link
                              </>
                            )}
                          </Button>
                          <a
                            href={`/pay/${link.link_code}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Preview
                          </a>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(link.id)}
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg p-1.5"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal dialog for creating new link */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-500" /> Create Payment Link
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="font-semibold">Link Title / Purpose *</Label>
                  <Input
                    id="title"
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    placeholder="e.g. Monthly Web Maintenance & Hosting"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="amount" className="font-semibold">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={data.amount}
                      onChange={(e) => setData('amount', e.target.value)}
                      placeholder="150.00"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="currency" className="font-semibold">Currency</Label>
                    <Select value={data.currency} onValueChange={(val) => setData('currency', val)}>
                      <SelectTrigger><SelectValue placeholder="Currency" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="BDT">BDT (৳)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="type" className="font-semibold">Payment Type</Label>
                    <Select value={data.type} onValueChange={(val: any) => setData('type', val)}>
                      <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="one_time">One-Time Payment</SelectItem>
                        <SelectItem value="recurring">Recurring Subscription</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {data.type === 'recurring' && (
                    <div className="space-y-1.5">
                      <Label htmlFor="billing_cycle" className="font-semibold">Billing Cycle</Label>
                      <Select value={data.billing_cycle} onValueChange={(val: any) => setData('billing_cycle', val)}>
                        <SelectTrigger><SelectValue placeholder="Cycle" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="customer_name" className="font-semibold">Customer Name (Optional)</Label>
                  <Input
                    id="customer_name"
                    value={data.customer_name}
                    onChange={(e) => setData('customer_name', e.target.value)}
                    placeholder="e.g. John Doe"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description" className="font-semibold">Description / Notes (Optional)</Label>
                  <Textarea
                    id="description"
                    rows={3}
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    placeholder="Provide details about what this payment covers..."
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" disabled={processing} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3">
                    {processing ? 'Generating...' : 'Generate & Copy Link'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
