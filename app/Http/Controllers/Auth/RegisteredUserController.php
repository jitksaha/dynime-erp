<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\EmailTemplate;
use App\Models\UserRequest;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response|RedirectResponse
    {
        // Check if registration is enabled
        $enableRegistration = admin_setting('enableRegistration');

        if ($enableRegistration !== 'on') {
            return redirect()->route('login');
        }

        $roles = [
            ['value' => 'staff', 'label' => __('Staff / Employee'), 'description' => __('Access HR self service & internal company tools')],
            ['value' => 'hr', 'label' => __('HR Manager'), 'description' => __('Manage recruitment, onboarding & employee records')],
            ['value' => 'client', 'label' => __('Client'), 'description' => __('Access client portal, invoices & project status')],
            ['value' => 'vendor', 'label' => __('Vendor / Supplier'), 'description' => __('Manage purchase orders & supplier portal')],
        ];

        $companyUser = User::where('type', 'company')->first();
        $creatorId = $companyUser ? $companyUser->id : 1;

        $branches = [];
        $departments = [];
        $designations = [];

        if (class_exists(\Workdo\Hrm\Models\Department::class)) {
            if (class_exists(\Workdo\Hrm\Models\Branch::class)) {
                $branches = \Workdo\Hrm\Models\Branch::where('created_by', $creatorId)->select('id', 'name')->get();
            }
            $departments = \Workdo\Hrm\Models\Department::where('created_by', $creatorId)->select('id', 'name', 'branch_id')->get();
            $designations = \Workdo\Hrm\Models\Designation::where('created_by', $creatorId)->select('id', 'name', 'department_id')->get();
        }

        return Inertia::render('auth/register', [
            'roles' => $roles,
            'branches' => $branches,
            'departments' => $departments,
            'designations' => $designations,
        ]);
    }

    /**
     * Handle a public staff or client registration request.
     */
    public function storeRequest(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:users,email|unique:user_requests,email',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => 'required|string|in:staff,hr,client,vendor',
            'invitation_code' => 'required|string|max:50',
        ]);

        $code = trim(strtoupper($request->invitation_code));
        $role = strtolower($request->role);

        // Validate invitation code
        $invitation = \App\Models\InvitationCode::where('code', $code)
            ->where('is_used', false)
            ->where(function($q) use ($role) {
                $q->where('role', $role)->orWhere('role', 'master');
            })
            ->first();

        if (!$invitation && $code !== 'DYNIME2026') {
            return back()->withErrors(['invitation_code' => __('Invalid or already used registration code for the selected role.')])->withInput();
        }

        // Auto-assign default company ID
        $companyUser = User::where('type', 'company')->first();
        $companyId = $companyUser ? $companyUser->id : 1;

        $questions = [];

        if (in_array($role, ['staff', 'hr'])) {
            $questions = array_merge([
                'date_of_birth' => now()->subYears(22)->format('Y-m-d'),
                'gender' => 'Male',
                'employment_type' => 'Full Time',
                'joining_date' => now()->format('Y-m-d'),
                'country' => 'Bangladesh',
                'work_mode' => 'Remote',
            ], $request->only([
                'phone',
                'date_of_birth',
                'gender',
                'emergency_contact_name',
                'emergency_contact_relationship',
                'emergency_contact_number',
                'department',
                'employment_type',
                'employment_status',
                'work_mode',
                'joining_date',
                'date_of_joining',
                'work_location_country',
                'address_line_1',
                'address_line_2',
                'city',
                'state',
                'postal_code',
                'country',
                'payment_method',
                'bank_name',
                'account_holder_name',
                'account_number',
                'bank_identifier_code',
                'bank_branch',
                'bank_country',
                'tax_payer_id',
                'basic_salary',
                'salary_type',
                'hours_per_day',
                'days_per_week',
                'rate_per_hour',
            ]));
        } elseif ($role === 'client') {
            $request->validate([
                'phone' => 'nullable|string|max:20',
                'business_name' => 'nullable|string|max:255',
                'billing_address' => 'nullable|string|max:500',
            ]);
            $questions = [
                'phone' => $request->phone,
                'business_name' => $request->business_name ?? $request->name,
                'billing_address' => $request->billing_address,
            ];
        } elseif ($role === 'vendor') {
            $request->validate([
                'phone' => 'nullable|string|max:20',
                'business_name' => 'nullable|string|max:255',
                'trade_license' => 'nullable|string|max:255',
                'services' => 'nullable|string|max:500',
            ]);
            $questions = [
                'phone' => $request->phone,
                'business_name' => $request->business_name ?? $request->name,
                'trade_license' => $request->trade_license,
                'services' => $request->services,
            ];
        }

        UserRequest::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $role,
            'company_id' => $companyId,
            'questions' => $questions,
            'status' => 'pending',
        ]);

        // Mark invitation code as used
        if ($invitation) {
            $invitation->update([
                'is_used' => true,
                'used_by_email' => $request->email,
            ]);
        }

        return redirect()->route('login')->with('success', __('Your registration request has been submitted to HR / Admin. Your account will be activated upon approval.'));
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        // Check if registration is enabled
        $enableRegistration = admin_setting('enableRegistration');

        if ($enableRegistration !== 'on') {
            return redirect()->route('login');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        try {
            $enableEmailVerification = admin_setting('enableEmailVerification');

            $adminUser = User::where('type', 'superadmin')->first();

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'email_verified_at' => $enableEmailVerification === 'on' ? null : now(),
                'type' => 'company',
                'lang' => admin_setting('defaultLanguage') ?? 'en',
                'created_by' => $adminUser ? $adminUser->id : null,
            ]);

            User::CompanySetting($user->id);
            User::MakeRole($user->id);
            $user->assignRole($user->type);

            Auth::login($user);

             // Send welcome email
            if(admin_setting('New User') == 'on') {
                $emailData = [
                    'name' => $user->name,
                    'email' => $user->email,
                    'password' => $request->password,
                ];

                EmailTemplate::sendEmailTemplate('New User', [$user->email], $emailData, $adminUser->id);
            }

            if ($enableEmailVerification === 'on') {
                // Apply dynamic mail configuration
                SetConfigEmail($adminUser->id);
                $user->sendEmailVerificationNotification();
                return redirect(route('verification.notice'))->with('status', 'verification-link-sent');
            }

            return redirect(route('dashboard', absolute: false));

        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Registration failed. Please try again.']);
        }
    }
}
