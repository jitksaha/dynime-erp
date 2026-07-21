<?php

namespace Workdo\Hrm\Http\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Workdo\Hrm\Models\Employee;
use Workdo\Hrm\Models\EmployeeDocumentRequest;

class EmployeeDocumentRequestController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $employee = Employee::where('user_id', $user->id)->first();

        $query = EmployeeDocumentRequest::with(['employee.user', 'approver:id,name']);

        if (!$user->can('manage-employees') && $employee) {
            // Employee only sees their own document requests
            $query->where('employee_id', $employee->id);
        } else {
            // Admin/HR sees all for creatorId
            $query->where('created_by', creatorId());
        }

        $requests = $query->latest()->paginate(15);

        return Inertia::render('Hrm::DocumentRequests/Index', [
            'documentRequests' => $requests,
            'currentEmployee'  => $employee,
            'documentTypes'    => [
                'Experience Certificate',
                'Salary Certificate',
                'NOC (No Objection Certificate)',
                'Proof of Employment',
                'Relieving Letter',
                'Custom Request',
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'document_type'      => 'required|string',
            'reason'             => 'nullable|string',
            'employee_signature' => 'required|string', // Base64 signature
        ]);

        $user = Auth::user();
        $employee = Employee::where('user_id', $user->id)->first();

        if (!$employee) {
            return redirect()->back()->with('error', 'No linked employee record found for your user account.');
        }

        EmployeeDocumentRequest::create([
            'employee_id'        => $employee->id,
            'document_type'      => $validated['document_type'],
            'reason'             => $validated['reason'] ?? null,
            'employee_signature' => $validated['employee_signature'],
            'status'             => 'pending',
            'created_by'         => creatorId(),
        ]);

        return redirect()->back()->with('success', 'Document request with e-signature submitted successfully.');
    }

    public function approve(Request $request, $id)
    {
        $docRequest = EmployeeDocumentRequest::where('created_by', creatorId())->findOrFail($id);

        $docRequest->update([
            'status'      => 'approved',
            'admin_notes' => $request->input('admin_notes', 'Approved by HR/Admin'),
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Document request approved.');
    }

    public function reject(Request $request, $id)
    {
        $request->validate([
            'admin_notes' => 'required|string',
        ]);

        $docRequest = EmployeeDocumentRequest::where('created_by', creatorId())->findOrFail($id);

        $docRequest->update([
            'status'      => 'rejected',
            'admin_notes' => $request->input('admin_notes'),
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Document request rejected.');
    }
}
