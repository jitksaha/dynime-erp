<?php

namespace Workdo\Hrm\Http\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Workdo\Hrm\Models\Employee;
use Workdo\Hrm\Models\EmployeeProfileChangeRequest;
use App\Models\User;

class EmployeeProfileChangeRequestController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = EmployeeProfileChangeRequest::with(['employee.user', 'reviewer:id,name'])
            ->where('created_by', creatorId());

        $changeRequests = $query->latest()->paginate(15);

        return Inertia::render('Hrm::ProfileChangeRequests/Index', [
            'changeRequests' => $changeRequests,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id'       => 'required|exists:employees,id',
            'requested_changes' => 'required|array',
        ]);

        $employee = Employee::with('user')->findOrFail($validated['employee_id']);

        // Check if there is already a pending change request
        $existingPending = EmployeeProfileChangeRequest::where('employee_id', $employee->id)
            ->where('status', 'pending')
            ->first();

        if ($existingPending) {
            return redirect()->back()->with('error', 'You already have a pending profile change request under review.');
        }

        EmployeeProfileChangeRequest::create([
            'employee_id'       => $employee->id,
            'requested_changes' => $validated['requested_changes'],
            'status'             => 'pending',
            'created_by'         => creatorId(),
        ]);

        return redirect()->back()->with('success', 'Profile verification changes submitted for company approval.');
    }

    public function approve(Request $request, $id)
    {
        $changeRequest = EmployeeProfileChangeRequest::with('employee.user')
            ->where('created_by', creatorId())
            ->findOrFail($id);

        if ($changeRequest->status !== 'pending') {
            return redirect()->back()->with('error', 'This request has already been processed.');
        }

        $employee = $changeRequest->employee;
        $user = $employee->user;

        $changes = $changeRequest->requested_changes ?? [];

        // Apply approved changes to Employee and User models
        $employeeDataToUpdate = [];
        $userDataToUpdate = [];

        foreach ($changes as $key => $diff) {
            $newValue = $diff['new'] ?? null;

            if ($key === 'name' && $user) {
                $userDataToUpdate['name'] = $newValue;
            } elseif ($key === 'email' && $user) {
                $userDataToUpdate['email'] = $newValue;
            } elseif (in_array($key, [
                'phone', 'dob', 'gender', 'address', 'emergency_contact', 'emergency_phone',
                'bank_name', 'account_number', 'account_holder', 'bank_country', 'passport_number', 'nid_number'
            ])) {
                $employeeDataToUpdate[$key] = $newValue;
            }
        }

        if (!empty($employeeDataToUpdate)) {
            $employee->update($employeeDataToUpdate);
        }

        if (!empty($userDataToUpdate) && $user) {
            $user->update($userDataToUpdate);
        }

        $changeRequest->update([
            'status'      => 'approved',
            'admin_notes' => $request->input('admin_notes', 'Approved and updated in system.'),
            'reviewed_by' => Auth::id(),
            'reviewed_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Profile change request approved and database updated.');
    }

    public function reject(Request $request, $id)
    {
        $request->validate([
            'admin_notes' => 'required|string',
        ]);

        $changeRequest = EmployeeProfileChangeRequest::where('created_by', creatorId())->findOrFail($id);

        if ($changeRequest->status !== 'pending') {
            return redirect()->back()->with('error', 'This request has already been processed.');
        }

        $changeRequest->update([
            'status'      => 'rejected',
            'admin_notes' => $request->input('admin_notes'),
            'reviewed_by' => Auth::id(),
            'reviewed_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Profile change request rejected. No changes were made.');
    }
}
