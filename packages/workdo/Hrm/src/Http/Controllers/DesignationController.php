<?php

namespace Workdo\Hrm\Http\Controllers;

use Workdo\Hrm\Models\Designation;
use Workdo\Hrm\Http\Requests\StoreDesignationRequest;
use Workdo\Hrm\Http\Requests\UpdateDesignationRequest;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Workdo\Hrm\Models\Branch;
use Workdo\Hrm\Models\Department;
use Workdo\Hrm\Events\CreateDesignation;
use Workdo\Hrm\Events\DestroyDesignation;
use Workdo\Hrm\Events\UpdateDesignation;

class DesignationController extends Controller
{
    public function index()
    {
        if (Auth::user()->can('manage-designations')) {
            $designations = Designation::select('id', 'designation_name', 'branch_id', 'department_id', 'created_at')
                ->where(function ($q) {
                    if (Auth::user()->can('manage-any-designations')) {
                        $q->where('created_by', creatorId());
                    } elseif (Auth::user()->can('manage-own-designations')) {
                        $q->where('creator_id', Auth::id());
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                })
                ->latest()
                ->get();

            // Fetch all branches once to map their names
            $allBranches = Branch::where('created_by', creatorId())->orderBy('priority', 'asc')->orderBy('id', 'desc')->select('id', 'branch_name')->get()->keyBy('id');
            // Fetch all departments once to map their names
            $allDepartments = Department::where('created_by', creatorId())->select('id', 'department_name')->get()->keyBy('id');

            // Format designations to include arrays of IDs and joined strings of names
            $designations = $designations->map(function ($designation) use ($allBranches, $allDepartments) {
                $branchIds = array_filter(explode(',', $designation->branch_id));
                $branchNames = [];
                foreach ($branchIds as $bid) {
                    if (isset($allBranches[$bid])) {
                        $branchNames[] = $allBranches[$bid]->branch_name;
                    }
                }

                $departmentIds = array_filter(explode(',', $designation->department_id));
                $departmentNames = [];
                foreach ($departmentIds as $did) {
                    if (isset($allDepartments[$did])) {
                        $departmentNames[] = $allDepartments[$did]->department_name;
                    }
                }
                
                return [
                    'id' => $designation->id,
                    'designation_name' => $designation->designation_name,
                    'branch_id' => array_map('intval', $branchIds), // Send as array of ints
                    'department_id' => array_map('intval', $departmentIds), // Send as array of ints
                    'branch_names' => implode(', ', $branchNames),
                    'department_names' => implode(', ', $departmentNames),
                    'created_at' => $designation->created_at,
                ];
            });

            return Inertia::render('Hrm/SystemSetup/Designations/Index', [
                'designations' => $designations,
                'branches' => $allBranches->values(),
                'departments' => Department::where('created_by', creatorId())->select('id', 'department_name', 'branch_id')->get(),
            ]);
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }

    public function store(StoreDesignationRequest $request)
    {
        if (Auth::user()->can('create-designations')) {
            $validated = $request->validated();



            $designation = new Designation();
            $designation->designation_name = $validated['designation_name'];
            $designation->branch_id = implode(',', $validated['branch_id']);
            $designation->department_id = implode(',', $validated['department_id']);

            $designation->creator_id = Auth::id();
            $designation->created_by = creatorId();
            $designation->save();

            CreateDesignation::dispatch($request, $designation);

            return redirect()->route('hrm.designations.index')->with('success', __('The designation has been created successfully.'));
        } else {
            return redirect()->route('hrm.designations.index')->with('error', __('Permission denied'));
        }
    }

    public function update(UpdateDesignationRequest $request, Designation $designation)
    {
        if (Auth::user()->can('edit-designations')) {
            $validated = $request->validated();



            $designation->designation_name = $validated['designation_name'];
            $designation->branch_id = implode(',', $validated['branch_id']);
            $designation->department_id = implode(',', $validated['department_id']);

            $designation->save();

            UpdateDesignation::dispatch($request, $designation);

            return redirect()->route('hrm.designations.index')->with('success', __('The designation details are updated successfully.'));
        } else {
            return redirect()->route('hrm.designations.index')->with('error', __('Permission denied'));
        }
    }

    public function destroy(Designation $designation)
    {
        if (Auth::user()->can('delete-designations')) {
            DestroyDesignation::dispatch($designation);
            $designation->delete();

            return redirect()->route('hrm.designations.index')->with('success', __('The designation has been deleted.'));
        } else {
            return redirect()->route('hrm.designations.index')->with('error', __('Permission denied'));
        }
    }


}
