<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Workdo\Hrm\Models\Employee;

class EmployeeOnboardingReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public $employee;
    public $days;

    public function __construct(Employee $employee, int $days = 3)
    {
        $this->employee = $employee;
        $this->days = $days;
    }

    public function build()
    {
        return $this->subject('Reminder: Action Required - Complete Your Dynime ERP Employee Profile')
                    ->view('emails.employee_onboarding_reminder');
    }
}
