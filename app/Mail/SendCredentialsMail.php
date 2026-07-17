<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\User;

class SendCredentialsMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $password;
    public $loginUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(User $user, string $password)
    {
        $this->user = $user;
        $this->password = $password;
        $this->loginUrl = route('login');
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->subject('Welcome to Dynime - Your Login Credentials')
                    ->view('emails.credentials');
    }
}
