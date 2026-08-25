<?php

namespace Workdo\Hrm\Http\Controllers;

use Workdo\Hrm\Models\Shift;
use Workdo\Hrm\Models\MasterCountryShift;
use Workdo\Hrm\Models\EmployeeShiftHistory;
use Workdo\Hrm\Models\ShiftRule;
use Workdo\Hrm\Models\ShiftBreak;
use Workdo\Hrm\Models\ShiftAssignment;
use Workdo\Hrm\Models\OvertimeRule;
use Workdo\Hrm\Models\Employee;
use Workdo\Hrm\Models\Department;
use Workdo\Hrm\Services\ShiftCalculator;
use Workdo\Hrm\Http\Requests\StoreEnterpriseShiftRequest;
use Workdo\Hrm\Http\Requests\UpdateEnterpriseShiftRequest;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\User;
use Workdo\Hrm\Events\CreateShift;
use Workdo\Hrm\Events\UpdateShift;
use Workdo\Hrm\Events\DestroyShift;

class ShiftController extends Controller
{
    public function index(Request $request)
    {
        if (!Auth::user()->can('manage-shifts')) {
            return back()->with('error', __('Permission denied'));
        }

        $creatorId = creatorId();

        $shifts = Shift::query()
            ->with(['creator', 'rules', 'breaks', 'overtimeRule', 'assignments'])
            ->where(function ($q) use ($creatorId) {
                if (Auth::user()->can('manage-any-shifts')) {
                    $q->where('created_by', $creatorId);
                } elseif (Auth::user()->can('manage-own-shifts')) {
                    $q->where('creator_id', Auth::id());
                } else {
                    $q->whereRaw('1 = 0');
                }
            })
            ->when($request->input('search'), function ($q, $search) {
                $q->where(function ($query) use ($search) {
                    $query->where('shift_name', 'like', '%' . $search . '%')
                          ->orWhere('shift_code', 'like', '%' . $search . '%')
                          ->orWhere('country', 'like', '%' . $search . '%')
                          ->orWhere('timezone', 'like', '%' . $search . '%');
                });
            })
            ->when($request->input('shift_name'), fn($q, $val) => $q->where('shift_name', 'like', '%' . $val . '%'))
            ->when($request->input('shift_type') && $request->input('shift_type') !== 'all', fn($q, $val) => $q->where('shift_type', $val))
            ->when($request->input('country') && $request->input('country') !== 'all', fn($q, $val) => $q->where('country', $val))
            ->when($request->has('is_active') && $request->input('is_active') !== 'all', fn($q) => $q->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN)))
            ->when($request->input('sort'), fn($q) => $q->orderBy($request->input('sort'), $request->input('direction', 'asc')), fn($q) => $q->latest())
            ->paginate($request->input('per_page', 10))
            ->withQueryString();

        // Transform collection to append assigned_employees_count and sync assignments
        $shifts->getCollection()->transform(function ($shift) use ($creatorId) {
            $shift->assigned_employees_count = $shift->assigned_employees_count;

            // Merge shift_assignments table with employees.shift column
            $existingDirect = $shift->assignments->where('assignee_type', 'employee')->pluck('assignee_id')->map(fn($id) => (string)$id)->toArray();
            $tableEmpIds = Employee::where('created_by', $creatorId)->where('shift', $shift->id)->pluck('id')->map(fn($id) => (string)$id)->toArray();
            $allEmpIds = array_unique(array_merge($existingDirect, $tableEmpIds));

            $mergedAssignments = [];
            foreach ($allEmpIds as $empId) {
                $mergedAssignments[] = [
                    'shift_id' => $shift->id,
                    'assignee_type' => 'employee',
                    'assignee_id' => (string)$empId,
                ];
            }

            foreach ($shift->assignments->where('assignee_type', 'department') as $dept) {
                $mergedAssignments[] = [
                    'shift_id' => $shift->id,
                    'assignee_type' => 'department',
                    'assignee_id' => (string)$dept->assignee_id,
                ];
            }

            $shift->setRelation('assignments', collect($mergedAssignments));
            return $shift;
        });

        $employees = Employee::where('created_by', $creatorId)
            ->with(['user'])
            ->get()
            ->map(function ($emp) {
                return [
                    'id' => $emp->id,
                    'name' => $emp->user ? $emp->user->name : ('Employee #' . $emp->id),
                    'user_id' => $emp->user_id,
                    'employee_id' => $emp->employee_id,
                    'department_id' => $emp->department_id,
                ];
            });

        $departments = Department::where('created_by', $creatorId)
            ->get()
            ->map(function ($dept) {
                return [
                    'id' => $dept->id,
                    'name' => $dept->department_name,
                ];
            });

        return Inertia::render('Hrm/Shifts/Index', [
            'shifts' => $shifts,
            'users' => User::where('created_by', $creatorId)->select('id', 'name')->get(),
            'timezones' => ShiftCalculator::getSupportedTimezones(),
            'timezone_info' => ShiftCalculator::getTimezoneWithInfo(),
            'employees' => $employees,
            'departments' => $departments,
            'master_country_shifts' => MasterCountryShift::orderBy('country_name')->get(),
        ]);
    }

    public function store(StoreEnterpriseShiftRequest $request)
    {
        if (!Auth::user()->can('create-shifts')) {
            return redirect()->route('hrm.shifts.index')->with('error', __('Permission denied'));
        }

        $validated = $request->validated();
        $creatorId = creatorId();

        DB::transaction(function () use ($validated, $creatorId, $request) {
            // 1. Calculate hours and night shift flags
            $hours = ShiftCalculator::calculateHours(
                $validated['start_time'] ?? null,
                $validated['end_time'] ?? null,
                $validated['breaks'] ?? []
            );

            $isCross = ShiftCalculator::detectCrossMidnight($validated['start_time'] ?? null, $validated['end_time'] ?? null);
            $isNight = ShiftCalculator::detectNightShift($validated['start_time'] ?? null, $validated['end_time'] ?? null);

            $shift = new Shift();
            $shift->shift_name = $validated['shift_name'];
            $shift->shift_code = $validated['shift_code'] ?? ('SFT-' . strtoupper(substr(uniqid(), -5)));
            $shift->shift_type = $validated['shift_type'];
            $shift->description = $validated['description'] ?? null;
            $shift->is_active = $validated['is_active'] ?? true;
            $shift->country = $validated['country'] ?? 'United States';
            $shift->region = $validated['region'] ?? 'North America';
            $shift->timezone = $validated['timezone'] ?? 'America/Denver';
            $shift->start_time = $validated['start_time'] ?? null;
            $shift->end_time = $validated['end_time'] ?? null;
            $shift->is_night_shift = $isNight;
            $shift->is_cross_midnight = $isCross;
            $shift->total_shift_hours = $hours['total_shift_hours'];
            $shift->net_working_hours = $hours['net_working_hours'];

            if ($validated['shift_type'] === 'flexible') {
                $shift->required_working_hours = $validated['required_working_hours'] ?? 8.00;
                $shift->earliest_start_time = $validated['earliest_start_time'] ?? null;
                $shift->latest_start_time = $validated['latest_start_time'] ?? null;
                $shift->latest_finish_time = $validated['latest_finish_time'] ?? null;
            }

            if ($validated['shift_type'] === 'on_call') {
                $shift->on_call_standby_allowance = $validated['on_call_standby_allowance'] ?? 0;
                $shift->on_call_response_time_mins = $validated['on_call_response_time_mins'] ?? 30;
            }

            $shift->creator_id = Auth::id();
            $shift->created_by = $creatorId;
            $shift->save();

            // 2. Save Rules
            $ruleData = $validated['rules'] ?? [];
            $shift->rules()->create([
                'grace_period_mins' => $ruleData['grace_period_mins'] ?? 10,
                'early_clock_in_mins' => $ruleData['early_clock_in_mins'] ?? 30,
                'late_clock_out_mins' => $ruleData['late_clock_out_mins'] ?? 120,
                'min_working_hours' => $ruleData['min_working_hours'] ?? 4.00,
                'max_working_hours' => $ruleData['max_working_hours'] ?? 12.00,
                'half_day_threshold_hours' => $ruleData['half_day_threshold_hours'] ?? 4.00,
                'absent_threshold_hours' => $ruleData['absent_threshold_hours'] ?? 2.00,
                'auto_mark_late' => $ruleData['auto_mark_late'] ?? true,
                'auto_mark_early_leave' => $ruleData['auto_mark_early_leave'] ?? true,
            ]);

            // 3. Save Breaks
            if (!empty($validated['breaks']) && is_array($validated['breaks'])) {
                foreach ($validated['breaks'] as $b) {
                    $shift->breaks()->create([
                        'break_name' => $b['break_name'] ?? 'Lunch Break',
                        'break_type' => $b['break_type'] ?? 'unpaid',
                        'duration_mins' => $b['duration_mins'] ?? 60,
                        'start_time' => $b['start_time'] ?? null,
                        'end_time' => $b['end_time'] ?? null,
                    ]);
                }
            }

            // 4. Save Overtime Rules
            $otData = $validated['overtime'] ?? [];
            $shift->overtimeRule()->create([
                'enable_ot' => $otData['enable_ot'] ?? true,
                'ot_starts_after_hours' => $otData['ot_starts_after_hours'] ?? $hours['net_working_hours'],
                'max_ot_hours' => $otData['max_ot_hours'] ?? 4.00,
                'approval_required' => $otData['approval_required'] ?? true,
                'ot_multiplier' => $otData['ot_multiplier'] ?? 1.50,
            ]);

            // 5. Save Assignments if provided
            if (!empty($validated['assignments']['assignee_ids'])) {
                $type = $validated['assignments']['assignee_type'] ?? 'employee';
                foreach ($validated['assignments']['assignee_ids'] as $id) {
                    $shift->assignments()->create([
                        'assignee_type' => $type,
                        'assignee_id' => (string)$id,
                        'created_by' => $creatorId,
                    ]);
                }
            }

            CreateShift::dispatch($request, $shift);
        });

        return redirect()->route('hrm.shifts.index')->with('success', __('Enterprise shift created successfully.'));
    }

    public function update(UpdateEnterpriseShiftRequest $request, Shift $shift)
    {
        if (!Auth::user()->can('edit-shifts')) {
            return redirect()->route('hrm.shifts.index')->with('error', __('Permission denied'));
        }

        $validated = $request->validated();
        $creatorId = creatorId();

        DB::transaction(function () use ($validated, $shift, $creatorId, $request) {
            $hours = ShiftCalculator::calculateHours(
                $validated['start_time'] ?? null,
                $validated['end_time'] ?? null,
                $validated['breaks'] ?? []
            );

            $isCross = ShiftCalculator::detectCrossMidnight($validated['start_time'] ?? null, $validated['end_time'] ?? null);
            $isNight = ShiftCalculator::detectNightShift($validated['start_time'] ?? null, $validated['end_time'] ?? null);

            $shift->shift_name = $validated['shift_name'];
            if (!empty($validated['shift_code'])) {
                $shift->shift_code = $validated['shift_code'];
            }
            $shift->shift_type = $validated['shift_type'];
            $shift->description = $validated['description'] ?? null;
            $shift->is_active = $validated['is_active'] ?? true;
            $shift->country = $validated['country'] ?? $shift->country;
            $shift->region = $validated['region'] ?? $shift->region;
            $shift->timezone = $validated['timezone'] ?? $shift->timezone;
            $shift->start_time = $validated['start_time'] ?? null;
            $shift->end_time = $validated['end_time'] ?? null;
            $shift->is_night_shift = $isNight;
            $shift->is_cross_midnight = $isCross;
            $shift->total_shift_hours = $hours['total_shift_hours'];
            $shift->net_working_hours = $hours['net_working_hours'];

            if ($validated['shift_type'] === 'flexible') {
                $shift->required_working_hours = $validated['required_working_hours'] ?? 8.00;
                $shift->earliest_start_time = $validated['earliest_start_time'] ?? null;
                $shift->latest_start_time = $validated['latest_start_time'] ?? null;
                $shift->latest_finish_time = $validated['latest_finish_time'] ?? null;
            }

            $shift->save();

            // Update Rules
            $ruleData = $validated['rules'] ?? [];
            $shift->rules()->updateOrCreate(
                ['shift_id' => $shift->id],
                [
                    'grace_period_mins' => $ruleData['grace_period_mins'] ?? 10,
                    'early_clock_in_mins' => $ruleData['early_clock_in_mins'] ?? 30,
                    'late_clock_out_mins' => $ruleData['late_clock_out_mins'] ?? 120,
                    'min_working_hours' => $ruleData['min_working_hours'] ?? 4.00,
                    'max_working_hours' => $ruleData['max_working_hours'] ?? 12.00,
                    'half_day_threshold_hours' => $ruleData['half_day_threshold_hours'] ?? 4.00,
                    'absent_threshold_hours' => $ruleData['absent_threshold_hours'] ?? 2.00,
                    'auto_mark_late' => $ruleData['auto_mark_late'] ?? true,
                    'auto_mark_early_leave' => $ruleData['auto_mark_early_leave'] ?? true,
                ]
            );

            // Update Breaks
            $shift->breaks()->delete();
            if (!empty($validated['breaks']) && is_array($validated['breaks'])) {
                foreach ($validated['breaks'] as $b) {
                    $shift->breaks()->create([
                        'break_name' => $b['break_name'] ?? 'Lunch Break',
                        'break_type' => $b['break_type'] ?? 'unpaid',
                        'duration_mins' => $b['duration_mins'] ?? 60,
                        'start_time' => $b['start_time'] ?? null,
                        'end_time' => $b['end_time'] ?? null,
                    ]);
                }
            }

            // Update OT Rules
            $otData = $validated['overtime'] ?? [];
            $shift->overtimeRule()->updateOrCreate(
                ['shift_id' => $shift->id],
                [
                    'enable_ot' => $otData['enable_ot'] ?? true,
                    'ot_starts_after_hours' => $otData['ot_starts_after_hours'] ?? $hours['net_working_hours'],
                    'max_ot_hours' => $otData['max_ot_hours'] ?? 4.00,
                    'approval_required' => $otData['approval_required'] ?? true,
                    'ot_multiplier' => $otData['ot_multiplier'] ?? 1.50,
                ]
            );

            // Update Assignments if provided
            if (isset($validated['assignments']['assignee_ids'])) {
                $shift->assignments()->delete();
                $type = $validated['assignments']['assignee_type'] ?? 'employee';
                foreach ($validated['assignments']['assignee_ids'] as $id) {
                    $shift->assignments()->create([
                        'assignee_type' => $type,
                        'assignee_id' => (string)$id,
                        'created_by' => $creatorId,
                    ]);
                }
            }

            UpdateShift::dispatch($request, $shift);
        });

        return redirect()->back()->with('success', __('Shift details updated successfully.'));
    }

    public function show(Shift $shift)
    {
        if (!Auth::user()->can('manage-shifts')) {
            return back()->with('error', __('Permission denied'));
        }

        $shift->load(['creator', 'rules', 'breaks', 'overtimeRule', 'assignments']);
        
        $assignedEmployees = [];
        $assigneeIds = $shift->assignments->pluck('assignee_id')->toArray();
        if (!empty($assigneeIds)) {
            $assignedEmployees = Employee::whereIn('id', $assigneeIds)
                ->orWhereIn('user_id', $assigneeIds)
                ->with(['user', 'department'])
                ->get()
                ->map(function ($emp) {
                    return [
                        'id' => $emp->id,
                        'name' => $emp->user ? $emp->user->name : ('Employee #' . $emp->id),
                        'employee_id' => $emp->employee_id,
                        'official_email' => $emp->official_email,
                        'department' => $emp->department,
                        'timezone' => $emp->timezone,
                    ];
                });
        }

        return Inertia::render('Hrm/Shifts/View', [
            'shift' => $shift,
            'assigned_employees' => $assignedEmployees,
            'timezones' => ShiftCalculator::getSupportedTimezones(),
            'timezone_info' => ShiftCalculator::getTimezoneWithInfo(),
        ]);
    }

    public function duplicate(Shift $shift)
    {
        if (!Auth::user()->can('create-shifts')) {
            return back()->with('error', __('Permission denied'));
        }

        $creatorId = creatorId();

        DB::transaction(function () use ($shift, $creatorId) {
            $newShift = $shift->replicate();
            $newShift->shift_name = $shift->shift_name . ' (Copy)';
            $newShift->shift_code = 'SFT-' . strtoupper(substr(uniqid(), -5));
            $newShift->creator_id = Auth::id();
            $newShift->created_by = $creatorId;
            $newShift->save();

            if ($shift->rules) {
                $newShift->rules()->create($shift->rules->toArray());
            }

            foreach ($shift->breaks as $b) {
                $newShift->breaks()->create($b->toArray());
            }

            if ($shift->overtimeRule) {
                $newShift->overtimeRule()->create($shift->overtimeRule->toArray());
            }
        });

        return redirect()->route('hrm.shifts.index')->with('success', __('Shift duplicated successfully.'));
    }

    public function assignEmployees(Request $request, Shift $shift)
    {
        if (!Auth::user()->can('edit-shifts')) {
            return back()->with('error', __('Permission denied'));
        }

        $request->validate([
            'assignee_type' => 'required|string|in:employee,department,team,role,country',
            'assignee_ids' => 'nullable|array',
        ]);

        $creatorId = creatorId();
        $assigneeType = $request->input('assignee_type', 'employee');
        $assigneeIds = $request->input('assignee_ids', []);

        DB::transaction(function () use ($assigneeType, $assigneeIds, $shift, $creatorId) {
            $shift->assignments()->delete();
            foreach ($assigneeIds as $id) {
                $shift->assignments()->create([
                    'assignee_type' => $assigneeType,
                    'assignee_id' => (string)$id,
                    'created_by' => $creatorId,
                ]);
            }

            if ($assigneeType === 'employee') {
                // Clear previous employees assigned to this shift
                Employee::where('created_by', $creatorId)
                    ->where('shift', $shift->id)
                    ->update(['shift' => null]);

                if (!empty($assigneeIds)) {
                    Employee::where('created_by', $creatorId)
                        ->where(function ($query) use ($assigneeIds) {
                            $query->whereIn('id', $assigneeIds)
                                  ->orWhereIn('user_id', $assigneeIds);
                        })
                        ->update(['shift' => $shift->id]);
                }
            } elseif ($assigneeType === 'department') {
                // Clear previous department employees assigned to this shift
                Employee::where('created_by', $creatorId)
                    ->where('shift', $shift->id)
                    ->update(['shift' => null]);

                if (!empty($assigneeIds)) {
                    Employee::where('created_by', $creatorId)
                        ->whereIn('department_id', $assigneeIds)
                        ->update(['shift' => $shift->id]);
                }
            }
        });

        return back()->with('success', __('Employees assigned to shift successfully.'));
    }

    public function archive(Shift $shift)
    {
        if (!Auth::user()->can('edit-shifts')) {
            return back()->with('error', __('Permission denied'));
        }

        $shift->is_active = !$shift->is_active;
        $shift->save();

        $statusStr = $shift->is_active ? __('activated') : __('archived');
        return back()->with('success', __("Shift has been {$statusStr} successfully."));
    }

    public function destroy(Shift $shift)
    {
        if (Auth::user()->can('delete-shifts')) {
            DestroyShift::dispatch($shift);
            $shift->delete();
            return redirect()->route('hrm.shifts.index')->with('success', __('The shift has been deleted.'));
        } else {
            return redirect()->route('hrm.shifts.index')->with('error', __('Permission denied'));
        }
    }

    public function importCountryShift(Request $request)
    {
        if (!Auth::user()->can('create-shifts')) {
            return back()->with('error', __('Permission denied'));
        }

        $request->validate([
            'master_country_shift_id' => 'required|exists:master_country_shifts,id',
            'shift_name' => 'required|string|max:255',
            'timezone' => 'required|string|max:255',
        ]);

        $master = MasterCountryShift::findOrFail($request->master_country_shift_id);
        $creatorId = creatorId();

        $startTimeStr = date('H:i', strtotime($master->office_start_time));
        $endTimeStr = date('H:i', strtotime($master->office_end_time));

        $isNight = ShiftCalculator::detectNightShift($startTimeStr, $endTimeStr);
        $isCross = ShiftCalculator::detectCrossMidnight($startTimeStr, $endTimeStr);
        $hours = ShiftCalculator::calculateHours($startTimeStr, $endTimeStr, [
            ['duration_mins' => $master->break_duration_mins ?? 60, 'break_type' => 'unpaid']
        ]);

        $shift = Shift::create([
            'shift_name' => $request->shift_name,
            'shift_code' => strtoupper($master->iso_code) . '-' . rand(100, 999),
            'shift_type' => 'fixed',
            'description' => "Imported Country Standard Shift for {$master->country_name}",
            'is_active' => true,
            'country' => $master->country_name,
            'region' => null,
            'timezone' => $request->timezone,
            'start_time' => $master->office_start_time,
            'end_time' => $master->office_end_time,
            'break_start_time' => '13:00:00',
            'break_end_time' => '14:00:00',
            'is_night_shift' => $isNight,
            'is_cross_midnight' => $isCross,
            'total_shift_hours' => $hours['total_shift_hours'] ?? 8.0,
            'net_working_hours' => $hours['net_working_hours'] ?? 7.0,
            'required_working_hours' => $master->weekly_working_hours ? ($master->weekly_working_hours / 5) : 8.0,
            'master_country_shift_id' => $master->id,
            'source_type' => 'country_standard',
            'version' => $master->version,
            'effective_from' => now()->toDateString(),
            'has_update_available' => false,
            'latest_master_version' => $master->version,
            'creator_id' => Auth::id(),
            'created_by' => $creatorId,
        ]);

        // Default Shift Rule
        ShiftRule::create([
            'shift_id' => $shift->id,
            'late_arrival_threshold_mins' => 15,
            'early_exit_threshold_mins' => 15,
            'grace_period_mins' => 10,
            'half_day_hours' => 4,
            'full_day_hours' => 8,
            'auto_clock_out' => true,
            'max_shift_hours' => 12,
        ]);

        return back()->with('success', __('Country Standard Shift imported successfully.'));
    }

    public function updateMasterVersion(Shift $shift)
    {
        if (!Auth::user()->can('edit-shifts')) {
            return back()->with('error', __('Permission denied'));
        }

        if ($shift->masterCountryShift) {
            $master = $shift->masterCountryShift;
            $shift->version = $master->version;
            $shift->start_time = $master->office_start_time;
            $shift->end_time = $master->office_end_time;
            $shift->has_update_available = false;
            $shift->latest_master_version = $master->version;
            $shift->save();
        }

        return back()->with('success', __('Shift updated to latest version successfully.'));
    }

    public function ignoreMasterVersion(Shift $shift)
    {
        if (!Auth::user()->can('edit-shifts')) {
            return back()->with('error', __('Permission denied'));
        }

        $shift->has_update_available = false;
        $shift->save();

        return back()->with('success', __('Version update notification ignored.'));
    }
}
