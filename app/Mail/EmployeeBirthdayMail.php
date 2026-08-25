<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Workdo\Hrm\Models\Employee;

class EmployeeBirthdayMail extends Mailable
{
    use Queueable, SerializesModels;

    public $employee;
    public $employeeName;
    public $designationName;
    public $departmentName;
    public $companyName;

    /**
     * Create a new message instance.
     */
    public function __construct(Employee $employee, string $companyName = 'Dynime LLC')
    {
        $this->employee = $employee;
        $this->companyName = $companyName;
        $this->employeeName = $employee->user ? $employee->user->name : 'Valued Team Member';
        $this->designationName = $employee->designation ? ($employee->designation->designation_name ?? $employee->designation->name ?? '') : '';
        $this->departmentName = $employee->department ? ($employee->department->department_name ?? $employee->department->name ?? '') : '';
    }

    /**
     * Build the message.
     */
    public function build()
    {
        $subject = "🎂 Happy Birthday, " . $this->employeeName . "! Enjoy Your Special Birthday Holiday! 🎉";

        $mailable = $this->subject($subject)
                         ->view('emails.employee_birthday');

        // CC official company/HR email if set
        $officialEmail = env('OFFICIAL_HR_EMAIL', env('MAIL_FROM_ADDRESS', 'hr@dynime.com'));
        if ($officialEmail && filter_var($officialEmail, FILTER_VALIDATE_EMAIL)) {
            $mailable->cc($officialEmail);
        }

        return $mailable;
    }
}
