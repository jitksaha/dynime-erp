<?php

namespace Workdo\Hrm\Http\Controllers;

use App\Models\User;
use Workdo\Hrm\Models\Resignation;
use Workdo\Hrm\Http\Requests\StoreResignationRequest;
use Workdo\Hrm\Http\Requests\UpdateResignationRequest;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Workdo\Hrm\Events\UpdateResignaionStatus;
use Workdo\Hrm\Models\Employee;

class ResignationController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        if ($user->can('manage-resignations') || $user->type !== 'company') {
            $resignations = Resignation::with([
                'employee:id,name',
                'approvedBy:id,name'
            ])->where(function ($q) use ($user) {
                if ($user->can('manage-any-resignations') || $user->type === 'company' || $user->type === 'superadmin') {
                    $q->where('created_by', creatorId());
                } else {
                    $q->where('creator_id', $user->id)->orWhere('employee_id', $user->id);
                }
            })
                ->when(request('name'), function ($q) {
                    $q->whereHas('employee', function ($query) {
                        $query->where('name', 'like', '%' . request('name') . '%');
                    });
                })
                ->when(request('employee_id'), fn($q) => $q->where('employee_id', request('employee_id')))

                ->when(request('sort'), fn($q) => $q->orderBy(request('sort'), request('direction', 'asc')), fn($q) => $q->latest())
                ->paginate(request('per_page', 10))
                ->withQueryString();

            return Inertia::render('Hrm/Resignations/Index', [
                'resignations' => $resignations,
                'employees' => $this->getFilteredEmployees(),
                'users' => User::where('created_by', creatorId())->select('id', 'name')->get(),
            ]);
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }

    public function store(StoreResignationRequest $request)
    {
        $user = Auth::user();
        if ($user->can('create-resignations') || $user->type !== 'company') {
            $validated = $request->validated();
            $resignation = new Resignation();

            // If regular employee, set employee_id to logged in user's ID
            if ($user->type !== 'company' && $user->type !== 'superadmin' && !$user->can('manage-any-resignations')) {
                $resignation->employee_id = $user->id;
            } else {
                $resignation->employee_id = $validated['employee_id'];
            }

            $resignation->last_working_date = $validated['last_working_date'];
            $resignation->reason = $validated['reason'];
            $resignation->description = $validated['description'] ?? '';
            $resignation->document = $validated['document'] ?? null;
            $resignation->status = 'pending';

            $resignation->creator_id = $user->id;
            $resignation->created_by = creatorId();
            $resignation->save();

            return redirect()->route('hrm.resignations.index')->with('success', __('The resignation request has been created successfully.'));
        } else {
            return redirect()->route('hrm.resignations.index')->with('error', __('Permission denied'));
        }
    }

    public function update(UpdateResignationRequest $request, Resignation $resignation)
    {
        if (Auth::user()->can('edit-resignations')) {
            $validated = $request->validated();



            $resignation->employee_id = $validated['employee_id'];
            $resignation->last_working_date = $validated['last_working_date'];
            $resignation->reason = $validated['reason'];
            $resignation->description = $validated['description'];
            $resignation->document = $validated['document'];

            $resignation->save();

            return redirect()->back()->with('success', __('The resignation details are updated successfully.'));
        } else {
            return redirect()->route('hrm.resignations.index')->with('error', __('Permission denied'));
        }
    }

    public function destroy(Resignation $resignation)
    {
        if (Auth::user()->can('delete-resignations')) {
            $resignation->delete();

            return redirect()->back()->with('success', __('The resignation has been deleted.'));
        } else {
            return redirect()->route('hrm.resignations.index')->with('error', __('Permission denied'));
        }
    }

    public function updateStatus(Request $request, Resignation $resignation, $status)
    {
        if (Auth::user()->can('manage-resignation-status') || Auth::user()->type === 'company' || Auth::user()->type === 'superadmin') {
            $resignation->status = $status;
            $resignation->approved_by = Auth::id();
            $resignation->save();
            UpdateResignaionStatus::dispatch($request, $resignation);

            return redirect()->back()->with('success', __('The resignation status has been updated.'));
        } else {
            return redirect()->route('hrm.resignations.index')->with('error', __('Permission denied'));
        }
    }

    private function getFilteredUsers()
    {
        return User::emp()->where('created_by', creatorId())
            ->when(!Auth::user()->can('manage-any-resignations'), function ($q) {
                if (Auth::user()->can('manage-own-resignations')) {
                    $q->where('creator_id', Auth::id());
                } else {
                    $q->whereRaw('1 = 0');
                }
            })
            ->select('id', 'name')->get();
    }


    private function getFilteredEmployees()
    {
        $user = Auth::user();

        // For company admin or HR manager with manage-any-resignations:
        if ($user->type === 'company' || $user->type === 'superadmin' || $user->can('manage-any-resignations')) {
            $employeeUserIds = Employee::where('created_by', creatorId())->pluck('user_id');

            $empUsers = User::emp()->where('created_by', creatorId())
                ->whereIn('id', $employeeUserIds)
                ->select('id', 'name')->get();

            if ($empUsers->isNotEmpty()) {
                return $empUsers;
            }

            return User::emp()->where('created_by', creatorId())->select('id', 'name')->get();
        }

        // For employee user: return at least their own user account so they can select themselves
        return User::where('id', $user->id)->select('id', 'name')->get();
    }
}
