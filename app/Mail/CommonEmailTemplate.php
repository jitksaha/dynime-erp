<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CommonEmailTemplate extends Mailable
{
    use Queueable, SerializesModels;
    public $template;
    public $user_id;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($template, $user_id)
    {
        $this->template = $template;
        $this->user_id = $user_id;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        $fromAddress = company_setting('email_fromAddress', $this->user_id) ?: config('mail.from.address', 'contact@dynime.com');
        $fromName = company_setting('email_fromName', $this->user_id) ?: $this->template->from ?: config('mail.from.name', 'Dynime');
        $replyTo = company_setting('email_replyTo', $this->user_id);

        $mail = $this->from($fromAddress, $fromName)
                    ->markdown('emails.common_email_template')
                    ->subject($this->template->subject)
                    ->with('content', $this->template->content);

        if (!empty($replyTo)) {
            $mail->replyTo($replyTo, $fromName);
        }

        return $mail;
    }
}
