<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class UserRequestController extends Controller
{
    public function index()
    {
        if (!Auth::user()->can('manage-users')) {
            return back()->with('error', __('Permission denied'));
        }

        $requests = UserRequest::where('company_id', creatorId())
            ->where('status', 'pending')
            ->latest()
            ->paginate(15);

        return Inertia::render('user-requests/index', [
            'requests' => $requests,
        ]);
    }

    public function approve(UserRequest $userRequest)
    {
        if (!Auth::user()->can('manage-users') || $userRequest->company_id !== creatorId()) {
            return back()->with('error', __('Permission denied'));
        }

        // Check if email already exists in users table
        if (User::where('email', $userRequest->email)->exists()) {
            return back()->with('error', __('A user with this email already exists.'));
        }

        try {
            \DB::transaction(function () use ($userRequest) {
                // Create user
                $user = new User();
                $user->name = $userRequest->name;
                $user->email = $userRequest->email;
                $user->password = $userRequest->password; // already hashed during request creation
                $user->type = $userRequest->role; // 'staff' or 'client'
                $user->is_enable_login = true;
                $user->lang = company_setting('defaultLanguage') ?? 'en';
                $user->email_verified_at = now();
                $user->creator_id = Auth::id();
                $user->created_by = creatorId();
                $user->save();

                // Assign spatie role
                try {
                    $roleName = $userRequest->role;
                    $role = \Spatie\Permission\Models\Role::where('name', $roleName)
                        ->where(function($query) {
                            $query->where('created_by', creatorId())
                                  ->orWhere('created_by', 0)
                                  ->orWhereNull('created_by');
                        })
                        ->first();
                    if ($role) {
                        $user->assignRole($role);
                    }
                } catch (\Exception $e) {
                    // Spatie role assignment optional/failsafe
                }

                $roleLower = strtolower($userRequest->role);
                $isClient = in_array($roleLower, ['client', 'vendor', 'customer', 'buyer']) || 
                            str_contains($roleLower, 'client') || 
                            str_contains($roleLower, 'vendor');

                // If not client-like (e.g. staff, hr, manager), create Employee record
                if (!$isClient) {
                    if (class_exists(\Workdo\Hrm\Models\Employee::class)) {
                        $employee = new \Workdo\Hrm\Models\Employee();
                        $employee->employee_id = \Workdo\Hrm\Models\Employee::generateEmployeeId();
                        $employee->date_of_birth = $userRequest->questions['date_of_birth'] ?? now()->subYears(20)->format('Y-m-d');
                        $employee->gender = $userRequest->questions['gender'] ?? 'Male';
                        $employee->date_of_joining = now()->format('Y-m-d');
                        $employee->employment_type = 'Full Time';
                        $employee->employment_status = 'permanent';
                        $employee->work_mode = 'Remote';
                        $employee->work_location_country = 'Bangladesh';
                        $employee->basic_salary = 0;
                        $employee->salary_type = 'monthly';
                        $employee->hours_per_day = 8;
                        $employee->days_per_week = 5;
                        $employee->rate_per_hour = 0;
                        $employee->user_id = $user->id;
                        $employee->creator_id = Auth::id();
                        $employee->created_by = creatorId();
                        $employee->save();
                    }
                } else {
                    // If client-like (e.g. client, vendor), create Customer record
                    if (class_exists(\Workdo\Account\Models\Customer::class)) {
                        $customer = new \Workdo\Account\Models\Customer();
                        $customer->user_id = $user->id;
                        $customer->company_name = $userRequest->questions['business_name'] ?? $userRequest->name;
                        $customer->contact_person_name = $userRequest->name;
                        $customer->contact_person_email = $userRequest->email;
                        $customer->contact_person_mobile = $userRequest->questions['phone'] ?? null;
                        $customer->billing_address = [
                            'name'           => $userRequest->name,
                            'address_line_1' => '-',
                            'address_line_2' => null,
                            'city'           => '-',
                            'state'          => '-',
                            'country'        => '-',
                            'zip_code'       => '-',
                        ];
                        $customer->shipping_address = $customer->billing_address;
                        $customer->same_as_billing = true;
                        $customer->creator_id = Auth::id();
                        $customer->created_by = creatorId();
                        $customer->save();
                    }
                }

                // Mark request as approved
                $userRequest->status = 'approved';
                $userRequest->save();
            });

            return back()->with('success', __('User request approved and user created successfully.'));
        } catch (\Exception $e) {
            return back()->with('error', __('Approval failed: ') . $e->getMessage());
        }
    }

    public function reject(UserRequest $userRequest)
    {
        if (!Auth::user()->can('manage-users') || $userRequest->company_id !== creatorId()) {
            return back()->with('error', __('Permission denied'));
        }

        try {
            $userRequest->status = 'rejected';
            $userRequest->save();
            return back()->with('success', __('User request rejected successfully.'));
        } catch (\Exception $e) {
            return back()->with('error', __('Rejection failed: ') . $e->getMessage());
        }
    }
}
