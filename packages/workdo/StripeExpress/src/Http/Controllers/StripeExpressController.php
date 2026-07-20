<?php

namespace Workdo\StripeExpress\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Plan;
use App\Models\User;
use App\Models\Order;
use Illuminate\Support\Facades\Http;

class StripeExpressController extends Controller
{
    public function createPaymentIntent(Request $request)
    {
        $plan = Plan::find($request->plan_id);
        $user = User::find($request->user_id ?? auth()->id());
        $admin_settings = getAdminAllSetting();

        if (!$plan) {
            return response()->json(['error' => __('Plan not found')], 404);
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

        $mode = ($admin_settings['stripe_sandbox'] ?? 'off') === 'on' ? 'test' : 'live';
        $secretKey = ($mode === 'live') ? ($admin_settings['stripe_secret_key'] ?? '') : ($admin_settings['stripe_test_secret_key'] ?? '');
        $publishableKey = ($mode === 'live') ? ($admin_settings['stripe_publishable_key'] ?? '') : ($admin_settings['stripe_test_publishable_key'] ?? '');

        if (empty($secretKey)) {
            return response()->json(['error' => __('Stripe is not configured')], 422);
        }

        try {
            $price_in_cents = intval(round($price * 100));

            $response = Http::withBasicAuth($secretKey, '')
                ->asForm()
                ->post('https://api.stripe.com/v1/payment_intents', [
                    'amount' => $price_in_cents,
                    'currency' => strtolower($admin_settings['stripe_currency'] ?? 'usd'),
                    'automatic_payment_methods' => ['enabled' => 'true'],
                    'receipt_email' => $user->email,
                    'metadata' => [
                        'user_id' => $user->id,
                        'plan_id' => $plan->id,
                        'duration' => $duration,
                        'user_module' => $user_module,
                        'coupon_code' => $request->coupon_code ?? '',
                    ]
                ]);

            if ($response->successful()) {
                $data = $response->json();
                return response()->json([
                    'client_secret' => $data['client_secret'],
                    'publishable_key' => $publishableKey,
                    'payment_intent_id' => $data['id'],
                    'amount' => $price,
                ]);
            }

            return response()->json(['error' => $response->json()['error']['message'] ?? __('Failed to create Stripe PaymentIntent')], 422);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function confirmPayment(Request $request)
    {
        $paymentIntentId = $request->payment_intent_id;
        $plan_id = $request->plan_id;
        $user_id = $request->user_id ?? auth()->id();
        $duration = $request->duration ?? 'Month';
        $user_module = $request->user_module ?? '';

        $plan = Plan::find($plan_id);
        $user = User::find($user_id);

        if (!$plan || !$user) {
            return response()->json(['error' => __('Invalid plan or user')], 404);
        }

        $assignPlan = assignPlan($plan->id, $duration, $user_module, ['user_counter' => -1, 'storage_counter' => 0], $user->id);

        if ($assignPlan['is_success']) {
            $orderID = strtoupper(substr(uniqid(), -12));
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
                'payment_type' => 'Stripe Express (On-Site)',
                'payment_status' => 'succeeded',
                'receipt' => $paymentIntentId,
                'user_id' => $user->id,
            ]);

            return response()->json(['success' => true, 'message' => __('Plan activated successfully!')]);
        }

        return response()->json(['error' => __('Plan activation failed')], 422);
    }
}
