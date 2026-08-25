<?php

namespace Workdo\Hrm\Services;

use Carbon\Carbon;
use DateTimeZone;
use Workdo\Hrm\Models\Shift;

class ShiftCalculator
{
    /**
     * List of major supported global timezones for IANA selector
     */
    public static function getSupportedTimezones(): array
    {
        return [
            'America/Denver' => 'Mountain Time (MT - Denver, USA)',
            'America/New_York' => 'Eastern Time (ET - New York, USA)',
            'America/Chicago' => 'Central Time (CT - Chicago, USA)',
            'America/Los_Angeles' => 'Pacific Time (PT - Los Angeles, USA)',
            'Europe/London' => 'Greenwich Mean Time (GMT - London, UK)',
            'Europe/Paris' => 'Central European Time (CET - Paris, France)',
            'Europe/Berlin' => 'Central European Time (CET - Berlin, Germany)',
            'Asia/Dhaka' => 'Bangladesh Standard Time (BST - Dhaka, BD)',
            'Asia/Dubai' => 'Gulf Standard Time (GST - Dubai, UAE)',
            'Asia/Kolkata' => 'India Standard Time (IST - Kolkata, IN)',
            'Asia/Singapore' => 'Singapore Time (SGT - Singapore)',
            'Asia/Tokyo' => 'Japan Standard Time (JST - Tokyo, JP)',
            'Australia/Sydney' => 'Australian Eastern Time (AEST - Sydney, AU)',
            'UTC' => 'Universal Coordinated Time (UTC+0)',
        ];
    }

    /**
     * Auto detect if shift crosses midnight (e.g. 10:00 PM to 06:00 AM)
     */
    public static function detectCrossMidnight(?string $startTime, ?string $endTime): bool
    {
        if (!$startTime || !$endTime) return false;
        try {
            $start = Carbon::createFromTimeString($startTime);
            $end = Carbon::createFromTimeString($endTime);
            return $end->lt($start);
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Auto detect night shift (if shift works predominantly between 08:00 PM and 06:00 AM)
     */
    public static function detectNightShift(?string $startTime, ?string $endTime): bool
    {
        if (!$startTime || !$endTime) return false;
        try {
            $isCross = self::detectCrossMidnight($startTime, $endTime);
            if ($isCross) return true;

            $start = Carbon::createFromTimeString($startTime);
            $startHour = (int)$start->format('H');
            return $startHour >= 20 || $startHour < 6;
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Calculate total shift hours and net working hours after deducting unpaid breaks
     */
    public static function calculateHours(?string $startTime, ?string $endTime, array $breaks = []): array
    {
        if (!$startTime || !$endTime) {
            return [
                'total_shift_hours' => 8.0,
                'unpaid_break_hours' => 1.0,
                'net_working_hours' => 7.0,
            ];
        }

        try {
            $start = Carbon::createFromTimeString($startTime);
            $end = Carbon::createFromTimeString($endTime);
            if ($end->lt($start)) {
                $end->addDay();
            }

            $diffSecs = $end->diffInSeconds($start);
            $totalShiftHours = round($diffSecs / 3600, 2);

            $unpaidBreakMins = 0;
            foreach ($breaks as $b) {
                $type = $b['break_type'] ?? 'unpaid';
                $mins = (int)($b['duration_mins'] ?? 0);
                if ($type === 'unpaid') {
                    $unpaidBreakMins += $mins;
                }
            }

            $unpaidBreakHours = round($unpaidBreakMins / 60, 2);
            $netWorkingHours = max(0, round($totalShiftHours - $unpaidBreakHours, 2));

            return [
                'total_shift_hours' => $totalShiftHours,
                'unpaid_break_hours' => $unpaidBreakHours,
                'net_working_hours' => $netWorkingHours,
            ];
        } catch (\Throwable $e) {
            return [
                'total_shift_hours' => 8.0,
                'unpaid_break_hours' => 1.0,
                'net_working_hours' => 7.0,
            ];
        }
    }

    /**
     * Convert timestamp from Employee Timezone to UTC
     */
    public static function convertLocalToUTC(string $localTimeStr, string $timezoneStr): string
    {
        try {
            return Carbon::parse($localTimeStr, $timezoneStr)->setTimezone('UTC')->toIso8601String();
        } catch (\Throwable $e) {
            return Carbon::now('UTC')->toIso8601String();
        }
    }

    /**
     * Convert timestamp from UTC to Target Timezone
     */
    public static function convertUTCToLocal(string $utcTimeStr, string $timezoneStr): string
    {
        try {
            return Carbon::parse($utcTimeStr, 'UTC')->setTimezone($timezoneStr)->format('h:i:s A');
        } catch (\Throwable $e) {
            return $utcTimeStr;
        }
    }

    /**
     * Get supported timezones enriched with UTC offset, abbreviation, and current local time.
     * Used by the frontend timezone selector and table display.
     */
    public static function getTimezoneWithInfo(): array
    {
        $labels = self::getSupportedTimezones();
        $result = [];

        foreach ($labels as $iana => $label) {
            try {
                $now = Carbon::now($iana);
                $result[$iana] = [
                    'iana'         => $iana,
                    'label'        => $label,
                    'utc_offset'   => 'UTC' . $now->format('P'),
                    'abbreviation' => $now->format('T'),
                    'local_time'   => $now->format('h:i A'),
                    'local_date'   => $now->format('M d, Y'),
                ];
            } catch (\Throwable $e) {
                $result[$iana] = [
                    'iana'         => $iana,
                    'label'        => $label,
                    'utc_offset'   => 'UTC+00:00',
                    'abbreviation' => '?',
                    'local_time'   => '--:--',
                    'local_date'   => '--',
                ];
            }
        }

        return $result;
    }
}
