<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalesInvoice;
use App\Models\SalesInvoiceItem;
use App\Models\SalesInvoiceItemTax;
use App\Models\User;
use Workdo\ProductService\Models\ProductServiceItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrderSyncController extends Controller
{
    public function syncOrder(Request $request)
    {
        // Simple authentication check using a token (VITE_API_SECRET or similar)
        // For security, you can configure an API token in your .env
        $token = $request->header('X-Webhook-Token');
        if ($token !== config('services.webhook.token', 'dynime-secret-token')) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'required|email|max:255',
            'order_id' => 'required|string|max:100', // Unique order reference from customer site
            'type' => 'required|in:product,service',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.name' => 'required|string',
            'items.*.sku' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount_percentage' => 'nullable|numeric|min:0|max:100',
            'items.*.tax_percentage' => 'nullable|numeric|min:0|max:100',
        ]);

        try {
            DB::beginTransaction();

            // Find or create customer
            $customer = User::where('email', $validated['customer_email'])->first();
            if (!$customer) {
                $customer = new User();
                $customer->name = $validated['customer_name'];
                $customer->email = $validated['customer_email'];
                $customer->password = bcrypt(\Illuminate\Support\Str::random(16));
                $customer->type = 'client';
                $customer->created_by = 1; // Default creator (super admin or company creator)
                $customer->save();
            }

            // Calculate totals
            $subtotal = 0;
            $totalTax = 0;
            $totalDiscount = 0;

            $itemsData = [];

            foreach ($validated['items'] as $item) {
                // Find matching product/service in ERP by SKU
                $product = ProductServiceItem::where('sku', $item['sku'])->first();
                $productId = $product ? $product->id : 1; // Fallback or throw error

                $lineTotal = $item['quantity'] * $item['unit_price'];
                $discountAmount = ($lineTotal * ($item['discount_percentage'] ?? 0)) / 100;
                $afterDiscount = $lineTotal - $discountAmount;
                $taxAmount = ($afterDiscount * ($item['tax_percentage'] ?? 0)) / 100;

                $subtotal += $lineTotal;
                $totalDiscount += $discountAmount;
                $totalTax += $taxAmount;

                $itemsData[] = [
                    'product_id' => $productId,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'discount_percentage' => $item['discount_percentage'] ?? 0,
                    'tax_percentage' => $item['tax_percentage'] ?? 0,
                ];
            }

            $totalAmount = $subtotal + $totalTax - $totalDiscount;

            // Create SalesInvoice
            $invoice = new SalesInvoice();
            $invoice->invoice_date = now();
            $invoice->due_date = now()->addDays(7); // default 7 days due date
            $invoice->customer_id = $customer->id;
            $invoice->warehouse_id = null;
            $invoice->type = $validated['type'];
            $invoice->payment_terms = 'Due on Receipt';
            $invoice->notes = $validated['notes'] ?? ('Synced from Main Customer Site: ' . $validated['order_id']);
            $invoice->subtotal = $subtotal;
            $invoice->tax_amount = $totalTax;
            $invoice->discount_amount = $totalDiscount;
            $invoice->total_amount = $totalAmount;
            $invoice->paid_amount = 0;
            $invoice->balance_amount = $totalAmount;
            $invoice->status = 'posted'; // Directly post it since it's processed from live site
            $invoice->creator_id = 1; // Super Admin ID
            $invoice->created_by = 1; // Super Admin ID
            $invoice->save();

            // Create SalesInvoiceItems
            foreach ($itemsData as $itemData) {
                $invoiceItem = new SalesInvoiceItem();
                $invoiceItem->invoice_id = $invoice->id;
                $invoiceItem->product_id = $itemData['product_id'];
                $invoiceItem->quantity = $itemData['quantity'];
                $invoiceItem->unit_price = $itemData['unit_price'];
                $invoiceItem->discount_percentage = $itemData['discount_percentage'];
                $invoiceItem->tax_percentage = $itemData['tax_percentage'];
                $invoiceItem->save();
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Order successfully synced to ERP',
                'invoice_id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Order sync failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to sync order: ' . $e->getMessage()
            ], 500);
        }
    }
}
