<?php

namespace Workdo\Keeal\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Plan;
use App\Models\User;
use App\Models\Order;
use Illuminate\Support\Facades\Http;

class KeealController extends Controller
{
    public function planPayWithKeeal(Request $request)
    {
        $plan = Plan::find($request->plan_id);
        $user = User::find($request->user_id ?? auth()->id());
        $admin_settings = getAdminAllSetting();

        if (!$plan) {
            return redirect()->route('plans.index')->with('error', __('The plan has been deleted.'));
        }

        $duration = $request->time_period ?? 'Month';
        $user_module = $request->user_module_input ?? '';
        $user_module_price = 0;

        if (!empty($user_module)) {
            $user_module_array = explode(',', $user_module);
            foreach ($user_module_array as $value) {
                $temp = ($duration == 'Year') ? ModulePriceByName($value)['yearly_price'] : ModulePriceByName($value)['monthly_price'];
                $user_module_price += $temp;
            }
        }

        $plan_price = ($duration == 'Year') ? $plan->package_price_yearly : $plan->package_price_monthly;
        $price = $plan_price + $user_module_price;

        if ($request->coupon_code) {
            $validation = applyCouponDiscount($request->coupon_code, $price, auth()->id());
            if ($validation['valid']) {
                $price = $validation['final_amount'];
            }
        }

        if ($price <= 0) {
            $assignPlan = assignPlan($plan->id, $duration, $user_module, ['user_counter' => -1, 'storage_counter' => 0], $user->id);
            if ($assignPlan['is_success']) {
                return redirect()->route('plans.index')->with('success', __('Plan activated successfully!'));
            }
            return redirect()->route('plans.index')->with('error', __('Something went wrong, Please try again.'));
        }

        try {
            $orderID = strtoupper(substr(uniqid(), -12));
            $keeal_enabled = $admin_settings['keeal_enabled'] ?? 'off';
            $keeal_mode = $admin_settings['keeal_mode'] ?? 'live';
            $secret_key = $admin_settings['keeal_api_key'] ?? $admin_settings['keeal_secret_key'] ?? $admin_settings['keeal_test_secret_key'] ?? '';

            if ($keeal_enabled !== 'on' || empty($secret_key)) {
                return redirect()->route('plans.index')->with('error', __('Keeal payment gateway is not configured properly with an API key.'));
            }

            $returnUrl = route('payment.keeal.status', [
                'order_id' => $orderID,
                'plan_id' => $plan->id,
                'duration' => $duration,
                'user_module' => $user_module,
                'user_id' => $user->id,
                'coupon_code' => $request->coupon_code,
            ]);

            $baseUrl = ($keeal_mode === 'live') ? 'https://api.keeal.com' : 'https://sandbox.keeal.com';

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $secret_key,
                'Content-Type' => 'application/json',
            ])->post($baseUrl . '/v1/checkout/sessions', [
                'amount' => $price,
                'currency' => $admin_settings['keeal_currency'] ?? 'USD',
                'customer_email' => $user->email,
                'customer_name' => $user->name,
                'reference_id' => $orderID,
                'success_url' => $returnUrl . '&status=success',
                'cancel_url' => $returnUrl . '&status=cancel',
            ]);

            if ($response->successful() && isset($response->json()['checkout_url'])) {
                return redirect($response->json()['checkout_url']);
            }

            // Fallback redirect URL format if direct session endpoint is structured as token
            if (isset($response->json()['url'])) {
                return redirect($response->json()['url']);
            }

            return redirect()->route('plans.index')->with('error', $response->json()['message'] ?? __('Failed to initialize Keeal payment session.'));

        } catch (\Exception $e) {
            return redirect()->route('plans.index')->with('error', $e->getMessage());
        }
    }

    public function keealPaymentStatus(Request $request)
    {
        if ($request->status === 'cancel') {
            return redirect()->route('plans.index')->with('error', __('Payment was cancelled.'));
        }

        $orderID = $request->order_id;
        $plan_id = $request->plan_id;
        $duration = $request->duration;
        $user_module = $request->user_module;
        $user_id = $request->user_id;

        $plan = Plan::find($plan_id);
        $user = User::find($user_id);

        if (!$plan || !$user) {
            return redirect()->route('plans.index')->with('error', __('Invalid request.'));
        }

        $assignPlan = assignPlan($plan->id, $duration, $user_module, ['user_counter' => -1, 'storage_counter' => 0], $user->id);
        
        if ($assignPlan['is_success']) {
            Order::create([
                'order_id' => $orderID,
                'name' => $user->name,
                'card_number' => '',
                'card_exp_month' => '',
                'card_exp_year' => '',
                'plan_name' => $plan->name,
                'plan_id' => $plan->id,
                'price' => $assignPlan['plan_price'] ?? $plan->price,
                'price_currency' => 'USD',
                'payment_type' => 'Keeal',
                'payment_status' => 'succeeded',
                'receipt' => '',
                'user_id' => $user->id,
            ]);

            return redirect()->route('plans.index')->with('success', __('Plan activated successfully!'));
        }

        return redirect()->route('plans.index')->with('error', __('Plan activation failed.'));
    }

    public function handleWebhook(Request $request)
    {
        return response()->json(['status' => 'success']);
    }
}
