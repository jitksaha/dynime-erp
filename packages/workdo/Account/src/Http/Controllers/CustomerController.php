<?php

namespace Workdo\Account\Http\Controllers;

use App\Models\User;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Workdo\Account\Models\Customer;
use Workdo\Account\Http\Requests\StoreCustomerRequest;
use Workdo\Account\Http\Requests\UpdateCustomerRequest;
use Workdo\Account\Events\CreateCustomer;
use Workdo\Account\Events\UpdateCustomer;
use Workdo\Account\Events\DestroyCustomer;

class CustomerController extends Controller
{
    public function index()
    {
        if(Auth::user()->can('manage-customers')){
            $customers = Customer::query()
                ->with('user:id,name,avatar,is_disable')
                ->where(function($q) {
                    if(Auth::user()->can('manage-any-customers')) {
                        $q->where('created_by', creatorId());
                    } elseif(Auth::user()->can('manage-own-customers')) {
                        $q->where('creator_id', Auth::id());
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                })
                ->when(request('company_name'), fn($q) => $q->where('company_name', 'like', '%' . request('company_name') . '%'))
                ->when(request('customer_code'), fn($q) => $q->where('customer_code', 'like', '%' . request('customer_code') . '%'))
                ->when(request('tax_number'), fn($q) => $q->where('tax_number', 'like', '%' . request('tax_number') . '%'))
                ->when(request('sort'), fn($q) => $q->orderBy(request('sort'), request('direction', 'asc')), fn($q) => $q->latest())
                ->paginate(request('per_page', 10))
                ->withQueryString();

            $users = User::where('type', 'client')
                ->where('created_by', creatorId())
                ->whereNotIn('id', Customer::pluck('user_id')->filter())
                ->select('id', 'name', 'email', 'mobile_no')
                ->get();

            return Inertia::render('Account/Customers/Index', [
                'customers' => $customers,
                'users' => $users,
            ]);
        }
        return back()->with('error', __('Permission denied'));
    }

    public function store(StoreCustomerRequest $request)
    {
        if(Auth::user()->can('create-customers')){
            $validated = $request->validated();

            $customer = new Customer();
            $customer->user_id = $validated['user_id'] ?? null;
            $customer->company_name = $validated['company_name'];
            $customer->contact_person_name = $validated['contact_person_name'];
            $customer->contact_person_email = $validated['contact_person_email'] ?? null;
            $customer->contact_person_mobile = $validated['contact_person_mobile'] ?? null;
            $customer->tax_number = $validated['tax_number'] ?? null;
            $customer->payment_terms = $validated['payment_terms'] ?? null;
            $customer->billing_address = $validated['billing_address'];
            $customer->shipping_address = $validated['same_as_billing'] ? $validated['billing_address'] : $validated['shipping_address'];
            $customer->same_as_billing = $validated['same_as_billing'] ?? false;
            $customer->notes = $validated['notes'] ?? null;
            $customer->creator_id = Auth::id();
            $customer->created_by = creatorId();
            $customer->save();

            CreateCustomer::dispatch($request, $customer);

            return redirect()->route('account.customers.index')->with('success', __('The customer has been created successfully.'));
        }
        return redirect()->route('account.customers.index')->with('error', __('Permission denied'));
    }

    public function quickStore(\Illuminate\Http\Request $request)
    {
        if (!Auth::user()->can('create-customers')) {
            return response()->json(['error' => __('Permission denied')], 403);
        }

        $validated = $request->validate([
            'company_name'          => 'required|string|max:255',
            'contact_person_name'   => 'required|string|max:255',
            'contact_person_email'  => 'required|email|max:255|unique:users,email',
            'contact_person_mobile' => 'nullable|string|max:50',
            'password'              => 'required|string|min:6',
            'billing_city'          => 'nullable|string|max:255',
            'billing_country'       => 'nullable|string|max:255',
            'notes'                 => 'nullable|string',
        ]);

        // Use the admin-provided password
        $plainPassword = $validated['password'];

        // Create the linked User account (type: client)
        $user = new User();
        $user->name             = $validated['contact_person_name'];
        $user->email            = $validated['contact_person_email'];
        $user->mobile_no        = $validated['contact_person_mobile'] ?? null;
        $user->password         = \Illuminate\Support\Facades\Hash::make($plainPassword);
        $user->type             = 'client';
        $user->is_enable_login  = true;
        $user->lang             = company_setting('defaultLanguage') ?? 'en';
        $user->email_verified_at = now();
        $user->creator_id       = Auth::id();
        $user->created_by       = creatorId();
        $user->save();

        // Assign client role if it exists
        try {
            $clientRole = \Spatie\Permission\Models\Role::where('name', 'client')
                ->where('created_by', creatorId())
                ->first();
            if ($clientRole) {
                $user->assignRole($clientRole);
            }
        } catch (\Exception $e) {
            // Role assignment is optional — continue
        }

        // Do NOT auto-email — admin will manually send login info from Customers page

        // Build billing address skeleton
        $billingAddress = [
            'name'           => $validated['contact_person_name'],
            'address_line_1' => '-',
            'address_line_2' => null,
            'city'           => $validated['billing_city'] ?? '-',
            'state'          => '-',
            'country'        => $validated['billing_country'] ?? '-',
            'zip_code'       => '-',
        ];

        // Create the Customer linked to the new User
        $customer = new Customer();
        $customer->user_id               = $user->id;
        $customer->company_name          = $validated['company_name'];
        $customer->contact_person_name   = $validated['contact_person_name'];
        $customer->contact_person_email  = $validated['contact_person_email'];
        $customer->contact_person_mobile = $validated['contact_person_mobile'] ?? null;
        $customer->billing_address       = $billingAddress;
        $customer->shipping_address      = $billingAddress;
        $customer->same_as_billing       = true;
        $customer->notes                 = $validated['notes'] ?? null;
        $customer->creator_id            = Auth::id();
        $customer->created_by            = creatorId();
        $customer->save();

        CreateCustomer::dispatch($request, $customer);

        return response()->json([
            'id'    => $customer->id,
            'name'  => $customer->contact_person_name . ' (' . $customer->company_name . ')',
            'email' => $customer->contact_person_email,
        ]);
    }

    public function sendLoginInfo(Customer $customer)
    {
        if (!Auth::user()->can('edit-customers')) {
            return response()->json(['error' => __('Permission denied')], 403);
        }

        if (!$customer->user_id) {
            return response()->json(['error' => __('This customer has no linked login account.')], 422);
        }

        $user = User::find($customer->user_id);
        if (!$user) {
            return response()->json(['error' => __('Linked user account not found.')], 404);
        }

        // Generate a fresh password and update the user
        $newPassword = \Illuminate\Support\Str::random(10);
        $user->password = \Illuminate\Support\Facades\Hash::make($newPassword);
        $user->save();

        try {
            \App\Models\EmailTemplate::sendEmailTemplate('New User', [$user->email], [
                'name'     => $user->name,
                'email'    => $user->email,
                'password' => $newPassword,
            ]);
            return response()->json(['success' => __('Login info sent to :email', ['email' => $user->email])]);
        } catch (\Exception $e) {
            return response()->json(['error' => __('Failed to send email: ') . $e->getMessage()], 500);
        }
    }

    public function update(UpdateCustomerRequest $request, Customer $customer)
    {
        if(Auth::user()->can('edit-customers')){
            $validated = $request->validated();

            $customer->company_name = $validated['company_name'];
            $customer->contact_person_name = $validated['contact_person_name'];
            $customer->contact_person_email = $validated['contact_person_email'] ?? null;
            $customer->contact_person_mobile = $validated['contact_person_mobile'] ?? null;
            $customer->tax_number = $validated['tax_number'] ?? null;
            $customer->payment_terms = $validated['payment_terms'] ?? null;
            $customer->billing_address = $validated['billing_address'];
            $customer->shipping_address = $validated['same_as_billing'] ? $validated['billing_address'] : $validated['shipping_address'];
            $customer->same_as_billing = $validated['same_as_billing'] ?? false;
            $customer->notes = $validated['notes'] ?? null;
            $customer->save();

            UpdateCustomer::dispatch($request, $customer);

            return back()->with('success', __('The customer details are updated successfully.'));
        }
        return back()->with('error', __('Permission denied'));
    }

    public function destroy(Customer $customer)
    {
        if(Auth::user()->can('delete-customers')){
            DestroyCustomer::dispatch($customer);
            $customer->delete();
            return back()->with('success', __('The customer has been deleted.'));
        }
        return back()->with('error', __('Permission denied'));
    }
}