<?php

namespace Workdo\Hrm\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Workdo\Hrm\Models\Employee;
use Workdo\Hrm\Models\FlexibleShiftRequest;

class FlexibleShiftController extends Controller
{
    /**
     * Employee toggles their active shift mode (fixed vs flexible).
     */
    public function toggleShift(Request $request)
    {
        $userId = Auth::id();
        $employee = Employee::where('user_id', $userId)->where('created_by', creatorId())->first();

        if (!$employee) {
            return redirect()->back()->with('error', __('Employee record not found.'));
        }

        $targetShift = $request->input('target_shift', 'fixed');

        if ($targetShift === 'flexible') {
            if (!$employee->is_flexible_shift_allowed) {
                return redirect()->back()->with('error', __('Flexible shift permission is required from Company / HR. Please request access first.'));
            }
            $employee->current_shift_type = 'flexible';
            $employee->save();

            return redirect()->back()->with('success', __('Switched to Flexible Shift successfully.'));
        } else {
            $employee->current_shift_type = 'fixed';
            $employee->save();

            return redirect()->back()->with('success', __('Switched to Fixed Shift successfully.'));
        }
    }

    /**
     * Employee submits a request for Flexible Shift access.
     */
    public function requestAccess(Request $request)
    {
        $userId = Auth::id();
        $employee = Employee::where('user_id', $userId)->where('created_by', creatorId())->first();

        if (!$employee) {
            return redirect()->back()->with('error', __('Employee record not found.'));
        }

        if ($employee->is_flexible_shift_allowed) {
            return redirect()->back()->with('info', __('You already have Flexible Shift permission enabled.'));
        }

        // Check for existing pending request
        $existing = FlexibleShiftRequest::where('employee_id', $employee->id)
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            return redirect()->back()->with('info', __('You already have a pending Flexible Shift request.'));
        }

        $reasonInput = $request->input('reason');
        if (!$reasonInput && $request->input('reason_type')) {
            $reasonType = $request->input('reason_type', 'General Request');
            $desc = $request->input('description', '');
            $country = $request->input('country', '');

            $reasonInput = "Category: {$reasonType}";
            if ($country) {
                $reasonInput .= " | Country: {$country}";
            }
            if ($desc) {
                $reasonInput .= " | Notes: {$desc}";
            }
        }

        FlexibleShiftRequest::create([
            'employee_id' => $employee->id,
            'user_id' => $userId,
            'status' => 'pending',
            'reason' => $reasonInput ?: 'Flexible shift access request',
            'created_by' => creatorId(),
        ]);

        $employee->flexible_shift_status = 'pending';
        $employee->save();

        return redirect()->back()->with('success', __('Flexible shift request submitted to HR/Company for review.'));
    }

    /**
     * List all flexible shift requests for Company / HR management.
     */
    public function indexRequests(Request $request)
    {
        if (Auth::user()->can('manage-shifts') || Auth::user()->can('manage-employees') || Auth::user()->type === 'company' || Auth::user()->type === 'hr') {
            $requests = FlexibleShiftRequest::with(['employee.user', 'employee.department', 'employee.designation', 'reviewer'])
                ->where('created_by', creatorId())
                ->orderBy('created_at', 'desc')
                ->get();

            return Inertia::render('Hrm/Shifts/FlexibleRequests', [
                'requests' => $requests,
            ]);
        }

        return redirect()->back()->with('error', __('Permission denied.'));
    }

    /**
     * Approve a flexible shift request.
     */
    public function approveRequest($id)
    {
        if (Auth::user()->can('manage-shifts') || Auth::user()->can('manage-employees') || Auth::user()->type === 'company' || Auth::user()->type === 'hr') {
            $req = FlexibleShiftRequest::where('id', $id)->where('created_by', creatorId())->firstOrFail();

            $req->status = 'approved';
            $req->reviewed_by = Auth::id();
            $req->reviewed_at = now();
            $req->save();

            $employee = Employee::find($req->employee_id);
            if ($employee) {
                $employee->is_flexible_shift_allowed = true;
                $employee->flexible_shift_status = 'approved';
                $employee->current_shift_type = 'flexible';
                $employee->save();
            }

            return redirect()->back()->with('success', __('Flexible Shift Request approved successfully.'));
        }

        return redirect()->back()->with('error', __('Permission denied.'));
    }

    /**
     * Reject a flexible shift request.
     */
    public function rejectRequest($id)
    {
        if (Auth::user()->can('manage-shifts') || Auth::user()->can('manage-employees') || Auth::user()->type === 'company' || Auth::user()->type === 'hr') {
            $req = FlexibleShiftRequest::where('id', $id)->where('created_by', creatorId())->firstOrFail();

            $req->status = 'rejected';
            $req->reviewed_by = Auth::id();
            $req->reviewed_at = now();
            $req->save();

            $employee = Employee::find($req->employee_id);
            if ($employee) {
                $employee->flexible_shift_status = 'rejected';
                $employee->is_flexible_shift_allowed = false;
                $employee->save();
            }

            return redirect()->back()->with('success', __('Flexible Shift Request rejected.'));
        }

        return redirect()->back()->with('error', __('Permission denied.'));
    }

    /**
     * Directly toggle/set flexible shift permission on employee profile by HR/Company.
     */
    public function toggleEmployeePermission(Request $request, $employeeId)
    {
        if (Auth::user()->can('manage-employees') || Auth::user()->type === 'company' || Auth::user()->type === 'hr') {
            $employee = Employee::where('id', $employeeId)->where('created_by', creatorId())->firstOrFail();
            
            $allowed = $request->boolean('is_flexible_shift_allowed');
            $employee->is_flexible_shift_allowed = $allowed;
            if ($allowed) {
                $employee->flexible_shift_status = 'approved';
            } else {
                $employee->flexible_shift_status = 'none';
                $employee->current_shift_type = 'fixed';
            }
            $employee->save();

            return redirect()->back()->with('success', __('Employee Flexible Shift permission updated.'));
        }

        return redirect()->back()->with('error', __('Permission denied.'));
    }
}
