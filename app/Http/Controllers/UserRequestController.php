<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class UserRequestController extends Controller
{
    private function canManageRequests(): bool
    {
        $user = Auth::user();
        if (!$user) return false;
        return $user->type === 'company' || 
               $user->type === 'superadmin' || 
               $user->can('manage-users') || 
               $user->can('manage-employees');
    }

    public function index()
    {
        if (!$this->canManageRequests()) {
            return redirect()->route('dashboard')->with('error', __('Permission denied'));
        }

        try {
            $cid = creatorId();
            $requests = UserRequest::where(function($q) use ($cid) {
                    $q->where('company_id', $cid)
                      ->orWhereNull('company_id');
                })
                ->where('status', 'pending')
                ->latest()
                ->paginate(15);

            $invitationCodes = \App\Models\InvitationCode::latest()->take(30)->get();
        } catch (\Throwable $e) {
            $requests = new \Illuminate\Pagination\LengthAwarePaginator([], 0, 15);
            $invitationCodes = collect([]);
        }

        return Inertia::render('user-requests/index', [
            'requests' => $requests,
            'invitationCodes' => $invitationCodes,
        ]);
    }

    public function generateInviteCode(Request $request)
    {
        if (!$this->canManageRequests()) {
            return back()->with('error', __('Permission denied'));
        }

        $request->validate([
            'role' => 'required|string|in:staff,hr,client,vendor',
        ]);

        $code = \App\Models\InvitationCode::generateCode($request->role, Auth::id());

        return back()->with('success', __('Generated new registration code: ') . $code->code);
    }

    public function approve(UserRequest $userRequest)
    {
        if (!$this->canManageRequests()) {
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
                        $q = $userRequest->questions ?? [];
                        $employee = new \Workdo\Hrm\Models\Employee();
                        $employee->employee_id = \Workdo\Hrm\Models\Employee::generateEmployeeId();
                        $employee->user_id = $user->id;
                        $employee->creator_id = Auth::id();
                        $employee->created_by = creatorId();

                        // Default fallback values for standard required fields
                        $employee->date_of_birth = $q['date_of_birth'] ?? now()->subYears(22)->format('Y-m-d');
                        $employee->gender = $q['gender'] ?? 'Male';
                        $employee->date_of_joining = $q['joining_date'] ?? $q['date_of_joining'] ?? now()->format('Y-m-d');
                        $employee->employment_type = $q['employment_type'] ?? 'Full Time';
                        $employee->employment_status = $q['employment_status'] ?? 'probation';
                        $employee->work_mode = $q['work_mode'] ?? 'Remote';
                        $employee->work_location_country = $q['country'] ?? $q['work_location_country'] ?? 'Bangladesh';
                        $employee->basic_salary = $q['basic_salary'] ?? 0;
                        $employee->salary_type = $q['salary_type'] ?? 'monthly';
                        $employee->hours_per_day = $q['hours_per_day'] ?? 8;
                        $employee->days_per_week = $q['days_per_week'] ?? 5;
                        $employee->rate_per_hour = $q['rate_per_hour'] ?? 0;

                        // DYNAMICALLY SYNC ANY CURRENT & FUTURE ATTRIBUTES MATCHING EMPLOYEE FILLABLE
                        $fillable = $employee->getFillable();
                        if (is_array($q)) {
                            foreach ($q as $key => $val) {
                                if ($val !== null && $val !== '' && in_array($key, $fillable)) {
                                    $employee->$key = $val;
                                }
                            }
                        }

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
        if (!$this->canManageRequests()) {
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
