<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Workdo\Hrm\Models\EmployeeOnboardingStatus;
use App\Mail\EmployeeOnboardingReminderMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class SendOnboardingRemindersCommand extends Command
{
    protected $signature = 'hrm:send-onboarding-reminders';
    protected $description = 'Send email reminders to employees with incomplete onboarding profiles at Days 3, 7, and 14 thresholds.';

    public function handle()
    {
        $pendingStatuses = EmployeeOnboardingStatus::where('status', '!=', 'completed')
            ->where('completion_percentage', '<', 100)
            ->with(['employee.user'])
            ->get();

        $count = 0;
        foreach ($pendingStatuses as $status) {
            $employee = $status->employee;
            if (!$employee || !$employee->user || !$employee->user->email) {
                continue;
            }

            $createdDays = (int) $employee->created_at->diffInDays(now());

            // Thresholds: Day 3, Day 7, Day 14
            if (in_array($createdDays, [3, 7, 14])) {
                try {
                    Mail::to($employee->user->email)->send(new EmployeeOnboardingReminderMail($employee, $createdDays));
                    $count++;
                } catch (\Throwable $e) {
                    Log::error("Failed to send onboarding reminder to employee {$employee->id}: " . $e->getMessage());
                }
            }
        }

        $this->info("Successfully sent {$count} onboarding reminder email(s).");
        return 0;
    }
}
