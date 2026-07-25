import InputError from '@/components/ui/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AuthLayout from '@/layouts/auth-layout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserCheck, Building2, ShoppingBag, Key, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useBrand } from '@/contexts/brand-context';

export default function Register() {
    const { t } = useTranslation();
    const { getPrimaryColor } = useBrand();
    const primaryColor = getPrimaryColor();

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
        date_of_birth: '',
        gender: 'Male',
        phone: '',
        department: '',
        business_name: '',
        billing_address: '',
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

    return (
        <AuthLayout
            title={t('Create an account')}
            description={t('Select your role and enter your details to submit an onboarding request')}
        >
            <Head title={t('Register')} />
            
            <form onSubmit={submit} className="space-y-5">
                {/* 1. Role Selection via Radio Cards */}
                <div className="space-y-2.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        {t('I want to register as')} *
                    </Label>

                    <div className="grid grid-cols-2 gap-2.5">
                        {roleOptions.map((item) => {
                            const Icon = item.icon;
                            const isSelected = data.role === item.value;
                            return (
                                <div
                                    key={item.value}
                                    onClick={() => setData('role', item.value)}
                                    className={`relative flex flex-col p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                                        isSelected 
                                            ? 'bg-indigo-50/50 dark:bg-indigo-950/40 border-indigo-600 dark:border-indigo-500 shadow-sm' 
                                            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300 dark:border-slate-600'}`}>
                                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                                        {item.label}
                                    </span>
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                                        {item.desc}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <InputError message={errors.role} />
                </div>

                {/* 2. Invitation Code Field */}
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="invitation_code" className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-amber-600" />
                            {t('Company Invite / Registration Code')} *
                        </Label>
                        <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full">
                            {t('One-Time Code')}
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
                        className="w-full px-3 py-2 uppercase font-mono text-sm tracking-wider font-semibold border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                    />
                    <p className="text-[10px] text-amber-800 dark:text-amber-400">
                        {t('Issued by Company / HR. Contact HR if you need an invite code.')}
                    </p>
                    <InputError message={errors.invitation_code} />
                </div>

                {/* 3. Basic Credentials */}
                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-xs font-medium text-gray-900 dark:text-white">{t('Full Name')} *</Label>
                        <Input
                            id="name"
                            type="text"
                            name="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            placeholder={t('Enter full name')}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-slate-700 dark:text-white"
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-xs font-medium text-gray-900 dark:text-white">{t('Email Address')} *</Label>
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            required
                            placeholder={t('name@example.com')}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-slate-700 dark:text-white"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="phone" className="text-xs font-medium text-gray-900 dark:text-white">{t('Phone Number')}</Label>
                        <Input
                            id="phone"
                            type="text"
                            name="phone"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            placeholder={t('+8801700000000')}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-slate-700 dark:text-white"
                        />
                        <InputError message={errors.phone} />
                    </div>
                </div>

                {/* 4. Role-Specific Onboarding Fields */}
                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 space-y-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {t('Role-Specific Details')} ({data.role.toUpperCase()})
                    </span>

                    {(data.role === 'staff' || data.role === 'hr') && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2.5">
                                <div className="space-y-1">
                                    <Label htmlFor="date_of_birth" className="text-xs text-gray-700 dark:text-gray-300">{t('Date of Birth')}</Label>
                                    <Input
                                        id="date_of_birth"
                                        type="date"
                                        name="date_of_birth"
                                        value={data.date_of_birth}
                                        onChange={(e) => setData('date_of_birth', e.target.value)}
                                        className="w-full px-3 py-1.5 text-xs dark:bg-slate-700 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="gender" className="text-xs text-gray-700 dark:text-gray-300">{t('Gender')}</Label>
                                    <Select
                                        value={data.gender}
                                        onValueChange={(val) => setData('gender', val)}
                                    >
                                        <SelectTrigger className="w-full h-9 text-xs dark:bg-slate-700 dark:text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="department" className="text-xs text-gray-700 dark:text-gray-300">{t('Department / Role Preference')}</Label>
                                <Input
                                    id="department"
                                    type="text"
                                    name="department"
                                    value={data.department}
                                    onChange={(e) => setData('department', e.target.value)}
                                    placeholder={t('e.g. Software Engineering, Sales...')}
                                    className="w-full px-3 py-1.5 text-xs dark:bg-slate-700 dark:text-white"
                                />
                            </div>
                        </div>
                    )}

                    {data.role === 'client' && (
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <Label htmlFor="business_name" className="text-xs text-gray-700 dark:text-gray-300">{t('Company / Organization Name')}</Label>
                                <Input
                                    id="business_name"
                                    type="text"
                                    name="business_name"
                                    value={data.business_name}
                                    onChange={(e) => setData('business_name', e.target.value)}
                                    placeholder={t('e.g. Acme Corp Inc.')}
                                    className="w-full px-3 py-1.5 text-xs dark:bg-slate-700 dark:text-white"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="billing_address" className="text-xs text-gray-700 dark:text-gray-300">{t('Billing Address')}</Label>
                                <Textarea
                                    id="billing_address"
                                    rows={2}
                                    value={data.billing_address}
                                    onChange={(e) => setData('billing_address', e.target.value)}
                                    placeholder={t('Street, City, Zip, Country...')}
                                    className="w-full px-3 py-1.5 text-xs dark:bg-slate-700 dark:text-white"
                                />
                            </div>
                        </div>
                    )}

                    {data.role === 'vendor' && (
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <Label htmlFor="business_name" className="text-xs text-gray-700 dark:text-gray-300">{t('Vendor / Business Name')}</Label>
                                <Input
                                    id="business_name"
                                    type="text"
                                    name="business_name"
                                    value={data.business_name}
                                    onChange={(e) => setData('business_name', e.target.value)}
                                    placeholder={t('e.g. TechParts Ltd.')}
                                    className="w-full px-3 py-1.5 text-xs dark:bg-slate-700 dark:text-white"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="trade_license" className="text-xs text-gray-700 dark:text-gray-300">{t('Trade License / Tax ID Number')}</Label>
                                <Input
                                    id="trade_license"
                                    type="text"
                                    name="trade_license"
                                    value={data.trade_license}
                                    onChange={(e) => setData('trade_license', e.target.value)}
                                    placeholder={t('TRD-938210')}
                                    className="w-full px-3 py-1.5 text-xs dark:bg-slate-700 dark:text-white"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* 5. Password Fields */}
                <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1.5">
                        <Label htmlFor="password" className="text-xs font-medium text-gray-900 dark:text-white">{t('Password')} *</Label>
                        <Input
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            required
                            autoComplete="new-password"
                            placeholder={t('••••••••')}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-slate-700 dark:text-white"
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="password_confirmation" className="text-xs font-medium text-gray-900 dark:text-white">{t('Confirm Password')} *</Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            required
                            autoComplete="new-password"
                            placeholder={t('••••••••')}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-slate-700 dark:text-white"
                        />
                        <InputError message={errors.password_confirmation} />
                    </div>
                </div>

                {/* Submit Button */}
                <Button
                    type="submit"
                    disabled={processing}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all"
                >
                    {processing ? t('Submitting...') : t('Submit Registration Request')}
                </Button>

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
