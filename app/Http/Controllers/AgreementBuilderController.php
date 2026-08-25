<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Workdo\Hrm\Models\Employee;

class AgreementBuilderController extends Controller
{
    public function index()
    {
        if (!Auth::user()->can('manage-agreement-builder') && !Auth::user()->can('view-agreement-builder') && !Auth::user()->hasRole('company') && !Auth::user()->hasRole('superadmin')) {
            return back()->with('error', __('Permission denied'));
        }

        $creatorId = creatorId();
        $employees = [];
        
        try {
            $employees = Employee::with(['user', 'designation', 'department'])
                ->where('created_by', $creatorId)
                ->get()
                ->map(function ($employee) {
                    return [
                        'id' => $employee->id,
                        'employee_id' => $employee->employee_id,
                        'name' => $employee->user ? $employee->user->name : ($employee->name ?? 'Employee #' . $employee->id),
                        'email' => $employee->user ? $employee->user->email : ($employee->email ?? ''),
                        'phone' => $employee->phone ?? ($employee->user ? $employee->user->phone : ''),
                        'designation' => $employee->designation ? $employee->designation->designation_name : '',
                        'department' => $employee->department ? $employee->department->department_name : '',
                    ];
                });
        } catch (\Exception $e) {
            $employees = [];
        }

        return Inertia::render('AgreementBuilder/Index', [
            'companyInfo' => [
                'name' => 'Dynime LLC.',
                'email' => 'contact@dynime.com',
                'phone' => '+1(646)8840271',
                'website' => 'dynime.com',
                'support_email' => 'support@dynime.com',
                'address' => '1209 Mountain Road PL STE N, Albuquerque, NM 87110, USA',
            ],
            'employees' => $employees,
        ]);
    }
}
