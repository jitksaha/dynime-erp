import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Globe, Calendar, Save, Building2, ShieldCheck, Plus, X, Search, Zap, RefreshCw, Utensils } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { router } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { WORLDWIDE_COUNTRIES, SearchableCountrySelect } from '@/components/ui/searchable-country-select';
import { TimePicker } from '@/components/ui/time-picker';

interface TimezoneDutySettingsProps {
  userSettings?: Record<string, string>;
  auth?: any;
}

const TIMEZONE_OPTIONS = [
  { value: 'America/Denver', label: 'America/Denver (Mountain Time - USA Base)' },
  { value: 'America/New_York', label: 'America/New_York (Eastern Time - USA)' },
  { value: 'America/Chicago', label: 'America/Chicago (Central Time - USA)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (Pacific Time - USA)' },
  { value: 'Asia/Dhaka', label: 'Asia/Dhaka (Bangladesh Standard Time - GMT+6)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (Gulf Standard Time - GMT+4)' },
  { value: 'Asia/Riyadh', label: 'Asia/Riyadh (Saudi Arabia - GMT+3)' },
  { value: 'Europe/London', label: 'Europe/London (Greenwich Mean Time - UK)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (Central European Time - EU)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (India Standard Time - GMT+5:30)' },
  { value: 'Asia/Kathmandu', label: 'Asia/Kathmandu (Nepal Time - GMT+5:45)' },
  { value: 'UTC', label: 'Universal Time Coordinated (UTC+0)' },
];

const DAYS_OF_WEEK = [
  { key: '0', name: 'Sunday', color: 'bg-rose-50 border-rose-200 text-rose-700' },
  { key: '1', name: 'Monday', color: 'bg-slate-50 border-slate-200 text-slate-700' },
  { key: '2', name: 'Tuesday', color: 'bg-slate-50 border-slate-200 text-slate-700' },
  { key: '3', name: 'Wednesday', color: 'bg-slate-50 border-slate-200 text-slate-700' },
  { key: '4', name: 'Thursday', color: 'bg-slate-50 border-slate-200 text-slate-700' },
  { key: '5', name: 'Friday', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { key: '6', name: 'Saturday', color: 'bg-purple-50 border-purple-200 text-purple-700' },
];

// All countries worldwide
const ALL_COUNTRY_NAMES = WORLDWIDE_COUNTRIES.map((c) => c.name);

// Preset 1: Full Global Standard Weekly Holiday List (195 Countries)
const GLOBAL_195_HOLIDAY_PRESET: Record<string, string[]> = {
  '0': [
    'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
    'Bahamas', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana',
    'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic',
    'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', "Côte d'Ivoire", 'Croatia', 'Cuba', 'Cyprus',
    'Czech Republic', 'Democratic Republic of the Congo', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt',
    'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon',
    'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti',
    'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iraq', 'Ireland', 'Italy', 'Jamaica', 'Japan', 'Jordan',
    'Kazakhstan', 'Kenya', 'Kiribati', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein',
    'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius',
    'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia',
    'Nauru', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Pakistan',
    'Palau', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Romania', 'Russia',
    'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe',
    'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa',
    'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Tajikistan',
    'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
    'Uganda', 'Ukraine', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela',
    'Vietnam', 'Zambia', 'Zimbabwe'
  ],
  '1': [],
  '2': [],
  '3': [],
  '4': [],
  '5': [
    'Afghanistan', 'Bahrain', 'Bangladesh', 'Iran', 'Israel', 'Kuwait', 'Maldives', 'Oman', 'Palestine', 'Qatar', 'Saudi Arabia', 'United Arab Emirates', 'Yemen'
  ],
  '6': [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria',
    'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia',
    'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia',
    'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica',
    "Côte d'Ivoire", 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Democratic Republic of the Congo', 'Denmark', 'Djibouti',
    'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini',
    'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala',
    'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
    'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia',
    'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia',
    'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco',
    'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand',
    'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine',
    'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda',
    'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe',
    'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands',
    'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland',
    'Syria', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey',
    'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan',
    'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
  ]
};

// Preset 2: USA = Saturday & Sunday (2 days), All other countries = Sunday only (1 day)
const USA_2DAY_OTHERS_SUNDAY_SCHEDULE: Record<string, string[]> = {
  '0': ALL_COUNTRY_NAMES,
  '1': [],
  '2': [],
  '3': [],
  '4': [],
  '5': [],
  '6': ['United States'],
};

// Helper utilities to convert between 12-hour (09:00 AM) and 24-hour (09:00) formats
const formatTo24h = (timeStr: string) => {
  if (!timeStr) return '09:00';
  if (timeStr.includes('AM') || timeStr.includes('PM')) {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = (time || '').split(':');
    let h = parseInt(hours || '9', 10);
    if (modifier === 'PM' && h < 12) h += 12;
    if (modifier === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${minutes || '00'}`;
  }
  return timeStr;
};

const formatTo12h = (time24: string) => {
  if (!time24) return '09:00 AM';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr || '9', 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${String(h).padStart(2, '0')}:${mStr || '00'} ${ampm}`;
};

export default function TimezoneDutySettings({ userSettings, auth }: TimezoneDutySettingsProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [activeAddDay, setActiveAddDay] = useState<string | null>(null);
  const [selectedCountryToAdd, setSelectedCountryToAdd] = useState('');
  const [importNotification, setImportNotification] = useState<string | null>(null);

  const parseSchedule = (raw: any): Record<string, string[]> => {
    if (!raw) return USA_2DAY_OTHERS_SUNDAY_SCHEDULE;
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (typeof parsed === 'object' && parsed !== null) {
        return {
          '0': parsed['0'] || [],
          '1': parsed['1'] || [],
          '2': parsed['2'] || [],
          '3': parsed['3'] || [],
          '4': parsed['4'] || [],
          '5': parsed['5'] || [],
          '6': parsed['6'] || [],
        };
      }
    } catch (e) {}
    return USA_2DAY_OTHERS_SUNDAY_SCHEDULE;
  };

  const [settings, setSettings] = useState({
    company_primary_timezone: userSettings?.company_primary_timezone || 'America/Denver',
    company_shift_start: userSettings?.company_shift_start || '09:00 AM',
    company_shift_end: userSettings?.company_shift_end || '06:00 PM',
    company_lunch_start: userSettings?.company_lunch_start || '01:00 PM',
    company_lunch_end: userSettings?.company_lunch_end || '02:00 PM',
    company_daily_paid_hours: userSettings?.company_daily_paid_hours || '8',
    company_work_days_per_week: userSettings?.company_work_days_per_week || '5',
    company_weekend_schedule: parseSchedule(userSettings?.company_weekend_schedule),
  });

  useEffect(() => {
    if (userSettings) {
      setSettings({
        company_primary_timezone: userSettings?.company_primary_timezone || 'America/Denver',
        company_shift_start: userSettings?.company_shift_start || '09:00 AM',
        company_shift_end: userSettings?.company_shift_end || '06:00 PM',
        company_lunch_start: userSettings?.company_lunch_start || '01:00 PM',
        company_lunch_end: userSettings?.company_lunch_end || '02:00 PM',
        company_daily_paid_hours: userSettings?.company_daily_paid_hours || '8',
        company_work_days_per_week: userSettings?.company_work_days_per_week || '5',
        company_weekend_schedule: parseSchedule(userSettings?.company_weekend_schedule),
      });
    }
  }, [userSettings]);

  const handleRemoveCountry = (dayKey: string, countryName: string) => {
    setSettings((prev) => {
      const currentList = prev.company_weekend_schedule[dayKey] || [];
      const updatedList = currentList.filter((c) => c !== countryName);
      return {
        ...prev,
        company_weekend_schedule: {
          ...prev.company_weekend_schedule,
          [dayKey]: updatedList,
        },
      };
    });
  };

  const handleAddCountryToDay = (dayKey: string, countryName: string) => {
    if (!countryName) return;
    setSettings((prev) => {
      const currentList = prev.company_weekend_schedule[dayKey] || [];
      if (currentList.includes(countryName)) return prev;
      return {
        ...prev,
        company_weekend_schedule: {
          ...prev.company_weekend_schedule,
          [dayKey]: [...currentList, countryName],
        },
      };
    });
    setSelectedCountryToAdd('');
    setActiveAddDay(null);
  };

  const handleApplyGlobal195Preset = () => {
    setSettings((prev) => ({
      ...prev,
      company_weekend_schedule: GLOBAL_195_HOLIDAY_PRESET,
    }));
    setImportNotification('Full Global 195-Country Preset loaded! (USA/EU: Sat&Sun, BD/ME: Fri&Sat, Nepal: Sat, India/PK: Sun)');
    setTimeout(() => setImportNotification(null), 5000);
  };

  const handleApplyUsa2DayOthersSundaySchedule = () => {
    setSettings((prev) => ({
      ...prev,
      company_weekend_schedule: USA_2DAY_OTHERS_SUNDAY_SCHEDULE,
    }));
    setImportNotification('USA (Sat & Sun) + Others (Sunday Only) Preset loaded!');
    setTimeout(() => setImportNotification(null), 5000);
  };

  const saveSettings = () => {
    setIsLoading(true);
    const payload = {
      ...settings,
      company_weekend_schedule: JSON.stringify(settings.company_weekend_schedule),
    };

    router.post(
      route('settings.company.update'),
      { settings: payload },
      {
        preserveScroll: true,
        onSuccess: () => {
          setIsLoading(false);
          router.reload({ only: ['globalSettings'] });
        },
        onError: () => {
          setIsLoading(false);
        },
      }
    );
  };

  return (
    <Card className="border border-slate-200/90 shadow-sm bg-white rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Clock className="h-5 w-5 text-indigo-600" />
            {t('Company Timezone & Duty Policy Settings')}
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-1">
            {t('Configure global base timezone, multi-region shift hours, and dynamic day-by-day country weekend matrix.')}
          </CardDescription>
        </div>
        <Button
          onClick={saveSettings}
          disabled={isLoading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg"
        >
          <Save className="h-4 w-4 mr-1.5" />
          {isLoading ? t('Saving...') : t('Save Settings')}
        </Button>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Section 1: Base Company Timezone */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Globe className="h-4 w-4 text-indigo-500" />
            {t('1. Primary Base Timezone (Company Reference)')}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <Label className="text-xs font-bold text-slate-700">{t('Company Base Timezone')}</Label>
              <Select
                value={settings.company_primary_timezone}
                onValueChange={(val) => setSettings((prev) => ({ ...prev, company_primary_timezone: val }))}
              >
                <SelectTrigger className="mt-1 bg-white">
                  <SelectValue placeholder={t('Select Base Timezone')} />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-slate-500 mt-1">
                {t('This serves as the master reference clock across all multi-timezone dashboards.')}
              </p>
            </div>

            <div className="flex flex-col justify-center bg-white p-3 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">{t('Configured Base')}:</span>
                <span className="font-bold text-indigo-700">{settings.company_primary_timezone}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono mt-1.5">
                <span className="text-slate-500">{t('Registration Scope')}:</span>
                <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px]">
                  Dynime LLC (New Mexico, USA)
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Shift Timings & Duty Hours (Time Picker Selectors) */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Building2 className="h-4 w-4 text-indigo-500" />
            {t('2. Standard Duty & Shift Policy (Time Selection System)')}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {/* Shift Start Time */}
            <div>
              <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-indigo-600" />
                {t('Shift Start Time')}
              </Label>
              <div className="mt-1">
                <TimePicker
                  value={formatTo24h(settings.company_shift_start)}
                  onChange={(val) => setSettings((prev) => ({ ...prev, company_shift_start: formatTo12h(val) }))}
                  placeholder="Select Shift Start"
                />
              </div>
              <span className="text-[10px] font-mono text-indigo-600 block mt-1">
                Formatted: {settings.company_shift_start}
              </span>
            </div>

            {/* Shift End Time */}
            <div>
              <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-indigo-600" />
                {t('Shift End Time')}
              </Label>
              <div className="mt-1">
                <TimePicker
                  value={formatTo24h(settings.company_shift_end)}
                  onChange={(val) => setSettings((prev) => ({ ...prev, company_shift_end: formatTo12h(val) }))}
                  placeholder="Select Shift End"
                />
              </div>
              <span className="text-[10px] font-mono text-indigo-600 block mt-1">
                Formatted: {settings.company_shift_end}
              </span>
            </div>

            {/* Lunch Break Start */}
            <div>
              <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Utensils className="h-3.5 w-3.5 text-amber-600" />
                {t('Lunch Break Start')}
              </Label>
              <div className="mt-1">
                <TimePicker
                  value={formatTo24h(settings.company_lunch_start)}
                  onChange={(val) => setSettings((prev) => ({ ...prev, company_lunch_start: formatTo12h(val) }))}
                  placeholder="Lunch Start"
                />
              </div>
              <span className="text-[10px] font-mono text-amber-600 block mt-1">
                Formatted: {settings.company_lunch_start}
              </span>
            </div>

            {/* Lunch Break End */}
            <div>
              <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Utensils className="h-3.5 w-3.5 text-amber-600" />
                {t('Lunch Break End')}
              </Label>
              <div className="mt-1">
                <TimePicker
                  value={formatTo24h(settings.company_lunch_end)}
                  onChange={(val) => setSettings((prev) => ({ ...prev, company_lunch_end: formatTo12h(val) }))}
                  placeholder="Lunch End"
                />
              </div>
              <span className="text-[10px] font-mono text-amber-600 block mt-1">
                Formatted: {settings.company_lunch_end}
              </span>
            </div>

            {/* Daily Paid Duty Hours */}
            <div>
              <Label className="text-xs font-bold text-slate-700">{t('Daily Paid Duty Hours')}</Label>
              <Input
                type="number"
                value={settings.company_daily_paid_hours}
                onChange={(e) => setSettings((prev) => ({ ...prev, company_daily_paid_hours: e.target.value }))}
                className="mt-1 font-mono text-xs h-10"
                placeholder="8"
              />
              <span className="text-[10px] font-mono text-slate-500 block mt-1">
                {t('Paid Daily')}: {settings.company_daily_paid_hours} Hours
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Dynamic Country-Wise Weekly Holiday Matrix */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <Calendar className="h-4 w-4 text-purple-600" />
                {t('3. Dynamic Country-Wise Weekly Holiday Matrix')}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('Choose a standard holiday rule preset below or manually customize day-wise country off-days.')}
              </p>
            </div>

            {/* 2 Preset Import Buttons */}
            <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
              {/* Button 1: Global 195 Preset */}
              <Button
                type="button"
                onClick={handleApplyGlobal195Preset}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <Zap className="h-3.5 w-3.5 fill-current text-amber-300" />
                {t('Global 195 Preset')}
              </Button>

              {/* Button 2: USA (Sat & Sun) + Others (Sun) */}
              <Button
                type="button"
                onClick={handleApplyUsa2DayOthersSundaySchedule}
                className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <Zap className="h-3.5 w-3.5 fill-current text-amber-300" />
                {t('USA (Sat&Sun) + Others (Sun)')}
              </Button>
            </div>
          </div>

          {importNotification && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in-50">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                {importNotification} {t('Click "Save Settings" to apply permanently.')}
              </span>
              <button
                type="button"
                onClick={() => setImportNotification(null)}
                className="text-emerald-600 hover:text-emerald-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* 7 Days Table List */}
          <div className="space-y-3">
            {DAYS_OF_WEEK.map((day) => {
              const assignedCountries = settings.company_weekend_schedule[day.key] || [];

              return (
                <div
                  key={day.key}
                  className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  {/* Left: Day Name & Badge */}
                  <div className="flex items-center space-x-3 w-44 flex-shrink-0">
                    <Badge className={`font-mono text-xs font-bold px-2.5 py-1 ${day.color}`}>
                      {day.name}
                    </Badge>
                    <span className="text-[11px] font-mono text-slate-400">
                      ({assignedCountries.length} {assignedCountries.length === 1 ? 'Country' : 'Countries'})
                    </span>
                  </div>

                  {/* Middle: Country Badges List */}
                  <div className="flex-1 flex flex-wrap items-center gap-1.5 min-h-[32px]">
                    {assignedCountries.length > 0 ? (
                      assignedCountries.map((cName) => {
                        const matchedObj = WORLDWIDE_COUNTRIES.find(
                          (w) => w.name.toLowerCase() === cName.toLowerCase()
                        );
                        return (
                          <span
                            key={cName}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-800 shadow-2xs hover:border-rose-200 group transition-all"
                          >
                            <span>{matchedObj ? matchedObj.flag : '🌐'}</span>
                            <span>{cName}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCountry(day.key, cName)}
                              className="text-slate-400 hover:text-rose-600 transition-colors ml-0.5"
                              title={`Remove ${cName} from ${day.name}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        No countries assigned as off day on {day.name}
                      </span>
                    )}
                  </div>

                  {/* Right: Add Country Trigger */}
                  <div className="flex-shrink-0">
                    {activeAddDay === day.key ? (
                      <div className="flex items-center gap-2 w-64">
                        <SearchableCountrySelect
                          value={selectedCountryToAdd}
                          onValueChange={(val) => handleAddCountryToDay(day.key, val)}
                          placeholder={`Add to ${day.name}...`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveAddDay(null)}
                          className="h-9 px-2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActiveAddDay(day.key);
                          setSelectedCountryToAdd('');
                        }}
                        className="text-xs font-semibold text-indigo-600 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 transition-colors h-8"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add Country
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
