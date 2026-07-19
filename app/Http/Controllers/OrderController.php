<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OrderController extends Controller
{
    public function index()
    {
        if(Auth::user()->can('manage-orders')){
            $orders = Order::with(['plan', 'user', 'total_coupon_used.coupon_detail'])
                ->where(function($q) {
                    if(Auth::user()->type == 'superadmin') {
                    } else {
                        $q->where('created_by', Auth::id());
                    }
                })
                ->when(request('search'), function($q) {
                    $search = request('search');
                    $q->where(function ($query) use ($search) {
                        $query->where('order_id', 'like', "%{$search}%")
                              ->orWhere('name', 'like', "%{$search}%")
                              ->orWhere('email', 'like', "%{$search}%")
                              ->orWhere('plan_name', 'like', "%{$search}%");
                    });
                })
                ->when(request('order_id'), fn($q) => $q->where('order_id', 'like', '%' . request('order_id') . '%'))
                ->when(request('sort'), fn($q) => $q->orderBy(request('sort'), request('direction', 'desc')), fn($q) => $q->orderBy('id', 'desc'))
                ->paginate(request('per_page', 10))
                ->withQueryString();

            return Inertia::render('orders/index', [
                'orders' => $orders,
            ]);
        }
        else{
            return back()->with('error', __('Permission denied'));
        }
    }

    public function updateStatus(Request $request, Order $order)
    {
        if (Auth::user()->can('manage-orders')) {
            $request->validate([
                'payment_status' => 'required|in:pending,succeeded,failed'
            ]);

            $order->payment_status = $request->payment_status;
            $order->save();

            return redirect()->back()->with('success', __('Order status updated successfully.'));
        }
        return redirect()->back()->with('error', __('Permission denied'));
    }
}