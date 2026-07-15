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

        $companies = User::where('type', 'company')->select('id', 'name')->get();

        // Get Spatie roles excluding company and superadmin
        $roles = \Spatie\Permission\Models\Role::whereNotIn('name', ['company', 'superadmin'])
            ->select('id', 'name')
            ->get()
            ->map(function($role) {
                return [
                    'value' => $role->name,
                    'label' => ucwords(str_replace('_', ' ', $role->name))
                ];
            });

        return Inertia::render('auth/register', [
            'companies' => $companies,
            'roles' => $roles
        ]);
    }

    /**
     * Handle a public staff or client registration request.
     */
    public function storeRequest(Request $request): RedirectResponse
    {
        $allowedRoles = \Spatie\Permission\Models\Role::whereNotIn('name', ['company', 'superadmin'])
            ->pluck('name')
            ->toArray();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:users,email|unique:user_requests,email',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => 'required|string|in:' . implode(',', $allowedRoles),
            'company_id' => 'required|exists:users,id',
        ]);

        $role = $request->role;
        $roleLower = strtolower($role);
        $isClient = in_array($roleLower, ['client', 'vendor', 'customer', 'buyer']) || 
                    str_contains($roleLower, 'client') || 
                    str_contains($roleLower, 'vendor');

        $questions = [];
        if (!$isClient) {
            $request->validate([
                'date_of_birth' => 'required|date',
                'gender' => 'required|string|in:Male,Female,Other',
            ]);
            $questions = [
                'date_of_birth' => $request->date_of_birth,
                'gender' => $request->gender,
            ];
        } else {
            $request->validate([
                'phone' => 'required|string|max:20',
                'business_name' => 'required|string|max:255',
            ]);
            $questions = [
                'phone' => $request->phone,
                'business_name' => $request->business_name,
            ];
        }

        UserRequest::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $role,
            'company_id' => $request->company_id,
            'questions' => $questions,
            'status' => 'pending',
        ]);

        return redirect()->route('login')->with('success', __('Your registration request has been submitted. The company will review and approve your account shortly.'));
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
