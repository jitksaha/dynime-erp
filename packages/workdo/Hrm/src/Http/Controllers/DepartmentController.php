<?php

namespace Workdo\Hrm\Http\Controllers;

use Workdo\Hrm\Http\Requests\StoreDepartmentRequest;
use Workdo\Hrm\Http\Requests\UpdateDepartmentRequest;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Workdo\Hrm\Models\Branch;
use Workdo\Hrm\Models\Department;
use Workdo\Hrm\Events\CreateDepartment;
use Workdo\Hrm\Events\DestroyDepartment;
use Workdo\Hrm\Events\UpdateDepartment;

class DepartmentController extends Controller
{
    public function index()
    {
        if (Auth::user()->can('manage-departments')) {
            $departments = Department::select('id', 'department_name', 'branch_id', 'created_at')
                ->where(function ($q) {
                    if (Auth::user()->can('manage-any-departments')) {
                        $q->where('created_by', creatorId());
                    } elseif (Auth::user()->can('manage-own-departments')) {
                        $q->where('creator_id', Auth::id());
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                })
                ->latest()
                ->get();

            // Fetch all branches once to map their names
            $allBranches = Branch::where('created_by', creatorId())->orderBy('priority', 'asc')->orderBy('id', 'desc')->select('id', 'branch_name')->get()->keyBy('id');

            // Format departments to include an array of branch IDs and a joined string of branch names
            $departments = $departments->map(function ($department) use ($allBranches) {
                $branchIds = array_filter(explode(',', $department->branch_id));
                $branchNames = [];
                foreach ($branchIds as $bid) {
                    if (isset($allBranches[$bid])) {
                        $branchNames[] = $allBranches[$bid]->branch_name;
                    }
                }
                
                return [
                    'id' => $department->id,
                    'department_name' => $department->department_name,
                    'branch_id' => array_map('intval', $branchIds), // Send as array of ints to the frontend
                    'branch_names' => implode(', ', $branchNames),
                    'created_at' => $department->created_at,
                ];
            });

            return Inertia::render('Hrm/SystemSetup/Departments/Index', [
                'departments' => $departments,
                'branches' => $allBranches->values(),
            ]);
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }

    public function store(StoreDepartmentRequest $request)
    {
        if (Auth::user()->can('create-departments')) {
            $validated = $request->validated();



            $department = new Department();
            $department->department_name = $validated['department_name'];
            $department->branch_id = implode(',', $validated['branch_id']);

            $department->creator_id = Auth::id();
            $department->created_by = creatorId();
            $department->save();

            CreateDepartment::dispatch($request, $department);

            return redirect()->route('hrm.departments.index')->with('success', __('The department has been created successfully.'));
        } else {
            return redirect()->route('hrm.departments.index')->with('error', __('Permission denied'));
        }
    }

    public function update(UpdateDepartmentRequest $request, Department $department)
    {
        if (Auth::user()->can('edit-departments')) {
            $validated = $request->validated();



            $department->department_name = $validated['department_name'];
            $department->branch_id = implode(',', $validated['branch_id']);

            $department->save();

            UpdateDepartment::dispatch($request, $department);

            return redirect()->route('hrm.departments.index')->with('success', __('The department details are updated successfully.'));
        } else {
            return redirect()->route('hrm.departments.index')->with('error', __('Permission denied'));
        }
    }

    public function destroy(Department $department)
    {
        if (Auth::user()->can('delete-departments')) {
            DestroyDepartment::dispatch($department);
            $department->delete();

            return redirect()->route('hrm.departments.index')->with('success', __('The department has been deleted.'));
        } else {
            return redirect()->route('hrm.departments.index')->with('error', __('Permission denied'));
        }
    }
}
