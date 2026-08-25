<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

// Automated Daily HRMS Birthday Wishes Scheduler
Schedule::command('hrm:send-birthday-wishes')->dailyAt('08:00');

// Automated Daily Screenshots Cleanup
Schedule::command('attendance:cleanup-screenshots')->daily();

// Shift Notifications & Email Reminders (Runs every minute to check worldwide employee timezones)
Schedule::command('time-tracker:send-shift-notifications')->everyMinute();

// Employee Onboarding Profile Completion Reminders
Schedule::command('hrm:send-onboarding-reminders')->dailyAt('09:30');
