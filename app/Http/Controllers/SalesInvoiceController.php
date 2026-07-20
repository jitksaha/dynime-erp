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
        if(Auth::user()->can('print-sales-invoices')){
            $salesInvoice->load(['customer', 'customerDetails', 'items.product', 'items.taxes', 'warehouse']);

            return Inertia::render('Sales/Print', [
                'invoice' => $salesInvoice
            ]);
        }
        else{
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
                'paid_amount' => 'nullable|numeric|min:0'
            ]);

            if ($request->has('payment_status')) {
                $salesInvoice->payment_status = $request->payment_status;
                if ($request->payment_status === 'Paid') {
                    $salesInvoice->status = 'paid';
                    $salesInvoice->paid_amount = $salesInvoice->total_amount;
                    $salesInvoice->balance_amount = 0;
                } elseif ($request->payment_status === 'Partially Paid') {
                    $salesInvoice->status = 'partial';
                    if ($request->has('paid_amount')) {
                        $salesInvoice->paid_amount = floatval($request->paid_amount);
                    }
                    $salesInvoice->balance_amount = max(0, $salesInvoice->total_amount - $salesInvoice->paid_amount);
                } elseif ($request->payment_status === 'Unpaid' || $request->payment_status === 'Failed') {
                    $salesInvoice->status = 'posted';
                    $salesInvoice->paid_amount = 0;
                    $salesInvoice->balance_amount = $salesInvoice->total_amount;
                }
            } elseif ($request->has('paid_amount') && $salesInvoice->payment_status === 'Partially Paid') {
                $salesInvoice->paid_amount = floatval($request->paid_amount);
                $salesInvoice->balance_amount = max(0, $salesInvoice->total_amount - $salesInvoice->paid_amount);
            }

            if ($request->has('operational_status')) {
                $salesInvoice->operational_status = $request->operational_status;
            }

            if ($request->has('project_category')) {
                $salesInvoice->project_category = $request->project_category;
                // Default project status for new category if category is changing
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
                    'message' => __('Invoice status updated successfully.'),
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

    public function processInvoicePayment(Request $request, $invoiceNumber)
    {
        $salesInvoice = SalesInvoice::where('invoice_number', $invoiceNumber)->first();
        if (!$salesInvoice) {
            $salesInvoice = SalesInvoice::where('invoice_number', 'like', '%' . $invoiceNumber)->firstOrFail();
        }

        $gateway = $request->gateway;
        $amount = floatval($request->amount ?? $salesInvoice->balance_amount);

        if ($amount <= 0 || $amount > $salesInvoice->balance_amount) {
            return redirect()->back()->with('error', __('Invalid payment amount.'));
        }

        $settings = getCompanyAllSetting($salesInvoice->created_by);
        if (empty($settings)) {
            $settings = getAdminAllSetting();
        }

        // 1. Bank Transfer (Manual reference deposit)
        if ($gateway === 'bank_transfer') {
            $salesInvoice->paid_amount += $amount;
            $salesInvoice->balance_amount = max(0, $salesInvoice->total_amount - $salesInvoice->paid_amount);
            $salesInvoice->payment_status = ($salesInvoice->balance_amount <= 0) ? 'Paid' : 'Partially Paid';
            $salesInvoice->save();

            return redirect()->back()->with('success', __('Bank transfer reference submitted successfully! Invoice status updated.'));
        }

        // 2. Dodo Payments (Live Capture Session)
        if ($gateway === 'dodopay') {
            $apiKey = $settings['dodopay_api_key'] ?? $settings['dodopayment_api_key'] ?? '';
            $productId = $settings['dodopay_product_id'] ?? $settings['dodopayment_product_id'] ?? '';
            $mode = $settings['dodopay_mode'] ?? 'test';

            if (empty($apiKey)) {
                return redirect()->back()->with('error', __('Dodo Payments API Key is not configured in settings.'));
            }

            $baseUrl = ($mode === 'live') ? 'https://api.dodopayments.com' : 'https://test.dodopayments.com';
            $returnUrl = url("/invoice/{$salesInvoice->invoice_number}?payment=success");

            try {
                $response = \Illuminate\Support\Facades\Http::withHeaders([
                    'Authorization' => 'Bearer ' . $apiKey,
                    'Content-Type' => 'application/json',
                ])->post($baseUrl . '/v1/checkout-sessions', [
                    'product_id' => $productId,
                    'quantity' => 1,
                    'payment_link' => true,
                    'return_url' => $returnUrl,
                    'customer' => [
                        'email' => $salesInvoice->customer->email ?? 'client@dynime.com',
                        'name' => $salesInvoice->customer->name ?? 'Client',
                    ],
                ]);

                if ($response->successful()) {
                    $checkoutUrl = $response->json('payment_link') ?? $response->json('url') ?? $response->json('checkout_url');
                    if ($checkoutUrl) {
                        return Inertia::location($checkoutUrl);
                    }
                }

                $err = $response->json('message') ?? $response->body();
                return redirect()->back()->with('error', __('Dodo Payments error: ') . $err);
            } catch (\Exception $e) {
                return redirect()->back()->with('error', __('Dodo Payments connection error: ') . $e->getMessage());
            }
        }

        // 3. Stripe (Live Capture Session)
        if ($gateway === 'stripe' || $gateway === 'stripe_express') {
            $stripeSecret = $settings['stripe_secret_key'] ?? $settings['stripe_secret'] ?? $settings['stripe_key'] ?? '';
            if (empty($stripeSecret)) {
                return redirect()->back()->with('error', __('Stripe Secret Key is not configured in settings.'));
            }

            try {
                $successUrl = url("/invoice/{$salesInvoice->invoice_number}?payment=success");
                $cancelUrl = url("/invoice/{$salesInvoice->invoice_number}?payment=cancel");

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
                    return Inertia::location($response->json('url'));
                }

                $err = $response->json('error.message') ?? $response->body();
                return redirect()->back()->with('error', __('Stripe error: ') . $err);
            } catch (\Exception $e) {
                return redirect()->back()->with('error', __('Stripe connection error: ') . $e->getMessage());
            }
        }

        // Check if merchant credentials are set for other gateways before processing
        $gatewayKey = $settings[$gateway . '_secret_key'] ?? $settings[$gateway . '_api_key'] ?? $settings[$gateway . '_key'] ?? $settings[$gateway . '_app_key'] ?? '';
        if (empty($gatewayKey) && $gateway !== 'bank_transfer') {
            return redirect()->back()->with('error', __("Live credentials for gateway '" . ucfirst($gateway) . "' are not configured in Settings. Please configure API keys."));
        }

        return redirect()->back()->with('error', __("Live checkout session for '" . ucfirst($gateway) . "' requires completed merchant account API key setup in Settings."));
    }
}

