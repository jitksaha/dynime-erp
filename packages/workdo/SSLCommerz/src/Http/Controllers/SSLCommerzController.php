<?php

namespace Workdo\SSLCommerz\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Plan;
use App\Models\User;
use App\Models\Order;
use Illuminate\Support\Facades\Http;

class SSLCommerzController extends Controller
{
    public function planPayWithSSLCommerz(Request $request)
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

        $ssl_enabled = $admin_settings['sslcommerz_enabled'] ?? 'off';
        $mode = ($admin_settings['sslcommerz_sandbox'] ?? 'off') === 'on' ? 'sandbox' : 'live';
        $storeId = ($mode === 'live') ? ($admin_settings['sslcommerz_store_id'] ?? '') : ($admin_settings['sslcommerz_test_store_id'] ?? '');
        $storePassword = ($mode === 'live') ? ($admin_settings['sslcommerz_store_password'] ?? '') : ($admin_settings['sslcommerz_test_store_password'] ?? '');

        if ($ssl_enabled !== 'on' || empty($storeId) || empty($storePassword)) {
            return redirect()->route('plans.index')->with('error', __('SSLCommerz is not configured properly.'));
        }

        try {
            $orderID = strtoupper(substr(uniqid(), -12));
            $baseUrl = ($mode === 'live') ? 'https://securepay.sslcommerz.com' : 'https://sandbox.sslcommerz.com';

            $postData = [
                'store_id' => $storeId,
                'store_passwd' => $storePassword,
                'total_amount' => $price,
                'currency' => 'BDT',
                'tran_id' => $orderID,
                'success_url' => route('payment.sslcommerz.success', [
                    'order_id' => $orderID, 'plan_id' => $plan->id, 'duration' => $duration, 'user_module' => $user_module, 'user_id' => $user->id
                ]),
                'fail_url' => route('payment.sslcommerz.fail'),
                'cancel_url' => route('payment.sslcommerz.cancel'),
                'ipn_url' => route('sslcommerz.ipn'),
                'cus_name' => $user->name,
                'cus_email' => $user->email,
                'cus_add1' => 'Dhaka',
                'cus_city' => 'Dhaka',
                'cus_country' => 'Bangladesh',
                'cus_phone' => '01700000000',
                'shipping_method' => 'NO',
                'product_name' => $plan->name,
                'product_category' => 'Subscription',
                'product_profile' => 'non-physical-goods',
            ];

            $response = Http::asForm()->post($baseUrl . '/gwprocess/v4/api.php', $postData);

            if ($response->successful()) {
                $resData = $response->json();
                if (isset($resData['GatewayPageURL']) && !empty($resData['GatewayPageURL'])) {
                    return redirect($resData['GatewayPageURL']);
                }
            }

            return redirect()->route('plans.index')->with('error', __('Failed to initiate SSLCommerz session.'));
        } catch (\Exception $e) {
            return redirect()->route('plans.index')->with('error', $e->getMessage());
        }
    }

    public function paymentSuccess(Request $request)
    {
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
                'price_currency' => 'BDT',
                'payment_type' => 'SSLCommerz',
                'payment_status' => 'succeeded',
                'receipt' => $request->val_id ?? '',
                'user_id' => $user->id,
            ]);

            return redirect()->route('plans.index')->with('success', __('Plan activated successfully!'));
        }

        return redirect()->route('plans.index')->with('error', __('Plan activation failed.'));
    }

    public function paymentFail(Request $request)
    {
        return redirect()->route('plans.index')->with('error', __('SSLCommerz payment failed.'));
    }

    public function paymentCancel(Request $request)
    {
        return redirect()->route('plans.index')->with('error', __('SSLCommerz payment was cancelled.'));
    }

    public function handleIpn(Request $request)
    {
        return response()->json(['status' => 'VALID']);
    }
}
