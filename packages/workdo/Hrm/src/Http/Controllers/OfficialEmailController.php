<?php

namespace Workdo\Hrm\Http\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Workdo\Hrm\Models\Employee;
use App\Models\User;

class OfficialEmailController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        // Check if user is Company Admin or HR role
        $isAuthorized = $user->type === 'company' ||
            $user->type === 'superadmin' ||
            $user->hasRole('company') ||
            $user->hasRole('super admin') ||
            $user->hasRole('HR') ||
            $user->hasRole('HR Admin') ||
            $user->hasRole('Global HR') ||
            $user->can('manage-employees');

        if (!$isAuthorized) {
            return back()->with('error', __('Permission denied. Only Company Admin and HR can access official email records.'));
        }

        $query = Employee::query()
            ->where('created_by', creatorId())
            ->whereNotNull('official_email')
            ->where('official_email', '!=', '')
            ->with(['user:id,name,email,avatar,is_disable', 'branch', 'department', 'designation']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('official_email', 'like', "%{$search}%")
                    ->orWhere('official_email_password', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        $officialEmails = $query->latest()
            ->paginate(request('per_page', 15))
            ->withQueryString();

        return Inertia::render('Hrm/OfficialEmails/Index', [
            'officialEmails' => $officialEmails,
            'filters' => [
                'search' => $request->input('search', ''),
            ],
        ]);
    }

    public function update(Request $request, Employee $employee)
    {
        $user = Auth::user();
        $isAuthorized = $user->type === 'company' ||
            $user->type === 'superadmin' ||
            $user->hasRole('company') ||
            $user->hasRole('super admin') ||
            $user->hasRole('HR') ||
            $user->hasRole('HR Admin') ||
            $user->hasRole('Global HR') ||
            $user->can('manage-employees');

        if (!$isAuthorized) {
            return back()->with('error', __('Permission denied.'));
        }

        $validated = $request->validate([
            'official_email' => 'required|email|max:255',
            'official_email_password' => 'required|string|max:255',
        ]);

        $employee->official_email = $validated['official_email'];
        $employee->official_email_password = $validated['official_email_password'];
        $employee->save();

        return back()->with('success', __('Official email credentials updated successfully.'));
    }
}
