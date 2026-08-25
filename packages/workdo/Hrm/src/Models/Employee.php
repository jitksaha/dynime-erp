<?php

namespace Workdo\Hrm\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\User;
use Workdo\Hrm\Models\Branch;
use Workdo\Hrm\Models\Department;
use Workdo\Hrm\Models\Designation;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'official_email',
        'whatsapp',
        'roles_responsibilities',
        'is_verified',
        'date_of_birth',
        'gender',
        'shift_id',
        'date_of_joining',
        'employment_type',
        'employment_status',
        'probation_percentage',
        'probation_period',
        'work_mode',
        'work_location_country',
        'address_line_1',
        'address_line_2',
        'city',
        'state',
        'country',
        'postal_code',
        'emergency_contact_name',
        'emergency_contact_relationship',
        'emergency_contact_number',
        'bank_name',
        'account_holder_name',
        'account_number',
        'bank_identifier_code',
        'bank_branch',
        'bank_country',
        'bank_notes',
        'tax_payer_id',
        'basic_salary',
        'salary_type',
        'hours_per_day',
        'days_per_week',
        'rate_per_hour',
        'user_id',
        'manager_id',
        'branch_id',
        'additional_branch_ids',
        'department_id',
        'designation_id',
        'creator_id',
        'created_by',
        'payment_method',
        'payment_details',
        'timezone',
        'is_flexible_shift_allowed',
        'current_shift_type',
        'flexible_shift_status',
    ];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'date_of_joining' => 'date',
            'payment_details' => 'array',
            'additional_branch_ids' => 'array',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function manager()
    {
        return $this->belongsTo(Employee::class, 'manager_id');
    }

    public function subordinates()
    {
        return $this->hasMany(Employee::class, 'manager_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function designation()
    {
        return $this->belongsTo(Designation::class);
    }

    public function shift()
    {
        return $this->belongsTo(Shift::class, 'shift', 'id');
    }

    public function onboardingStatus()
    {
        return $this->hasOne(EmployeeOnboardingStatus::class, 'employee_id');
    }

    public function devices()
    {
        return $this->hasMany(EmployeeDevice::class, 'employee_id');
    }

    public static function generateEmployeeId()
    {
        $prefix = 'EMP';
        $year = date('Y');
        $lastEmployee = self::where('employee_id', 'like', $prefix . $year . '%')
            ->orderBy('employee_id', 'desc')
            ->first();

        if ($lastEmployee) {
            $lastNumber = (int) substr($lastEmployee->employee_id, -4);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return $prefix . $year . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }

    public function getEffectiveTimezoneAttribute()
    {
        $country = trim($this->work_location_country ?? $this->country ?? '');
        if (empty($country) && $this->user) {
            $country = trim($this->user->country ?? '');
        }

        if (!empty($country)) {
            $tzMap = [
                'AFGHANISTAN' => 'Asia/Kabul',
                'ALBANIA' => 'Europe/Tirana',
                'ALGERIA' => 'Africa/Algiers',
                'ANDORRA' => 'Europe/Andorra',
                'ANGOLA' => 'Africa/Luanda',
                'ARGENTINA' => 'America/Argentina/Buenos_Aires',
                'ARMENIA' => 'Asia/Yerevan',
                'AUSTRALIA' => 'Australia/Sydney',
                'AUSTRIA' => 'Europe/Vienna',
                'AZERBAIJAN' => 'Asia/Baku',
                'BAHAMAS' => 'America/Nassau',
                'BAHRAIN' => 'Asia/Bahrain',
                'BANGLADESH' => 'Asia/Dhaka',
                'BARBADOS' => 'America/Barbados',
                'BELARUS' => 'Europe/Minsk',
                'BELGIUM' => 'Europe/Brussels',
                'BELIZE' => 'America/Belize',
                'BENIN' => 'Africa/Porto-Novo',
                'BHUTAN' => 'Asia/Thimphu',
                'BOLIVIA' => 'America/La_Paz',
                'BOSNIA AND HERZEGOVINA' => 'Europe/Sarajevo',
                'BRAZIL' => 'America/Sao_Paulo',
                'BRUNEI' => 'Asia/Brunei',
                'BULGARIA' => 'Europe/Sofia',
                'CAMBODIA' => 'Asia/Phnom_Penh',
                'CAMEROON' => 'Africa/Douala',
                'CANADA' => 'America/Toronto',
                'CHILE' => 'America/Santiago',
                'CHINA' => 'Asia/Shanghai',
                'COLOMBIA' => 'America/Bogota',
                'COSTA RICA' => 'America/Costa_Rica',
                'CROATIA' => 'Europe/Zagreb',
                'CUBA' => 'America/Havana',
                'CYPRUS' => 'Asia/Nicosia',
                'CZECH REPUBLIC' => 'Europe/Prague',
                'DENMARK' => 'Europe/Copenhagen',
                'DOMINICAN REPUBLIC' => 'America/Santo_Domingo',
                'ECUADOR' => 'America/Guayaquil',
                'EGYPT' => 'Africa/Cairo',
                'EL SALVADOR' => 'America/El_Salvador',
                'ESTONIA' => 'Europe/Tallinn',
                'ETHIOPIA' => 'Africa/Addis_Ababa',
                'FIJI' => 'Pacific/Fiji',
                'FINLAND' => 'Europe/Helsinki',
                'FRANCE' => 'Europe/Paris',
                'GEORGIA' => 'Asia/Tbilisi',
                'GERMANY' => 'Europe/Berlin',
                'GHANA' => 'Africa/Accra',
                'GREECE' => 'Europe/Athens',
                'GUATEMALA' => 'America/Guatemala',
                'HAITI' => 'America/Port-au-Prince',
                'HONDURAS' => 'America/Tegucigalpa',
                'HONG KONG' => 'Asia/Hong_Kong',
                'HUNGARY' => 'Europe/Budapest',
                'ICELAND' => 'Atlantic/Reykjavik',
                'INDIA' => 'Asia/Kolkata',
                'INDONESIA' => 'Asia/Jakarta',
                'IRAN' => 'Asia/Tehran',
                'IRAQ' => 'Asia/Baghdad',
                'IRELAND' => 'Europe/Dublin',
                'ISRAEL' => 'Asia/Jerusalem',
                'ITALY' => 'Europe/Rome',
                'JAMAICA' => 'America/Jamaica',
                'JAPAN' => 'Asia/Tokyo',
                'JORDAN' => 'Asia/Amman',
                'KAZAKHSTAN' => 'Asia/Almaty',
                'KENYA' => 'Africa/Nairobi',
                'KUWAIT' => 'Asia/Kuwait',
                'KYRGYZSTAN' => 'Asia/Bishkek',
                'LAOS' => 'Asia/Vientiane',
                'LATVIA' => 'Europe/Riga',
                'LEBANON' => 'Asia/Beirut',
                'LITHUANIA' => 'Europe/Vilnius',
                'LUXEMBOURG' => 'Europe/Luxembourg',
                'MADAGASCAR' => 'Indian/Antananarivo',
                'MALAYSIA' => 'Asia/Kuala_Lumpur',
                'MALDIVES' => 'Indian/Maldives',
                'MALTA' => 'Europe/Malta',
                'MEXICO' => 'America/Mexico_City',
                'MOLDOVA' => 'Europe/Chisinau',
                'MONACO' => 'Europe/Monaco',
                'MONGOLIA' => 'Asia/Ulaanbaatar',
                'MONTENEGRO' => 'Europe/Podgorica',
                'MOROCCO' => 'Africa/Casablanca',
                'MOZAMBIQUE' => 'Africa/Maputo',
                'MYANMAR' => 'Asia/Yangon',
                'NAMIBIA' => 'Africa/Windhoek',
                'NEPAL' => 'Asia/Kathmandu',
                'NETHERLANDS' => 'Europe/Amsterdam',
                'NEW ZEALAND' => 'Pacific/Auckland',
                'NICARAGUA' => 'America/Managua',
                'NIGERIA' => 'Africa/Lagos',
                'NORTH MACEDONIA' => 'Europe/Skopje',
                'NORWAY' => 'Europe/Oslo',
                'OMAN' => 'Asia/Muscat',
                'PAKISTAN' => 'Asia/Karachi',
                'PALESTINE' => 'Asia/Gaza',
                'PANAMA' => 'America/Panama',
                'PARAGUAY' => 'America/Asuncion',
                'PERU' => 'America/Lima',
                'PHILIPPINES' => 'Asia/Manila',
                'POLAND' => 'Europe/Warsaw',
                'PORTUGAL' => 'Europe/Lisbon',
                'QATAR' => 'Asia/Qatar',
                'ROMANIA' => 'Europe/Bucharest',
                'RUSSIA' => 'Europe/Moscow',
                'SAUDI ARABIA' => 'Asia/Riyadh',
                'SENEGAL' => 'Africa/Dakar',
                'SERBIA' => 'Europe/Belgrade',
                'SINGAPORE' => 'Asia/Singapore',
                'SLOVAKIA' => 'Europe/Bratislava',
                'SLOVENIA' => 'Europe/Ljubljana',
                'SOUTH AFRICA' => 'Africa/Johannesburg',
                'SOUTH KOREA' => 'Asia/Seoul',
                'SPAIN' => 'Europe/Madrid',
                'SRI LANKA' => 'Asia/Colombo',
                'SWEDEN' => 'Europe/Stockholm',
                'SWITZERLAND' => 'Europe/Zurich',
                'TAIWAN' => 'Asia/Taipei',
                'TANZANIA' => 'Africa/Dar_es_Salaam',
                'THAILAND' => 'Asia/Bangkok',
                'TUNISIA' => 'Africa/Tunis',
                'TURKEY' => 'Europe/Istanbul',
                'TURKIYE' => 'Europe/Istanbul',
                'UGANDA' => 'Africa/Kampala',
                'UKRAINE' => 'Europe/Kyiv',
                'UNITED ARAB EMIRATES' => 'Asia/Dubai',
                'UAE' => 'Asia/Dubai',
                'UNITED KINGDOM' => 'Europe/London',
                'UK' => 'Europe/London',
                'GREAT BRITAIN' => 'Europe/London',
                'ENGLAND' => 'Europe/London',
                'UNITED STATES' => 'America/Denver',
                'USA' => 'America/Denver',
                'US' => 'America/Denver',
                'URUGUAY' => 'America/Montevideo',
                'UZBEKISTAN' => 'Asia/Tashkent',
                'VENEZUELA' => 'America/Caracas',
                'VIETNAM' => 'Asia/Ho_Chi_Minh',
                'ZAMBIA' => 'Africa/Lusaka',
                'ZIMBABWE' => 'Africa/Harare',
                'BD' => 'Asia/Dhaka',
                'IN' => 'Asia/Kolkata',
                'PK' => 'Asia/Karachi',
                'SA' => 'Asia/Riyadh',
                'QA' => 'Asia/Qatar',
                'KW' => 'Asia/Kuwait',
                'AE' => 'Asia/Dubai',
                'NG' => 'Africa/Lagos',
            ];

            $cUpper = strtoupper($country);
            if (isset($tzMap[$cUpper])) {
                return $tzMap[$cUpper];
            }

            foreach ($tzMap as $name => $tz) {
                if (str_contains($cUpper, $name) || str_contains($name, $cUpper)) {
                    return $tz;
                }
            }
        }

        if (!empty($this->timezone) && $this->timezone !== 'America/Denver') {
            return $this->timezone;
        }

        $companySettings = getCompanyAllSetting($this->created_by ?? creatorId());
        return $companySettings['company_timezone'] ?? 'America/Denver';
    }

    public function getCountryWeekendDaysAttribute()
    {
        $country = strtolower(trim($this->country ?? $this->work_location_country ?? ''));
        
        $companySettings = getCompanyAllSetting($this->created_by ?? creatorId());
        if (!empty($companySettings['company_weekend_schedule'])) {
            $schedule = is_array($companySettings['company_weekend_schedule'])
                ? $companySettings['company_weekend_schedule']
                : json_decode($companySettings['company_weekend_schedule'], true);

            if (is_array($schedule)) {
                $matchedDays = [];
                foreach ($schedule as $dayIndex => $countries) {
                    if (is_array($countries)) {
                        foreach ($countries as $c) {
                            $cClean = strtolower(trim($c));
                            if (!empty($cClean) && !empty($country) && (str_contains($country, $cClean) || str_contains($cClean, $country))) {
                                $matchedDays[] = (int)$dayIndex;
                                break;
                            }
                        }
                    }
                }
                if (!empty($matchedDays)) {
                    sort($matchedDays);
                    return array_values(array_unique($matchedDays));
                }
            }
        }

        // Fallback default rules if no custom company_weekend_schedule is set:
        if (str_contains($country, 'bangladesh') || $country === 'bd') {
            return [5, 6]; // Friday (5) & Saturday (6) for Bangladesh
        } elseif (str_contains($country, 'emirates') || str_contains($country, 'uae') || str_contains($country, 'saudi') || str_contains($country, 'qatar') || str_contains($country, 'kuwait') || str_contains($country, 'bahrain')) {
            return [5, 6]; // Friday (5) & Saturday (6) for Middle East countries
        } elseif (str_contains($country, 'united states') || str_contains($country, 'usa') || $country === 'us') {
            return [0, 6]; // Sunday (0) & Saturday (6) for USA
        }

        return [0]; // Sunday (0) for all other countries
    }
}
