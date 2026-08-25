<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Workdo\Hrm\Models\Employee;

class EmployeeWelcomeMail extends Mailable
{
    use Queueable, SerializesModels;

    public $employee;

    public function __construct(Employee $employee)
    {
        $this->employee = $employee;
    }

    public function build()
    {
        return $this->subject('Welcome to Dynime ERP - Complete Your Employee Profile')
                    ->view('emails.employee_welcome');
    }
}
