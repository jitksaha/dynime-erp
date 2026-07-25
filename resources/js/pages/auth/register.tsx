import InputError from '@/components/ui/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AuthLayout from '@/layouts/auth-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserCheck, Building2, ShoppingBag, Key, ShieldCheck, ChevronRight, ChevronLeft, CheckCircle2, User, Briefcase, MapPin, CreditCard } from 'lucide-react';

export default function Register() {
    const { t } = useTranslation();

    const [currentStep, setCurrentStep] = useState(1);

    const roleOptions = [
        { 
            value: 'staff', 
            label: t('Staff / Employee'), 
            desc: t('Access HR portal, attendance & employee tools'),
            icon: Users 
        },
        { 
            value: 'hr', 
            label: t('HR Manager'), 
            desc: t('Manage recruitment, onboarding & HR records'),
            icon: UserCheck 
        },
        { 
            value: 'client', 
            label: t('Client'), 
            desc: t('Access client portal, invoices & projects'),
            icon: Building2 
        },
        { 
            value: 'vendor', 
            label: t('Vendor / Supplier'), 
            desc: t('Manage purchase orders & supplier portal'),
            icon: ShoppingBag 
        },
    ];

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'staff',
        invitation_code: '',
        // Step 1: Personal
        date_of_birth: '',
        gender: 'Male',
        phone: '',
        emergency_contact_name: '',
        emergency_contact_number: '',
        // Step 2: Employment
        department: '',
        employment_type: 'Full Time',
        joining_date: '',
        // Step 3: Contact & Address
        address_line_1: '',
        city: '',
        state: '',
        country: 'Bangladesh',
        postal_code: '',
        // Step 4: Bank & ID
        tax_payer_id: '',
        bank_name: '',
        account_number: '',
        // Business (Client / Vendor)
        business_name: '',
        trade_license: '',
        services: '',
    });

    useEffect(() => {
        return () => {
            reset('password', 'password_confirmation');
        };
    }, []);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register.request'));
    };

    const isStaffOrHr = data.role === 'staff' || data.role === 'hr';

    return (
        <AuthLayout
            title={t('Employee & User Onboarding')}
            description={t('Enter your details and company invite code to submit an onboarding request')}
        >
            <Head title={t('Register')} />
            
            <form onSubmit={submit} className="space-y-4">
                {/* 1. Role Selection via Radio Cards */}
                <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        {t('I want to register as')} *
                    </Label>

                    <div className="grid grid-cols-2 gap-2">
                        {roleOptions.map((item) => {
                            const Icon = item.icon;
                            const isSelected = data.role === item.value;
                            return (
                                <div
                                    key={item.value}
                                    onClick={() => setData('role', item.value)}
                                    className={`relative flex flex-col p-2.5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                                        isSelected 
                                            ? 'bg-indigo-50/50 dark:bg-indigo-950/40 border-indigo-600 dark:border-indigo-500 shadow-sm' 
                                            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <div className={`p-1 rounded-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'}`}>
                                            <Icon className="w-3.5 h-3.5" />
                                        </div>
                                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300 dark:border-slate-600'}`}>
                                            {isSelected && <div className="w-1 h-1 rounded-full bg-white"></div>}
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                                        {item.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <InputError message={errors.role} />
                </div>

                {/* 2. Invitation Code Field */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="invitation_code" className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-amber-600" />
                            {t('Company Invite Code')} *
                        </Label>
                        <span className="text-[9px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full">
                            {t('Required')}
                        </span>
                    </div>
                    <Input
                        id="invitation_code"
                        type="text"
                        name="invitation_code"
                        value={data.invitation_code}
                        onChange={(e) => setData('invitation_code', e.target.value.toUpperCase())}
                        required
                        placeholder="e.g. STA-1001 or DYN-8492"
                        className="w-full px-3 py-1.5 uppercase font-mono text-xs tracking-wider font-semibold border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                    />
                    <InputError message={errors.invitation_code} />
                </div>

                {/* 3. Multi-Step Onboarding Tabs for Staff / HR */}
                {isStaffOrHr ? (
                    <div className="space-y-3">
                        {/* Steps Indicator */}
                        <div className="flex items-center justify-between border-b pb-2 text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                            <button
                                type="button"
                                onClick={() => setCurrentStep(1)}
                                className={`flex items-center gap-1 pb-1 border-b-2 transition-colors ${currentStep === 1 ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold' : 'border-transparent'}`}
                            >
                                <User className="w-3.5 h-3.5" />
                                {t('1. Personal')}
                            </button>

                            <button
                                type="button"
                                onClick={() => setCurrentStep(2)}
                                className={`flex items-center gap-1 pb-1 border-b-2 transition-colors ${currentStep === 2 ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold' : 'border-transparent'}`}
                            >
                                <Briefcase className="w-3.5 h-3.5" />
                                {t('2. Employment')}
                            </button>

                            <button
                                type="button"
                                onClick={() => setCurrentStep(3)}
                                className={`flex items-center gap-1 pb-1 border-b-2 transition-colors ${currentStep === 3 ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold' : 'border-transparent'}`}
                            >
                                <MapPin className="w-3.5 h-3.5" />
                                {t('3. Contact')}
                            </button>

                            <button
                                type="button"
                                onClick={() => setCurrentStep(4)}
                                className={`flex items-center gap-1 pb-1 border-b-2 transition-colors ${currentStep === 4 ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold' : 'border-transparent'}`}
                            >
                                <CreditCard className="w-3.5 h-3.5" />
                                {t('4. Bank & ID')}
                            </button>
                        </div>

                        {/* STEP 1: Personal */}
                        {currentStep === 1 && (
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label htmlFor="name" className="text-xs font-medium text-gray-900 dark:text-white">{t('Full Name')} *</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                        placeholder={t('Enter full name')}
                                        className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-700 dark:text-white"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="email" className="text-xs font-medium text-gray-900 dark:text-white">{t('Email Address')} *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                        placeholder={t('name@example.com')}
                                        className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-700 dark:text-white"
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label htmlFor="phone" className="text-xs font-medium text-gray-900 dark:text-white">{t('Phone Number')} *</Label>
                                        <Input
                                            id="phone"
                                            type="text"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            placeholder={t('+8801700000000')}
                                            className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="date_of_birth" className="text-xs font-medium text-gray-900 dark:text-white">{t('Date of Birth')} *</Label>
                                        <Input
                                            id="date_of_birth"
                                            type="date"
                                            value={data.date_of_birth}
                                            onChange={(e) => setData('date_of_birth', e.target.value)}
                                            className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label htmlFor="gender" className="text-xs font-medium text-gray-900 dark:text-white">{t('Gender')}</Label>
                                        <Select value={data.gender} onValueChange={(val) => setData('gender', val)}>
                                            <SelectTrigger className="w-full h-8 text-xs dark:bg-slate-700 dark:text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Male">Male</SelectItem>
                                                <SelectItem value="Female">Female</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="emergency_contact_number" className="text-xs font-medium text-gray-900 dark:text-white">{t('Emergency Contact')}</Label>
                                        <Input
                                            id="emergency_contact_number"
                                            type="text"
                                            value={data.emergency_contact_number}
                                            onChange={(e) => setData('emergency_contact_number', e.target.value)}
                                            placeholder={t('Contact number')}
                                            className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: Employment */}
                        {currentStep === 2 && (
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label htmlFor="department" className="text-xs font-medium text-gray-900 dark:text-white">{t('Department / Role Interest')}</Label>
                                    <Input
                                        id="department"
                                        type="text"
                                        value={data.department}
                                        onChange={(e) => setData('department', e.target.value)}
                                        placeholder={t('e.g. Software Engineering, Accounts, HR...')}
                                        className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-700 dark:text-white"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label htmlFor="employment_type" className="text-xs font-medium text-gray-900 dark:text-white">{t('Employment Type')}</Label>
                                        <Select value={data.employment_type} onValueChange={(val) => setData('employment_type', val)}>
                                            <SelectTrigger className="w-full h-8 text-xs dark:bg-slate-700 dark:text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Full Time">Full Time</SelectItem>
                                                <SelectItem value="Part Time">Part Time</SelectItem>
                                                <SelectItem value="Contract">Contract</SelectItem>
                                                <SelectItem value="Internship">Internship</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="joining_date" className="text-xs font-medium text-gray-900 dark:text-white">{t('Expected Joining Date')}</Label>
                                        <Input
                                            id="joining_date"
                                            type="date"
                                            value={data.joining_date}
                                            onChange={(e) => setData('joining_date', e.target.value)}
                                            className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: Contact & Address */}
                        {currentStep === 3 && (
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label htmlFor="address_line_1" className="text-xs font-medium text-gray-900 dark:text-white">{t('Street Address / Location')}</Label>
                                    <Input
                                        id="address_line_1"
                                        type="text"
                                        value={data.address_line_1}
                                        onChange={(e) => setData('address_line_1', e.target.value)}
                                        placeholder={t('House #, Road #, Area...')}
                                        className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-700 dark:text-white"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label htmlFor="city" className="text-xs font-medium text-gray-900 dark:text-white">{t('City')}</Label>
                                        <Input
                                            id="city"
                                            type="text"
                                            value={data.city}
                                            onChange={(e) => setData('city', e.target.value)}
                                            placeholder={t('Dhaka')}
                                            className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="postal_code" className="text-xs font-medium text-gray-900 dark:text-white">{t('Postal Code')}</Label>
                                        <Input
                                            id="postal_code"
                                            type="text"
                                            value={data.postal_code}
                                            onChange={(e) => setData('postal_code', e.target.value)}
                                            placeholder={t('1212')}
                                            className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 4: Bank & ID Credentials */}
                        {currentStep === 4 && (
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label htmlFor="tax_payer_id" className="text-xs font-medium text-gray-900 dark:text-white">{t('NID / Passport / Tax ID Number')}</Label>
                                    <Input
                                        id="tax_payer_id"
                                        type="text"
                                        value={data.tax_payer_id}
                                        onChange={(e) => setData('tax_payer_id', e.target.value)}
                                        placeholder={t('NID-9382109831')}
                                        className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-700 dark:text-white"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label htmlFor="bank_name" className="text-xs font-medium text-gray-900 dark:text-white">{t('Bank / Mobile Banking Name')}</Label>
                                        <Input
                                            id="bank_name"
                                            type="text"
                                            value={data.bank_name}
                                            onChange={(e) => setData('bank_name', e.target.value)}
                                            placeholder={t('City Bank / bKash')}
                                            className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="account_number" className="text-xs font-medium text-gray-900 dark:text-white">{t('Account Number')}</Label>
                                        <Input
                                            id="account_number"
                                            type="text"
                                            value={data.account_number}
                                            onChange={(e) => setData('account_number', e.target.value)}
                                            placeholder={t('11029381029')}
                                            className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>
                                </div>

                                {/* Password Credentials */}
                                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                                    <div className="space-y-1">
                                        <Label htmlFor="password" className="text-xs font-medium text-gray-900 dark:text-white">{t('Password')} *</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            required
                                            placeholder={t('••••••••')}
                                            className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-700 dark:text-white"
                                        />
                                        <InputError message={errors.password} />
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="password_confirmation" className="text-xs font-medium text-gray-900 dark:text-white">{t('Confirm Password')} *</Label>
                                        <Input
                                            id="password_confirmation"
                                            type="password"
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            required
                                            placeholder={t('••••••••')}
                                            className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step Navigation Controls */}
                        <div className="flex items-center justify-between pt-2">
                            {currentStep > 1 ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentStep((prev) => prev - 1)}
                                    className="gap-1 text-xs"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                    {t('Previous')}
                                </Button>
                            ) : <div></div>}

                            {currentStep < 4 ? (
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => setCurrentStep((prev) => prev + 1)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1 text-xs"
                                >
                                    {t('Next Step')}
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-sm"
                                >
                                    {processing ? t('Submitting...') : t('Submit Complete Profile')}
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Business Onboarding (Client / Vendor) */
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <Label htmlFor="name" className="text-xs font-medium text-gray-900 dark:text-white">{t('Contact Person Name')} *</Label>
                            <Input
                                id="name"
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                                placeholder={t('Enter contact person name')}
                                className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-700 dark:text-white"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="email" className="text-xs font-medium text-gray-900 dark:text-white">{t('Email Address')} *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                                placeholder={t('name@company.com')}
                                className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-700 dark:text-white"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="business_name" className="text-xs font-medium text-gray-900 dark:text-white">{t('Company / Organization Name')} *</Label>
                            <Input
                                id="business_name"
                                type="text"
                                value={data.business_name}
                                onChange={(e) => setData('business_name', e.target.value)}
                                placeholder={t('e.g. Acme Corporation')}
                                className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-700 dark:text-white"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label htmlFor="password" className="text-xs font-medium text-gray-900 dark:text-white">{t('Password')} *</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    required
                                    placeholder={t('••••••••')}
                                    className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-700 dark:text-white"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="password_confirmation" className="text-xs font-medium text-gray-900 dark:text-white">{t('Confirm Password')} *</Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    required
                                    placeholder={t('••••••••')}
                                    className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-700 dark:text-white"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={processing}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm"
                        >
                            {processing ? t('Submitting...') : t('Submit Registration Request')}
                        </Button>
                    </div>
                )}

                <div className="text-center text-xs text-gray-600 dark:text-gray-400 pt-2">
                    {t('Already registered?')} {' '}
                    <Link
                        href={route('login')}
                        className="font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                        {t('Log in here')}
                    </Link>
                </div>
            </form>
        </AuthLayout>
    );
}
