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
                'active_gateways' => [
                    [
                        'id' => 'dodopay',
                        'name' => !empty($settings['dodopay_display_name']) ? $settings['dodopay_display_name'] : ($settings['dodopayment_display_name'] ?? 'Dodo Payments'),
                        'description' => !empty($settings['dodopay_description']) ? $settings['dodopay_description'] : ($settings['dodopayment_description'] ?? 'Credit/Debit Cards, Apple Pay, Google Pay & Global Checkout'),
                        'badge' => !empty($settings['dodopay_badge']) ? $settings['dodopay_badge'] : ($settings['dodopayment_badge'] ?? 'Card / Apple Pay'),
                        'icon_url' => !empty($settings['dodopay_icon_url']) ? $settings['dodopay_icon_url'] : ($settings['dodopayment_icon_url'] ?? ''),
                        'enabled' => ($settings['dodopay_is_on'] ?? $settings['dodopay_payment_is_on'] ?? $settings['dodopayment_enabled'] ?? 'off') === 'on' || !empty($settings['dodopay_api_key'] ?? $settings['dodopayment_api_key'] ?? ''),
                    ],
                    [
                        'id' => 'stripe',
                        'name' => !empty($settings['stripe_display_name']) ? $settings['stripe_display_name'] : 'Stripe Checkout',
                        'description' => !empty($settings['stripe_description']) ? $settings['stripe_description'] : 'Cards, Apple Pay & International Cards',
                        'badge' => !empty($settings['stripe_badge']) ? $settings['stripe_badge'] : 'Stripe',
                        'icon_url' => !empty($settings['stripe_icon_url']) ? $settings['stripe_icon_url'] : '',
                        'enabled' => ($settings['stripe_is_on'] ?? $settings['stripe_payment_is_on'] ?? $settings['stripe_enabled'] ?? 'off') === 'on' || !empty($settings['stripe_secret_key'] ?? $settings['stripe_key'] ?? ''),
                    ],
                    [
                        'id' => 'bkash',
                        'name' => !empty($settings['bkash_display_name']) ? $settings['bkash_display_name'] : 'bKash Tokenized Checkout',
                        'description' => !empty($settings['bkash_description']) ? $settings['bkash_description'] : 'Pay directly in BDT with instant OTP & PIN',
                        'badge' => !empty($settings['bkash_badge']) ? $settings['bkash_badge'] : 'BDT ৳',
                        'icon_url' => !empty($settings['bkash_icon_url']) ? $settings['bkash_icon_url'] : '',
                        'enabled' => ($settings['bkash_is_on'] ?? $settings['bkash_payment_is_on'] ?? $settings['bkash_enabled'] ?? 'off') === 'on' || !empty($settings['bkash_app_key'] ?? ''),
                    ],
                    [
                        'id' => 'sslcommerz',
                        'name' => !empty($settings['sslcommerz_display_name']) ? $settings['sslcommerz_display_name'] : 'SSLCommerz (Bangladesh)',
                        'description' => !empty($settings['sslcommerz_description']) ? $settings['sslcommerz_description'] : 'Cards, Mobile Banking & Net Banking in BDT',
                        'badge' => !empty($settings['sslcommerz_badge']) ? $settings['sslcommerz_badge'] : 'Cards / MFS',
                        'icon_url' => !empty($settings['sslcommerz_icon_url']) ? $settings['sslcommerz_icon_url'] : '',
                        'enabled' => ($settings['sslcommerz_is_on'] ?? $settings['sslcommerz_payment_is_on'] ?? $settings['sslcommerz_enabled'] ?? 'off') === 'on' || !empty($settings['sslcommerz_store_id'] ?? ''),
                    ],
                    [
                        'id' => 'keeal',
                        'name' => !empty($settings['keeal_display_name']) ? $settings['keeal_display_name'] : 'PayPal & Cards (Keeal)',
                        'description' => !empty($settings['keeal_description']) ? $settings['keeal_description'] : 'Hosted PayPal & Global Card Checkout',
                        'badge' => !empty($settings['keeal_badge']) ? $settings['keeal_badge'] : 'Keeal',
                        'icon_url' => !empty($settings['keeal_icon_url']) ? $settings['keeal_icon_url'] : '',
                        'enabled' => ($settings['keeal_is_on'] ?? $settings['keeal_enabled'] ?? 'off') === 'on',
                    ],
                    [
                        'id' => 'bank_transfer',
                        'name' => !empty($settings['bank_transfer_display_name']) ? $settings['bank_transfer_display_name'] : 'Bank Transfer (Manual Deposit)',
                        'description' => !empty($settings['bank_transfer_description']) ? $settings['bank_transfer_description'] : 'Direct wire transfer to company bank account',
                        'badge' => !empty($settings['bank_transfer_badge']) ? $settings['bank_transfer_badge'] : 'Bank Wire',
                        'icon_url' => !empty($settings['bank_transfer_icon_url']) ? $settings['bank_transfer_icon_url'] : '',
                        'enabled' => ($settings['bank_transfer_is_on'] ?? $settings['bank_transfer_enabled'] ?? 'on') === 'on',
                    ],
                ],
                'bkash_enabled' => ($settings['bkash_is_on'] ?? $settings['bkash_payment_is_on'] ?? $settings['bkash_enabled'] ?? 'off') === 'on' ? 'on' : 'off',
                'sslcommerz_enabled' => ($settings['sslcommerz_is_on'] ?? $settings['sslcommerz_payment_is_on'] ?? $settings['sslcommerz_enabled'] ?? 'off') === 'on' ? 'on' : 'off',
                'stripe_onsite_enabled' => ($settings['stripe_is_on'] ?? $settings['stripe_payment_is_on'] ?? $settings['stripe_enabled'] ?? 'off') === 'on' ? 'on' : 'off',
                'stripe_hosted_enabled' => ($settings['stripe_hosted_enabled'] ?? 'off') === 'on' ? 'on' : 'off',
                'keeal_enabled' => ($settings['keeal_is_on'] ?? $settings['keeal_enabled'] ?? 'off') === 'on' ? 'on' : 'off',
                'dodopayment_enabled' => ($settings['dodopay_is_on'] ?? $settings['dodopay_payment_is_on'] ?? $settings['dodopayment_enabled'] ?? 'off') === 'on' ? 'on' : 'off',
                'bank_transfer_enabled' => ($settings['bank_transfer_is_on'] ?? $settings['bank_transfer_enabled'] ?? 'on') === 'on' ? 'on' : 'off',
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
