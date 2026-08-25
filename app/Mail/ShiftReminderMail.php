<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ShiftReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $headline;
    public string $messageText;
    public string $userName;
    public string $employeeId;
    public string $designation;
    public string $officialEmail;
    public string $userAvatar;
    public string $compTime;
    public string $utcTime;
    public string $shiftUtc;
    public string $empTime;
    public string $empTimezone;
    public string $country;
    public string $offDaysText;

    /**
     * Create a new message instance.
     */
    public function __construct(array $data)
    {
        $this->headline = $data['headline'] ?? 'Dtime Trace Shift Notification';
        $this->messageText = $data['messageText'] ?? 'Your working time shift schedule is starting.';
        $this->userName = $data['userName'] ?? 'Employee';
        $this->employeeId = $data['employeeId'] ?? 'EMP-0001';
        $this->designation = $data['designation'] ?? 'Staff Member';
        $this->officialEmail = $data['officialEmail'] ?? '';
        $this->userAvatar = $data['userAvatar'] ?? '';
        $this->compTime = $data['compTime'] ?? '09:00 AM';
        $this->utcTime = $data['utcTime'] ?? '08:00 AM';
        $this->shiftUtc = $data['shiftUtc'] ?? '08:00 AM – 05:00 PM UTC';
        $this->empTime = $data['empTime'] ?? '09:00 AM';
        $this->empTimezone = $data['empTimezone'] ?? 'America/Denver';
        $this->country = $data['country'] ?? 'USA';
        $this->offDaysText = $data['offDaysText'] ?? 'Sun';
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '⏱️ ' . $this->headline . ' | Dtime Trace (Beta Phase)',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.shift_reminder',
        );
    }
}
