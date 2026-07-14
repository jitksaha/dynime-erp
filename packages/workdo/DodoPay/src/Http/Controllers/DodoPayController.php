<?php

namespace Workdo\DodoPay\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Plan;
use App\Models\Order;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Http;
use Workdo\DodoPay\Events\DodoPayPaymentStatus;

class DodoPayController extends Controller
{
    public function planPayWithDodoPay(Request $request)
    {
        $plan = Plan::find($request->plan_id);
        $user = User::find($request->user_id);
        
        $admin_settings = getAdminAllSetting();
        $admin_currency = !empty($admin_settings['defaultCurrency']) ? $admin_settings['defaultCurrency'] : 'USD';

        if (!$plan) {
            return redirect()->route('plans.index')->with('error', __('The plan has been deleted.'));
        }

        $user_module = !empty($request->user_module_input) ? $request->user_module_input : '';
        $duration = !empty($request->time_period) ? $request->time_period : 'Month';
        $user_module_price = 0;

        if (!empty($user_module)) {
            $user_module_array = explode(',', $user_module);
            foreach ($user_module_array as $key => $value) {
                $temp = ($duration == 'Year') ? ModulePriceByName($value)['yearly_price'] : ModulePriceByName($value)['monthly_price'];
                $user_module_price = $user_module_price + $temp;
            }
        }

        $plan_price = ($duration == 'Year') ? $plan->package_price_yearly : $plan->package_price_monthly;
        $counter = [
            'user_counter' => -1,
            'storage_counter' => 0,
        ];

        $price = $plan_price + $user_module_price;

        if ($request->coupon_code) {
            $validation = applyCouponDiscount($request->coupon_code, $price, auth()->id());
            if ($validation['valid']) {
                $price = $validation['final_amount'];
            }
        }

        if ($price <= 0) {
            $assignPlan = assignPlan($plan->id, $duration, $user_module, $counter, $request->user_id);
            if ($assignPlan['is_success']) {
                return redirect()->route('plans.index')->with('success', __('Plan activated successfully!'));
            } else {
                return redirect()->route('plans.index')->with('error', __('Something went wrong, Please try again.'));
            }
        }

        try {
            $orderID = strtoupper(substr(uniqid(), -12));
            
            // Fetch DodoPay configuration settings
            $dodopay_enabled = $admin_settings['dodopay_enabled'] ?? 'off';
            $dodopay_api_key = $admin_settings['dodopay_api_key'] ?? '';
            $dodopay_product_id = $admin_settings['dodopay_product_id'] ?? '';
            $dodopay_mode = $admin_settings['dodopay_mode'] ?? 'test';

            if ($dodopay_enabled !== 'on' || empty($dodopay_api_key) || empty($dodopay_product_id)) {
                return redirect()->route('plans.index')->with('error', __('DodoPay payment method is not configured properly.'));
            }

            // Dodo Payments API endpoints
            $baseUrl = ($dodopay_mode === 'live') ? 'https://api.dodopayments.com' : 'https://test.dodopayments.com';
            
            // Price must be in cents (lowest currency denomination)
            $price_in_cents = intval(round($price * 100));

            // Return URL on success / cancel
            $returnUrl = route('payment.dodopay.status', [
                'order_id' => $orderID,
                'plan_id' => $plan->id,
                'duration' => $duration,
                'user_module' => $user_module,
                'user_id' => $user->id,
                'coupon_code' => $request->coupon_code,
            ]);

            // Call Dodo Payments API to create checkout session
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $dodopay_api_key,
                'Content-Type' => 'application/json',
            ])->post($baseUrl . '/v1/checkout-sessions', [
                'customer' => [
                    'email' => $user->email,
                    'name' => $user->name,
                ],
                'product_cart' => [
                    [
                        'product_id' => $dodopay_product_id,
                        'quantity' => 1,
                        'amount' => $price_in_cents,
                    ]
                ],
                'return_url' => $returnUrl,
            ]);

            if ($response->failed()) {
                $errorData = $response->json();
                $errorMessage = $errorData['message'] ?? $errorData['error'] ?? __('Failed to create DodoPay checkout session.');
                return redirect()->route('plans.index')->with('error', $errorMessage);
            }

            $sessionData = $response->json();
            $checkoutUrl = $sessionData['checkout_url'] ?? null;
            $checkoutSessionId = $sessionData['id'] ?? null;

            if (empty($checkoutUrl)) {
                return redirect()->route('plans.index')->with('error', __('No checkout URL returned from DodoPay.'));
            }

            // Create pending Order record
            $order = new Order();
            $order->order_id = $orderID;
            $order->name = $user->name;
            $order->email = $user->email;
            $order->card_number = null;
            $order->card_exp_month = null;
            $order->card_exp_year = null;
            $order->plan_name = !empty($plan->name) ? $plan->name : 'Basic Package';
            $order->plan_id = $plan->id;
            $order->price = !empty($price) ? $price : 0;
            $order->currency = $admin_currency;
            $order->txn_id = $checkoutSessionId; // Save DodoPay Checkout Session ID
            $order->payment_type = 'DodoPay';
            $order->payment_status = 'pending';
            $order->receipt = null;
            $order->created_by = $user->id;
            $order->save();

            return redirect()->away($checkoutUrl);

        } catch (\Exception $e) {
            return redirect()->route('plans.index')->with('error', $e->getMessage());
        }
    }

    public function planGetDodoPayStatus(Request $request)
    {
        try {
            $orderID = $request->order_id;
            $order = Order::where('order_id', $orderID)->first();

            if (!$order) {
                return redirect()->route('plans.index')->with('error', __('The order was not found.'));
            }

            $admin_settings = getAdminAllSetting();
            $dodopay_api_key = $admin_settings['dodopay_api_key'] ?? '';
            $dodopay_mode = $admin_settings['dodopay_mode'] ?? 'test';
            $baseUrl = ($dodopay_mode === 'live') ? 'https://api.dodopayments.com' : 'https://test.dodopayments.com';

            if (empty($dodopay_api_key) || empty($order->txn_id)) {
                return redirect()->route('plans.index')->with('error', __('Invalid order status verification.'));
            }

            // Query Dodo Payments API to retrieve checkout session status
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $dodopay_api_key,
            ])->get($baseUrl . '/v1/checkouts/' . $order->txn_id);

            if ($response->failed()) {
                return redirect()->route('plans.index')->with('error', __('Failed to verify payment with DodoPay.'));
            }

            $checkoutData = $response->json();
            $paymentStatus = $checkoutData['payment_status'] ?? 'failed';

            // Dodo Payments status check
            if (in_array(strtolower($paymentStatus), ['succeeded', 'paid', 'completed'])) {
                $order->payment_status = 'succeeded';
                $order->save();

                $plan = Plan::find($request->plan_id);
                $counter = [
                    'user_counter' => -1,
                    'storage_counter' => 0,
                ];

                $assignPlan = assignPlan($plan->id, $request->duration, $request->user_module, $counter, $request->user_id);
                
                if ($assignPlan['is_success']) {
                    if ($request->coupon_code) {
                        $coupon = Coupon::where('code', $request->coupon_code)->first();
                        if ($coupon) {
                            recordCouponUsage($coupon->id, $request->user_id, $request->order_id);
                        }
                    }

                    $type = 'Subscription';
                    try {
                        DodoPayPaymentStatus::dispatch($plan, $type, $order);
                    } catch (\Exception $e) {
                        // Log event error and proceed
                    }

                    if (Session::has('user-module-selection')) {
                        Session::forget('user-module-selection');
                    }

                    return redirect()->route('plans.index')->with('success', __('Plan activated successfully.'));
                } else {
                    return redirect()->route('plans.index')->with('error', __('Failed to assign plan privileges.'));
                }
            } else {
                $order->payment_status = 'failed';
                $order->save();
                return redirect()->route('plans.index')->with('error', __('Payment was not completed.'));
            }

        } catch (\Exception $e) {
            return redirect()->route('plans.index')->with('error', $e->getMessage());
        }
    }
}
