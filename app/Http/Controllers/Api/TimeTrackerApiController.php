<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Traits\ApiResponseTrait;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Workdo\Hrm\Models\Attendance;
use Workdo\Hrm\Models\AttendanceScreenshot;
use Workdo\Hrm\Models\Employee;

class TimeTrackerApiController extends Controller
{
    use ApiResponseTrait;

    /**
     * Helper to parse sessions array from Attendance notes.
     */
    private function parseNotesSessions($notes)
    {
        if (empty($notes)) return [];
        $trimmed = trim($notes);
        if (str_starts_with($trimmed, '{')) {
            $data = json_decode($trimmed, true);
            if (isset($data['sessions']) && is_array($data['sessions'])) {
                return $data['sessions'];
            }
        }
        return [];
    }

    /**
     * Helper to encode sessions array back to Attendance notes JSON.
     */
    private function buildNotesJson(array $sessions, string $textNote = '')
    {
        return json_encode([
            'text' => $textNote,
            'sessions' => $sessions
        ]);
    }

    /**
     * Get or auto-create Employee profile for seamless tracking.
     */
    private function getOrCreateEmployee(User $user): Employee
    {
        $employee = Employee::where('user_id', $user->id)
            ->orWhere('official_email', $user->email)
            ->first();

        if (!$employee) {
            $creatorId = $user->created_by ?? 1;
            if (function_exists('creatorId')) {
                try {
                    $creatorId = creatorId();
                } catch (\Throwable $th) {}
            }

            $employee = new Employee();
            $employee->user_id = $user->id;
            $employee->employee_id = 'EMP-' . str_pad((string)$user->id, 4, '0', STR_PAD_LEFT);
            $employee->official_email = $user->email;
            $employee->created_by = $creatorId;
            $employee->save();
        } elseif (empty($employee->user_id)) {
            $employee->user_id = $user->id;
            $employee->save();
        }

        return $employee;
    }

    /**
     * Get live timer status and user employee details.
     */
    public function status(Request $request)
    {
        try {
            $user = $request->user();
            $employee = $this->getOrCreateEmployee($user);
            $creatorId = $user->created_by ?? ($employee->created_by ?? 1);
            $empIds = array_unique(array_filter([$user->id, $employee->id ?? null]));

            $today = Carbon::today()->format('Y-m-d');
            $attendance = Attendance::whereIn('employee_id', $empIds)
                ->whereNotNull('clock_in')
                ->whereNull('clock_out')
                ->orderBy('clock_in', 'desc')
                ->first();

            if (!$attendance) {
                $attendance = Attendance::whereIn('employee_id', $empIds)
                    ->where('date', $today)
                    ->first();
            }

            $isClockedIn = false;
            $clockInTime = null;
            $clockOutTime = null;
            $totalHours = 0;
            $sessions = [];

            if ($attendance) {
                $sessions = $this->parseNotesSessions($attendance->notes);
                if (empty($sessions) && !empty($attendance->clock_in)) {
                    $sessions = [
                        [
                            'in' => $attendance->clock_in,
                            'out' => $attendance->clock_out,
                            'platform' => 'App/Web'
                        ]
                    ];
                }

                $isClockedIn = !empty($attendance->clock_in) && empty($attendance->clock_out);
                if (!empty($sessions)) {
                    $last = end($sessions);
                    if (empty($last['out'])) {
                        $isClockedIn = true;
                        $rawIn = $last['in'];
                        if (!str_contains($rawIn, '-') && !str_contains($rawIn, 'T')) {
                            $clockInTime = $attendance->date . ' ' . $rawIn;
                        } else {
                            $clockInTime = $rawIn;
                        }
                    } else {
                        $isClockedIn = false;
                        $clockInTime = $attendance->clock_in;
                        $clockOutTime = $attendance->clock_out;
                    }
                } else {
                    $clockInTime = $attendance->clock_in;
                    $clockOutTime = $attendance->clock_out;
                }
                $totalHours = (float) $attendance->total_hour;
            }

            $data = [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name ?? 'User',
                    'email' => $user->email,
                    'avatar' => $user->avatar ? asset(Storage::url($user->avatar)) : null,
                    'role' => $user->type ?? 'Staff',
                ],
                'employee' => [
                    'id' => $employee->id,
                    'employee_id' => $employee->employee_id ?? ('EMP-' . $user->id),
                    'designation' => $employee->designation?->name ?? ($user->type ?? 'Employee'),
                    'department' => $employee->department?->name ?? 'General',
                ],
                'timer' => [
                    'is_clocked_in' => $isClockedIn,
                    'clock_in_time' => $clockInTime,
                    'clock_out_time' => $clockOutTime,
                    'total_hours_today' => $totalHours,
                    'today_sessions' => $sessions,
                    'date' => $today,
                ]
            ];

            return $this->successResponse($data, 'Time tracker status retrieved successfully.');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve status: ' . $e->getMessage());
        }
    }

    /**
     * Clock in from desktop/mobile tracker.
     */
    public function clockIn(Request $request)
    {
        try {
            $user = $request->user();
            $employee = $this->getOrCreateEmployee($user);
            $creatorId = $user->created_by ?? ($employee->created_by ?? 1);
            $empIds = array_unique(array_filter([$user->id, $employee->id ?? null]));

            $today = Carbon::today()->format('Y-m-d');
            $now = Carbon::now()->format('H:i:s');

            $attendance = Attendance::whereIn('employee_id', $empIds)
                ->where('date', $today)
                ->first();

            $platform = $request->input('platform', 'Desktop');

            if (!$attendance) {
                $attendance = new Attendance();
                $attendance->employee_id = $user->id;
                $attendance->shift_id = $employee->shift ?? null;
                $attendance->date = $today;
                $attendance->creator_id = $user->id;
                $attendance->created_by = $creatorId;
                $sessions = [];
            } else {
                $sessions = $this->parseNotesSessions($attendance->notes);
            }

            $hasActiveSession = false;
            foreach ($sessions as $s) {
                if (empty($s['out'])) {
                    $hasActiveSession = true;
                    break;
                }
            }

            if (!$hasActiveSession) {
                $sessions[] = [
                    'in' => $now,
                    'out' => null,
                    'platform' => $platform
                ];
            }

            if (empty($attendance->clock_in)) {
                $attendance->clock_in = $now;
            }
            $attendance->clock_out = null;
            $attendance->status = 'present';
            $attendance->notes = $this->buildNotesJson($sessions, 'Clocked in via ' . $platform);
            $attendance->save();

            return $this->successResponse([
                'is_clocked_in' => true,
                'clock_in_time' => $now,
                'today_sessions' => $sessions,
                'attendance_id' => $attendance->id,
            ], 'Clocked in successfully!');
        } catch (\Exception $e) {
            return $this->errorResponse('Clock-in failed: ' . $e->getMessage());
        }
    }

    /**
     * Clock out from desktop/mobile tracker.
     */
    public function clockOut(Request $request)
    {
        try {
            $user = $request->user();
            $employee = $this->getOrCreateEmployee($user);
            $creatorId = $user->created_by ?? ($employee->created_by ?? 1);
            $empIds = array_unique(array_filter([$user->id, $employee->id ?? null]));

            $today = Carbon::today()->format('Y-m-d');
            $now = Carbon::now()->format('H:i:s');

            $attendance = Attendance::whereIn('employee_id', $empIds)
                ->where('date', $today)
                ->first();

            if (!$attendance || empty($attendance->clock_in)) {
                return $this->errorResponse('No active clock-in session found for today.');
            }

            $sessions = $this->parseNotesSessions($attendance->notes);
            $platform = $request->input('platform', 'Desktop');

            if (empty($sessions)) {
                $sessions[] = [
                    'in' => $attendance->clock_in,
                    'out' => $now,
                    'platform' => $platform
                ];
            } else {
                $updated = false;
                for ($i = count($sessions) - 1; $i >= 0; $i--) {
                    if (empty($sessions[$i]['out'])) {
                        $sessions[$i]['out'] = $now;
                        $updated = true;
                        break;
                    }
                }
                if (!$updated) {
                    $sessions[] = [
                        'in' => $attendance->clock_in,
                        'out' => $now,
                        'platform' => $platform
                    ];
                }
            }

            $totalSecs = 0;
            foreach ($sessions as $s) {
                if (!empty($s['in']) && !empty($s['out'])) {
                    try {
                        $start = Carbon::createFromFormat('H:i:s', substr($s['in'], -8));
                        $end = Carbon::createFromFormat('H:i:s', substr($s['out'], -8));
                        $totalSecs += max(0, $end->diffInSeconds($start));
                    } catch (\Throwable $th) {}
                }
            }

            $hrs = round($totalSecs / 3600, 2);
            $attendance->clock_out = $now;
            $attendance->total_hour = $hrs;
            $attendance->status = ($hrs >= 8) ? 'present' : (($hrs >= 4) ? 'half day' : 'absent');
            $attendance->notes = $this->buildNotesJson($sessions, 'Clocked out via ' . $platform);
            $attendance->save();

            return $this->successResponse([
                'is_clocked_in' => false,
                'clock_in_time' => $attendance->clock_in,
                'clock_out_time' => $now,
                'total_hours' => $hrs,
                'today_sessions' => $sessions,
            ], 'Clocked out successfully!');
        } catch (\Exception $e) {
            return $this->errorResponse('Clock-out failed: ' . $e->getMessage());
        }
    }

    /**
     * Heartbeat auto-sync from desktop daemon / app.
     */
    public function syncHeartbeat(Request $request)
    {
        try {
            $user = $request->user();
            $employee = $this->getOrCreateEmployee($user);
            $empIds = array_unique(array_filter([$user->id, $employee->id ?? null]));

            $today = Carbon::today()->format('Y-m-d');

            $attendance = Attendance::whereIn('employee_id', $empIds)
                ->where('date', $today)
                ->first();

            $isClockedIn = $attendance && !empty($attendance->clock_in) && empty($attendance->clock_out);
            $sessions = $attendance ? $this->parseNotesSessions($attendance->notes) : [];

            return $this->successResponse([
                'is_clocked_in' => $isClockedIn,
                'today_sessions' => $sessions,
                'server_time' => Carbon::now()->toIso8601String(),
            ], 'Heartbeat synced successfully.');
        } catch (\Exception $e) {
            return $this->errorResponse('Heartbeat sync failed: ' . $e->getMessage());
        }
    }

    /**
     * Upload screenshot captured from Dtime Trace desktop app.
     */
    public function uploadScreenshot(Request $request)
    {
        try {
            $request->validate([
                'screenshot' => 'required|image|mimes:jpeg,jpg,png,webp|max:10240',
            ]);

            $user = $request->user();
            $employee = $this->getOrCreateEmployee($user);
            $creatorId = $user->created_by ?? ($employee->created_by ?? 1);
            $empIds = array_unique(array_filter([$user->id, $employee->id ?? null]));

            $today = Carbon::today()->format('Y-m-d');
            $attendance = Attendance::whereIn('employee_id', $empIds)
                ->where('date', $today)
                ->first();

            if (!$attendance || empty($attendance->clock_in) || !empty($attendance->clock_out)) {
                return $this->errorResponse('Cannot upload screenshot: Employee is not currently clocked in.');
            }

            if ($request->hasFile('screenshot')) {
                $file = $request->file('screenshot');
                $filename = 'screenshot_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('attendance_screenshots/' . $today, $filename, 'public');

                $screenshot = new AttendanceScreenshot();
                $screenshot->attendance_id = $attendance->id;
                $screenshot->employee_id = $employee->id;
                $screenshot->image_path = $path;
                $screenshot->captured_at = Carbon::now();
                $screenshot->active_app = $request->input('active_app', 'Unknown App');
                $screenshot->active_window = $request->input('active_window', 'Desktop');
                $screenshot->creator_id = $user->id;
                $screenshot->created_by = $creatorId;
                $screenshot->save();

                return $this->successResponse([
                    'screenshot_id' => $screenshot->id,
                    'image_url' => asset(Storage::url($path)),
                    'captured_at' => $screenshot->captured_at->toIso8601String(),
                ], 'Screenshot captured and uploaded successfully!');
            }

            return $this->errorResponse('No screenshot file provided.');
        } catch (\Exception $e) {
            return $this->errorResponse('Screenshot upload failed: ' . $e->getMessage());
        }
    }
}
