<?php

namespace Workdo\Hrm\Services;

use Workdo\Hrm\Models\Employee;
use Workdo\Hrm\Models\EmployeeOnboardingStatus;
use Workdo\Hrm\Models\EmployeeDevice;
use App\Models\User;
use App\Mail\EmployeeWelcomeMail;
use App\Mail\EmployeeOnboardingReminderMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class OnboardingService
{
    /**
     * Initialize onboarding status when HR creates a new employee account.
     */
    public static function initializeOnboarding(Employee $employee): EmployeeOnboardingStatus
    {
        $status = EmployeeOnboardingStatus::firstOrCreate(
            ['employee_id' => $employee->id],
            [
                'completion_percentage' => 0,
                'status' => 'not_started',
                'completed_sections' => [],
                'last_updated_at' => now(),
            ]
        );

        self::recalculatePercentage($employee);

        // Send Welcome Email & Bell Notification
        try {
            if ($employee->user && $employee->user->email) {
                Mail::to($employee->user->email)->send(new EmployeeWelcomeMail($employee));
            }
        } catch (\Throwable $e) {
            Log::error('Failed to send welcome onboarding email: ' . $e->getMessage());
        }

        return $status->fresh();
    }

    /**
     * Recalculate section-by-section completion percentage.
     */
    public static function recalculatePercentage(Employee $employee): array
    {
        $employee->loadMissing(['user', 'devices']);

        $sections = [
            'personal' => false,
            'contact' => false,
            'emergency' => false,
            'address' => false,
            'employment' => false,
            'bank' => false,
            'devices' => false,
            'photo' => false,
        ];

        // 1. Personal Information (15%)
        if (!empty($employee->date_of_birth) && !empty($employee->gender)) {
            $sections['personal'] = true;
        }

        // 2. Contact Information (10%)
        if (!empty($employee->official_email) || !empty($employee->whatsapp) || (!empty($employee->user) && !empty($employee->user->email))) {
            $sections['contact'] = true;
        }

        // 3. Emergency Contact (15%)
        if (!empty($employee->emergency_contact_name) && !empty($employee->emergency_contact_number)) {
            $sections['emergency'] = true;
        }

        // 4. Address (15%)
        if (!empty($employee->address_line_1) && !empty($employee->city) && !empty($employee->country)) {
            $sections['address'] = true;
        }

        // 5. Employment Information (10%)
        if (!empty($employee->date_of_joining) && !empty($employee->department_id)) {
            $sections['employment'] = true;
        }

        // 6. Bank Information (15%)
        if (!empty($employee->bank_name) && !empty($employee->account_number) && !empty($employee->account_holder_name)) {
            $sections['bank'] = true;
        }

        // 7. Device Configuration (15%)
        if ($employee->devices->count() > 0) {
            $sections['devices'] = true;
        }

        // 8. Profile Photo (5%)
        if (!empty($employee->user) && !empty($employee->user->avatar) && $employee->user->avatar !== 'avatar.png') {
            $sections['photo'] = true;
        }

        $weights = [
            'personal' => 15,
            'contact' => 10,
            'emergency' => 15,
            'address' => 15,
            'employment' => 10,
            'bank' => 15,
            'devices' => 15,
            'photo' => 5,
        ];

        $totalPercentage = 0;
        $completedList = [];

        foreach ($sections as $key => $isComplete) {
            if ($isComplete) {
                $totalPercentage += $weights[$key];
                $completedList[] = $key;
            }
        }

        $totalPercentage = min(100, $totalPercentage);

        $statusStr = 'not_started';
        $completedAt = null;

        if ($totalPercentage === 100) {
            $statusStr = 'completed';
            $completedAt = now();
        } elseif ($totalPercentage > 0) {
            $statusStr = 'in_progress';
        }

        $status = EmployeeOnboardingStatus::updateOrCreate(
            ['employee_id' => $employee->id],
            [
                'completion_percentage' => $totalPercentage,
                'status' => $statusStr,
                'completed_sections' => $completedList,
                'last_updated_at' => now(),
                'completed_at' => $completedAt,
            ]
        );

        return [
            'percentage' => $totalPercentage,
            'status' => $statusStr,
            'sections' => $sections,
            'completed_sections' => $completedList,
            'onboarding_status' => $status,
        ];
    }

    /**
     * Save specific wizard step data and update completion status.
     */
    public static function saveStepData(Employee $employee, string $step, array $data): array
    {
        switch ($step) {
            case 'personal':
                $employee->update([
                    'date_of_birth' => $data['date_of_birth'] ?? $employee->date_of_birth,
                    'gender' => $data['gender'] ?? $employee->gender,
                ]);
                if (!empty($data['name']) && $employee->user) {
                    $employee->user->update(['name' => $data['name']]);
                }
                break;

            case 'contact':
                $employee->update([
                    'official_email' => $data['official_email'] ?? $employee->official_email,
                    'whatsapp' => $data['whatsapp'] ?? $employee->whatsapp,
                ]);
                break;

            case 'emergency':
                $employee->update([
                    'emergency_contact_name' => $data['emergency_contact_name'] ?? $employee->emergency_contact_name,
                    'emergency_contact_relationship' => $data['emergency_contact_relationship'] ?? $employee->emergency_contact_relationship,
                    'emergency_contact_number' => $data['emergency_contact_number'] ?? $employee->emergency_contact_number,
                ]);
                break;

            case 'address':
                $employee->update([
                    'address_line_1' => $data['address_line_1'] ?? $employee->address_line_1,
                    'address_line_2' => $data['address_line_2'] ?? $employee->address_line_2,
                    'city' => $data['city'] ?? $employee->city,
                    'state' => $data['state'] ?? $employee->state,
                    'country' => $data['country'] ?? $employee->country,
                    'postal_code' => $data['postal_code'] ?? $employee->postal_code,
                ]);
                break;

            case 'bank':
                $employee->update([
                    'bank_name' => $data['bank_name'] ?? $employee->bank_name,
                    'account_holder_name' => $data['account_holder_name'] ?? $employee->account_holder_name,
                    'account_number' => $data['account_number'] ?? $employee->account_number,
                    'bank_identifier_code' => $data['bank_identifier_code'] ?? $employee->bank_identifier_code,
                    'bank_branch' => $data['bank_branch'] ?? $employee->bank_branch,
                    'bank_country' => $data['bank_country'] ?? $employee->bank_country,
                    'bank_notes' => $data['bank_notes'] ?? $employee->bank_notes,
                ]);
                break;

            case 'devices':
                if (isset($data['devices']) && is_array($data['devices'])) {
                    // Refresh employee devices
                    EmployeeDevice::where('employee_id', $employee->id)->delete();
                    foreach ($data['devices'] as $d) {
                        EmployeeDevice::create([
                            'employee_id' => $employee->id,
                            'device_ownership' => $d['device_ownership'] ?? 'byod',
                            'device_category' => $d['device_category'] ?? 'desktop_laptop',
                            'purchase_month_year' => $d['purchase_month_year'] ?? null,
                            'device_name' => $d['device_name'] ?? null,
                            'brand' => $d['brand'] ?? null,
                            'model' => $d['model'] ?? null,
                            'serial_number' => $d['serial_number'] ?? null,
                            'imei' => $d['imei'] ?? null,
                            'mobile_number' => $d['mobile_number'] ?? null,
                            'operating_system' => $d['operating_system'] ?? null,
                            'os_version' => $d['os_version'] ?? null,
                            'notes' => $d['notes'] ?? null,
                        ]);
                    }
                }
                break;
        }

        return self::recalculatePercentage($employee);
    }
}
