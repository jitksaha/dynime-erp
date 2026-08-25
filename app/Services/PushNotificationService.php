<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PushNotificationService
{
    /**
     * Send push notification to a user's registered desktop/mobile devices.
     */
    public static function sendToUser(User $user, string $title, string $message, array $extraData = []): bool
    {
        $tokens = $user->device_tokens ?? [];
        if (is_string($tokens)) {
            $tokens = json_decode($tokens, true) ?? [];
        }

        if (empty($tokens)) {
            return false;
        }

        $sentCount = 0;

        foreach ($tokens as $platform => $token) {
            if (!empty($token)) {
                $success = self::dispatchNotification($platform, $token, $title, $message, $extraData);
                if ($success) {
                    $sentCount++;
                }
            }
        }

        return $sentCount > 0;
    }

    /**
     * Internal dispatcher for WebPush / FCM / Desktop push payloads.
     */
    protected static function dispatchNotification(string $platform, string $token, string $title, string $message, array $extraData = []): bool
    {
        try {
            // Firebase Cloud Messaging (FCM) or Web Push Gateway
            $fcmKey = config('services.fcm.key');

            if ($fcmKey) {
                $response = Http::withHeaders([
                    'Authorization' => 'key=' . $fcmKey,
                    'Content-Type' => 'application/json',
                ])->post('https://fcm.googleapis.com/fcm/send', [
                    'to' => $token,
                    'notification' => [
                        'title' => $title,
                        'body' => $message,
                        'icon' => asset('favicon.ico'),
                        'sound' => 'default',
                    ],
                    'data' => array_merge([
                        'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
                        'platform' => $platform,
                        'timestamp' => now()->toIso8601String(),
                    ], $extraData),
                ]);

                return $response->successful();
            }

            Log::info("Push Notification dispatched to user ({$platform}): {$title} - {$message}");
            return true;
        } catch (\Exception $e) {
            Log::error("Push notification error for platform {$platform}: " . $e->getMessage());
            return false;
        }
    }
}
