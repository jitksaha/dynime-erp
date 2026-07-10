import { Input } from './input';
import { Label } from './label';
import InputError from './input-error';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef } from 'react';

interface PhoneInputProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    error?: string;
    className?: string;
    id?: string;
    required?: boolean;
    readOnly?: boolean;
    style?: React.CSSProperties;
}

// Comprehensive list of countries globally with their flags and dial codes
const countries = [
    { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸' },
    { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
    { code: 'BD', name: 'Bangladesh', dial: '+880', flag: '🇧🇩' },
    { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦' },
    { code: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺' },
    { code: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪' },
    { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
    { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳' },
    { code: 'PK', name: 'Pakistan', dial: '+92', flag: '🇵🇰' },
    { code: 'SA', name: 'Saudi Arabia', dial: '+966', flag: '🇸🇦' },
    { code: 'AE', name: 'United Arab Emirates', dial: '+971', flag: '🇦🇪' },
    { code: 'SG', name: 'Singapore', dial: '+65', flag: '🇸🇬' },
    { code: 'MY', name: 'Malaysia', dial: '+60', flag: '🇲🇾' },
    { code: 'ZA', name: 'South Africa', dial: '+27', flag: '🇿🇦' },
    { code: 'TR', name: 'Turkey', dial: '+90', flag: '🇹🇷' },
    { code: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵' },
    { code: 'CN', name: 'China', dial: '+86', flag: '🇨🇳' },
    { code: 'AF', name: 'Afghanistan', dial: '+93', flag: '🇦🇫' },
    { code: 'AL', name: 'Albania', dial: '+355', flag: '🇦🇱' },
    { code: 'DZ', name: 'Algeria', dial: '+213', flag: '🇩🇿' },
    { code: 'AD', name: 'Andorra', dial: '+376', flag: '🇦🇩' },
    { code: 'AO', name: 'Angola', dial: '+244', flag: '🇦🇴' },
    { code: 'AR', name: 'Argentina', dial: '+54', flag: '🇦🇷' },
    { code: 'AM', name: 'Armenia', dial: '+374', flag: '🇦🇲' },
    { code: 'AT', name: 'Austria', dial: '+43', flag: '🇦🇹' },
    { code: 'AZ', name: 'Azerbaijan', dial: '+994', flag: '🇦🇿' },
    { code: 'BS', name: 'Bahamas', dial: '+1', flag: '🇧🇸' },
    { code: 'BH', name: 'Bahrain', dial: '+973', flag: '🇧🇭' },
    { code: 'BB', name: 'Barbados', dial: '+1', flag: '🇧🇧' },
    { code: 'BY', name: 'Belarus', dial: '+375', flag: '🇧🇾' },
    { code: 'BE', name: 'Belgium', dial: '+32', flag: '🇧🇪' },
    { code: 'BZ', name: 'Belize', dial: '+501', flag: '🇧🇿' },
    { code: 'BJ', name: 'Benin', dial: '+229', flag: '🇧🇯' },
    { code: 'BT', name: 'Bhutan', dial: '+975', flag: '🇧🇹' },
    { code: 'BO', name: 'Bolivia', dial: '+591', flag: '🇧🇴' },
    { code: 'BA', name: 'Bosnia and Herzegovina', dial: '+387', flag: '🇧🇦' },
    { code: 'BW', name: 'Botswana', dial: '+267', flag: '🇧🇼' },
    { code: 'BR', name: 'Brazil', dial: '+55', flag: '🇧🇷' },
    { code: 'BN', name: 'Brunei', dial: '+673', flag: '🇧🇳' },
    { code: 'BG', name: 'Bulgaria', dial: '+359', flag: '🇧🇬' },
    { code: 'BF', name: 'Burkina Faso', dial: '+226', flag: '🇧🇫' },
    { code: 'BI', name: 'Burundi', dial: '+257', flag: '🇧🇮' },
    { code: 'KH', name: 'Cambodia', dial: '+855', flag: '🇰🇭' },
    { code: 'CM', name: 'Cameroon', dial: '+237', flag: '🇨🇲' },
    { code: 'CV', name: 'Cape Verde', dial: '+238', flag: '🇨🇻' },
    { code: 'CF', name: 'Central African Republic', dial: '+236', flag: '🇨🇫' },
    { code: 'TD', name: 'Chad', dial: '+235', flag: '🇹🇩' },
    { code: 'CL', name: 'Chile', dial: '+56', flag: '🇨🇱' },
    { code: 'CO', name: 'Colombia', dial: '+57', flag: '🇨🇴' },
    { code: 'KM', name: 'Comoros', dial: '+269', flag: '🇰🇲' },
    { code: 'CG', name: 'Congo', dial: '+242', flag: '🇨🇬' },
    { code: 'CR', name: 'Costa Rica', dial: '+506', flag: '🇨🇷' },
    { code: 'HR', name: 'Croatia', dial: '+385', flag: '🇭🇷' },
    { code: 'CU', name: 'Cuba', dial: '+53', flag: '🇨🇺' },
    { code: 'CY', name: 'Cyprus', dial: '+357', flag: '🇨🇾' },
    { code: 'CZ', name: 'Czech Republic', dial: '+420', flag: '🇨🇿' },
    { code: 'DK', name: 'Denmark', dial: '+45', flag: '🇩🇰' },
    { code: 'DJ', name: 'Djibouti', dial: '+253', flag: '🇩🇯' },
    { code: 'DM', name: 'Dominica', dial: '+1', flag: '🇩🇲' },
    { code: 'DO', name: 'Dominican Republic', dial: '+1', flag: '🇩🇴' },
    { code: 'EC', name: 'Ecuador', dial: '+593', flag: '🇪🇨' },
    { code: 'EG', name: 'Egypt', dial: '+20', flag: '🇪🇬' },
    { code: 'SV', name: 'El Salvador', dial: '+503', flag: '🇸🇻' },
    { code: 'GQ', name: 'Equatorial Guinea', dial: '+240', flag: '🇬🇶' },
    { code: 'ER', name: 'Eritrea', dial: '+291', flag: '🇪🇷' },
    { code: 'EE', name: 'Estonia', dial: '+372', flag: '🇪🇪' },
    { code: 'ET', name: 'Ethiopia', dial: '+251', flag: '🇪🇹' },
    { code: 'FJ', name: 'Fiji', dial: '+679', flag: '🇫🇯' },
    { code: 'FI', name: 'Finland', dial: '+358', flag: '🇫🇮' },
    { code: 'GA', name: 'Gabon', dial: '+241', flag: '🇬🇦' },
    { code: 'GM', name: 'Gambia', dial: '+220', flag: '🇬🇲' },
    { code: 'GE', name: 'Georgia', dial: '+995', flag: '🇬🇪' },
    { code: 'GH', name: 'Ghana', dial: '+233', flag: '🇬🇭' },
    { code: 'GR', name: 'Greece', dial: '+30', flag: '🇬🇷' },
    { code: 'GD', name: 'Grenada', dial: '+1', flag: '🇬🇩' },
    { code: 'GT', name: 'Guatemala', dial: '+502', flag: '🇬🇹' },
    { code: 'GN', name: 'Guinea', dial: '+224', flag: '🇬🇳' },
    { code: 'GW', name: 'Guinea-Bissau', dial: '+245', flag: '🇬🇼' },
    { code: 'GY', name: 'Guyana', dial: '+592', flag: '🇬🇾' },
    { code: 'HT', name: 'Haiti', dial: '+509', flag: '🇭🇹' },
    { code: 'HN', name: 'Honduras', dial: '+504', flag: '🇭🇳' },
    { code: 'HK', name: 'Hong Kong', dial: '+852', flag: '🇭🇰' },
    { code: 'HU', name: 'Hungary', dial: '+36', flag: '🇭🇺' },
    { code: 'IS', name: 'Iceland', dial: '+354', flag: '🇮🇸' },
    { code: 'ID', name: 'Indonesia', dial: '+62', flag: '🇮🇩' },
    { code: 'IR', name: 'Iran', dial: '+98', flag: '🇮🇷' },
    { code: 'IQ', name: 'Iraq', dial: '+964', flag: '🇮🇶' },
    { code: 'IE', name: 'Ireland', dial: '+353', flag: '🇮🇪' },
    { code: 'IL', name: 'Israel', dial: '+972', flag: '🇮🇱' },
    { code: 'IT', name: 'Italy', dial: '+39', flag: '🇮🇹' },
    { code: 'JM', name: 'Jamaica', dial: '+1', flag: '🇯🇲' },
    { code: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵' },
    { code: 'JO', name: 'Jordan', dial: '+962', flag: '🇯🇴' },
    { code: 'KZ', name: 'Kazakhstan', dial: '+7', flag: '🇰🇿' },
    { code: 'KE', name: 'Kenya', dial: '+254', flag: '🇰🇪' },
    { code: 'KI', name: 'Kiribati', dial: '+686', flag: '🇰🇮' },
    { code: 'KP', name: 'North Korea', dial: '+850', flag: '🇰🇵' },
    { code: 'KR', name: 'South Korea', dial: '+82', flag: '🇰🇷' },
    { code: 'KW', name: 'Kuwait', dial: '+965', flag: '🇰🇼' },
    { code: 'KG', name: 'Kyrgyzstan', dial: '+996', flag: '🇰🇬' },
    { code: 'LA', name: 'Laos', dial: '+856', flag: '🇱🇦' },
    { code: 'LV', name: 'Latvia', dial: '+371', flag: '🇱🇻' },
    { code: 'LB', name: 'Lebanon', dial: '+961', flag: '🇱🇧' },
    { code: 'LS', name: 'Lesotho', dial: '+266', flag: '🇱🇸' },
    { code: 'LR', name: 'Liberia', dial: '+231', flag: '🇱🇷' },
    { code: 'LY', name: 'Libya', dial: '+218', flag: '🇱🇾' },
    { code: 'LI', name: 'Liechtenstein', dial: '+423', flag: '🇱🇮' },
    { code: 'LT', name: 'Lithuania', dial: '+370', flag: '🇱🇹' },
    { code: 'LU', name: 'Luxembourg', dial: '+352', flag: '🇱🇺' },
    { code: 'MO', name: 'Macao', dial: '+853', flag: '🇲🇴' },
    { code: 'MK', name: 'North Macedonia', dial: '+389', flag: '🇲🇰' },
    { code: 'MG', name: 'Madagascar', dial: '+261', flag: '🇲🇬' },
    { code: 'MW', name: 'Malawi', dial: '+265', flag: '🇲🇼' },
    { code: 'MY', name: 'Malaysia', dial: '+60', flag: '🇲🇾' },
    { code: 'MV', name: 'Maldives', dial: '+960', flag: '🇲🇻' },
    { code: 'ML', name: 'Mali', dial: '+223', flag: '🇲🇱' },
    { code: 'MT', name: 'Malta', dial: '+356', flag: '🇲🇹' },
    { code: 'MH', name: 'Marshall Islands', dial: '+692', flag: '🇲🇭' },
    { code: 'MR', name: 'Mauritania', dial: '+222', flag: '🇲🇷' },
    { code: 'MU', name: 'Mauritius', dial: '+230', flag: '🇲🇺' },
    { code: 'MX', name: 'Mexico', dial: '+52', flag: '🇲🇽' },
    { code: 'FM', name: 'Micronesia', dial: '+691', flag: '🇫🇲' },
    { code: 'MD', name: 'Moldova', dial: '+373', flag: '🇲🇩' },
    { code: 'MC', name: 'Monaco', dial: '+377', flag: '🇲🇨' },
    { code: 'MN', name: 'Mongolia', dial: '+976', flag: '🇲🇳' },
    { code: 'ME', name: 'Montenegro', dial: '+382', flag: '🇲🇪' },
    { code: 'MA', name: 'Morocco', dial: '+212', flag: '🇲🇦' },
    { code: 'MZ', name: 'Mozambique', dial: '+258', flag: '🇲🇿' },
    { code: 'MM', name: 'Myanmar', dial: '+95', flag: '🇲🇲' },
    { code: 'NA', name: 'Namibia', dial: '+264', flag: '🇳🇦' },
    { code: 'NR', name: 'Nauru', dial: '+674', flag: '🇳🇷' },
    { code: 'NP', name: 'Nepal', dial: '+977', flag: '🇳🇵' },
    { code: 'NL', name: 'Netherlands', dial: '+31', flag: '🇳🇱' },
    { code: 'NZ', name: 'New Zealand', dial: '+64', flag: '🇳🇿' },
    { code: 'NI', name: 'Nicaragua', dial: '+505', flag: '🇳🇮' },
    { code: 'NE', name: 'Niger', dial: '+227', flag: '🇳🇪' },
    { code: 'NG', name: 'Nigeria', dial: '+234', flag: '🇳🇬' },
    { code: 'NO', name: 'Norway', dial: '+47', flag: '🇳🇴' },
    { code: 'OM', name: 'Oman', dial: '+968', flag: '🇴🇲' },
    { code: 'PW', name: 'Palau', dial: '+680', flag: '🇵🇼' },
    { code: 'PS', name: 'Palestine', dial: '+970', flag: '🇵🇸' },
    { code: 'PA', name: 'Panama', dial: '+507', flag: '🇵🇦' },
    { code: 'PG', name: 'Papua New Guinea', dial: '+675', flag: '🇵🇬' },
    { code: 'PY', name: 'Paraguay', dial: '+595', flag: '🇵🇾' },
    { code: 'PE', name: 'Peru', dial: '+51', flag: '🇵🇪' },
    { code: 'PH', name: 'Philippines', dial: '+63', flag: '🇵🇭' },
    { code: 'PL', name: 'Poland', dial: '+48', flag: '🇵🇱' },
    { code: 'PT', name: 'Portugal', dial: '+351', flag: '🇵🇹' },
    { code: 'QA', name: 'Qatar', dial: '+974', flag: '🇶🇦' },
    { code: 'RO', name: 'Romania', dial: '+40', flag: '🇷🇴' },
    { code: 'RU', name: 'Russia', dial: '+7', flag: '🇷🇺' },
    { code: 'RW', name: 'Rwanda', dial: '+250', flag: '🇷🇼' },
    { code: 'KN', name: 'Saint Kitts and Nevis', dial: '+1', flag: '🇰🇳' },
    { code: 'LC', name: 'Saint Lucia', dial: '+1', flag: '🇱🇨' },
    { code: 'VC', name: 'Saint Vincent', dial: '+1', flag: '🇻🇨' },
    { code: 'WS', name: 'Samoa', dial: '+685', flag: '🇼🇸' },
    { code: 'SM', name: 'San Marino', dial: '+378', flag: '🇸🇲' },
    { code: 'ST', name: 'Sao Tome and Principe', dial: '+239', flag: '🇸🇹' },
    { code: 'SA', name: 'Saudi Arabia', dial: '+966', flag: '🇸🇦' },
    { code: 'SN', name: 'Senegal', dial: '+221', flag: '🇸🇳' },
    { code: 'RS', name: 'Serbia', dial: '+381', flag: '🇷🇸' },
    { code: 'SC', name: 'Seychelles', dial: '+248', flag: '🇸🇨' },
    { code: 'SL', name: 'Sierra Leone', dial: '+232', flag: '🇸🇱' },
    { code: 'SK', name: 'Slovakia', dial: '+421', flag: '🇸🇰' },
    { code: 'SI', name: 'Slovenia', dial: '+386', flag: '🇸🇮' },
    { code: 'SB', name: 'Solomon Islands', dial: '+677', flag: '🇸🇧' },
    { code: 'SO', name: 'Somalia', dial: '+252', flag: '🇸🇴' },
    { code: 'SS', name: 'South Sudan', dial: '+211', flag: '🇸🇸' },
    { code: 'ES', name: 'Spain', dial: '+34', flag: '🇪🇸' },
    { code: 'LK', name: 'Sri Lanka', dial: '+94', flag: '🇱🇰' },
    { code: 'SD', name: 'Sudan', dial: '+249', flag: '🇸🇩' },
    { code: 'SR', name: 'Suriname', dial: '+597', flag: '🇸🇷' },
    { code: 'SZ', name: 'Swaziland', dial: '+268', flag: '🇸🇿' },
    { code: 'SE', name: 'Sweden', dial: '+46', flag: '🇸🇪' },
    { code: 'CH', name: 'Switzerland', dial: '+41', flag: '🇨🇭' },
    { code: 'SY', name: 'Syria', dial: '+963', flag: '🇸🇾' },
    { code: 'TW', name: 'Taiwan', dial: '+886', flag: '🇹🇼' },
    { code: 'TJ', name: 'Tajikistan', dial: '+992', flag: '🇹🇯' },
    { code: 'TZ', name: 'Tanzania', dial: '+255', flag: '🇹🇿' },
    { code: 'TH', name: 'Thailand', dial: '+66', flag: '🇹🇭' },
    { code: 'TL', name: 'Timor-Leste', dial: '+670', flag: '🇹🇱' },
    { code: 'TG', name: 'Togo', dial: '+228', flag: '🇹🇬' },
    { code: 'TO', name: 'Tonga', dial: '+676', flag: '🇹🇴' },
    { code: 'TT', name: 'Trinidad and Tobago', dial: '+1', flag: '🇹🇹' },
    { code: 'TN', name: 'Tunisia', dial: '+216', flag: '🇹🇳' },
    { code: 'TR', name: 'Turkey', dial: '+90', flag: '🇹🇷' },
    { code: 'TM', name: 'Turkmenistan', dial: '+993', flag: '🇹🇲' },
    { code: 'TV', name: 'Tuvalu', dial: '+688', flag: '🇹🇻' },
    { code: 'UG', name: 'Uganda', dial: '+256', flag: '🇺🇬' },
    { code: 'UA', name: 'Ukraine', dial: '+380', flag: '🇺🇦' },
    { code: 'UY', name: 'Uruguay', dial: '+598', flag: '🇺🇾' },
    { code: 'UZ', name: 'Uzbekistan', dial: '+998', flag: '🇺🇿' },
    { code: 'VU', name: 'Vanuatu', dial: '+678', flag: '🇻🇺' },
    { code: 'VE', name: 'Venezuela', dial: '+58', flag: '🇻🇪' },
    { code: 'VN', name: 'Vietnam', dial: '+84', flag: '🇻🇳' },
    { code: 'YE', name: 'Yemen', dial: '+967', flag: '🇾🇪' },
    { code: 'ZM', name: 'Zambia', dial: '+260', flag: '🇿🇲' },
    { code: 'ZW', name: 'Zimbabwe', dial: '+263', flag: '🇿🇼' }
];

export function PhoneInputComponent({
    label,
    value,
    onChange,
    placeholder,
    error,
    className,
    id,
    required,
    readOnly,
    style
}: PhoneInputProps) {
    const { t } = useTranslation();
    const [selectedCountry, setSelectedCountry] = useState(countries[2]); // Default Bangladesh (+880)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Sync selected country if value changes from outside with a different dial code
    useEffect(() => {
        if (value && value.startsWith('+')) {
            const matched = [...countries]
                .sort((a, b) => b.dial.length - a.dial.length)
                .find(c => value.startsWith(c.dial));
            if (matched) {
                setSelectedCountry(matched);
            }
        }
    }, [value]);

    const handleCountrySelect = (country: typeof countries[0]) => {
        setSelectedCountry(country);
        setIsDropdownOpen(false);
        setSearchQuery('');

        if (value && value.startsWith('+')) {
            const oldCountry = [...countries]
                .sort((a, b) => b.dial.length - a.dial.length)
                .find(c => value.startsWith(c.dial));
            if (oldCountry) {
                const numberPart = value.slice(oldCountry.dial.length);
                onChange(country.dial + numberPart);
                return;
            }
        }
        onChange(country.dial + (value || ''));
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;
        if (!val.startsWith('+')) {
            val = selectedCountry.dial + val.replace(/[^\d]/g, '');
        }
        onChange(val);
    };

    // Filter countries based on search query
    const filteredCountries = countries.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.dial.includes(searchQuery) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="relative">
            {label && <Label htmlFor={id} required={required}>{label}</Label>}
            
            <div className={`relative flex h-10 w-full items-center rounded-md border border-input bg-background text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${className}`}>
                {/* Clickable country code trigger (NO gap, NO inner border) */}
                <button
                    type="button"
                    disabled={readOnly}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex h-full items-center gap-1 px-3 text-sm font-medium hover:bg-slate-50 border-r border-input transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <span className="text-base leading-none">{selectedCountry.flag}</span>
                    <span className="text-slate-600 text-xs font-semibold">{selectedCountry.dial}</span>
                    <span className="text-[10px] text-slate-400">▼</span>
                </button>

                <input
                    id={id}
                    type="tel"
                    value={value}
                    onChange={handleNumberChange}
                    placeholder={placeholder || t('Phone Number')}
                    disabled={readOnly}
                    required={required}
                    readOnly={readOnly}
                    style={style}
                    className="flex-1 h-full border-0 bg-transparent py-2 pl-3 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-0 w-full"
                />
            </div>

            {/* Custom Searchable Country List Dropdown */}
            {isDropdownOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-40 bg-transparent" 
                        onClick={() => {
                            setIsDropdownOpen(false);
                            setSearchQuery('');
                        }}
                    />
                    <div 
                        ref={dropdownRef}
                        className="absolute left-0 z-50 bottom-full mb-1 max-h-64 w-72 overflow-y-auto rounded-md border border-slate-200 bg-white p-1 text-slate-950 shadow-md animate-in fade-in-80 duration-100"
                    >
                        <div className="sticky top-0 bg-white p-1 pb-1.5 border-b border-slate-100">
                            <input
                                type="search"
                                name="phone_country_search"
                                autoComplete="off"
                                data-lpignore="true"
                                placeholder={t('Search country or code...')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                            />
                        </div>
                        <div className="space-y-0.5 mt-1 max-h-48 overflow-y-auto">
                            {filteredCountries.length > 0 ? (
                                filteredCountries.map((c) => (
                                    <div
                                        key={`${c.code}-${c.dial}`}
                                        className={`flex w-full cursor-pointer select-none items-center gap-2 rounded-sm py-1.5 px-2 text-xs outline-none hover:bg-slate-100 hover:text-slate-900 ${c.code === selectedCountry.code ? 'bg-slate-50 font-medium' : ''}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCountrySelect(c);
                                        }}
                                    >
                                        <span className="text-sm leading-none">{c.flag}</span>
                                        <span className="font-semibold text-slate-700 min-w-[40px]">{c.dial}</span>
                                        <span className="text-slate-500 truncate flex-1">{c.name}</span>
                                        <span className="text-[10px] text-slate-400 font-mono">{c.code}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="p-2 text-center text-xs text-muted-foreground">
                                    {t('No countries found')}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            <p className="text-xs text-muted-foreground mt-1">{t('Format: +[country code][phone number]')}</p>
            <InputError message={error} />
        </div>
    );
}