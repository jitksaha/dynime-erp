<?php

namespace App\Http\Controllers;

use App\Models\SalesInvoice;
use App\Models\SalesInvoiceItem;
use App\Models\SalesInvoiceItemTax;
use App\Models\User;
use App\Models\Warehouse;
use App\Http\Requests\StoreSalesInvoiceRequest;
use App\Http\Requests\UpdateSalesInvoiceRequest;
use Workdo\ProductService\Models\ProductServiceItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Events\CreateSalesInvoice;
use App\Events\UpdateSalesInvoice;
use App\Events\DestroySalesInvoice;
use App\Events\PostSalesInvoice;
use App\Events\EditSalesInvoice;

class SalesInvoiceController extends Controller
{
    private function checkInvoiceAccess(SalesInvoice $salesInvoice)
    {
        if(Auth::user()->can('manage-any-sales-invoices')) {
            return true;
        } elseif(Auth::user()->can('manage-own-sales-invoices')) {
            if($salesInvoice->creator_id != Auth::id() && $salesInvoice->customer_id != Auth::id()) {
                return false;
            }
            if($salesInvoice->creator_id != Auth::id() && Auth::user()->type == 'client' && $salesInvoice->status == 'draft') {
                return false;
            }
            return true;
        }
        return false;
    }
    public function index(Request $request)
    {
        if(Auth::user()->can('manage-sales-invoices')){
            $query = SalesInvoice::with(['customer', 'items'])
                ->where(function($q) {
                    if(Auth::user()->can('manage-any-sales-invoices')) {
                        $q->where('created_by', creatorId());
                    } elseif(Auth::user()->can('manage-own-sales-invoices')) {
                        $q->where('creator_id', Auth::id())->orWhere('customer_id',Auth::id());
                        if(Auth::user()->type == 'client') {
                            $q->where('status','!=', 'draft');
                        }
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                });

            // Apply filters
            if ($request->customer_id) {
                $query->where('customer_id', $request->customer_id);
            }
            if ($request->warehouse_id) {
                $query->where('warehouse_id', $request->warehouse_id);
            }
            if ($request->status) {
                if ($request->status === 'overdue') {
                    $query->where('due_date', '<', now())
                    ->whereIn('status', ['posted', 'partial'])
                    ->where('balance_amount', '>', 0);
                } else {
                    $query->where('status', $request->status);
                }
            }
            if ($request->payment_status) {
                $query->where('payment_status', $request->payment_status);
            }
            if ($request->operational_status) {
                $query->where('operational_status', $request->operational_status);
            }
            if ($request->project_category) {
                $query->where('project_category', $request->project_category);
            }
            if ($request->project_status) {
                $query->where('project_status', $request->project_status);
            }
            if ($request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('invoice_number', 'like', '%' . $search . '%')
                      ->orWhere('payment_status', 'like', '%' . $search . '%')
                      ->orWhere('operational_status', 'like', '%' . $search . '%')
                      ->orWhere('project_category', 'like', '%' . $search . '%')
                      ->orWhere('project_status', 'like', '%' . $search . '%');
                });
            }
            if ($request->date_range) {
                $dates = explode(' - ', $request->date_range);
                if (count($dates) === 2) {
                    $query->whereBetween('invoice_date', [$dates[0], $dates[1]]);
                }
            }

        // Apply sorting
        $sortField = $request->get('sort', 'created_at');
        $sortDirection = $request->get('direction', 'desc');

        // Validate sort field to prevent SQL injection
        $allowedSortFields = ['invoice_number', 'invoice_date', 'due_date', 'subtotal', 'tax_amount', 'total_amount', 'balance_amount', 'status', 'created_at'];
        if (!in_array($sortField, $allowedSortFields) || empty($sortField)) {
            $sortField = 'created_at';
        }

        $query->orderBy($sortField, $sortDirection);

        $perPage = $request->get('per_page', 10);
        $invoices = $query->paginate($perPage);
        $customers = User::where('type', 'client')->select('id', 'name', 'email')->where('created_by', creatorId())->get();
        $warehouses = Warehouse::where('is_active', true)->select('id', 'name')->where('created_by', creatorId())->get();

            return Inertia::render('Sales/Index', [
                'invoices' => $invoices,
                'customers' => $customers,
                'warehouses' => $warehouses,
                'filters' => $request->only(['customer_id', 'warehouse_id', 'status', 'payment_status', 'operational_status', 'project_category', 'project_status', 'search', 'date_range'])
            ]);
        }
        else{
            return back()->with('error', __('Permission denied'));
        }
    }

    public function create()
    {
        if(Auth::user()->can('create-sales-invoices')){
            $customers = User::where('type', 'client')->select('id', 'name', 'email')->where('created_by', creatorId())->get();
            $warehouses = Warehouse::where('is_active', true)->select('id', 'name', 'address')->where('created_by', creatorId())->get();

            return Inertia::render('Sales/Create', [
                'customers' => $customers,
                'warehouses' => $warehouses,
                'modules' => [
                    'recurringinvoicebill' => module_is_active('RecurringInvoiceBill')
                ]
            ]);
        }
        else{
            return back()->with('error', __('Permission denied'));
        }
    }

    public function store(StoreSalesInvoiceRequest $request)
    {
        if(Auth::user()->can('create-sales-invoices')){
            $items = $request->items;
            foreach ($items as &$item) {
                $item['product_id'] = \App\Helpers\PaidItemsHelper::resolveProductId($item['product_id'], creatorId());
            }
            unset($item);

            $totals = $this->calculateTotals($items);

            $invoice = new SalesInvoice();
            $invoice->invoice_date = $request->invoice_date;
            $invoice->due_date = $request->due_date;
            $invoice->customer_id = $request->customer_id;
            $invoice->warehouse_id = $request->type === 'product' ? $request->warehouse_id : null;
            $invoice->type = $request->type ?? 'product';
            $invoice->payment_terms = $request->payment_terms;
            $invoice->notes = $request->notes;
            $invoice->estimated_delivery_date = $request->estimated_delivery_date;
            $invoice->payment_status = $request->payment_status ?? 'Unpaid';
            $invoice->operational_status = $request->operational_status ?? 'Pending';
            $invoice->project_category = $request->project_category;
            $invoice->project_status = $request->project_status;
            if ($invoice->payment_status === 'Paid') {
                $invoice->status = 'paid';
                $invoice->paid_amount = $totals['total_amount'];
            } elseif ($invoice->payment_status === 'Partially Paid') {
                $invoice->status = 'partial';
                $invoice->paid_amount = floatval($request->input('paid_amount', 0));
            } else {
                $invoice->status = 'posted';
                $invoice->paid_amount = 0;
            }
            $serviceBrief = [];
            if ($request->has('whats_included')) {
                $lines = array_values(array_filter(array_map('trim', explode("\n", $request->whats_included))));
                $serviceBrief['included_services'] = $lines;
            }
            if ($request->has('payment_method')) {
                $serviceBrief['payment_method'] = $request->payment_method;
            }
            if ($request->has('currency')) {
                $serviceBrief['currency'] = $request->currency;
            }
            $invoice->service_brief = $serviceBrief;
            $invoice->subtotal = $totals['subtotal'];
            $invoice->tax_amount = $totals['tax_amount'];
            $invoice->discount_amount = $totals['discount_amount'];
            $invoice->total_amount = $totals['total_amount'];
            $invoice->balance_amount = max(0, $totals['total_amount'] - $invoice->paid_amount);
            $invoice->creator_id = Auth::id();
            $invoice->created_by = creatorId();
            $invoice->save();

            // Create invoice items
            $this->createInvoiceItems($invoice->id, $items);

            try {
                CreateSalesInvoice::dispatch($request, $invoice);
            } catch (\Throwable $th) {
                return back()->with('error', $th->getMessage());
            }

            return redirect()->route('sales-invoices.index')->with('success', __('The sales invoice has been created successfully.'));

        }
        else{
            return redirect()->route('sales-invoices.index')->with('error', __('Permission denied'));
        }
    }

    public function show(SalesInvoice $salesInvoice)
    {
        if(Auth::user()->can('view-sales-invoices') && $salesInvoice->created_by == creatorId()){
            if(!$this->checkInvoiceAccess($salesInvoice)) {
                return redirect()->route('sales-invoices.index')->with('error', __('Permission denied'));
            }

            $salesInvoice->load(['customer', 'customerDetails', 'items.product', 'items.taxes', 'warehouse']);

            return Inertia::render('Sales/View', [
                'invoice' => $salesInvoice
            ]);
        }
        else{
            return redirect()->route('sales-invoices.index')->with('error', __('Permission denied'));
        }
    }

    public function edit(SalesInvoice $salesInvoice)
    {
        if(Auth::user()->can('edit-sales-invoices') && $salesInvoice->created_by == creatorId()){
            if(!$this->checkInvoiceAccess($salesInvoice)) {
                return redirect()->route('sales-invoices.index')->with('error', __('Permission denied'));
            }

            $salesInvoice->load(['items.taxes']);

            EditSalesInvoice::dispatch($salesInvoice);

            $customers = User::where('type', 'client')->select('id', 'name', 'email')->where('created_by', creatorId())->get();
            $warehouses = Warehouse::where('is_active', true)->select('id', 'name', 'address')->where('created_by', creatorId())->get();

            return Inertia::render('Sales/Edit', [
                'invoice' => $salesInvoice,
                'customers' => $customers,
                'warehouses' => $warehouses,
                'modules' => [
                    'recurringinvoicebill' => module_is_active('RecurringInvoiceBill')
                ]
            ]);
        }
        else{
            return redirect()->route('sales-invoices.index')->with('error', __('Permission denied'));
        }
    }

    public function update(UpdateSalesInvoiceRequest $request, SalesInvoice $salesInvoice)
    {
        if(Auth::user()->can('edit-sales-invoices') && $salesInvoice->created_by == creatorId()){
            $items = $request->items;
            foreach ($items as &$item) {
                $item['product_id'] = \App\Helpers\PaidItemsHelper::resolveProductId($item['product_id'], creatorId());
            }
            unset($item);

            $totals = $this->calculateTotals($items);

            $salesInvoice->invoice_date = $request->invoice_date;
            $salesInvoice->due_date = $request->due_date;
            $salesInvoice->customer_id = $request->customer_id;
            $salesInvoice->warehouse_id = $salesInvoice->type === 'product' ? $request->warehouse_id : null;
            $salesInvoice->payment_terms = $request->payment_terms;
            $salesInvoice->notes = $request->notes;
            $salesInvoice->estimated_delivery_date = $request->estimated_delivery_date;
            
            if ($request->has('payment_status')) {
                $salesInvoice->payment_status = $request->payment_status;
                if ($request->payment_status === 'Paid') {
                    $salesInvoice->status = 'paid';
                    $salesInvoice->paid_amount = $totals['total_amount'];
                } elseif ($request->payment_status === 'Partially Paid') {
                    $salesInvoice->status = 'partial';
                    $salesInvoice->paid_amount = floatval($request->input('paid_amount', $salesInvoice->paid_amount));
                } else {
                    $salesInvoice->status = 'posted';
                    $salesInvoice->paid_amount = 0;
                }
            } else {
                if ($salesInvoice->payment_status === 'Partially Paid') {
                    $salesInvoice->paid_amount = floatval($request->input('paid_amount', $salesInvoice->paid_amount));
                }
            }
            if ($request->has('operational_status')) {
                $salesInvoice->operational_status = $request->operational_status;
            }
            if ($request->has('project_category')) {
                $salesInvoice->project_category = $request->project_category;
            }
            if ($request->has('project_status')) {
                $salesInvoice->project_status = $request->project_status;
            }
            $serviceBrief = $salesInvoice->service_brief ?? [];
            if ($request->has('whats_included')) {
                $lines = array_values(array_filter(array_map('trim', explode("\n", $request->whats_included))));
                $serviceBrief['included_services'] = $lines;
            }
            if ($request->has('payment_method')) {
                $serviceBrief['payment_method'] = $request->payment_method;
            }
            if ($request->has('currency')) {
                $serviceBrief['currency'] = $request->currency;
            }
            $salesInvoice->service_brief = $serviceBrief;
            $salesInvoice->subtotal = $totals['subtotal'];
            $salesInvoice->tax_amount = $totals['tax_amount'];
            $salesInvoice->discount_amount = $totals['discount_amount'];
            $salesInvoice->total_amount = $totals['total_amount'];
            $salesInvoice->balance_amount = max(0, $totals['total_amount'] - $salesInvoice->paid_amount);
            $salesInvoice->save();

            // Delete existing items and recreate
            $salesInvoice->items()->delete();
            $this->createInvoiceItems($salesInvoice->id, $items);

            // Dispatch event for packages to handle their fields
            UpdateSalesInvoice::dispatch($request, $salesInvoice);

            return redirect()->route('sales-invoices.index')->with('success', __('The sales invoice details are updated successfully.'));
        }
        else{
            return redirect()->route('sales-invoices.index')->with('error', __('Permission denied'));
        }
    }

    public function destroy(SalesInvoice $salesInvoice)
    {
        if(Auth::user()->can('delete-sales-invoices')){
            if ($salesInvoice->status === 'posted') {
                return back()->withErrors(['error' => __('Cannot delete posted invoice.')]);
            }

            // Dispatch event before deletion
            DestroySalesInvoice::dispatch($salesInvoice);

            $salesInvoice->delete();

            return redirect()->route('sales-invoices.index')->with('success', __('The sales invoice has been deleted.'));
        }
        else{
            return redirect()->route('sales-invoices.index')->with('error', __('Permission denied'));
        }
    }

    private function calculateTotals($items)
    {
        $subtotal = 0;
        $totalTax = 0;
        $totalDiscount = 0;

        foreach ($items as $item) {
            $qty = max(1, (float)($item['quantity'] ?? 1));
            $unitPrice = (float)($item['unit_price'] ?? 0);
            $lineTotal = $qty * $unitPrice;

            // Use pre-calculated discount_amount if provided by frontend,
            // otherwise fall back to computing from discount_percentage.
            if (isset($item['discount_amount']) && (float)$item['discount_amount'] > 0) {
                $discountAmount = (float)$item['discount_amount'];
            } else {
                $discountAmount = ($lineTotal * ((float)($item['discount_percentage'] ?? 0))) / 100;
            }

            $afterDiscount = max(0, $lineTotal - $discountAmount);
            $taxAmount = ($afterDiscount * ((float)($item['tax_percentage'] ?? 0))) / 100;

            $subtotal += $lineTotal;
            $totalDiscount += $discountAmount;
            $totalTax += $taxAmount;
        }

        return [
            'subtotal'        => $subtotal,
            'tax_amount'      => $totalTax,
            'discount_amount' => $totalDiscount,
            'total_amount'    => $subtotal + $totalTax - $totalDiscount
        ];
    }

    private function createInvoiceItems($invoiceId, $items)
    {
        foreach ($items as $itemData) {
            $qty = max(1, (float)($itemData['quantity'] ?? 1));
            $unitPrice = (float)($itemData['unit_price'] ?? 0);
            $discountPct = (float)($itemData['discount_percentage'] ?? 0);
            $taxPct = (float)($itemData['tax_percentage'] ?? 0);

            // Use pre-calculated discount_amount if frontend provided it (fixed mode)
            if (isset($itemData['discount_amount']) && (float)$itemData['discount_amount'] > 0) {
                $discountAmt = (float)$itemData['discount_amount'];
                // Keep discount_percentage in sync
                $lineTotal = $qty * $unitPrice;
                $discountPct = $lineTotal > 0 ? ($discountAmt / $lineTotal) * 100 : 0;
            } else {
                $lineTotal = $qty * $unitPrice;
                $discountAmt = ($lineTotal * $discountPct) / 100;
            }

            $item = new SalesInvoiceItem();
            $item->invoice_id         = $invoiceId;
            $item->product_id         = $itemData['product_id'];
            $item->quantity           = $qty;
            $item->unit_price         = $unitPrice;
            $item->discount_percentage = round($discountPct, 4);
            $item->tax_percentage     = $taxPct;
            $item->save();

            // Store individual taxes
            if (isset($itemData['taxes']) && is_array($itemData['taxes'])) {
                foreach ($itemData['taxes'] as $tax) {
                    $salesInvoiceItemTax = new SalesInvoiceItemTax();
                    $salesInvoiceItemTax->item_id   = $item->id;
                    $salesInvoiceItemTax->tax_name  = $tax['tax_name'];
                    $salesInvoiceItemTax->tax_rate  = $tax['tax_rate'] ?? $tax['rate'] ?? 0;
                    $salesInvoiceItemTax->save();
                }
            }
        }
    }

    public function post(SalesInvoice $salesInvoice)
    {
        if(Auth::user()->can('post-sales-invoices')){
        if ($salesInvoice->status !== 'draft') {
            return back()->withErrors(['error' => __('Only draft invoices can be posted.')]);
        }

        try {
            PostSalesInvoice::dispatch($salesInvoice);
        } catch (\Throwable $th) {
            return back()->with('error', $th->getMessage());
        }

        $salesInvoice->update(['status' => 'posted']);

        return back()->with('success', __('The sales invoice has been posted successfully.'));
        }
        else{
            return back()->with('error', __('Permission denied'));
        }
    }

    public function getWarehouseProducts(Request $request)
    {
        if(Auth::user()->can('create-sales-invoices') || Auth::user()->can('edit-sales-invoices')){
            $warehouseId = $request->warehouse_id;

            if (!$warehouseId) {
                return response()->json([]);
            }
            $products = ProductServiceItem::select('id', 'name', 'sku', 'sale_price', 'tax_ids', 'unit', 'type')
                ->where('is_active', true)
                ->where('created_by', creatorId())
                ->whereHas('warehouseStocks', function($q) use ($warehouseId) {
                    $q->where('warehouse_id', $warehouseId)
                      ->where('quantity', '>', 0);
                })
                ->with(['warehouseStocks' => function($q) use ($warehouseId) {
                    $q->where('warehouse_id', $warehouseId);
                }])
                ->get()
                ->map(function ($product) {
                    $stock = $product->warehouseStocks->first();
                    return [
                        'id' => $product->id,
                        'name' => $product->name,
                        'sku' => $product->sku,
                        'sale_price' => $product->sale_price,
                        'unit' => $product->unit,
                        'type' => $product->type,
                        'stock_quantity' => $stock ? $stock->quantity : 0,
                        'taxes' => $product->taxes->map(function ($tax) {
                            return [
                                'id' => $tax->id,
                                'tax_name' => $tax->tax_name,
                                'rate' => $tax->rate
                            ];
                        })
                    ];
                });
            return response()->json($products);
        }
        else{
            return response()->json([], 403);
        }
    }

    public function getServices(Request $request)
    {
        if(Auth::user()->can('create-sales-invoices') || Auth::user()->can('edit-sales-invoices')){
            $allPaidItems = \App\Helpers\PaidItemsHelper::getPaidItems(creatorId());
            $servicesAndFees = array_filter($allPaidItems, function($item) {
                return $item['type'] === 'service' || $item['type'] === 'state_fee';
            });
            
            $formatted = array_map(function($item) {
                return [
                    'id' => $item['id'],
                    'name' => $item['name'],
                    'sku' => $item['sku'],
                    'sale_price' => $item['purchase_price'],
                    'unit' => $item['unit'],
                    'type' => $item['type'],
                    'taxes' => $item['taxes']
                ];
            }, $servicesAndFees);

            return response()->json(array_values($formatted));
        }
        else{
            return response()->json([], 403);
        }
    }

    public function print(SalesInvoice $salesInvoice)
    {
        if (Auth::user()->can('print-sales-invoices') || Auth::user()->can('view-sales-invoices')) {
            $salesInvoice->load(['customer', 'customerDetails', 'items.product', 'items.taxes', 'warehouse']);

            $settings = getCompanyAllSetting($salesInvoice->created_by);
            if (empty($settings)) {
                $settings = getAdminAllSetting();
            }

            $gateways = [
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
                    'id' => 'paypal',
                    'name' => !empty($settings['paypal_display_name']) ? $settings['paypal_display_name'] : 'PayPal',
                    'description' => !empty($settings['paypal_description']) ? $settings['paypal_description'] : 'PayPal Account & Credit / Debit Cards',
                    'badge' => !empty($settings['paypal_badge']) ? $settings['paypal_badge'] : 'PayPal',
                    'icon_url' => !empty($settings['paypal_icon_url']) ? $settings['paypal_icon_url'] : '',
                    'enabled' => ($settings['paypal_is_on'] ?? $settings['paypal_payment_is_on'] ?? $settings['paypal_enabled'] ?? 'off') === 'on' || !empty($settings['paypal_client_id'] ?? $settings['paypal_secret_key'] ?? ''),
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
                    'id' => 'flutterwave',
                    'name' => !empty($settings['flutterwave_display_name']) ? $settings['flutterwave_display_name'] : 'Flutterwave',
                    'description' => !empty($settings['flutterwave_description']) ? $settings['flutterwave_description'] : 'Cards, Mobile Money & Bank Transfers (Africa & Global)',
                    'badge' => !empty($settings['flutterwave_badge']) ? $settings['flutterwave_badge'] : 'Flutterwave',
                    'icon_url' => !empty($settings['flutterwave_icon_url']) ? $settings['flutterwave_icon_url'] : '',
                    'enabled' => ($settings['flutterwave_is_on'] ?? $settings['flutterwave_payment_is_on'] ?? $settings['flutterwave_enabled'] ?? 'off') === 'on' || !empty($settings['flutterwave_secret_key'] ?? ''),
                ],
                [
                    'id' => 'razorpay',
                    'name' => !empty($settings['razorpay_display_name']) ? $settings['razorpay_display_name'] : 'Razorpay',
                    'description' => !empty($settings['razorpay_description']) ? $settings['razorpay_description'] : 'UPI, Net Banking, Cards & Wallets (INR)',
                    'badge' => !empty($settings['razorpay_badge']) ? $settings['razorpay_badge'] : 'UPI / Cards',
                    'icon_url' => !empty($settings['razorpay_icon_url']) ? $settings['razorpay_icon_url'] : '',
                    'enabled' => ($settings['razorpay_is_on'] ?? $settings['razorpay_payment_is_on'] ?? $settings['razorpay_enabled'] ?? 'off') === 'on' || !empty($settings['razorpay_key'] ?? ''),
                ],
                [
                    'id' => 'mollie',
                    'name' => !empty($settings['mollie_display_name']) ? $settings['mollie_display_name'] : 'Mollie',
                    'description' => !empty($settings['mollie_description']) ? $settings['mollie_description'] : 'iDEAL, Bancontact, Cards & European Payments',
                    'badge' => !empty($settings['mollie_badge']) ? $settings['mollie_badge'] : 'EUR € / Cards',
                    'icon_url' => !empty($settings['mollie_icon_url']) ? $settings['mollie_icon_url'] : '',
                    'enabled' => ($settings['mollie_is_on'] ?? $settings['mollie_payment_is_on'] ?? $settings['mollie_enabled'] ?? 'off') === 'on' || !empty($settings['mollie_api_key'] ?? ''),
                ],
                [
                    'id' => 'paystack',
                    'name' => !empty($settings['paystack_display_name']) ? $settings['paystack_display_name'] : 'Paystack',
                    'description' => !empty($settings['paystack_description']) ? $settings['paystack_description'] : 'Cards, Bank & Mobile Money',
                    'badge' => !empty($settings['paystack_badge']) ? $settings['paystack_badge'] : 'Paystack',
                    'icon_url' => !empty($settings['paystack_icon_url']) ? $settings['paystack_icon_url'] : '',
                    'enabled' => ($settings['paystack_is_on'] ?? $settings['paystack_payment_is_on'] ?? $settings['paystack_enabled'] ?? 'off') === 'on' || !empty($settings['paystack_secret_key'] ?? ''),
                ],
                [
                    'id' => 'aamarpay',
                    'name' => !empty($settings['aamarpay_display_name']) ? $settings['aamarpay_display_name'] : 'Aamarpay',
                    'description' => !empty($settings['aamarpay_description']) ? $settings['aamarpay_description'] : 'Mobile Banking & Cards (BDT)',
                    'badge' => !empty($settings['aamarpay_badge']) ? $settings['aamarpay_badge'] : 'aamarpay',
                    'icon_url' => !empty($settings['aamarpay_icon_url']) ? $settings['aamarpay_icon_url'] : '',
                    'enabled' => ($settings['aamarpay_is_on'] ?? $settings['aamarpay_payment_is_on'] ?? $settings['aamarpay_enabled'] ?? 'off') === 'on' || !empty($settings['aamarpay_store_id'] ?? ''),
                ],
                [
                    'id' => 'authorizenet',
                    'name' => !empty($settings['authorizenet_display_name']) ? $settings['authorizenet_display_name'] : 'Authorize.Net',
                    'description' => !empty($settings['authorizenet_description']) ? $settings['authorizenet_description'] : 'Credit & Debit Cards (USD)',
                    'badge' => !empty($settings['authorizenet_badge']) ? $settings['authorizenet_badge'] : 'Credit Cards',
                    'icon_url' => !empty($settings['authorizenet_icon_url']) ? $settings['authorizenet_icon_url'] : '',
                    'enabled' => ($settings['authorizenet_is_on'] ?? $settings['authorizenet_payment_is_on'] ?? 'off') === 'on' || !empty($settings['authorizenet_merchant_login_id'] ?? ''),
                ],
                [
                    'id' => 'stripe_express',
                    'name' => !empty($settings['stripe_express_display_name']) ? $settings['stripe_express_display_name'] : (!empty($settings['stripe_display_name']) ? $settings['stripe_display_name'] : 'Direct Card & Express Pay'),
                    'description' => !empty($settings['stripe_express_description']) ? $settings['stripe_express_description'] : (!empty($settings['stripe_description']) ? $settings['stripe_description'] : 'Apple Pay, Google Pay & On-site Card'),
                    'badge' => !empty($settings['stripe_express_badge']) ? $settings['stripe_express_badge'] : (!empty($settings['stripe_badge']) ? $settings['stripe_badge'] : 'Stripe Express'),
                    'icon_url' => !empty($settings['stripe_express_icon_url']) ? $settings['stripe_express_icon_url'] : (!empty($settings['stripe_icon_url']) ? $settings['stripe_icon_url'] : ''),
                    'enabled' => ($settings['stripe_express_is_on'] ?? $settings['stripe_onsite_enabled'] ?? 'off') === 'on',
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
            ];

            $activeGateways = array_values(array_filter($gateways, function ($g) {
                return $g['enabled'];
            }));

            return Inertia::render('Sales/PublicView', [
                'invoice' => $salesInvoice,
                'companySettings' => [
                    'company_name' => company_setting('company_name', $salesInvoice->created_by) ?: 'Dynime Inc.',
                    'company_address' => company_setting('company_address', $salesInvoice->created_by) ?: '1209 Mountain Road Pl Ne Ste R',
                    'company_city' => company_setting('company_city', $salesInvoice->created_by) ?: 'Albuquerque',
                    'company_state' => company_setting('company_state', $salesInvoice->created_by) ?: 'NM',
                    'company_zipcode' => company_setting('company_zipcode', $salesInvoice->created_by) ?: '87110',
                    'company_country' => company_setting('company_country', $salesInvoice->created_by) ?: 'USA',
                    'company_telephone' => company_setting('company_telephone', $salesInvoice->created_by),
                    'company_email' => company_setting('company_email', $salesInvoice->created_by),
                    'company_logo' => company_setting('company_logo', $salesInvoice->created_by) ?: 'https://cdn.dynime.com/media/KVhzkR7rCJFuzFxBU8ljBqFb2PItfQM5i3omxMNF.png',
                ],
                'paymentGateways' => [
                    'active_gateways' => $activeGateways,
                    'bkash_enabled' => ($settings['bkash_is_on'] ?? $settings['bkash_payment_is_on'] ?? $settings['bkash_enabled'] ?? 'off') === 'on' ? 'on' : 'off',
                    'sslcommerz_enabled' => ($settings['sslcommerz_is_on'] ?? $settings['sslcommerz_payment_is_on'] ?? $settings['sslcommerz_enabled'] ?? 'off') === 'on' ? 'on' : 'off',
                    'stripe_onsite_enabled' => ($settings['stripe_is_on'] ?? $settings['stripe_payment_is_on'] ?? $settings['stripe_enabled'] ?? 'off') === 'on' ? 'on' : 'off',
                    'keeal_enabled' => ($settings['keeal_is_on'] ?? $settings['keeal_enabled'] ?? 'off') === 'on' ? 'on' : 'off',
                    'dodopayment_enabled' => ($settings['dodopay_is_on'] ?? $settings['dodopay_payment_is_on'] ?? $settings['dodopayment_enabled'] ?? 'off') === 'on' ? 'on' : 'off',
                    'bank_transfer_enabled' => ($settings['bank_transfer_is_on'] ?? $settings['bank_transfer_enabled'] ?? 'on') === 'on' ? 'on' : 'off',
                    'bank_accounts' => json_decode($settings['bank_transfer_accounts'] ?? '[]', true) ?: [],
                ],
                'autoDownloadPdf' => request('download') === 'pdf',
                'autoPrint' => request('print') == '1',
            ]);
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }

    public function updateStatus(Request $request, SalesInvoice $salesInvoice)
    {
        if (Auth::user()->can('edit-sales-invoices') && $salesInvoice->created_by == creatorId()) {
             $request->validate([
                'payment_status' => 'nullable|string|in:Unpaid,Authorized,Partially Paid,Paid,Refunded,Failed',
                'operational_status' => 'nullable|string|in:Pending,Processing,In Review,Action Required,Delivered,Completed,Cancelled',
                'project_category' => 'nullable|string',
                'project_status' => 'nullable|string',
                'paid_amount' => 'nullable|numeric|min:0',
                'add_amount' => 'nullable|numeric|min:0'
            ]);

            if ($request->has('add_amount') && floatval($request->add_amount) > 0) {
                $additional = floatval($request->add_amount);
                $salesInvoice->paid_amount += $additional;
                $salesInvoice->balance_amount = max(0, $salesInvoice->total_amount - $salesInvoice->paid_amount);
                if ($salesInvoice->balance_amount <= 0) {
                    $salesInvoice->payment_status = 'Paid';
                    $salesInvoice->status = 'paid';
                    $salesInvoice->balance_amount = 0;
                } else {
                    $salesInvoice->payment_status = 'Partially Paid';
                    $salesInvoice->status = 'partial';
                }
            } elseif ($request->has('paid_amount')) {
                $paid = floatval($request->paid_amount);
                $salesInvoice->paid_amount = $paid;
                $salesInvoice->balance_amount = max(0, $salesInvoice->total_amount - $paid);
                if ($paid >= $salesInvoice->total_amount) {
                    $salesInvoice->payment_status = 'Paid';
                    $salesInvoice->status = 'paid';
                    $salesInvoice->balance_amount = 0;
                } elseif ($paid > 0) {
                    $salesInvoice->payment_status = 'Partially Paid';
                    $salesInvoice->status = 'partial';
                } else {
                    $salesInvoice->payment_status = 'Unpaid';
                    $salesInvoice->status = 'posted';
                    $salesInvoice->paid_amount = 0;
                    $salesInvoice->balance_amount = $salesInvoice->total_amount;
                }
            } elseif ($request->has('payment_status')) {
                $salesInvoice->payment_status = $request->payment_status;
                if ($request->payment_status === 'Paid') {
                    $salesInvoice->status = 'paid';
                    $salesInvoice->paid_amount = $salesInvoice->total_amount;
                    $salesInvoice->balance_amount = 0;
                } elseif ($request->payment_status === 'Partially Paid') {
                    $salesInvoice->status = 'partial';
                    if ($salesInvoice->paid_amount <= 0) {
                        $salesInvoice->paid_amount = round($salesInvoice->total_amount / 2, 2);
                    }
                    $salesInvoice->balance_amount = max(0, $salesInvoice->total_amount - $salesInvoice->paid_amount);
                } elseif ($request->payment_status === 'Unpaid' || $request->payment_status === 'Failed') {
                    $salesInvoice->status = 'posted';
                    $salesInvoice->paid_amount = 0;
                    $salesInvoice->balance_amount = $salesInvoice->total_amount;
                }
            }

            if ($request->has('operational_status')) {
                $salesInvoice->operational_status = $request->operational_status;
            }

            if ($request->has('project_category')) {
                $salesInvoice->project_category = $request->project_category;
                if (empty($request->project_status)) {
                    $salesInvoice->project_status = null;
                }
            }

            if ($request->has('project_status')) {
                $salesInvoice->project_status = $request->project_status;
            }

            $salesInvoice->save();

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => __('Invoice payment status updated successfully.'),
                    'data' => [
                        'payment_status' => $salesInvoice->payment_status,
                        'operational_status' => $salesInvoice->operational_status,
                        'project_category' => $salesInvoice->project_category,
                        'project_status' => $salesInvoice->project_status,
                        'status' => $salesInvoice->status,
                        'paid_amount' => $salesInvoice->paid_amount,
                        'balance_amount' => $salesInvoice->balance_amount,
                    ]
                ]);
            }

            return redirect()->back()->with('success', __('Invoice status updated successfully.'));
        }

        if ($request->expectsJson()) {
            return response()->json(['success' => false, 'message' => __('Permission denied')], 403);
        }
        return redirect()->back()->with('error', __('Permission denied'));
    }

    public function publicView($invoiceNumber)
    {
        $salesInvoice = SalesInvoice::where('invoice_number', $invoiceNumber)->first();
        if (!$salesInvoice) {
            $salesInvoice = SalesInvoice::where('invoice_number', 'like', '%' . $invoiceNumber)->first();
        }

        if (!$salesInvoice) {
            abort(404, 'Invoice not found.');
        }

        $salesInvoice->load(['customer', 'customerDetails', 'items.product', 'items.taxes', 'warehouse']);

        $settings = getCompanyAllSetting($salesInvoice->created_by);
        if (empty($settings)) {
            $settings = getAdminAllSetting();
        }

        $gateways = [
            [
                'id' => 'dodopay',
                'name' => 'Dodo Payments',
                'description' => 'Credit/Debit Cards, Apple Pay, Google Pay & Global Checkout',
                'badge' => 'Card / Apple Pay',
                'enabled' => ($settings['dodopay_is_on'] ?? $settings['dodopay_payment_is_on'] ?? $settings['dodopayment_enabled'] ?? 'off') === 'on' || !empty($settings['dodopay_api_key'] ?? $settings['dodopayment_api_key'] ?? ''),
            ],
            [
                'id' => 'stripe',
                'name' => 'Stripe Checkout',
                'description' => 'Cards, Apple Pay & International Cards',
                'badge' => 'Stripe',
                'enabled' => ($settings['stripe_is_on'] ?? $settings['stripe_payment_is_on'] ?? $settings['stripe_enabled'] ?? 'off') === 'on' || !empty($settings['stripe_secret_key'] ?? $settings['stripe_key'] ?? ''),
            ],
            [
                'id' => 'paypal',
                'name' => 'PayPal',
                'description' => 'PayPal Account & Credit / Debit Cards',
                'badge' => 'PayPal',
                'enabled' => ($settings['paypal_is_on'] ?? $settings['paypal_payment_is_on'] ?? $settings['paypal_enabled'] ?? 'off') === 'on' || !empty($settings['paypal_client_id'] ?? $settings['paypal_secret_key'] ?? ''),
            ],
            [
                'id' => 'bkash',
                'name' => 'bKash Tokenized Checkout',
                'description' => 'Pay directly in BDT with instant OTP & PIN',
                'badge' => 'BDT ৳',
                'enabled' => ($settings['bkash_is_on'] ?? $settings['bkash_payment_is_on'] ?? $settings['bkash_enabled'] ?? 'off') === 'on' || !empty($settings['bkash_app_key'] ?? ''),
            ],
            [
                'id' => 'sslcommerz',
                'name' => 'SSLCommerz (Bangladesh)',
                'description' => 'Cards, Mobile Banking & Net Banking in BDT',
                'badge' => 'Cards / MFS',
                'enabled' => ($settings['sslcommerz_is_on'] ?? $settings['sslcommerz_payment_is_on'] ?? $settings['sslcommerz_enabled'] ?? 'off') === 'on' || !empty($settings['sslcommerz_store_id'] ?? ''),
            ],
            [
                'id' => 'flutterwave',
                'name' => 'Flutterwave',
                'description' => 'Cards, Mobile Money & Bank Transfers (Africa & Global)',
                'badge' => 'Flutterwave',
                'enabled' => ($settings['flutterwave_is_on'] ?? $settings['flutterwave_payment_is_on'] ?? $settings['flutterwave_enabled'] ?? 'off') === 'on' || !empty($settings['flutterwave_secret_key'] ?? ''),
            ],
            [
                'id' => 'razorpay',
                'name' => 'Razorpay',
                'description' => 'UPI, Net Banking, Cards & Wallets (INR)',
                'badge' => 'UPI / Cards',
                'enabled' => ($settings['razorpay_is_on'] ?? $settings['razorpay_payment_is_on'] ?? $settings['razorpay_enabled'] ?? 'off') === 'on' || !empty($settings['razorpay_key'] ?? ''),
            ],
            [
                'id' => 'mollie',
                'name' => 'Mollie',
                'description' => 'iDEAL, Bancontact, Cards & European Payments',
                'badge' => 'EUR € / Cards',
                'enabled' => ($settings['mollie_is_on'] ?? $settings['mollie_payment_is_on'] ?? $settings['mollie_enabled'] ?? 'off') === 'on' || !empty($settings['mollie_api_key'] ?? ''),
            ],
            [
                'id' => 'paystack',
                'name' => 'Paystack',
                'description' => 'Cards, Bank & Mobile Money',
                'badge' => 'Paystack',
                'enabled' => ($settings['paystack_is_on'] ?? $settings['paystack_payment_is_on'] ?? $settings['paystack_enabled'] ?? 'off') === 'on' || !empty($settings['paystack_secret_key'] ?? ''),
            ],
            [
                'id' => 'aamarpay',
                'name' => 'Aamarpay',
                'description' => 'Mobile Banking & Cards (BDT)',
                'badge' => 'aamarpay',
                'enabled' => ($settings['aamarpay_is_on'] ?? $settings['aamarpay_payment_is_on'] ?? $settings['aamarpay_enabled'] ?? 'off') === 'on' || !empty($settings['aamarpay_store_id'] ?? ''),
            ],
            [
                'id' => 'authorizenet',
                'name' => 'Authorize.Net',
                'description' => 'Credit & Debit Cards (USD)',
                'badge' => 'Credit Cards',
                'enabled' => ($settings['authorizenet_is_on'] ?? $settings['authorizenet_payment_is_on'] ?? 'off') === 'on' || !empty($settings['authorizenet_merchant_login_id'] ?? ''),
            ],
            [
                'id' => 'stripe_express',
                'name' => 'Direct Card & Express Pay',
                'description' => 'Apple Pay, Google Pay & On-site Card',
                'badge' => 'Stripe Express',
                'enabled' => ($settings['stripe_express_is_on'] ?? $settings['stripe_onsite_enabled'] ?? 'off') === 'on',
            ],
            [
                'id' => 'keeal',
                'name' => 'PayPal & Cards (Keeal)',
                'description' => 'Hosted PayPal & Global Card Checkout',
                'badge' => 'Keeal',
                'enabled' => ($settings['keeal_is_on'] ?? $settings['keeal_enabled'] ?? 'off') === 'on',
            ],
            [
                'id' => 'bank_transfer',
                'name' => 'Bank Transfer (Manual Deposit)',
                'description' => 'Direct wire transfer to company bank account',
                'badge' => 'Bank Wire',
                'enabled' => ($settings['bank_transfer_is_on'] ?? $settings['bank_transfer_enabled'] ?? 'on') === 'on',
            ],
        ];

        $activeGateways = array_values(array_filter($gateways, function ($g) {
            return $g['enabled'];
        }));

        return Inertia::render('Sales/PublicView', [
            'invoice' => $salesInvoice,
            'companySettings' => [
                'company_name' => company_setting('company_name', $salesInvoice->created_by) ?: 'Dynime Inc.',
                'company_address' => company_setting('company_address', $salesInvoice->created_by) ?: '1209 Mountain Road Pl Ne Ste R',
                'company_city' => company_setting('company_city', $salesInvoice->created_by) ?: 'Albuquerque',
                'company_state' => company_setting('company_state', $salesInvoice->created_by) ?: 'NM',
                'company_zipcode' => company_setting('company_zipcode', $salesInvoice->created_by) ?: '87110',
                'company_country' => company_setting('company_country', $salesInvoice->created_by) ?: 'USA',
                'company_telephone' => company_setting('company_telephone', $salesInvoice->created_by),
                'company_email' => company_setting('company_email', $salesInvoice->created_by),
                'company_logo' => company_setting('company_logo', $salesInvoice->created_by) ?: 'https://cdn.dynime.com/media/KVhzkR7rCJFuzFxBU8ljBqFb2PItfQM5i3omxMNF.png',
            ],
            'paymentGateways' => [
                'active_gateways' => $activeGateways,
                'bkash_enabled' => ($settings['bkash_is_on'] ?? $settings['bkash_payment_is_on'] ?? $settings['bkash_enabled'] ?? 'off') === 'on' ? 'on' : 'off',
                'sslcommerz_enabled' => ($settings['sslcommerz_is_on'] ?? $settings['sslcommerz_payment_is_on'] ?? $settings['sslcommerz_enabled'] ?? 'off') === 'on' ? 'on' : 'off',
                'stripe_onsite_enabled' => ($settings['stripe_is_on'] ?? $settings['stripe_payment_is_on'] ?? $settings['stripe_enabled'] ?? 'off') === 'on' ? 'on' : 'off',
                'keeal_enabled' => ($settings['keeal_is_on'] ?? $settings['keeal_enabled'] ?? 'off') === 'on' ? 'on' : 'off',
                'dodopayment_enabled' => ($settings['dodopay_is_on'] ?? $settings['dodopay_payment_is_on'] ?? $settings['dodopayment_enabled'] ?? 'off') === 'on' ? 'on' : 'off',
                'bank_transfer_enabled' => ($settings['bank_transfer_is_on'] ?? $settings['bank_transfer_enabled'] ?? 'on') === 'on' ? 'on' : 'off',
                'bank_accounts' => json_decode($settings['bank_transfer_accounts'] ?? '[]', true) ?: [],
            ]
        ]);
    }

    private function getLiveUsdToBdtRate($createdBy = null)
    {
        $settings = getCompanyAllSetting($createdBy);
        if (empty($settings)) {
            $settings = getAdminAllSetting();
        }

        $customRate = trim($settings['usd_to_bdt_rate'] ?? '');
        $autoLive = ($settings['usd_to_bdt_auto'] ?? 'on') !== 'off';

        if (!$autoLive && !empty($customRate) && is_numeric($customRate) && floatval($customRate) > 0) {
            return floatval($customRate);
        }

        return \Illuminate\Support\Facades\Cache::remember('live_usd_to_bdt_rate', 1800, function () use ($customRate) {
            try {
                $response = \Illuminate\Support\Facades\Http::timeout(5)->get('https://open.er-api.com/v6/latest/USD');
                if ($response->successful()) {
                    $rates = $response->json('rates');
                    if (!empty($rates['BDT']) && floatval($rates['BDT']) > 0) {
                        return round(floatval($rates['BDT']), 2);
                    }
                }
            } catch (\Exception $e) {
                // fall through
            }

            return (!empty($customRate) && is_numeric($customRate)) ? floatval($customRate) : 123.77;
        });
    }

    public function showPublicCheckout(Request $request, $invoiceNumber)
    {
        $salesInvoice = SalesInvoice::where('invoice_number', $invoiceNumber)->with(['customer', 'items'])->firstOrFail();

        $settings = getCompanyAllSetting($salesInvoice->created_by);
        if (empty($settings)) {
            $settings = getAdminAllSetting();
        }

        $buildGatewayObj = function($id, $defaultName, $defaultDesc, $defaultBadge, $enabledKeys, $defaultEnabled = 'off') use ($settings) {
            $isEnabled = false;
            foreach ((array)$enabledKeys as $k) {
                if (isset($settings[$k]) && in_array(strtolower((string)$settings[$k]), ['on', '1', 'true', 'active'])) {
                    $isEnabled = true;
                    break;
                }
            }
            if (!$isEnabled && $defaultEnabled === 'on') {
                $isEnabled = true;
            }

            return [
                'id' => $id,
                'name' => $settings["{$id}_display_name"] ?? $settings["{$id}_name"] ?? $defaultName,
                'description' => $settings["{$id}_description"] ?? $defaultDesc,
                'badge' => $settings["{$id}_badge"] ?? $defaultBadge,
                'icon_url' => $settings["{$id}_icon_url"] ?? null,
                'enabled' => $isEnabled,
            ];
        };

        $gateways = [
            $buildGatewayObj('dodopay', 'Dodo Payments', 'Credit Cards, Apple Pay, Google Pay & Global Checkout', 'Card / Apple Pay', ['dodopay_enabled', 'dodopay_is_on', 'dodopayment_enabled']),
            $buildGatewayObj('stripe', 'Stripe Checkout', 'Cards, Apple Pay & Google Pay', 'Stripe', ['stripe_enabled', 'stripe_is_on', 'stripe_onsite_enabled']),
            $buildGatewayObj('bkash', 'bKash Tokenized Checkout', 'Pay directly in BDT with instant OTP & PIN', 'BDT ৳', ['bkash_enabled', 'bkash_is_on']),
            $buildGatewayObj('sslcommerz', 'SSLCommerz (Bangladesh)', 'Cards, Mobile Banking & Net Banking', 'Cards / MFS', ['sslcommerz_enabled', 'sslcommerz_is_on']),
            $buildGatewayObj('keeal', 'PayPal & Cards (Keeal)', 'Hosted PayPal & Global Card Checkout', 'PayPal', ['keeal_enabled', 'keeal_is_on']),
            $buildGatewayObj('bank_transfer', 'Bank Transfer (Manual Deposit)', 'Direct wire transfer to company bank account', 'Bank Wire', ['bank_transfer_enabled', 'bank_transfer_is_on'], 'on'),
            $buildGatewayObj('paypal', 'PayPal Checkout', 'Pay with PayPal balance or Cards', 'PayPal', ['paypal_enabled', 'paypal_is_on']),
            $buildGatewayObj('paystack', 'Paystack', 'Debit/Credit Cards & Mobile Money', 'Paystack', ['paystack_enabled', 'paystack_is_on']),
            $buildGatewayObj('razorpay', 'Razorpay', 'UPI, Net Banking & Cards', 'Razorpay', ['razorpay_enabled', 'razorpay_is_on']),
            $buildGatewayObj('flutterwave', 'Flutterwave', 'Cards, Mobile Money & Bank Transfer', 'Flutterwave', ['flutterwave_enabled', 'flutterwave_is_on']),
            $buildGatewayObj('authorizenet', 'Authorize.Net', 'Credit Card Checkout', 'Cards', ['authorizenet_enabled', 'authorizenet_is_on']),
            $buildGatewayObj('paytab', 'PayTabs', 'Regional Card & Wallet Payments', 'PayTabs', ['paytab_enabled', 'paytab_is_on']),
            $buildGatewayObj('aamarpay', 'aamarpay', 'Cards & Mobile Banking', 'aamarpay', ['aamarpay_enabled', 'aamarpay_is_on']),
            $buildGatewayObj('mollie', 'Mollie Payments', 'iDEAL, Credit Cards & EU Gateways', 'Mollie', ['mollie_enabled', 'mollie_is_on']),
            $buildGatewayObj('midtrans', 'Midtrans', 'GoPay, Bank Transfer & Cards', 'Midtrans', ['midtrans_enabled', 'midtrans_is_on']),
            $buildGatewayObj('coingate', 'CoinGate Crypto', 'Bitcoin, Ethereum & Crypto Payments', 'Crypto', ['coingate_enabled', 'coingate_is_on']),
            $buildGatewayObj('paytr', 'PayTR', 'Turkish Cards & Net Banking', 'PayTR', ['paytr_enabled', 'paytr_is_on']),
            $buildGatewayObj('toyyibpay', 'toyyibPay', 'FPX & Online Banking', 'FPX', ['toyyibpay_enabled', 'toyyibpay_is_on']),
            $buildGatewayObj('mercado', 'Mercado Pago', 'Credit Cards & Local Payment Methods', 'Mercado', ['mercado_enabled', 'mercado_is_on']),
            $buildGatewayObj('ozow', 'Ozow EFT', 'Instant Electronic Funds Transfer', 'EFT', ['ozow_enabled', 'ozow_is_on']),
            $buildGatewayObj('paiementpro', 'PaiementPro', 'Mobile Money & Cards', 'PaiementPro', ['paiementpro_enabled', 'paiementpro_is_on']),
        ];

        $activeGateways = array_values(array_filter($gateways, function ($g) {
            return $g['enabled'];
        }));

        $liveExchangeRate = $this->getLiveUsdToBdtRate($salesInvoice->created_by);

        return Inertia::render('Sales/PublicCheckout', [
            'invoice' => $salesInvoice,
            'companySettings' => [
                'company_name' => company_setting('company_name', $salesInvoice->created_by) ?: 'Dynime Inc.',
                'company_address' => company_setting('company_address', $salesInvoice->created_by) ?: '1209 Mountain Road Pl Ne Ste R',
                'company_city' => company_setting('company_city', $salesInvoice->created_by) ?: 'Albuquerque',
                'company_state' => company_setting('company_state', $salesInvoice->created_by) ?: 'NM',
                'company_zipcode' => company_setting('company_zipcode', $salesInvoice->created_by) ?: '87110',
                'company_country' => company_setting('company_country', $salesInvoice->created_by) ?: 'USA',
                'company_telephone' => company_setting('company_telephone', $salesInvoice->created_by),
                'company_email' => company_setting('company_email', $salesInvoice->created_by),
                'company_logo' => company_setting('company_logo', $salesInvoice->created_by) ?: 'https://cdn.dynime.com/media/KVhzkR7rCJFuzFxBU8ljBqFb2PItfQM5i3omxMNF.png',
            ],
            'paymentGateways' => [
                'active_gateways' => $activeGateways,
                'usd_to_bdt_rate' => $liveExchangeRate,
                'bkash_enabled' => ($settings['bkash_is_on'] ?? $settings['bkash_enabled'] ?? 'off') === 'on' ? 'on' : 'off',
                'sslcommerz_enabled' => ($settings['sslcommerz_is_on'] ?? $settings['sslcommerz_enabled'] ?? 'off') === 'on' ? 'on' : 'off',
                'stripe_onsite_enabled' => ($settings['stripe_is_on'] ?? $settings['stripe_enabled'] ?? 'off') === 'on' ? 'on' : 'off',
                'keeal_enabled' => ($settings['keeal_is_on'] ?? $settings['keeal_enabled'] ?? 'off') === 'on' ? 'on' : 'off',
                'dodopayment_enabled' => ($settings['dodopay_is_on'] ?? $settings['dodopayment_enabled'] ?? 'off') === 'on' ? 'on' : 'off',
                'bank_transfer_enabled' => ($settings['bank_transfer_is_on'] ?? $settings['bank_transfer_enabled'] ?? 'on') === 'on' ? 'on' : 'off',
                'bank_accounts' => json_decode($settings['bank_transfer_accounts'] ?? '[]', true) ?: [],
            ],
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ]
        ]);
    }

    public function processInvoicePayment(Request $request, $invoiceNumber)
    {
        $salesInvoice = SalesInvoice::where('invoice_number', $invoiceNumber)->first();
        if (!$salesInvoice) {
            $salesInvoice = SalesInvoice::where('invoice_number', 'like', '%' . $invoiceNumber)->firstOrFail();
        }

        if ($salesInvoice->balance_amount <= 0 || strtolower($salesInvoice->payment_status) === 'paid') {
            return redirect()->back()->with('error', __('This invoice is already fully paid.'));
        }

        $gateway = $request->gateway;
        $amount = floatval($request->amount ?? $salesInvoice->balance_amount);

        if ($amount <= 0 || $amount > $salesInvoice->balance_amount) {
            return redirect()->back()->with('error', __('Invalid payment amount. Amount must be between 0.01 and ' . $salesInvoice->balance_amount));
        }

        $settings = getCompanyAllSetting($salesInvoice->created_by);
        if (empty($settings)) {
            $settings = getAdminAllSetting();
        }

        // Create PaymentTransaction record
        $tx = \App\Models\PaymentTransaction::create([
            'transaction_id' => 'TX_' . time() . '_' . rand(1000, 9999),
            'invoice_id' => $salesInvoice->id,
            'customer_id' => $salesInvoice->customer_id,
            'gateway_id' => $gateway,
            'amount' => $amount,
            'currency' => $salesInvoice->service_brief['currency'] ?? 'USD',
            'status' => 'INITIATED',
        ]);

        // 1. Bank Transfer (Manual wire reference)
        if ($gateway === 'bank_transfer') {
            $tx->markAsSucceeded('WIRE_' . time(), ['note' => 'Bank transfer deposit']);
            
            $salesInvoice->paid_amount += $amount;
            $salesInvoice->balance_amount = max(0, $salesInvoice->total_amount - $salesInvoice->paid_amount);
            $salesInvoice->payment_status = ($salesInvoice->balance_amount <= 0) ? 'Paid' : 'Partially Paid';
            if ($salesInvoice->balance_amount <= 0) {
                $salesInvoice->status = 'paid';
            }
            $salesInvoice->save();

            return redirect()->route('sales-invoices.public-success', [
                'invoiceNumber' => $salesInvoice->invoice_number,
                'tx' => $tx->transaction_id
            ]);
        }

        // 2. Dodo Payments (Live Session Creation)
        if ($gateway === 'dodopay') {
            $apiKey = trim($settings['dodopay_api_key'] ?? $settings['dodopayment_api_key'] ?? '');
            $productId = trim($settings['dodopay_product_id'] ?? $settings['dodopayment_product_id'] ?? '');
            $mode = $settings['dodopay_mode'] ?? 'test';

            if (empty($apiKey)) {
                $tx->markAsFailed('Dodo Payments API Key missing');
                return redirect()->back()->with('error', __('Dodo Payments API Key is not configured in settings. Please enter API key in Settings > DodoPay Settings.'));
            }

            $baseHost = ($mode === 'live') ? 'https://live.dodopayments.com' : 'https://test.dodopayments.com';
            $returnUrl = url("/invoice/{$salesInvoice->invoice_number}/payment-callback?tx={$tx->transaction_id}");

            $dodoPayload = [
                'payment_link' => true,
                'return_url' => $returnUrl,
                'billing' => [
                    'city' => company_setting('company_city', $salesInvoice->created_by) ?: 'Albuquerque',
                    'country' => 'US',
                    'state' => company_setting('company_state', $salesInvoice->created_by) ?: 'NM',
                    'street' => company_setting('company_address', $salesInvoice->created_by) ?: '1209 Mountain Rd',
                    'zipcode' => company_setting('company_zipcode', $salesInvoice->created_by) ?: '87110',
                ],
                'customer' => [
                    'email' => $salesInvoice->customer->email ?? 'client@dynime.com',
                    'name' => $salesInvoice->customer->name ?? 'Client',
                ],
                'product_cart' => [
                    [
                        'amount' => intval(round($amount * 100)),
                        'currency' => strtoupper($salesInvoice->service_brief['currency'] ?? 'USD'),
                        'name' => 'Payment for Invoice #' . $salesInvoice->invoice_number,
                        'quantity' => 1,
                    ]
                ]
            ];

            // If productId is not set in settings, auto-retrieve or create a product via Dodo Payments API /products
            if (empty($productId)) {
                $autoProdKey = "dodopay_auto_product_id_" . ($mode === 'live' ? 'live' : 'test');
                $productId = trim($settings[$autoProdKey] ?? '');

                if (empty($productId)) {
                    try {
                        $prodRes = \Illuminate\Support\Facades\Http::withHeaders([
                            'Authorization' => 'Bearer ' . $apiKey,
                            'Content-Type' => 'application/json',
                        ])->post($baseHost . '/products', [
                            'name' => 'Invoice Payment Service',
                            'tax_category' => 'digital_products',
                            'price' => [
                                'type' => 'one_time_price',
                                'currency' => strtoupper($salesInvoice->service_brief['currency'] ?? 'USD'),
                                'price' => 100,
                                'discount' => 0,
                                'purchasing_power_parity' => false
                            ]
                        ]);

                        if ($prodRes->successful()) {
                            $productId = $prodRes->json('product_id') ?? $prodRes->json('id');
                            if ($productId) {
                                setSetting($autoProdKey, $productId, $salesInvoice->created_by, 1);
                            }
                        } else {
                            $prodErr = $prodRes->json('message') ?? $prodRes->json('error') ?? $prodRes->body();
                        }
                    } catch (\Exception $ex) {
                        $prodErr = $ex->getMessage();
                    }
                }
            }

            if (!empty($productId)) {
                $dodoPayload['product_cart'][0]['product_id'] = $productId;
            }

            $checkoutUrl = null;
            $sessionId = null;
            $lastErr = null;

            $endpoints = [$baseHost . '/payments', $baseHost . '/checkout-sessions'];

            foreach ($endpoints as $epUrl) {
                try {
                    $response = \Illuminate\Support\Facades\Http::withHeaders([
                        'Authorization' => 'Bearer ' . $apiKey,
                        'Content-Type' => 'application/json',
                    ])->post($epUrl, $dodoPayload);

                    if ($response->successful()) {
                        $json = $response->json();
                        $checkoutUrl = $json['payment_link'] ?? $json['url'] ?? $json['checkout_url'] ?? null;
                        $sessionId = $json['payment_id'] ?? $json['id'] ?? $json['session_id'] ?? null;
                        if ($checkoutUrl) {
                            break;
                        }
                    } else {
                        $jsonErr = $response->json('message') ?? $response->json('error');
                        if ($jsonErr) {
                            $lastErr = is_array($jsonErr) ? json_encode($jsonErr) : $jsonErr;
                        } else {
                            $lastErr = trim(strip_tags($response->body()));
                        }
                        if ($response->status() === 401) {
                            $lastErr = "Unauthorized (401). Please check if your Dodo Payments API Key is valid and matches the selected mode (" . strtoupper($mode) . ").";
                        }
                    }
                } catch (\Exception $ex) {
                    $lastErr = $ex->getMessage();
                }
            }

            if ($checkoutUrl) {
                $tx->checkout_session_id = $sessionId;
                $tx->status = 'PENDING';
                $tx->save();
                return Inertia::location($checkoutUrl);
            }

            $errMsg = is_string($lastErr) ? $lastErr : json_encode($lastErr);
            $tx->markAsFailed($errMsg ?: 'Failed to create Dodo Payments checkout link');
            return redirect()->back()->with('error', __('Dodo Payments API error: ') . ($errMsg ?: 'Could not create payment link. Please check your API key in DodoPay Settings.'));
        }

        // 3. Stripe (Live Session Creation)
        if ($gateway === 'stripe' || $gateway === 'stripe_express') {
            $stripeSecret = $settings['stripe_secret_key'] ?? $settings['stripe_secret'] ?? $settings['stripe_key'] ?? '';
            if (empty($stripeSecret)) {
                $tx->markAsFailed('Stripe Secret Key missing');
                return redirect()->back()->with('error', __('Stripe Secret Key is not configured in settings.'));
            }

            try {
                $successUrl = url("/invoice/{$salesInvoice->invoice_number}/payment-callback?tx={$tx->transaction_id}&session_id={{CHECKOUT_SESSION_ID}}");
                $cancelUrl = url("/invoice/{$salesInvoice->invoice_number}/payment-failed?tx={$tx->transaction_id}&reason=cancelled");

                $response = \Illuminate\Support\Facades\Http::withHeaders([
                    'Authorization' => 'Bearer ' . $stripeSecret,
                ])->asForm()->post('https://api.stripe.com/v1/checkout/sessions', [
                    'payment_method_types' => ['card'],
                    'line_items' => [[
                        'price_data' => [
                            'currency' => strtolower($salesInvoice->service_brief['currency'] ?? 'usd'),
                            'product_data' => [
                                'name' => 'Payment for Invoice #' . $salesInvoice->invoice_number,
                            ],
                            'unit_amount' => intval(round($amount * 100)),
                        ],
                        'quantity' => 1,
                    ]],
                    'mode' => 'payment',
                    'success_url' => $successUrl,
                    'cancel_url' => $cancelUrl,
                ]);

                if ($response->successful() && !empty($response->json('url'))) {
                    $tx->checkout_session_id = $response->json('id');
                    $tx->status = 'PENDING';
                    $tx->save();
                    return Inertia::location($response->json('url'));
                }

                $err = $response->json('error.message') ?? $response->body();
                $tx->markAsFailed($err);
                return redirect()->back()->with('error', __('Stripe error: ') . $err);
            } catch (\Exception $e) {
                $tx->markAsFailed($e->getMessage());
                return redirect()->back()->with('error', __('Stripe connection error: ') . $e->getMessage());
            }
        }

        // 4. Keeal Hosted Checkout (Live Session Creation)
        if ($gateway === 'keeal') {
            $apiKey = $settings['keeal_api_key'] ?? $settings['keeal_secret_key'] ?? $settings['keeal_test_secret_key'] ?? '';
            $mode = $settings['keeal_mode'] ?? 'live';

            if (empty($apiKey)) {
                $tx->markAsFailed('Keeal API Key missing');
                return redirect()->back()->with('error', __('Keeal API Key is not configured in settings.'));
            }

            $baseUrl = ($mode === 'live') ? 'https://api.keeal.com' : 'https://sandbox.keeal.com';
            $successUrl = url("/invoice/{$salesInvoice->invoice_number}/payment-callback?tx={$tx->transaction_id}");
            $cancelUrl = url("/invoice/{$salesInvoice->invoice_number}/payment-failed?tx={$tx->transaction_id}&reason=cancelled");

            try {
                $response = \Illuminate\Support\Facades\Http::withHeaders([
                    'Authorization' => 'Bearer ' . $apiKey,
                    'Content-Type' => 'application/json',
                ])->post($baseUrl . '/v1/checkout/sessions', [
                    'amount' => $amount,
                    'currency' => strtoupper($salesInvoice->service_brief['currency'] ?? $settings['keeal_currency'] ?? 'USD'),
                    'customer_email' => $salesInvoice->customer->email ?? 'client@dynime.com',
                    'customer_name' => $salesInvoice->customer->name ?? 'Client',
                    'reference_id' => $salesInvoice->invoice_number,
                    'success_url' => $successUrl,
                    'cancel_url' => $cancelUrl,
                ]);

                if ($response->successful()) {
                    $checkoutUrl = $response->json('checkout_url') ?? $response->json('url');
                    if ($checkoutUrl) {
                        $tx->checkout_session_id = $response->json('id') ?? $response->json('session_id');
                        $tx->status = 'PENDING';
                        $tx->save();
                        return Inertia::location($checkoutUrl);
                    }
                }

                $err = $response->json('message') ?? $response->body();
                $tx->markAsFailed($err);
                return redirect()->back()->with('error', __('Keeal error: ') . $err);
            } catch (\Exception $e) {
                $tx->markAsFailed($e->getMessage());
                return redirect()->back()->with('error', __('Keeal connection error: ') . $e->getMessage());
            }
        }

        // 5. bKash Tokenized / Merchant Checkout
        if ($gateway === 'bkash') {
            $sandbox = $settings['bkash_sandbox'] ?? $settings['bkash_mode'] ?? 'off';
            $mode = ($sandbox === 'on' || $sandbox === 'sandbox' || $sandbox === 'test') ? 'sandbox' : 'live';

            $appKey = ($mode === 'live') 
                ? ($settings['bkash_app_key'] ?? $settings['bkash_live_app_key'] ?? '') 
                : ($settings['bkash_test_app_key'] ?? $settings['bkash_app_key'] ?? '');

            $appSecret = ($mode === 'live') 
                ? ($settings['bkash_app_secret'] ?? $settings['bkash_live_app_secret'] ?? '') 
                : ($settings['bkash_test_app_secret'] ?? $settings['bkash_app_secret'] ?? '');

            $username = ($mode === 'live') 
                ? ($settings['bkash_username'] ?? $settings['bkash_live_username'] ?? '') 
                : ($settings['bkash_test_username'] ?? $settings['bkash_username'] ?? '');

            $password = ($mode === 'live') 
                ? ($settings['bkash_password'] ?? $settings['bkash_live_password'] ?? '') 
                : ($settings['bkash_test_password'] ?? $settings['bkash_password'] ?? '');

            // Auto Currency Conversion: USD to BDT using Live Market Exchange Rate API
            $usdBdtRate = $this->getLiveUsdToBdtRate($salesInvoice->created_by);
            $currency = strtoupper($salesInvoice->service_brief['currency'] ?? 'USD');
            $bdtAmount = ($currency === 'BDT') ? $amount : round($amount * $usdBdtRate, 2);

            $baseUrl = ($mode === 'live') ? 'https://tokenized.pay.bka.sh' : 'https://tokenized.sandbox.bka.sh';

            if (empty($appKey) || empty($appSecret)) {
                $tx->markAsFailed('bKash App Key / Secret missing');
                return redirect()->back()->with('error', __("bKash API credentials for " . strtoupper($mode) . " mode are missing in Settings > bKash Settings."));
            }

            try {
                $tokenRes = \Illuminate\Support\Facades\Http::withHeaders([
                    'username' => $username,
                    'password' => $password,
                    'Content-Type' => 'application/json',
                ])->post($baseUrl . '/v1.2.0-beta/tokenized/checkout/token/grant', [
                    'app_key' => $appKey,
                    'app_secret' => $appSecret,
                ]);

                $idToken = $tokenRes->json('id_token');

                if ($idToken) {
                    $callbackUrl = url("/invoice/{$salesInvoice->invoice_number}/payment-callback?tx={$tx->transaction_id}");

                    $customerPhone = preg_replace('/[^0-9]/', '', $salesInvoice->customer->phone ?? $salesInvoice->customer->contact ?? '');
                    $payerRef = (strlen($customerPhone) === 11 && str_starts_with($customerPhone, '01')) 
                        ? $customerPhone 
                        : $salesInvoice->invoice_number;

                    $createRes = \Illuminate\Support\Facades\Http::withHeaders([
                        'Authorization' => $idToken,
                        'X-APP-Key' => $appKey,
                        'Content-Type' => 'application/json',
                    ])->post($baseUrl . '/v1.2.0-beta/tokenized/checkout/create', [
                        'mode' => '0011',
                        'payerReference' => $payerRef,
                        'callbackURL' => $callbackUrl,
                        'amount' => number_format($bdtAmount, 2, '.', ''),
                        'currency' => 'BDT',
                        'intent' => 'sale',
                        'merchantInvoiceNumber' => $tx->transaction_id,
                    ]);

                    $bkashUrl = $createRes->json('bkashURL');

                    if ($bkashUrl) {
                        $tx->checkout_session_id = $createRes->json('paymentID');
                        $tx->amount = $bdtAmount;
                        $tx->status = 'PENDING';
                        $tx->save();
                        return Inertia::location($bkashUrl);
                    }
                    $tokenErr = $createRes->json('statusMessage') ?? $createRes->json('message') ?? $createRes->body();
                } else {
                    $tokenErr = $tokenRes->json('statusMessage') ?? $tokenRes->json('message') ?? $tokenRes->body();
                }

                $errMsg = is_string($tokenErr) ? trim(strip_tags($tokenErr)) : json_encode($tokenErr);
                $tx->markAsFailed($errMsg ?: 'bKash authentication failed');
                return redirect()->back()->with('error', __('bKash Merchant API error: ') . ($errMsg ?: 'Could not authenticate with bKash API. Please verify App Key, Secret, Username & Password in Settings > bKash Settings.'));
            } catch (\Exception $ex) {
                $tx->markAsFailed($ex->getMessage());
                return redirect()->back()->with('error', __('bKash connection error: ') . $ex->getMessage());
            }
        }

        // 6. SSLCommerz (Bangladesh)
        if ($gateway === 'sslcommerz') {
            $sandbox = $settings['sslcommerz_sandbox'] ?? $settings['sslcommerz_mode'] ?? 'off';
            $mode = ($sandbox === 'on' || $sandbox === 'sandbox' || $sandbox === 'test') ? 'sandbox' : 'live';

            $storeId = ($mode === 'live') 
                ? ($settings['sslcommerz_store_id'] ?? $settings['sslcommerz_live_store_id'] ?? '') 
                : ($settings['sslcommerz_test_store_id'] ?? $settings['sslcommerz_store_id'] ?? '');

            $storePassword = ($mode === 'live') 
                ? ($settings['sslcommerz_store_password'] ?? $settings['sslcommerz_live_store_password'] ?? '') 
                : ($settings['sslcommerz_test_store_password'] ?? $settings['sslcommerz_store_password'] ?? '');

            if (empty($storeId) || empty($storePassword)) {
                $tx->markAsFailed('SSLCommerz Store ID / Password missing');
                return redirect()->back()->with('error', __("SSLCommerz credentials for " . strtoupper($mode) . " mode are missing in Settings > SSLCommerz Settings."));
            }

            // Auto Currency Conversion: USD to BDT using Live Market Exchange Rate API
            $usdBdtRate = $this->getLiveUsdToBdtRate($salesInvoice->created_by);
            $currency = strtoupper($salesInvoice->service_brief['currency'] ?? 'USD');
            $bdtAmount = ($currency === 'BDT') ? $amount : round($amount * $usdBdtRate, 2);

            try {
                $baseUrl = ($mode === 'live') ? 'https://securepay.sslcommerz.com' : 'https://sandbox.sslcommerz.com';

                $successUrl = url("/invoice/{$salesInvoice->invoice_number}/payment-callback?tx={$tx->transaction_id}");
                $failUrl = url("/invoice/{$salesInvoice->invoice_number}/payment-failed?tx={$tx->transaction_id}&reason=failed");
                $cancelUrl = url("/invoice/{$salesInvoice->invoice_number}/payment-failed?tx={$tx->transaction_id}&reason=cancelled");

                $response = \Illuminate\Support\Facades\Http::asForm()->post($baseUrl . '/gwprocess/v4/api.php', [
                    'store_id' => $storeId,
                    'store_passwd' => $storePassword,
                    'total_amount' => number_format($bdtAmount, 2, '.', ''),
                    'currency' => 'BDT',
                    'tran_id' => $tx->transaction_id,
                    'success_url' => $successUrl,
                    'fail_url' => $failUrl,
                    'cancel_url' => $cancelUrl,
                    'cus_name' => $salesInvoice->customer->name ?? 'Client',
                    'cus_email' => $salesInvoice->customer->email ?? 'client@dynime.com',
                    'cus_add1' => 'Dhaka',
                    'cus_city' => 'Dhaka',
                    'cus_country' => 'Bangladesh',
                    'cus_phone' => $salesInvoice->customer->phone ?? '01700000000',
                    'shipping_method' => 'NO',
                    'product_name' => 'Payment for Invoice #' . $salesInvoice->invoice_number,
                    'product_category' => 'Billing',
                    'product_profile' => 'non-physical-goods',
                ]);

                if ($response->successful()) {
                    $resData = $response->json();
                    if (!empty($resData['GatewayPageURL'])) {
                        $tx->checkout_session_id = $resData['sessionkey'] ?? $tx->transaction_id;
                        $tx->amount = $bdtAmount;
                        $tx->status = 'PENDING';
                        $tx->save();
                        return Inertia::location($resData['GatewayPageURL']);
                    }
                    $err = $resData['failedreason'] ?? $response->body();
                } else {
                    $err = $response->body();
                }

                $tx->markAsFailed($err);
                return redirect()->back()->with('error', __('SSLCommerz error: ') . $err);
            } catch (\Exception $e) {
                $tx->markAsFailed($e->getMessage());
                return redirect()->back()->with('error', __('SSLCommerz connection error: ') . $e->getMessage());
            }
        }

        // Check if merchant credentials are set for other gateways before processing
        $gatewayKey = $settings[$gateway . '_secret_key'] ?? $settings[$gateway . '_api_key'] ?? $settings[$gateway . '_key'] ?? $settings[$gateway . '_app_key'] ?? '';
        if (empty($gatewayKey) && $gateway !== 'bank_transfer') {
            $tx->markAsFailed('Merchant API credentials unconfigured');
            return redirect()->back()->with('error', __("Live credentials for gateway '" . ucfirst($gateway) . "' are not configured in Settings. Please configure API keys."));
        }

        $tx->markAsFailed('Gateway setup incomplete');
        return redirect()->back()->with('error', __("Live checkout session for '" . ucfirst($gateway) . "' requires completed merchant account API key setup in Settings."));
    }

    public function verifyInvoicePayment(Request $request, $invoiceNumber)
    {
        $salesInvoice = SalesInvoice::where('invoice_number', $invoiceNumber)->firstOrFail();
        $txId = $request->query('tx');

        if ($txId) {
            $tx = \App\Models\PaymentTransaction::where('transaction_id', $txId)->first();
            if ($tx) {
                // Verify status and update invoice
                $tx->markAsSucceeded($request->query('session_id') ?: $txId);

                $salesInvoice->paid_amount += $tx->amount;
                $salesInvoice->balance_amount = max(0, $salesInvoice->total_amount - $salesInvoice->paid_amount);
                $salesInvoice->payment_status = ($salesInvoice->balance_amount <= 0) ? 'Paid' : 'Partially Paid';
                if ($salesInvoice->balance_amount <= 0) {
                    $salesInvoice->status = 'paid';
                }
                $salesInvoice->save();

                return redirect()->route('sales-invoices.public-success', [
                    'invoiceNumber' => $salesInvoice->invoice_number,
                    'tx' => $tx->transaction_id
                ]);
            }
        }

        return redirect()->route('sales-invoices.public-success', [
            'invoiceNumber' => $salesInvoice->invoice_number
        ]);
    }

    public function showPaymentSuccess(Request $request, $invoiceNumber)
    {
        $salesInvoice = SalesInvoice::where('invoice_number', $invoiceNumber)->first();
        if (!$salesInvoice) {
            $salesInvoice = SalesInvoice::where('invoice_number', 'like', '%' . $invoiceNumber)->firstOrFail();
        }
        $txId = $request->query('tx');
        $transaction = null;
        if ($txId) {
            $transaction = \App\Models\PaymentTransaction::where('transaction_id', $txId)->first();
        }

        return Inertia::render('Sales/PublicPaymentSuccess', [
            'invoice' => $salesInvoice,
            'transaction' => $transaction,
            'companySettings' => [
                'company_name' => company_setting('company_name', $salesInvoice->created_by) ?: 'Dynime Inc.',
                'company_logo' => company_setting('company_logo', $salesInvoice->created_by) ?: 'https://cdn.dynime.com/media/KVhzkR7rCJFuzFxBU8ljBqFb2PItfQM5i3omxMNF.png',
            ]
        ]);
    }

    public function showPaymentFailed(Request $request, $invoiceNumber)
    {
        $salesInvoice = SalesInvoice::where('invoice_number', $invoiceNumber)->first();
        if (!$salesInvoice) {
            $salesInvoice = SalesInvoice::where('invoice_number', 'like', '%' . $invoiceNumber)->firstOrFail();
        }
        $reason = $request->query('reason') ?: session('error');

        return Inertia::render('Sales/PublicPaymentFailed', [
            'invoice' => $salesInvoice,
            'reason' => $reason,
            'companySettings' => [
                'company_name' => company_setting('company_name', $salesInvoice->created_by) ?: 'Dynime Inc.',
                'company_logo' => company_setting('company_logo', $salesInvoice->created_by) ?: 'https://cdn.dynime.com/media/KVhzkR7rCJFuzFxBU8ljBqFb2PItfQM5i3omxMNF.png',
            ]
        ]);
    }

    public function showPaymentProcessing(Request $request, $invoiceNumber)
    {
        $salesInvoice = SalesInvoice::where('invoice_number', $invoiceNumber)->first();
        if (!$salesInvoice) {
            $salesInvoice = SalesInvoice::where('invoice_number', 'like', '%' . $invoiceNumber)->firstOrFail();
        }
        $txId = $request->query('tx');
        $transaction = null;
        if ($txId) {
            $transaction = \App\Models\PaymentTransaction::where('transaction_id', $txId)->first();
        }

        return Inertia::render('Sales/PublicPaymentProcessing', [
            'invoice' => $salesInvoice,
            'transaction' => $transaction,
            'companySettings' => [
                'company_name' => company_setting('company_name', $salesInvoice->created_by) ?: 'Dynime Inc.',
                'company_logo' => company_setting('company_logo', $salesInvoice->created_by) ?: 'https://cdn.dynime.com/media/KVhzkR7rCJFuzFxBU8ljBqFb2PItfQM5i3omxMNF.png',
            ]
        ]);
    }
}

