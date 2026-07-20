<?php

namespace App\Http\Controllers;

use App\Models\PaymentLink;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PaymentLinkController extends Controller
{
    public function index()
    {
        $links = PaymentLink::latest()->get();
        return Inertia::render('PaymentLinks/Index', [
            'paymentLinks' => $links
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0.01',
            'currency' => 'required|string|max:10',
            'type' => 'required|in:one_time,recurring',
            'billing_cycle' => 'nullable|in:monthly,yearly',
            'description' => 'nullable|string',
            'customer_name' => 'nullable|string',
            'customer_email' => 'nullable|email',
        ]);

        $linkCode = 'lnk_' . Str::random(10);

        PaymentLink::create([
            'link_code' => $linkCode,
            'title' => $request->title,
            'description' => $request->description,
            'amount' => $request->amount,
            'currency' => strtoupper($request->currency),
            'type' => $request->type,
            'billing_cycle' => $request->billing_cycle,
            'customer_name' => $request->customer_name,
            'customer_email' => $request->customer_email,
            'status' => 'active',
            'created_by' => auth()->id(),
        ]);

        return redirect()->back()->with('success', __('Payment link generated successfully!'));
    }

    public function publicPay($code)
    {
        $link = PaymentLink::where('link_code', $code)->firstOrFail();
        $settings = getAdminAllSetting();

        return Inertia::render('PaymentLinks/PublicPay', [
            'paymentLink' => $link,
            'companySettings' => [
                'company_name' => company_setting('company_name', $link->created_by) ?: 'Dynime Inc.',
                'company_email' => company_setting('company_email', $link->created_by) ?: 'support@dynime.com',
                'company_telephone' => company_setting('company_telephone', $link->created_by) ?: '+1 (646) 884-0271',
                'company_logo' => company_setting('company_logo', $link->created_by) ?: 'https://cdn.dynime.com/media/KVhzkR7rCJFuzFxBU8ljBqFb2PItfQM5i3omxMNF.png',
            ],
            'paymentGateways' => [
                'bkash_enabled' => $settings['bkash_enabled'] ?? 'off',
                'sslcommerz_enabled' => $settings['sslcommerz_enabled'] ?? 'off',
                'stripe_onsite_enabled' => $settings['stripe_onsite_enabled'] ?? 'off',
                'stripe_hosted_enabled' => $settings['stripe_hosted_enabled'] ?? 'off',
                'keeal_enabled' => $settings['keeal_enabled'] ?? 'off',
                'dodopayment_enabled' => $settings['dodopayment_enabled'] ?? 'off',
                'bank_transfer_enabled' => $settings['bank_transfer_enabled'] ?? 'off',
                'bank_accounts' => json_decode($settings['bank_transfer_accounts'] ?? '[]', true) ?: [],
            ]
        ]);
    }

    public function processPublicPay(Request $request, $code)
    {
        $link = PaymentLink::where('link_code', $code)->firstOrFail();
        $gateway = $request->gateway;

        $link->payments_count += 1;
        $link->total_collected += $link->amount;
        if ($link->type === 'one_time') {
            $link->status = 'paid';
        }
        $link->save();

        return redirect()->back()->with('success', __('Payment processed successfully via ' . ucfirst($gateway) . '! Thank you.'));
    }

    public function destroy($id)
    {
        $link = PaymentLink::findOrFail($id);
        $link->delete();
        return redirect()->back()->with('success', __('Payment link deleted successfully.'));
    }
}
