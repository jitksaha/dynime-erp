import InputError from '@/components/ui/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Register() {
    const { t } = useTranslation();
    const { companies = [], roles = [] } = usePage<any>().props;

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: roles[0]?.value || '',
        company_id: '',
        date_of_birth: '',
        gender: 'Male',
        phone: '',
        business_name: '',
    });

    useEffect(() => {
        return () => {
            reset('password', 'password_confirmation');
        };
    }, []);

    const isClientRole = (roleVal: string) => {
        const lower = (roleVal || '').toLowerCase();
        return lower.includes('client') || lower.includes('vendor') || lower.includes('customer') || lower.includes('buyer');
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register.request'));
    };

    return (
        <AuthLayout
            title={t('Create an account')}
            description={t('Enter your details below to create your account')}
        >
            <Head title={t('Register')} />
            <form onSubmit={submit} className="space-y-4">
                <div className="space-y-4">
                    {/* Role Selector */}
                    <div className="space-y-2">
                        <Label htmlFor="role" className="text-sm font-medium text-gray-900 dark:text-white">{t('I want to register as')}</Label>
                        <Select
                            value={data.role}
                            onValueChange={(val) => setData('role', val)}
                        >
                            <SelectTrigger className="w-full dark:bg-slate-700 dark:text-white">
                                <SelectValue placeholder={t('Select role')} />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map((role: any) => (
                                    <SelectItem key={role.value} value={role.value}>
                                        {role.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.role} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-gray-900 dark:text-white">{t('Name')}</Label>
                        <Input
                            id="name"
                            type="text"
                            name="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="name"
                            placeholder={t('Full name')}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none transition-colors placeholder-gray-400 dark:bg-slate-700 dark:text-white"
                        />
                        <InputError
                            message={errors.name}
                            className="mt-2"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-gray-900 dark:text-white">{t('Email address')}</Label>
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            required
                            tabIndex={2}
                            autoComplete="email"
                            placeholder="email@example.com"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none transition-colors placeholder-gray-400 dark:bg-slate-700 dark:text-white"
                        />
                        <InputError message={errors.email} />
                    </div>

                    {/* Conditional Questions based on Role */}
                    {data.role && !isClientRole(data.role) && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="company_id" className="text-sm font-medium text-gray-900 dark:text-white">{t('Select Company')}</Label>
                                <Select
                                    value={data.company_id}
                                    onValueChange={(val) => setData('company_id', val)}
                                >
                                    <SelectTrigger className="w-full dark:bg-slate-700 dark:text-white">
                                        <SelectValue placeholder={t('Select target company')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {companies.map((company: any) => (
                                            <SelectItem key={company.id} value={company.id.toString()}>
                                                {company.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.company_id} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date_of_birth" className="text-sm font-medium text-gray-900 dark:text-white">{t('Date of Birth')}</Label>
                                <Input
                                    id="date_of_birth"
                                    type="date"
                                    name="date_of_birth"
                                    value={data.date_of_birth}
                                    onChange={(e) => setData('date_of_birth', e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none dark:bg-slate-700 dark:text-white"
                                />
                                <InputError message={errors.date_of_birth} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="gender" className="text-sm font-medium text-gray-900 dark:text-white">{t('Gender')}</Label>
                                <Select
                                    value={data.gender}
                                    onValueChange={(val) => setData('gender', val)}
                                >
                                    <SelectTrigger className="w-full dark:bg-slate-700 dark:text-white">
                                        <SelectValue placeholder={t('Select gender')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Male">{t('Male')}</SelectItem>
                                        <SelectItem value="Female">{t('Female')}</SelectItem>
                                        <SelectItem value="Other">{t('Other')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.gender} />
                            </div>
                        </>
                    )}

                    {data.role && isClientRole(data.role) && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="company_id" className="text-sm font-medium text-gray-900 dark:text-white">{t('Select Company')}</Label>
                                <Select
                                    value={data.company_id}
                                    onValueChange={(val) => setData('company_id', val)}
                                >
                                    <SelectTrigger className="w-full dark:bg-slate-700 dark:text-white">
                                        <SelectValue placeholder={t('Select target company')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {companies.map((company: any) => (
                                            <SelectItem key={company.id} value={company.id.toString()}>
                                                {company.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.company_id} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="business_name" className="text-sm font-medium text-gray-900 dark:text-white">{t('Business / Company Name')}</Label>
                                <Input
                                    id="business_name"
                                    type="text"
                                    name="business_name"
                                    value={data.business_name}
                                    onChange={(e) => setData('business_name', e.target.value)}
                                    required
                                    placeholder={t('Enter business or company name')}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none dark:bg-slate-700 dark:text-white"
                                />
                                <InputError message={errors.business_name} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-sm font-medium text-gray-900 dark:text-white">{t('Contact Phone')}</Label>
                                <Input
                                    id="phone"
                                    type="text"
                                    name="phone"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    required
                                    placeholder={t('Enter contact phone number')}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none dark:bg-slate-700 dark:text-white"
                                />
                                <InputError message={errors.phone} />
                            </div>
                        </>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium text-gray-900 dark:text-white">{t('Password')}</Label>
                        <Input
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            required
                            tabIndex={3}
                            autoComplete="new-password"
                            placeholder={t('Password')}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none transition-colors placeholder-gray-400 dark:bg-slate-700 dark:text-white"
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password_confirmation" className="text-sm font-medium text-gray-900 dark:text-white">
                            {t('Confirm password')}
                        </Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            required
                            tabIndex={4}
                            autoComplete="new-password"
                            placeholder={t('Confirm password')}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none transition-colors placeholder-gray-400 dark:bg-slate-700 dark:text-white"
                        />
                        <InputError
                            message={errors.password_confirmation}
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-primary text-white py-2.5 text-sm font-medium tracking-wide transition-all duration-200 rounded-md shadow-md hover:shadow-lg transform hover:scale-[1.02] mt-6"
                        tabIndex={5}
                        disabled={processing}
                        data-test="register-user-button"
                    >
                        {processing ? 'Loading...' : t('CREATE ACCOUNT')}
                    </Button>
                </div>

                <div className="text-center mt-5">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('Already have an account?')}{' '}
                        <Link href={route('login')} tabIndex={6} className="text-primary font-medium hover:underline">
                            {t('Log in')}
                        </Link>
                    </p>
                </div>
            </form>
        </AuthLayout>
    );
}
