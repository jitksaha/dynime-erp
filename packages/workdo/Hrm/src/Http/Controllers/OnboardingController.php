<?php

namespace Workdo\Hrm\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Workdo\Hrm\Models\Employee;
use Workdo\Hrm\Models\Branch;
use Workdo\Hrm\Models\Department;
use Workdo\Hrm\Models\Designation;
use Workdo\Hrm\Services\OnboardingService;
use App\Mail\EmployeeWelcomeMail;
use Illuminate\Support\Facades\Mail;

class OnboardingController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $employee = Employee::where('user_id', $user->id)->first();

        if ($employee) {
            return redirect()->route('hrm.employees.show', ['employee' => $employee->id, 'tab' => 'devices']);
        }

        return redirect()->route('hrm.employees.index')->with('error', __('No employee profile associated with your user account.'));
    }

    public function saveStep(Request $request)
    {
        $user = Auth::user();
        $employee = Employee::where('user_id', $user->id)->firstOrFail();

        $step = $request->input('step');
        $data = $request->input('data', []);

        $updatedProgress = OnboardingService::saveStepData($employee, $step, $data);

        return response()->json([
            'success' => true,
            'message' => __('Progress saved successfully'),
            'progress' => $updatedProgress,
        ]);
    }

    public function resendInvite($employeeId)
    {
        if (!Auth::user()->can('create-employees') && Auth::user()->type !== 'company' && Auth::user()->type !== 'super admin') {
            return back()->with('error', __('Permission denied'));
        }

        $employee = Employee::with('user')->findOrFail($employeeId);

        if ($employee->user && $employee->user->email) {
            try {
                Mail::to($employee->user->email)->send(new EmployeeWelcomeMail($employee));
                return back()->with('success', __('Onboarding invitation email sent successfully to ') . $employee->user->email);
            } catch (\Throwable $e) {
                return back()->with('error', __('Failed to send onboarding email: ') . $e->getMessage());
            }
        }

        return back()->with('error', __('Employee user email not found.'));
    }
}
