<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetLinkController extends Controller
{
    /**
     * Display the password reset link request view.
     */
    public function create(): Response
    {
        return Inertia::render('auth/forgot-password', [
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming password reset link request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        try {
            // Apply dynamic mail configuration safely
            $adminUser = User::where('type', 'superadmin')->first();
            if ($adminUser) {
                SetConfigEmail($adminUser->id);
            }

            // Send password reset link
            $status = Password::sendResetLink(
                $request->only('email')
            );

            if ($status == Password::RESET_LINK_SENT) {
                return back()->with('status', __($status));
            }

            return back()->withErrors(['email' => __($status)]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Password Reset Mail Error: ' . $e->getMessage());
            return back()->withErrors(['email' => __('Failed to send password reset email: ') . $e->getMessage()]);
        }
    }
}
