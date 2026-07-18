<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\User;

class SendOfficialEmailCredentialsMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $officialEmail;
    public $password;

    /**
     * Create a new message instance.
     */
    public function __construct(User $user, string $officialEmail, string $password)
    {
        $this->user = $user;
        $this->officialEmail = $officialEmail;
        $this->password = $password;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->subject('Your Official Email Account is Ready - Dynime')
                    ->view('emails.official_email_credentials');
    }
}
