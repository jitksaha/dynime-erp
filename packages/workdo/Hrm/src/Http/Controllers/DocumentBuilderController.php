<?php

namespace Workdo\Hrm\Http\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\DocumentIssuedMail;
use Workdo\Hrm\Models\Employee;
use Workdo\Hrm\Models\IssuedDocument;

class DocumentBuilderController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $isCompanyOrHR = ($user->type === 'company' || $user->type === 'superadmin' || ($user->can('manage-employees') && !Employee::where('user_id', $user->id)->exists()));

        if ($isCompanyOrHR) {
            $employeesQuery = Employee::with(['user', 'designation', 'department', 'branch'])
                ->where('created_by', creatorId());
        } else {
            $employeesQuery = Employee::with(['user', 'designation', 'department', 'branch'])
                ->where('user_id', $user->id);
        }

        $employees = $employeesQuery->get()->map(function ($employee) {
            return [
                'id' => $employee->id,
                'employee_id_code' => $employee->employee_id,
                'name' => $employee->user ? $employee->user->name : '',
                'email' => $employee->user ? $employee->user->email : '',
                'designation' => $employee->designation ? $employee->designation->designation_name : '',
                'department' => $employee->department ? $employee->department->department_name : '',
                'basic_salary' => $employee->basic_salary,
                'date_of_joining' => $employee->date_of_joining ? $employee->date_of_joining->toDateString() : '',
                'employment_type' => $employee->employment_type,
                'branch' => $employee->branch ? $employee->branch->branch_name : '',
                'work_mode' => $employee->work_mode,
                'work_location_country' => $employee->work_location_country,
                'work_location' => ($employee->branch ? $employee->branch->branch_name : '') . ($employee->work_location_country ? ' (' . $employee->work_location_country . ')' : ''),
                'bank_name' => $employee->bank_name,
                'account_holder_name' => $employee->account_holder_name,
                'account_number' => $employee->account_number,
                'bank_identifier_code' => $employee->bank_identifier_code,
                'bank_branch' => $employee->bank_branch,
                'bank_country' => $employee->bank_country,
                'bank_notes' => $employee->bank_notes,
                'tax_payer_id' => $employee->tax_payer_id,
            ];
        });

        $companySettings = getCompanyAllSetting();

        return Inertia::render('Hrm/DocumentBuilder/Index', [
            'employees' => $employees,
            'companySettings' => $companySettings,
            'prefill' => [
                'employee_id' => $request->employee_id,
                'document_type' => $request->document_type,
                'payload' => $request->payload,
                'issued_date' => $request->issued_date,
            ]
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        $isCompanyOrHR = ($user->type === 'company' || $user->type === 'superadmin' || ($user->can('manage-employees') && !Employee::where('user_id', $user->id)->exists()));

        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'document_type' => 'required|string',
            'payload' => 'required|array',
            'issued_date' => 'required|date',
        ]);

        if (!$isCompanyOrHR) {
            $myEmployee = Employee::where('user_id', $user->id)->first();
            if (!$myEmployee || (int)$request->employee_id !== (int)$myEmployee->id) {
                return back()->with('error', __('Permission denied. You can only generate documents for your own profile.'));
            }
        }

        $issuedDoc = new IssuedDocument();
        $issuedDoc->employee_id = $request->employee_id;
        $issuedDoc->document_type = $request->document_type;
        $issuedDoc->payload = $request->payload;
        $issuedDoc->issued_date = $request->issued_date;
        $issuedDoc->created_by = creatorId();
        $issuedDoc->save();

        // Automatic email notification to the employee's primary account email and official email
        try {
            \App\Services\MailConfigService::setDynamicConfig(creatorId());
            $employee = Employee::with('user')->find($request->employee_id);
            if ($employee && $employee->user && !empty($employee->user->email)) {
                $signUrl = route('hrm.document-builder.sign', $issuedDoc->id);
                $mailable = Mail::to($employee->user->email);
                if (!empty($employee->official_email) && strtolower($employee->official_email) !== strtolower($employee->user->email)) {
                    $mailable->cc($employee->official_email);
                }
                $mailable->send(new DocumentIssuedMail($employee->user, $issuedDoc, $signUrl));
            } else {
                Log::warning('DocumentIssuedMail not sent: Employee user or email is missing for employee ID ' . $request->employee_id);
            }
        } catch (\Exception $e) {
            Log::error('Failed to send DocumentIssuedMail: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
        }

        return redirect()->back()
            ->with('success', __('Document saved to history and email sent successfully.'))
            ->with('sign_link', route('hrm.document-builder.sign', $issuedDoc->id));
    }

    public function history()
    {
        $user = Auth::user();
        $isCompanyOrHR = ($user->type === 'company' || $user->type === 'superadmin' || ($user->can('manage-employees') && !Employee::where('user_id', $user->id)->exists()));

        $query = IssuedDocument::with(['employee.user']);

        if ($isCompanyOrHR) {
            $query->where('created_by', creatorId());
        } else {
            $myEmployee = Employee::where('user_id', $user->id)->first();
            $employeeId = $myEmployee ? $myEmployee->id : 0;
            $query->where('employee_id', $employeeId);
        }

        $history = $query->latest()
            ->paginate(request('per_page', 10))
            ->withQueryString();

        return Inertia::render('Hrm/DocumentBuilder/History', [
            'history' => $history,
        ]);
    }

    public function destroy($id)
    {
        if (Auth::user()->can('manage-employees')) {
            $issuedDoc = IssuedDocument::where('id', $id)->where('created_by', creatorId())->first();
            if ($issuedDoc) {
                $issuedDoc->delete();
                return redirect()->back()->with('success', __('Document deleted from history successfully.'));
            }
            return redirect()->back()->with('error', __('Document not found.'));
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }

    public function signView($id)
    {
        $issuedDoc = IssuedDocument::with(['employee.user'])->find($id);
        if (!$issuedDoc) {
            return back()->with('error', __('Document not found.'));
        }

        $user = Auth::user();
        $employee = $issuedDoc->employee;

        if (!$employee) {
            return back()->with('error', __('Employee record not found for this document.'));
        }

        // Allow HR/Admin (can manage-employees) OR the specific employee owner
        $isEmployeeOwner = ($employee->user_id === $user->id);
        $isHROwner = $user->can('manage-employees') && ($issuedDoc->created_by === creatorId());

        if (!$isEmployeeOwner && !$isHROwner) {
            return back()->with('error', __('Access denied. You do not have permission to view or sign this document.'));
        }

        // Map employee details to pass to frontend preview
        $mappedEmployee = [
            'id' => $employee->id,
            'employee_id_code' => $employee->employee_id,
            'name' => $employee->user ? $employee->user->name : '',
            'email' => $employee->user ? $employee->user->email : '',
            'designation' => $employee->designation ? $employee->designation->designation_name : '',
            'department' => $employee->department ? $employee->department->department_name : '',
            'basic_salary' => $employee->basic_salary,
            'date_of_joining' => $employee->date_of_joining ? $employee->date_of_joining->toDateString() : '',
            'employment_type' => $employee->employment_type,
            'branch' => $employee->branch ? $employee->branch->branch_name : '',
            'work_mode' => $employee->work_mode,
            'work_location_country' => $employee->work_location_country,
            'work_location' => ($employee->branch ? $employee->branch->branch_name : '') . ($employee->work_location_country ? ' (' . $employee->work_location_country . ')' : ''),
            'bank_name' => $employee->bank_name,
            'account_holder_name' => $employee->account_holder_name,
            'account_number' => $employee->account_number,
            'bank_identifier_code' => $employee->bank_identifier_code,
            'bank_branch' => $employee->bank_branch,
            'bank_country' => $employee->bank_country,
            'bank_notes' => $employee->bank_notes,
            'tax_payer_id' => $employee->tax_payer_id,
        ];

        $companySettings = getCompanyAllSetting($issuedDoc->created_by);

        return Inertia::render('Hrm/DocumentBuilder/Sign', [
            'document' => [
                'id' => $issuedDoc->id,
                'document_type' => $issuedDoc->document_type,
                'payload' => $issuedDoc->payload,
                'issued_date' => $issuedDoc->issued_date ? $issuedDoc->issued_date->toDateString() : '',
            ],
            'employee' => $mappedEmployee,
            'companySettings' => $companySettings,
            'isHR' => $user->can('manage-employees'),
        ]);
    }

    public function signSubmit(Request $request, $id)
    {
        $issuedDoc = IssuedDocument::find($id);
        if (!$issuedDoc) {
            return back()->with('error', __('Document not found.'));
        }

        $user = Auth::user();
        $employee = $issuedDoc->employee;

        if (!$employee) {
            return back()->with('error', __('Employee not found.'));
        }

        // Allow HR/Admin (can manage-employees) OR the specific employee owner
        $isEmployeeOwner = ($employee->user_id === $user->id);
        $isHROwner = $user->can('manage-employees') && ($issuedDoc->created_by === creatorId());

        if (!$isEmployeeOwner && !$isHROwner) {
            return back()->with('error', __('Permission denied.'));
        }

        $request->validate([
            'signature_base64' => 'required|string',
        ]);

        $payload = $issuedDoc->payload ?? [];
        $payload['employee_signature'] = $request->signature_base64;
        $payload['employee_signature_date'] = now()->toDateTimeString();

        $issuedDoc->payload = $payload;
        $issuedDoc->save();

        return redirect()->back()->with('success', __('Document signed digitally successfully.'));
    }
}
