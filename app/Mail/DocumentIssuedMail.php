<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\User;
use Workdo\Hrm\Models\IssuedDocument;

class DocumentIssuedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $issuedDoc;
    public $documentName;
    public $signUrl;
    public $issuedDate;

    /**
     * Create a new message instance.
     */
    public function __construct(User $user, IssuedDocument $issuedDoc, string $signUrl)
    {
        $this->user = $user;
        $this->issuedDoc = $issuedDoc;
        $this->signUrl = $signUrl;
        
        $type = $issuedDoc->document_type;
        $formatted = ucwords(str_replace(['_', '-'], ' ', $type));
        $this->documentName = $formatted;

        if ($issuedDoc->issued_date) {
            if (is_string($issuedDoc->issued_date)) {
                $this->issuedDate = date('d M Y', strtotime($issuedDoc->issued_date));
            } elseif ($issuedDoc->issued_date instanceof \DateTimeInterface) {
                $this->issuedDate = $issuedDoc->issued_date->format('d M Y');
            } else {
                $this->issuedDate = date('d M Y');
            }
        } else {
            $this->issuedDate = date('d M Y');
        }
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->subject('HR Document Issued: ' . $this->documentName . ' - Dynime')
                    ->view('emails.document_issued');
    }
}
