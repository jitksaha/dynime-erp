<?php

namespace Workdo\Hrm\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Workdo\Hrm\Models\Employee;
use Workdo\Hrm\Models\PayrollChangeRequest;

class PayrollChangeRequestController extends Controller
{
    public function index()
    {
        if (Auth::user()->can('manage-employees')) {
            $requests = PayrollChangeRequest::with(['employee.user'])
                ->where('created_by', creatorId())
                ->latest()
                ->get()
                ->map(function ($req) {
                    return [
                        'id' => $req->id,
                        'employee_id' => $req->employee_id,
                        'employee_name' => $req->employee->user->name ?? 'Unknown',
                        'requested_payment_method' => $req->requested_payment_method,
                        'requested_payment_details' => $req->requested_payment_details,
                        'status' => $req->status,
                        'created_at' => $req->created_at->toDateTimeString(),
                    ];
                });

            return Inertia::render('Hrm/PayrollRequests/Index', [
                'requests' => $requests,
            ]);
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }

    public function store(Request $request)
    {
        $employee = Employee::where('user_id', Auth::id())->first();
        if (!$employee) {
            return redirect()->back()->with('error', __('Employee profile not found.'));
        }

        $request->validate([
            'requested_payment_method' => 'required|string',
            'requested_payment_details' => 'nullable|array',
        ]);

        $changeRequest = new PayrollChangeRequest();
        $changeRequest->employee_id = $employee->id;
        $changeRequest->requested_payment_method = $request->requested_payment_method;
        $changeRequest->requested_payment_details = $request->requested_payment_details;
        $changeRequest->status = 'pending';
        $changeRequest->created_by = creatorId();
        $changeRequest->save();

        // Send email notification to company admin
        try {
            \App\Services\MailConfigService::setDynamicConfig(creatorId());
            $companyUser = \App\Models\User::find(creatorId());
            if ($companyUser && !empty($companyUser->email)) {
                $employeeName = $employee->user ? $employee->user->name : ('Employee #' . $employee->employee_id);
                $subject = "New Payroll Change Request - " . $employeeName;
                $content = "Hello Admin,\n\nEmployee " . $employeeName . " has submitted a request to change their payroll/payment method to '" . str_replace('_', ' ', strtoupper($request->requested_payment_method)) . "'.\n\nPlease log in to your portal to review and approve/reject this request.\n\nThank you,\nDynime LLC";
                
                \Illuminate\Support\Facades\Mail::raw($content, function ($message) use ($companyUser, $subject) {
                    $message->to($companyUser->email)->subject($subject);
                });
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed sending payroll change request admin email: ' . $e->getMessage());
        }

        return redirect()->back()->with('success', __('Payroll change request has been submitted successfully.'));
    }

    public function approve(PayrollChangeRequest $payrollRequest)
    {
        if (Auth::user()->can('manage-employees')) {
            $employee = Employee::find($payrollRequest->employee_id);
            if ($employee) {
                $employee->payment_method = $payrollRequest->requested_payment_method;
                
                $details = $payrollRequest->requested_payment_details;
                $employee->payment_details = $details;
                
                // Also update legacy individual columns for compatibility
                if ($payrollRequest->requested_payment_method === 'bank_transfer') {
                    $employee->bank_name = $details['bank_name'] ?? null;
                    $employee->account_holder_name = $details['account_holder_name'] ?? null;
                    $employee->account_number = $details['account_number'] ?? null;
                    $employee->bank_identifier_code = $details['bank_identifier_code'] ?? null;
                    $employee->bank_branch = $details['bank_branch'] ?? null;
                    $employee->bank_country = $details['bank_country'] ?? null;
                    $employee->bank_notes = $details['bank_notes'] ?? null;
                    $employee->tax_payer_id = $details['tax_payer_id'] ?? null;
                }

                $employee->save();
            }

            $payrollRequest->status = 'approved';
            $payrollRequest->save();

            // Send approval email to employee
            try {
                \App\Services\MailConfigService::setDynamicConfig(creatorId());
                $employeeWithUser = Employee::with('user')->find($payrollRequest->employee_id);
                if ($employeeWithUser && $employeeWithUser->user && !empty($employeeWithUser->user->email)) {
                    $mailable = \Illuminate\Support\Facades\Mail::raw("Hello " . $employeeWithUser->user->name . ",\n\nYour request to change your payroll payment method to '" . str_replace('_', ' ', strtoupper($payrollRequest->requested_payment_method)) . "' has been APPROVED.\n\nThank you,\nDynime LLC", function ($message) use ($employeeWithUser) {
                        $message->to($employeeWithUser->user->email);
                        if (!empty($employeeWithUser->official_email) && strtolower($employeeWithUser->official_email) !== strtolower($employeeWithUser->user->email)) {
                            $message->cc($employeeWithUser->official_email);
                        }
                        $message->subject("Payroll Change Request Approved");
                    });
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Failed sending payroll request approval email: ' . $e->getMessage());
            }

            return redirect()->back()->with('success', __('Payroll request approved successfully.'));
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }

    public function reject(PayrollChangeRequest $payrollRequest)
    {
        if (Auth::user()->can('manage-employees')) {
            $payrollRequest->status = 'rejected';
            $payrollRequest->save();

            // Send rejection email to employee
            try {
                \App\Services\MailConfigService::setDynamicConfig(creatorId());
                $employeeWithUser = Employee::with('user')->find($payrollRequest->employee_id);
                if ($employeeWithUser && $employeeWithUser->user && !empty($employeeWithUser->user->email)) {
                    \Illuminate\Support\Facades\Mail::raw("Hello " . $employeeWithUser->user->name . ",\n\nYour request to change your payroll payment method to '" . str_replace('_', ' ', strtoupper($payrollRequest->requested_payment_method)) . "' has been REJECTED.\n\nPlease contact HR for details.\n\nThank you,\nDynime LLC", function ($message) use ($employeeWithUser) {
                        $message->to($employeeWithUser->user->email);
                        if (!empty($employeeWithUser->official_email) && strtolower($employeeWithUser->official_email) !== strtolower($employeeWithUser->user->email)) {
                            $message->cc($employeeWithUser->official_email);
                        }
                        $message->subject("Payroll Change Request Rejected");
                    });
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Failed sending payroll request rejection email: ' . $e->getMessage());
            }

            return redirect()->back()->with('success', __('Payroll request rejected successfully.'));
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }
}
