<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Workdo\Hrm\Models\Employee;
use Workdo\Hrm\Models\Attendance;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use App\Mail\ShiftReminderMail;
use App\Services\MailConfigService;

class SendShiftNotifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'time-tracker:send-shift-notifications';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send automated shift push notifications and dynamic emails based on employee local timezones and working hours.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking shift schedules, timezones, push notifications and automated emails...');

        $employees = Employee::with(['user', 'designation', 'department'])->get();

        foreach ($employees as $employee) {
            $user = $employee->user;
            if (!$user || empty($user->email)) continue;

            $empTimezone = $employee->effective_timezone ?? 'America/Denver';
            try {
                $nowEmp = Carbon::now($empTimezone);
            } catch (\Exception $e) {
                $nowEmp = Carbon::now('America/Denver');
            }

            // Check if today is weekend / off day
            $weekendDays = $employee->country_weekend_days ?? [0, 6];
            if (in_array($nowEmp->dayOfWeek, $weekendDays)) {
                continue; // Skip weekends
            }

            // Standard Shift Start: 09:00 AM
            $shiftStart = $nowEmp->copy()->setTime(9, 0, 0);
            $before30Mins = $shiftStart->copy()->subMinutes(30);

            // Dynamic Time Details for Email & Notification
            $nowComp = Carbon::now('America/Denver');
            $nowUtc = Carbon::now('UTC');

            $shiftStartUtc = $shiftStart->copy()->setTimezone('UTC')->format('h:i A');
            $shiftEndUtc = $nowEmp->copy()->setTime(18, 0, 0)->setTimezone('UTC')->format('h:i A');

            $weekendNames = [];
            $dayMap = [0 => 'Sun', 1 => 'Mon', 2 => 'Tue', 3 => 'Wed', 4 => 'Thu', 5 => 'Fri', 6 => 'Sat'];
            foreach ($weekendDays as $dayIndex) {
                if (isset($dayMap[$dayIndex])) {
                    $weekendNames[] = $dayMap[$dayIndex];
                }
            }
            $offDaysText = count($weekendNames) > 0 ? implode(' & ', $weekendNames) : 'Sun';

            $userAvatarUrl = '';
            if (!empty($user->avatar)) {
                if (str_starts_with($user->avatar, 'http://') || str_starts_with($user->avatar, 'https://')) {
                    $userAvatarUrl = $user->avatar;
                } else {
                    $userAvatarUrl = 'https://app.dynime.com/storage/' . ltrim($user->avatar, '/');
                }
            }

            $officialEmail = !empty($employee->official_email) ? $employee->official_email : $user->email;
            $creatorId = $employee->created_by ?? ($user->created_by ?? 1);

            $emailData = [
                'userName' => $user->name,
                'employeeId' => $employee->employee_id ?? ('EMP-' . $user->id),
                'designation' => $employee->designation?->name ?? 'Employee',
                'officialEmail' => $officialEmail,
                'userAvatar' => $userAvatarUrl,
                'compTime' => $nowComp->format('h:i:s A'),
                'utcTime' => $nowUtc->format('h:i:s A'),
                'shiftUtc' => "{$shiftStartUtc} – {$shiftEndUtc}",
                'empTime' => $nowEmp->format('h:i:s A'),
                'empTimezone' => $empTimezone,
                'country' => $employee->country ?? $employee->work_location_country ?? 'USA',
                'offDaysText' => $offDaysText,
            ];

            // 1. 30 Minutes Before Shift Start Notification & Email
            $diff30Mins = abs($nowEmp->timestamp - $before30Mins->timestamp);
            if ($diff30Mins <= 90) {
                $cacheKey = "shift_notify_30m_{$user->id}_" . $nowEmp->format('Y-m-d');
                if (\Illuminate\Support\Facades\Cache::add($cacheKey, true, 86400)) {
                    $headline = 'Working Time Starting in 30 Minutes';
                    $messageText = 'Your daily working shift starts in 30 minutes (at ' . $shiftStart->format('h:i A') . ' ' . $nowEmp->format('T') . '). Please log in to Dtime Trace app or your ERP portal to get ready.';
                    
                    $this->sendPushNotification($user, "{$headline}", $messageText);
                    
                    $emailPayload = array_merge($emailData, [
                        'headline' => $headline,
                        'messageText' => $messageText,
                    ]);
                    $this->sendShiftEmail($user->email, $officialEmail, $emailPayload, $creatorId);
                }
            }

            // 2. Exact Shift Start Notification & Email
            $diffStart = abs($nowEmp->timestamp - $shiftStart->timestamp);
            if ($diffStart <= 90) {
                $cacheKey = "shift_notify_start_{$user->id}_" . $nowEmp->format('Y-m-d');
                if (\Illuminate\Support\Facades\Cache::add($cacheKey, true, 86400)) {
                    $todayAttendance = Attendance::where('employee_id', $user->id)
                        ->where('date', $nowEmp->format('Y-m-d'))
                        ->first();

                    if (!$todayAttendance || empty($todayAttendance->clock_in)) {
                        $headline = 'Shift Started - Time to Clock In';
                        $messageText = 'Your working time has officially started! Click the button below to clock in now on Dtime Trace client app.';
                        
                        $this->sendPushNotification($user, "{$headline}", $messageText);

                        $emailPayload = array_merge($emailData, [
                            'headline' => $headline,
                            'messageText' => $messageText,
                        ]);
                        $this->sendShiftEmail($user->email, $officialEmail, $emailPayload, $creatorId);
                    }
                }
            }

            // 3. Duty End / 8 Hours Completed Notification
            $todayAttendance = Attendance::where('employee_id', $user->id)
                ->where('date', $nowEmp->format('Y-m-d'))
                ->first();

            if ($todayAttendance && !empty($todayAttendance->clock_in) && empty($todayAttendance->clock_out)) {
                $clockInTime = Carbon::parse($todayAttendance->clock_in);
                $elapsedSeconds = $nowEmp->diffInSeconds($clockInTime);

                if ($elapsedSeconds >= 28800 && $elapsedSeconds <= 28860) {
                    $headline = '8 Hours Duty Completed Today';
                    $messageText = 'Great job! You have completed 8 hours of clocked-in duty today. Don\'t forget to clock out when wrapping up.';

                    $this->sendPushNotification($user, "{$headline}", $messageText);

                    $emailPayload = array_merge($emailData, [
                        'headline' => $headline,
                        'messageText' => $messageText,
                    ]);
                    $this->sendShiftEmail($user->email, $officialEmail, $emailPayload, $creatorId);
                }
            }
        }

        $this->info('Shift notification checks completed successfully.');
        return 0;
    }

    /**
     * Send push notification to user device.
     */
    private function sendPushNotification($user, string $title, string $message)
    {
        Log::info("Sending Push Notification to User #{$user->id} ({$user->name}): {$title} - {$message}");
        try {
            $user->notify(new \App\Notifications\GenericPushNotification($title, $message));
        } catch (\Throwable $e) {
            Log::info("Notification log: {$title}");
        }
    }

    /**
     * Send dynamic HTML email with CC to official email using MailConfigService.
     */
    private function sendShiftEmail(string $primaryEmail, string $officialEmail, array $data, $creatorId = null)
    {
        try {
            if (class_exists(MailConfigService::class)) {
                MailConfigService::setDynamicConfig($creatorId);
            }

            $mailable = new ShiftReminderMail($data);
            $mail = Mail::to($primaryEmail);

            if (!empty($officialEmail) && strtolower(trim($officialEmail)) !== strtolower(trim($primaryEmail))) {
                $mail->cc($officialEmail);
            }

            $mail->send($mailable);
            Log::info("Shift email sent to {$primaryEmail} (CC: {$officialEmail})");
        } catch (\Throwable $e) {
            Log::error("Failed to send shift email: " . $e->getMessage());
        }
    }
}
