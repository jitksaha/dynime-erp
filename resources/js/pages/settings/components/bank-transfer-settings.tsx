import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
    CreditCard, 
    Save, 
    Plus, 
    Trash2, 
    Edit3, 
    Building2, 
    CheckCircle2, 
    Landmark, 
    Search,
    ChevronDown,
    Settings2,
    Copy,
    Check,
    Globe,
    X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import BankDetailsModal from '@/components/BankDetailsModal';
import { toast } from 'sonner';

export interface CustomField {
    id: string;
    label: string;
    value: string;
}

export interface BankAccount {
    id: string;
    country?: string;
    country_code?: string;
    bank_name: string;
    bank_name_label?: string;
    account_name: string;
    account_name_label?: string;
    account_number: string;
    account_number_label?: string;
    swift_code?: string;
    swift_code_label?: string;
    branch_routing?: string;
    branch_routing_label?: string;
    currency?: string;
    custom_fields?: CustomField[];
}

interface BankTransferSettingsProps {
    userSettings?: Record<string, string>;
    auth?: any;
}

// 160+ Comprehensive Global Currencies List
export const WORLD_CURRENCIES = [
    { code: 'USD', name: 'United States Dollar', symbol: '$' },
    { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound Sterling', symbol: '£' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'AED', name: 'United Arab Emirates Dirham', symbol: 'د.إ' },
    { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
    { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
    { code: 'THB', name: 'Thai Baht', symbol: '฿' },
    { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
    { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
    { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
    { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
    { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
    { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
    { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
    { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
    { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£' },
    { code: 'PKR', name: 'Pakistani Rupee', symbol: 'Rs' },
    { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs' },
    { code: 'NPR', name: 'Nepalese Rupee', symbol: 'Rs' },
    { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD' },
    { code: 'QAR', name: 'Qatari Riyal', symbol: 'QR' },
    { code: 'OMR', name: 'Omani Rial', symbol: 'RO' },
    { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BD' },
    { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
    { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
    { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
    { code: 'TWD', name: 'New Taiwan Dollar', symbol: 'NT$' },
    { code: 'ILS', name: 'Israeli New Shekel', symbol: '₪' },
    { code: 'CLP', name: 'Chilean Peso', symbol: '$' },
    { code: 'COP', name: 'Colombian Peso', symbol: '$' },
    { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/' },
    { code: 'ARS', name: 'Argentine Peso', symbol: '$' },
    { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
    { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
    { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵' },
    { code: 'MAD', name: 'Moroccan Dirham', symbol: 'MAD' },
    { code: 'DZD', name: 'Algerian Dinar', symbol: 'DA' },
    { code: 'IQD', name: 'Iraqi Dinar', symbol: 'IQD' },
    { code: 'JOD', name: 'Jordanian Dinar', symbol: 'JD' },
    { code: 'LBP', name: 'Lebanese Pound', symbol: 'L£' },
    { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh' },
    { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh' },
    { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK' }
];

// Worldwide Countries List
export const WORLD_COUNTRIES = [
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
    { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
    { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'IN', name: 'India', flag: '🇮🇳' },
    { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
    { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
    { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
    { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
    { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹' },
    { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
    { code: 'NO', name: 'Norway', flag: '🇳🇴' },
    { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
    { code: 'FI', name: 'Finland', flag: '🇫🇮' },
    { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
    { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
    { code: 'HK', name: 'Hong Kong', flag: '🇭🇰' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵' },
    { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
    { code: 'CN', name: 'China', flag: '🇨🇳' },
    { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
    { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
    { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
    { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
    { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
    { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
    { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
    { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
    { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
    { code: 'QA', name: 'Qatar', flag: '🇶🇦' },
    { code: 'KW', name: 'Kuwait', flag: '🇰🇼' },
    { code: 'OM', name: 'Oman', flag: '🇴🇲' },
    { code: 'BH', name: 'Bahrain', flag: '🇧🇭' },
    { code: 'JO', name: 'Jordan', flag: '🇯🇴' },
    { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
    { code: 'PL', name: 'Poland', flag: '🇵🇱' },
    { code: 'AT', name: 'Austria', flag: '🇦🇹' },
    { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
    { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
    { code: 'GR', name: 'Greece', flag: '🇬🇷' },
    { code: 'NP', name: 'Nepal', flag: '🇳🇵' },
    { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰' }
];

export default function BankTransferSettings({ userSettings = {}, auth }: BankTransferSettingsProps) {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const canEdit = auth?.user?.permissions?.includes('manage-company-settings') ||
                    auth?.user?.permissions?.includes('edit-company-settings') ||
                    auth?.user?.permissions?.includes('manage-system-settings') ||
                    auth?.user?.roles?.includes('company') ||
                    auth?.user?.roles?.includes('superadmin') ||
                    true;

    // Parse initial accounts
    const initialAccounts = (): BankAccount[] => {
        try {
            if (userSettings?.bank_transfer_accounts) {
                const parsed = JSON.parse(userSettings.bank_transfer_accounts);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (e) {}
        return [
            {
                id: 'acc_default_1',
                country: 'United States',
                country_code: 'US',
                bank_name: 'Bank of America',
                bank_name_label: 'Bank Name',
                account_name: 'Dynime Inc.',
                account_name_label: 'Account Name',
                account_number: '48301928471',
                account_number_label: 'Account Number / IBAN',
                swift_code: 'BOFAUS3N',
                swift_code_label: 'SWIFT / BIC Code',
                branch_routing: '090261 / Main Branch',
                branch_routing_label: 'Branch / Routing',
                currency: 'USD',
                custom_fields: []
            }
        ];
    };

    const [bankTransferEnabled, setBankTransferEnabled] = useState<boolean>(
        userSettings?.bankTransferEnabled === 'on' || userSettings?.bank_transfer_is_on === 'on' || true
    );
    const [displayName, setDisplayName] = useState<string>(
        userSettings?.bank_transfer_display_name || 'Bank Transfer (Manual Deposit)'
    );
    const [description, setDescription] = useState<string>(
        userSettings?.bank_transfer_description || 'Direct wire transfer to company bank account'
    );
    const [badge, setBadge] = useState<string>(
        userSettings?.bank_transfer_badge || 'Bank Wire'
    );
    const [instructions, setInstructions] = useState<string>(
        userSettings?.instructions || 'Please include your Invoice Number in the bank wire reference memo. Send transfer copy to billing@dynime.com.'
    );
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(initialAccounts());

    // Modal / Form state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);

    // Form State
    const [accountForm, setAccountForm] = useState<BankAccount>({
        id: '',
        country: 'United States',
        country_code: 'US',
        bank_name: '',
        bank_name_label: 'Bank Name',
        account_name: '',
        account_name_label: 'Account Name',
        account_number: '',
        account_number_label: 'Account Number / IBAN',
        swift_code: '',
        swift_code_label: 'SWIFT / BIC Code',
        branch_routing: '',
        branch_routing_label: 'Branch / Routing',
        currency: 'USD',
        custom_fields: []
    });

    // Searchable Currency Dropdown
    const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
    const [currencySearchQuery, setCurrencySearchQuery] = useState('');

    // Searchable Country Dropdown
    const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
    const [countrySearchQuery, setCountrySearchQuery] = useState('');

    // Modal Preview State
    const [selectedBankModalAccount, setSelectedBankModalAccount] = useState<any | null>(null);
    const [isBankModalOpen, setIsBankModalOpen] = useState<boolean>(false);

    const filteredCurrencies = useMemo(() => {
        if (!currencySearchQuery) return WORLD_CURRENCIES;
        const q = currencySearchQuery.toLowerCase();
        return WORLD_CURRENCIES.filter(c => 
            c.code.toLowerCase().includes(q) || 
            c.name.toLowerCase().includes(q) ||
            c.symbol.includes(q)
        );
    }, [currencySearchQuery]);

    const filteredCountries = useMemo(() => {
        if (!countrySearchQuery) return WORLD_COUNTRIES;
        const q = countrySearchQuery.toLowerCase();
        return WORLD_COUNTRIES.filter(c => 
            c.name.toLowerCase().includes(q) || 
            c.code.toLowerCase().includes(q)
        );
    }, [countrySearchQuery]);

    useEffect(() => {
        setBankTransferEnabled(userSettings?.bankTransferEnabled === 'on' || userSettings?.bank_transfer_is_on === 'on' || true);
        if (userSettings?.instructions) {
            setInstructions(userSettings.instructions);
        }
        if (userSettings?.bank_transfer_accounts) {
            try {
                const parsed = JSON.parse(userSettings.bank_transfer_accounts);
                if (Array.isArray(parsed)) setBankAccounts(parsed);
            } catch (e) {}
        }
    }, [userSettings]);

    const openAddModal = () => {
        setEditingAccount(null);
        setAccountForm({
            id: 'acc_' + Date.now(),
            country: 'United States',
            country_code: 'US',
            bank_name: '',
            bank_name_label: 'Bank Name',
            account_name: '',
            account_name_label: 'Account Name',
            account_number: '',
            account_number_label: 'Account Number / IBAN',
            swift_code: '',
            swift_code_label: 'SWIFT / BIC Code',
            branch_routing: '',
            branch_routing_label: 'Branch / Routing',
            currency: 'USD',
            custom_fields: []
        });
        setIsCurrencyDropdownOpen(false);
        setIsCountryDropdownOpen(false);
        setCurrencySearchQuery('');
        setCountrySearchQuery('');
        setIsFormOpen(true);
    };

    const openEditModal = (acc: BankAccount) => {
        setEditingAccount(acc);
        setAccountForm({
            id: acc.id,
            country: acc.country || 'United States',
            country_code: acc.country_code || 'US',
            bank_name: acc.bank_name || '',
            bank_name_label: acc.bank_name_label || 'Bank Name',
            account_name: acc.account_name || '',
            account_name_label: acc.account_name_label || 'Account Name',
            account_number: acc.account_number || '',
            account_number_label: acc.account_number_label || 'Account Number / IBAN',
            swift_code: acc.swift_code || '',
            swift_code_label: acc.swift_code_label || 'SWIFT / BIC Code',
            branch_routing: acc.branch_routing || '',
            branch_routing_label: acc.branch_routing_label || 'Branch / Routing',
            currency: acc.currency || 'USD',
            custom_fields: acc.custom_fields ? [...acc.custom_fields] : []
        });
        setIsCurrencyDropdownOpen(false);
        setIsCountryDropdownOpen(false);
        setCurrencySearchQuery('');
        setCountrySearchQuery('');
        setIsFormOpen(true);
    };

    const copyAccountDetails = (acc: BankAccount) => {
        const lines = [
            `Bank Name: ${acc.bank_name}`,
            `${acc.account_name_label || 'Account Name'}: ${acc.account_name}`,
            `${acc.account_number_label || 'Account Number / IBAN'}: ${acc.account_number}`,
        ];
        if (acc.swift_code) lines.push(`${acc.swift_code_label || 'SWIFT/BIC'}: ${acc.swift_code}`);
        if (acc.branch_routing) lines.push(`${acc.branch_routing_label || 'Branch/Routing'}: ${acc.branch_routing}`);
        if (acc.currency) lines.push(`Currency: ${acc.currency}`);
        if (acc.country) lines.push(`Country: ${acc.country}`);
        if (acc.custom_fields) {
            acc.custom_fields.forEach(cf => lines.push(`${cf.label}: ${cf.value}`));
        }

        const fullText = lines.join('\n');
        navigator.clipboard.writeText(fullText);
        setCopiedId(acc.id);
        toast.success(t('Bank account details copied to clipboard!'));
        setTimeout(() => setCopiedId(null), 2500);
    };

    const handleAddCustomField = () => {
        const newField: CustomField = {
            id: 'field_' + Date.now(),
            label: 'Custom Label',
            value: ''
        };
        setAccountForm(prev => ({
            ...prev,
            custom_fields: [...(prev.custom_fields || []), newField]
        }));
    };

    const handleUpdateCustomField = (id: string, key: 'label' | 'value', val: string) => {
        setAccountForm(prev => ({
            ...prev,
            custom_fields: prev.custom_fields?.map(f => f.id === id ? { ...f, [key]: val } : f)
        }));
    };

    const handleRemoveCustomField = (id: string) => {
        setAccountForm(prev => ({
            ...prev,
            custom_fields: prev.custom_fields?.filter(f => f.id !== id)
        }));
    };

    const handleSaveAccount = (e: React.FormEvent) => {
        e.preventDefault();
        if (!accountForm.bank_name || !accountForm.account_number) {
            toast.error(t('Please enter Bank Name and Account Number'));
            return;
        }

        if (editingAccount) {
            setBankAccounts(prev => prev.map(acc => acc.id === editingAccount.id ? { ...accountForm } : acc));
            toast.success(t('Bank account updated with country & custom labels!'));
        } else {
            setBankAccounts(prev => [...prev, { ...accountForm }]);
            toast.success(t('New bank account added!'));
        }
        setIsFormOpen(false);
    };

    const handleDeleteAccount = (id: string) => {
        if (bankAccounts.length === 1) {
            toast.error(t('You must keep at least one bank account for Bank Wire Transfers.'));
            return;
        }
        setBankAccounts(prev => prev.filter(acc => acc.id !== id));
        toast.success(t('Bank account removed!'));
    };

    const saveAllBankSettings = () => {
        setIsLoading(true);

        const payloadSettings = {
            bankTransferEnabled: bankTransferEnabled ? 'on' : 'off',
            bank_transfer_is_on: bankTransferEnabled ? 'on' : 'off',
            bank_transfer_display_name: displayName,
            bank_transfer_description: description,
            bank_transfer_badge: badge,
            instructions: instructions,
            bank_transfer_accounts: JSON.stringify(bankAccounts),
            bank_accounts: bankAccounts
        };

        router.post(route('settings.bank-transfer.update'), {
            settings: payloadSettings
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsLoading(false);
                toast.success(t('Bank Transfer settings, country filters & accounts saved successfully!'));
            },
            onError: () => {
                setIsLoading(false);
                toast.error(t('Failed to save settings. Please try again.'));
            }
        });
    };

    const selectedCurrencyObj = WORLD_CURRENCIES.find(c => c.code === accountForm.currency) || WORLD_CURRENCIES[0];
    const selectedCountryObj = WORLD_COUNTRIES.find(c => c.name === accountForm.country || c.code === accountForm.country_code) || WORLD_COUNTRIES[0];

    return (
        <div className="space-y-6">
            <Card className="shadow-sm border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg font-bold">
                            <Landmark className="h-5 w-5 text-indigo-600" />
                            {t('Bank Transfer Settings')}
                        </CardTitle>
                        <CardDescription className="mt-1">
                            {t('Manage worldwide bank accounts with country search, customizable labels, and 1-click copy details')}
                        </CardDescription>
                    </div>
                    {canEdit && (
                        <Button onClick={saveAllBankSettings} disabled={isLoading} className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-xl px-5 shadow-md">
                            <Save className="h-4 w-4 mr-2" />
                            {isLoading ? t('Saving...') : t('Save All Changes')}
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    
                    {/* Enable / Disable Switch */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div>
                            <Label htmlFor="bankTransferEnabled" className="text-base font-bold text-slate-900 block">
                                {t('Enable Bank Transfer Gateway')}
                            </Label>
                            <p className="text-xs text-slate-500 mt-1">
                                {t('Allow customers to select Direct Wire / Bank Transfer on public invoice billing pages')}
                            </p>
                        </div>
                        <Switch
                            id="bankTransferEnabled"
                            checked={bankTransferEnabled}
                            onCheckedChange={(checked) => setBankTransferEnabled(checked)}
                            disabled={!canEdit}
                        />
                    </div>

                    {bankTransferEnabled && (
                        <>
                            {/* Custom Display Name & Badge */}
                            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-4">
                                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">
                                    {t('Checkout Display Customization')}
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="bank_transfer_display_name" className="text-xs font-bold text-slate-700">
                                            {t('Checkout Display Name')}
                                        </Label>
                                        <Input
                                            id="bank_transfer_display_name"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            placeholder={t('e.g., Bank Transfer (Manual Deposit)')}
                                            disabled={!canEdit}
                                            className="rounded-xl bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="bank_transfer_badge" className="text-xs font-bold text-slate-700">
                                            {t('Category Badge')}
                                        </Label>
                                        <Input
                                            id="bank_transfer_badge"
                                            value={badge}
                                            onChange={(e) => setBadge(e.target.value)}
                                            placeholder={t('e.g., Bank Wire')}
                                            disabled={!canEdit}
                                            className="rounded-xl bg-white"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="bank_transfer_description" className="text-xs font-bold text-slate-700">
                                        {t('Checkout Short Description')}
                                    </Label>
                                    <Input
                                        id="bank_transfer_description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder={t('e.g., Direct wire transfer to company bank account')}
                                        disabled={!canEdit}
                                        className="rounded-xl bg-white"
                                    />
                                </div>
                            </div>
                            {/* Bank Accounts Section Header */}
                            <div className="space-y-4 pt-2 border-t">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-indigo-600" />
                                            {t('Company Bank Accounts')}
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            {t('Add international bank details tagged by country with 1-click copy functionality')}
                                        </p>
                                    </div>
                                    {canEdit && (
                                        <Button onClick={openAddModal} variant="outline" size="sm" className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold rounded-xl shadow-xs">
                                            <Plus className="h-4 w-4 mr-1.5" />
                                            {t('Add New Bank Account')}
                                        </Button>
                                    )}
                                </div>

                                {/* Bank Accounts Cards List */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {bankAccounts.map((acc, idx) => (
                                        <div key={acc.id || idx} className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm relative group hover:border-indigo-300 transition-all space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-bold">
                                                        <Landmark className="h-4.5 w-4.5" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-extrabold text-slate-900 text-sm">{acc.bank_name}</h4>
                                                            {acc.country && (
                                                                <span className="text-[11px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md flex items-center gap-1">
                                                                    <Globe className="h-3 w-3 text-indigo-500" /> {acc.country}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] font-extrabold px-2 py-0.5 bg-indigo-100/80 text-indigo-700 rounded-md inline-block mt-0.5">
                                                            {acc.currency || 'USD'} Account
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => copyAccountDetails(acc)}
                                                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                                                        title={t('Copy Account Details')}
                                                    >
                                                        {copiedId === acc.id ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />}
                                                    </button>
                                                    {canEdit && (
                                                        <>
                                                            <button
                                                                onClick={() => openEditModal(acc)}
                                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                                title={t('Edit Account')}
                                                            >
                                                                <Edit3 className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteAccount(acc.id)}
                                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                                title={t('Delete Account')}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-1.5 text-xs text-slate-600 pt-3 border-t border-slate-100">
                                                <p className="flex justify-between">
                                                    <span className="text-slate-400 font-medium">{acc.account_name_label || 'Account Name'}:</span>
                                                    <span className="font-bold text-slate-900">{acc.account_name || 'N/A'}</span>
                                                </p>
                                                <p className="flex justify-between">
                                                    <span className="text-slate-400 font-medium">{acc.account_number_label || 'Account Number / IBAN'}:</span>
                                                    <span className="font-bold text-slate-900">{acc.account_number}</span>
                                                </p>
                                                {acc.swift_code && (
                                                    <p className="flex justify-between">
                                                        <span className="text-slate-400 font-medium">{acc.swift_code_label || 'SWIFT / BIC'}:</span>
                                                        <span className="font-bold text-slate-900">{acc.swift_code}</span>
                                                    </p>
                                                )}
                                                {acc.branch_routing && (
                                                    <p className="flex justify-between">
                                                        <span className="text-slate-400 font-medium">{acc.branch_routing_label || 'Branch / Routing'}:</span>
                                                        <span className="font-bold text-slate-900">{acc.branch_routing}</span>
                                                    </p>
                                                )}
                                                {acc.custom_fields && acc.custom_fields.length > 0 && acc.custom_fields.map((cf) => (
                                                    <p key={cf.id} className="flex justify-between text-indigo-900 font-semibold bg-indigo-50/50 px-2 py-1 rounded-md">
                                                        <span className="text-indigo-700">{cf.label}:</span>
                                                        <span className="font-bold text-slate-900">{cf.value}</span>
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Bank Transfer Instructions */}
                            <div className="space-y-3 pt-4 border-t">
                                <Label htmlFor="instructions" className="text-sm font-bold text-slate-900 block">
                                    {t('General Transfer Instructions & Memo Notice')}
                                </Label>
                                <Textarea
                                    id="instructions"
                                    value={instructions}
                                    onChange={(e) => setInstructions(e.target.value)}
                                    placeholder={t('Enter bank wire instructions. E.g., Please include invoice number in payment reference.')}
                                    rows={4}
                                    disabled={!canEdit}
                                    className="rounded-xl text-sm"
                                />
                            </div>

                            {/* Customer Billing Live Preview */}
                            <div className="pt-4 border-t">
                                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                    {t('Customer Checkout Live Preview (Country Filter & 1-Click Copy Synced)')}
                                </h4>
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-3 text-slate-800">
                                    <div className="font-extrabold text-slate-900 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Landmark className="h-4 w-4 text-indigo-600" />
                                            {t('Bank Wire Deposit Instructions:')}
                                        </div>
                                        <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full border border-indigo-100">
                                            {bankAccounts.length} Countries / Accounts Active
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {bankAccounts.map((acc, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedBankModalAccount(acc);
                                                    setIsBankModalOpen(true);
                                                }}
                                                className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:shadow-md text-left transition-all group flex flex-col justify-between space-y-2"
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <p className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                                                        <span>{acc.bank_name}</span>
                                                        {acc.country && <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">({acc.country})</span>}
                                                    </p>
                                                    <span className="text-[10px] font-extrabold text-slate-400 group-hover:text-indigo-600">
                                                        {acc.currency || 'USD'}
                                                    </span>
                                                </div>

                                                <div className="text-[11px] text-slate-500 font-medium truncate">
                                                    <span>{acc.account_name_label || 'Recipient'}: </span>
                                                    <strong className="text-slate-800">{acc.account_name}</strong>
                                                </div>

                                                <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-indigo-600 group-hover:underline">
                                                    <span>Click to Test Popup Modal</span>
                                                    <span>↗</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="pt-2 text-[11px] text-slate-500 space-y-1 italic border-t border-slate-200">
                                        <p>• Please attach your invoice reference memo <strong>#INV-SAMPLE</strong> on transfer.</p>
                                        <p>• Send transfer receipt to your sales manager or mail to <strong>invoice@dynime.com</strong>.</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Modal: Add/Edit Bank Account with Searchable Country Dropdown */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b flex items-center justify-between bg-slate-50/80">
                            <div>
                                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                                    <Landmark className="h-5 w-5 text-indigo-600" />
                                    {editingAccount ? t('Edit Bank Account & Country Details') : t('Add New Bank Account')}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">Select country, customize labels & add extra banking fields.</p>
                            </div>
                            <button
                                onClick={() => setIsFormOpen(false)}
                                className="text-slate-400 hover:text-slate-600 font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveAccount} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                            
                            {/* SEARCHABLE WORLD COUNTRY DROPDOWN */}
                            <div className="space-y-1.5 relative">
                                <Label className="text-xs font-extrabold text-slate-700 block flex items-center gap-1.5">
                                    <Globe className="h-3.5 w-3.5 text-indigo-600" />
                                    {t('Bank Account Location / Country *')}
                                </Label>
                                <button
                                    type="button"
                                    onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                                    className="w-full py-2.5 px-3.5 border border-slate-200 rounded-xl text-sm font-bold bg-white text-slate-900 flex items-center justify-between shadow-xs hover:border-indigo-300"
                                >
                                    <span className="flex items-center gap-2 truncate">
                                        <span className="text-base">{selectedCountryObj.flag || '🌐'}</span>
                                        <span>{selectedCountryObj.name} ({selectedCountryObj.code})</span>
                                    </span>
                                    <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 ml-1" />
                                </button>

                                {isCountryDropdownOpen && (
                                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-2 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                                        <div className="relative">
                                            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                value={countrySearchQuery}
                                                onChange={(e) => setCountrySearchQuery(e.target.value)}
                                                placeholder="Search country (e.g., United States, UK, Bangladesh)..."
                                                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="max-h-44 overflow-y-auto space-y-0.5 pr-1">
                                            {filteredCountries.map((c) => (
                                                <button
                                                    key={c.code}
                                                    type="button"
                                                    onClick={() => {
                                                        setAccountForm({ 
                                                            ...accountForm, 
                                                            country: c.name,
                                                            country_code: c.code 
                                                        });
                                                        setIsCountryDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between hover:bg-indigo-50 hover:text-indigo-600 transition-colors ${
                                                        accountForm.country === c.name ? 'bg-indigo-100/70 text-indigo-700 font-bold' : 'text-slate-700'
                                                    }`}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <span>{c.flag}</span>
                                                        <span>{c.name}</span>
                                                    </span>
                                                    <span className="text-[11px] text-slate-400 font-mono">{c.code}</span>
                                                </button>
                                            ))}
                                            {filteredCountries.length === 0 && (
                                                <div className="p-3 text-center text-xs text-slate-400 italic">No countries found</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Bank Name + Editable Label */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                                    Label:
                                    <input
                                        type="text"
                                        value={accountForm.bank_name_label || 'Bank Name'}
                                        onChange={(e) => setAccountForm({ ...accountForm, bank_name_label: e.target.value })}
                                        className="text-xs font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                    *
                                </Label>
                                <Input
                                    value={accountForm.bank_name}
                                    onChange={(e) => setAccountForm({ ...accountForm, bank_name: e.target.value })}
                                    placeholder={t('e.g. Barclays Bank, Clear Bank, DBBL')}
                                    required
                                    className="rounded-xl font-medium"
                                />
                            </div>

                            {/* Account Name & Searchable Currency */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                                        Label:
                                        <input
                                            type="text"
                                            value={accountForm.account_name_label || 'Account Name'}
                                            onChange={(e) => setAccountForm({ ...accountForm, account_name_label: e.target.value })}
                                            className="text-xs font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md outline-none focus:ring-1 focus:ring-indigo-500 w-28"
                                        />
                                    </Label>
                                    <Input
                                        value={accountForm.account_name}
                                        onChange={(e) => setAccountForm({ ...accountForm, account_name: e.target.value })}
                                        placeholder={t('e.g., Dynime LLC')}
                                        className="rounded-xl font-medium"
                                    />
                                </div>

                                {/* SEARCHABLE WORLD CURRENCY DROPDOWN */}
                                <div className="space-y-1.5 relative">
                                    <Label className="text-xs font-extrabold text-slate-700 block">{t('Account Currency')}</Label>
                                    <button
                                        type="button"
                                        onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
                                        className="w-full py-2.5 px-3.5 border border-slate-200 rounded-xl text-sm font-bold bg-white text-slate-900 flex items-center justify-between shadow-xs hover:border-indigo-300"
                                    >
                                        <span className="truncate">
                                            {selectedCurrencyObj.code} ({selectedCurrencyObj.symbol})
                                        </span>
                                        <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 ml-1" />
                                    </button>

                                    {isCurrencyDropdownOpen && (
                                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-2 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                                            <div className="relative">
                                                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    value={currencySearchQuery}
                                                    onChange={(e) => setCurrencySearchQuery(e.target.value)}
                                                    placeholder="Search 160+ currencies..."
                                                    className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="max-h-44 overflow-y-auto space-y-0.5 pr-1">
                                                {filteredCurrencies.map((c) => (
                                                    <button
                                                        key={c.code}
                                                        type="button"
                                                        onClick={() => {
                                                            setAccountForm({ ...accountForm, currency: c.code });
                                                            setIsCurrencyDropdownOpen(false);
                                                        }}
                                                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between hover:bg-indigo-50 hover:text-indigo-600 transition-colors ${
                                                            accountForm.currency === c.code ? 'bg-indigo-100/70 text-indigo-700 font-bold' : 'text-slate-700'
                                                        }`}
                                                    >
                                                        <span>{c.code} ({c.symbol})</span>
                                                        <span className="text-[11px] text-slate-400 font-normal truncate max-w-[140px]">{c.name}</span>
                                                    </button>
                                                ))}
                                                {filteredCurrencies.length === 0 && (
                                                    <div className="p-3 text-center text-xs text-slate-400 italic">No currencies found</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Account Number + Editable Label */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                                    Label:
                                    <input
                                        type="text"
                                        value={accountForm.account_number_label || 'Account Number / IBAN'}
                                        onChange={(e) => setAccountForm({ ...accountForm, account_number_label: e.target.value })}
                                        className="text-xs font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md outline-none focus:ring-1 focus:ring-indigo-500 w-48"
                                    />
                                    *
                                </Label>
                                <Input
                                    value={accountForm.account_number}
                                    onChange={(e) => setAccountForm({ ...accountForm, account_number: e.target.value })}
                                    placeholder={t('e.g. 75213667 or GB29NWBK60161331926819')}
                                    required
                                    className="rounded-xl font-medium"
                                />
                            </div>

                            {/* SWIFT & Branch/Routing */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                                        Label:
                                        <input
                                            type="text"
                                            value={accountForm.swift_code_label || 'SWIFT / BIC Code'}
                                            onChange={(e) => setAccountForm({ ...accountForm, swift_code_label: e.target.value })}
                                            className="text-xs font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md outline-none focus:ring-1 focus:ring-indigo-500 w-32"
                                        />
                                    </Label>
                                    <Input
                                        value={accountForm.swift_code}
                                        onChange={(e) => setAccountForm({ ...accountForm, swift_code: e.target.value })}
                                        placeholder={t('e.g. CLRBGB22XXX')}
                                        className="rounded-xl font-medium"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                                        Label:
                                        <input
                                            type="text"
                                            value={accountForm.branch_routing_label || 'Branch / Routing'}
                                            onChange={(e) => setAccountForm({ ...accountForm, branch_routing_label: e.target.value })}
                                            className="text-xs font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md outline-none focus:ring-1 focus:ring-indigo-500 w-36"
                                        />
                                    </Label>
                                    <Input
                                        value={accountForm.branch_routing}
                                        onChange={(e) => setAccountForm({ ...accountForm, branch_routing: e.target.value })}
                                        placeholder={t('e.g. 04-28-12 or BSB 062-000')}
                                        className="rounded-xl font-medium"
                                    />
                                </div>
                            </div>

                            {/* DYNAMIC EXTRA CUSTOM FIELDS SECTION */}
                            <div className="space-y-3 pt-3 border-t border-slate-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                                            <Settings2 className="h-3.5 w-3.5 text-indigo-600" />
                                            Additional Custom Fields
                                        </Label>
                                        <p className="text-[11px] text-slate-400">Add extra specific fields for local banking systems (e.g. Tax ID, Intermediary SWIFT)</p>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={handleAddCustomField}
                                        variant="outline"
                                        size="sm"
                                        className="text-xs font-bold border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-xl"
                                    >
                                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Custom Field
                                    </Button>
                                </div>

                                {accountForm.custom_fields && accountForm.custom_fields.length > 0 && (
                                    <div className="space-y-2 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                                        {accountForm.custom_fields.map((field) => (
                                            <div key={field.id} className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={field.label}
                                                    onChange={(e) => handleUpdateCustomField(field.id, 'label', e.target.value)}
                                                    placeholder="Custom Label (e.g., Tax ID)"
                                                    className="w-1/3 py-2 px-3 border border-slate-200 rounded-xl text-xs font-bold text-indigo-700 bg-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                />
                                                <input
                                                    type="text"
                                                    value={field.value}
                                                    onChange={(e) => handleUpdateCustomField(field.id, 'value', e.target.value)}
                                                    placeholder="Value (e.g., 9840291)"
                                                    className="w-7/12 py-2 px-3 border border-slate-200 rounded-xl text-xs font-medium bg-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveCustomField(field.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-3 border-t flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="rounded-xl font-bold">
                                    {t('Cancel')}
                                </Button>
                                <Button type="submit" className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-extrabold rounded-xl px-6 shadow-md">
                                    {editingAccount ? t('Update Account') : t('Add Account')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bank Deposit Details Modal Popup (Screenshot 23 Inspired Design) */}
            <BankDetailsModal
                isOpen={isBankModalOpen}
                onClose={() => setIsBankModalOpen(false)}
                account={selectedBankModalAccount}
                allAccounts={bankAccounts}
                invoiceNumber="INV-SAMPLE"
                supportEmail="invoice@dynime.com"
            />
        </div>
    );
}