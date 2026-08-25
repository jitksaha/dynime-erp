<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CustomResetPassword extends Notification
{
    use Queueable;

    /**
     * The password reset token.
     *
     * @var string
     */
    public string $token;

    /**
     * Create a notification instance.
     *
     * @param string $token
     */
    public function __construct(string $token)
    {
        $this->token = $token;
    }

    /**
     * Get the notification's channels.
     *
     * @param mixed $notifiable
     * @return array
     */
    public function via($notifiable): array
    {
        return ['mail'];
    }

    /**
     * Build the mail representation of the notification.
     *
     * @param mixed $notifiable
     * @return MailMessage
     */
    public function toMail($notifiable): MailMessage
    {
        $url = url(route('password.reset', [
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ], false));

        $fromAddress = config('mail.from.address', 'app.notify@dynime.com');
        $fromName = config('mail.from.name', 'Dynime App');

        return (new MailMessage)
            ->from($fromAddress, $fromName)
            ->subject('Password reset for dynime app account')
            ->greeting('Hello ' . ($notifiable->name ?? '') . ',')
            ->line('You are receiving this email because we received a password reset request for your Dynime App account.')
            ->action('Reset Password', $url)
            ->line('This password reset link will expire in ' . config('auth.passwords.'.config('auth.defaults.passwords').'.expire', 60) . ' minutes.')
            ->line('If you did not request a password reset, no further action is required.')
            ->salutation("Regards,\nDynime App Team");
    }
}
