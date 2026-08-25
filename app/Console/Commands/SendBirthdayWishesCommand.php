<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Workdo\Hrm\Models\Employee;
use App\Mail\EmployeeBirthdayMail;
use App\Models\User;

class SendBirthdayWishesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'hrm:send-birthday-wishes 
                            {--test= : Send a test birthday email to a specific email address}
                            {--employee_id= : Target a specific employee ID}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically check employee Date of Birth and send festive Birthday Holiday emails daily';

    /**
     * Apply SMTP settings dynamically from DB settings table
     */
    private function applyMailConfig()
    {
        try {
            $settings = DB::table('settings')->whereIn('key', [
                'email_host', 'email_port', 'email_username', 'email_password',
                'email_encryption', 'email_fromAddress', 'email_fromName'
            ])->pluck('value', 'key');

            if (isset($settings['email_host']) && !empty($settings['email_host'])) {
                $host = rtrim($settings['email_host'], '.');
                config([
                    'mail.default' => 'smtp',
                    'mail.mailers.smtp.transport' => 'smtp',
                    'mail.mailers.smtp.host' => $host,
                    'mail.mailers.smtp.port' => $settings['email_port'] ?? 587,
                    'mail.mailers.smtp.encryption' => $settings['email_encryption'] ?? 'tls',
                    'mail.mailers.smtp.username' => $settings['email_username'] ?? '',
                    'mail.mailers.smtp.password' => $settings['email_password'] ?? '',
                    'mail.from.address' => $settings['email_fromAddress'] ?? 'app.notify@dynime.com',
                    'mail.from.name' => $settings['email_fromName'] ?? 'Dynime',
                ]);
                Mail::purge('smtp');
            }
        } catch (\Exception $e) {
            $this->warn("⚠️ Could not load mail config from settings: " . $e->getMessage());
        }
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->applyMailConfig();

        $testEmail = $this->option('test');
        $employeeId = $this->option('employee_id');

        $this->info("🎂 Starting Birthday Wishes Automation...");

        // Case 1: Test Email Mode
        if ($testEmail) {
            $this->info("🧪 TEST MODE: Preparing test birthday email to: {$testEmail}");

            $employee = null;
            if ($employeeId) {
                $employee = Employee::find($employeeId);
            }

            if (!$employee) {
                // Try finding by user email
                $user = User::where('email', $testEmail)->first();
                if ($user) {
                    $employee = Employee::where('user_id', $user->id)->first();
                }
            }

            if (!$employee) {
                // Fallback to first active employee or mock
                $employee = Employee::with(['user', 'designation', 'department'])->first();
            }

            if (!$employee) {
                $this->error("❌ No employees found in system to send test email.");
                return 1;
            }

            try {
                Mail::to($testEmail)->send(new EmployeeBirthdayMail($employee, 'Dynime LLC'));
                $this->info("✅ Test Happy Birthday email successfully sent to {$testEmail}!");
                return 0;
            } catch (\Exception $e) {
                $this->error("❌ Failed to send test email: " . $e->getMessage());
                return 1;
            }
        }

        // Case 2: Daily Scheduled Mode
        $todayMonth = date('m');
        $todayDay = date('d');

        $query = Employee::with(['user', 'designation', 'department'])
            ->whereNotNull('date_of_birth');

        if ($employeeId) {
            $query->where('id', $employeeId);
        } else {
            $query->whereMonth('date_of_birth', $todayMonth)
                  ->whereDay('date_of_birth', $todayDay);
        }

        $birthdayEmployees = $query->get();

        if ($birthdayEmployees->isEmpty()) {
            $this->info("ℹ️ No employees celebrating birthdays today (" . date('M d') . ").");
            return 0;
        }

        $this->info("🎉 Found " . $birthdayEmployees->count() . " employee(s) celebrating a birthday today!");

        $sentCount = 0;

        foreach ($birthdayEmployees as $employee) {
            $recipientEmail = $employee->official_email;
            if (empty($recipientEmail) && $employee->user) {
                $recipientEmail = $employee->user->email;
            }

            if (empty($recipientEmail) || !filter_var($recipientEmail, FILTER_VALIDATE_EMAIL)) {
                $this->warn("⚠️ Skipping employee ID {$employee->id} - No valid email address found.");
                continue;
            }

            $empName = $employee->user ? $employee->user->name : "ID: {$employee->id}";

            try {
                Mail::to($recipientEmail)->send(new EmployeeBirthdayMail($employee, 'Dynime LLC'));
                $this->info("🎂 Birthday email sent to {$empName} ({$recipientEmail})");
                $sentCount++;
            } catch (\Exception $e) {
                $this->error("❌ Error sending to {$recipientEmail}: " . $e->getMessage());
            }
        }

        $this->info("✨ Completed! Total birthday emails delivered: {$sentCount}");
        return 0;
    }
}
