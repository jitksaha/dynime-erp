import InputError from '@/components/ui/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AuthLayout from '@/layouts/auth-layout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserCheck, Building2, ShoppingBag, Key, User, Briefcase, MapPin, CreditCard, Clock, ShieldCheck } from 'lucide-react';

export default function Register() {
    const { t } = useTranslation();
    const { branches = [], departments = [], designations = [] } = usePage<any>().props;

    const [currentStep, setCurrentStep] = useState(1);
    const [filteredDepartments, setFilteredDepartments] = useState(departments);
    const [filteredDesignations, setFilteredDesignations] = useState(designations);

    const roleOptions = [
        { 
            value: 'staff', 
            label: t('Staff / Employee'), 
            icon: Users 
        },
        { 
            value: 'hr', 
            label: t('HR Manager'), 
            icon: UserCheck 
        },
        { 
            value: 'client', 
            label: t('Client'), 
            icon: Building2 
        },
        { 
            value: 'vendor', 
            label: t('Vendor'), 
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
        
        // Personal
        date_of_birth: '',
        gender: 'Male',
        phone: '',
        emergency_contact_name: '',
        emergency_contact_relationship: '',
        emergency_contact_number: '',

        // Employment
        branch_id: '',
        department_id: '',
        designation_id: '',
        employment_type: 'Full Time',
        employment_status: 'probation',
        work_mode: 'Remote',
        joining_date: '',
        work_location_country: 'Bangladesh',

        // Contact & Address
        address_line_1: '',
        address_line_2: '',
        city: '',
        state: '',
        country: 'Bangladesh',
        postal_code: '',

        // Financial & Payroll
        tax_payer_id: '',
        payment_method: 'bank_transfer',
        bank_name: '',
        account_holder_name: '',
        account_number: '',
        bank_identifier_code: '',
        bank_branch: '',
        bank_country: 'Bangladesh',

        // Hours & Rates
        hours_per_day: '8',
        days_per_week: '5',
        basic_salary: '',

        // Business (Client / Vendor)
        business_name: '',
        trade_license: '',
        services: '',
        billing_address: '',
    });

    useEffect(() => {
        return () => {
            reset('password', 'password_confirmation');
        };
    }, []);

    // Filter Departments when Branch changes
    useEffect(() => {
        if (data.branch_id) {
            const depts = departments.filter((d: any) => {
                if (!d.branch_id) return true;
                const branchIds = d.branch_id.toString().split(',');
                return branchIds.includes(data.branch_id.toString());
            });
            setFilteredDepartments(depts);
        } else {
            setFilteredDepartments(departments || []);
        }
    }, [data.branch_id, departments]);

    // Filter Designations when Department changes
    useEffect(() => {
        if (data.department_id) {
            const desigs = designations.filter((d: any) => {
                if (!d.department_id) return true;
                const deptIds = d.department_id.toString().split(',');
                return deptIds.includes(data.department_id.toString());
            });
            setFilteredDesignations(desigs);
        } else {
            setFilteredDesignations(designations || []);
        }
    }, [data.department_id, designations]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register.request'));
    };

    const isStaffOrHr = data.role === 'staff' || data.role === 'hr';

    return (
        <AuthLayout
            title={t('Employee & User Onboarding')}
            description={t('Enter your details and company invite code to submit an onboarding request')}
            maxWidthClass="max-w-3xl"
        >
            <Head title={t('Register')} />
            
            <form onSubmit={submit} className="space-y-6">
                {/* 1. Role Selection via Compact Row Pills */}
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        {t('I want to register as')} *
                    </Label>

                    <div className="grid grid-cols-4 gap-2">
                        {roleOptions.map((item) => {
                            const Icon = item.icon;
                            const isSelected = data.role === item.value;
                            return (
                                <button
                                    key={item.value}
                                    type="button"
                                    onClick={() => setData('role', item.value)}
                                    className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg border text-xs font-bold transition-all ${
                                        isSelected 
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                                            : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-gray-300'
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                    <InputError message={errors.role} />
                </div>

                {/* 2. Invitation Code Field */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="invitation_code" className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            {t('Company Invite Code')} *
                        </Label>
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
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
                        className="w-full px-3 py-1.5 uppercase font-mono text-xs tracking-wider font-semibold border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                    />
                    <InputError message={errors.invitation_code} />
                </div>

                {/* 3. Step-by-Step Multi-Step Wizard for Staff / HR Self-Signup */}
                {isStaffOrHr ? (
                    <div className="space-y-4 pt-2">
                        {/* Step Progress Indicators */}
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 text-xs font-semibold">
                            {[
                                { step: 1, label: t('Personal') },
                                { step: 2, label: t('Employment') },
                                { step: 3, label: t('Contact') },
                                { step: 4, label: t('Payroll') },
                                { step: 5, label: t('Security') },
                            ].map((s) => (
                                <button
                                    key={s.step}
                                    type="button"
                                    onClick={() => setCurrentStep(s.step)}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-all ${
                                        currentStep === s.step
                                            ? 'bg-indigo-600 text-white font-bold'
                                            : currentStep > s.step
                                            ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                                            : 'text-slate-400'
                                    }`}
                                >
                                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                                        currentStep === s.step ? 'bg-white text-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                                    }`}>
                                        {s.step}
                                    </span>
                                    <span>{s.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* STEP 1: Personal Information */}
                        {currentStep === 1 && (
                            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                                    <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                                        1. {t('Personal Information')}
                                    </h3>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="name" className="text-xs font-medium text-gray-900 dark:text-white">{t('Full Name')} *</Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            required
                                            placeholder={t('Enter full name')}
                                            className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white"
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
                                            className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white"
                                        />
                                        <InputError message={errors.email} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="phone" className="text-xs font-medium text-gray-900 dark:text-white">{t('Phone Number')} *</Label>
                                        <Input
                                            id="phone"
                                            type="text"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            placeholder={t('+8801700000000')}
                                            className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="date_of_birth" className="text-xs font-medium text-gray-900 dark:text-white">{t('Date of Birth')} *</Label>
                                        <Input
                                            id="date_of_birth"
                                            type="date"
                                            value={data.date_of_birth}
                                            onChange={(e) => setData('date_of_birth', e.target.value)}
                                            className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="gender" className="text-xs font-medium text-gray-900 dark:text-white">{t('Gender')}</Label>
                                        <Select value={data.gender} onValueChange={(val) => setData('gender', val)}>
                                            <SelectTrigger className="w-full h-8 text-xs dark:bg-slate-800 dark:text-white">
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
                                        <Label htmlFor="emergency_contact_name" className="text-xs font-medium text-gray-900 dark:text-white">{t('Emergency Contact Name')}</Label>
                                        <Input
                                            id="emergency_contact_name"
                                            type="text"
                                            value={data.emergency_contact_name}
                                            onChange={(e) => setData('emergency_contact_name', e.target.value)}
                                            placeholder={t('Name of relative')}
                                            className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="emergency_contact_number" className="text-xs font-medium text-gray-900 dark:text-white">{t('Emergency Phone')}</Label>
                                        <Input
                                            id="emergency_contact_number"
                                            type="text"
                                            value={data.emergency_contact_number}
                                            onChange={(e) => setData('emergency_contact_number', e.target.value)}
                                            placeholder={t('+8801800000000')}
                                            className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: Employment Details */}
                        {currentStep === 2 && (
                            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                                    <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                                        2. {t('Employment Details')}
                                    </h3>
                                </div>

                                {branches && branches.length > 0 && (
                                    <div className="space-y-1">
                                        <Label htmlFor="branch_id" className="text-xs font-medium text-gray-900 dark:text-white">{t('Branch')}</Label>
                                        <Select value={data.branch_id} onValueChange={(val) => setData('branch_id', val)}>
                                            <SelectTrigger className="w-full h-8 text-xs dark:bg-slate-800 dark:text-white">
                                                <SelectValue placeholder={t('Select Branch')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {branches.map((b: any) => (
                                                    <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="department_id" className="text-xs font-medium text-gray-900 dark:text-white">{t('Department')} *</Label>
                                        {filteredDepartments && filteredDepartments.length > 0 ? (
                                            <Select value={data.department_id} onValueChange={(val) => setData('department_id', val)}>
                                                <SelectTrigger className="w-full h-8 text-xs dark:bg-slate-800 dark:text-white">
                                                    <SelectValue placeholder={t('Select Department')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {filteredDepartments.map((d: any) => (
                                                        <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Input
                                                id="department"
                                                type="text"
                                                value={data.department_id}
                                                onChange={(e) => setData('department_id', e.target.value)}
                                                placeholder={t('e.g. Software Engineering')}
                                                className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white"
                                            />
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="designation_id" className="text-xs font-medium text-gray-900 dark:text-white">{t('Designation / Title')}</Label>
                                        {filteredDesignations && filteredDesignations.length > 0 ? (
                                            <Select value={data.designation_id} onValueChange={(val) => setData('designation_id', val)}>
                                                <SelectTrigger className="w-full h-8 text-xs dark:bg-slate-800 dark:text-white">
                                                    <SelectValue placeholder={t('Select Designation')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {filteredDesignations.map((d: any) => (
                                                        <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Input
                                                id="designation"
                                                type="text"
                                                value={data.designation_id}
                                                onChange={(e) => setData('designation_id', e.target.value)}
                                                placeholder={t('e.g. Senior Developer')}
                                                className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white"
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="employment_type" className="text-xs font-medium text-gray-900 dark:text-white">{t('Employment Type')}</Label>
                                        <Select value={data.employment_type} onValueChange={(val) => setData('employment_type', val)}>
                                            <SelectTrigger className="w-full h-8 text-xs dark:bg-slate-800 dark:text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Full Time">Full Time</SelectItem>
                                                <SelectItem value="Part Time">Part Time</SelectItem>
                                                <SelectItem value="Contract">Contract</SelectItem>
                                                <SelectItem value="Probation">Probation</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="work_mode" className="text-xs font-medium text-gray-900 dark:text-white">{t('Work Mode')}</Label>
                                        <Select value={data.work_mode} onValueChange={(val) => setData('work_mode', val)}>
                                            <SelectTrigger className="w-full h-8 text-xs dark:bg-slate-800 dark:text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Remote">Remote</SelectItem>
                                                <SelectItem value="Onsite">Onsite</SelectItem>
                                                <SelectItem value="Hybrid">Hybrid</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="joining_date" className="text-xs font-medium text-gray-900 dark:text-white">{t('Joining Date')}</Label>
                                        <Input
                                            id="joining_date"
                                            type="date"
                                            value={data.joining_date}
                                            onChange={(e) => setData('joining_date', e.target.value)}
                                            className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: Contact & Address */}
                        {currentStep === 3 && (
                            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                                    <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                                        3. {t('Contact & Address')}
                                    </h3>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="address_line_1" className="text-xs font-medium text-gray-900 dark:text-white">{t('Address Line 1')}</Label>
                                        <Input
                                            id="address_line_1"
                                            type="text"
                                            value={data.address_line_1}
                                            onChange={(e) => setData('address_line_1', e.target.value)}
                                            placeholder={t('House #, Road #, Area...')}
                                            className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="address_line_2" className="text-xs font-medium text-gray-900 dark:text-white">{t('Address Line 2')}</Label>
                                        <Input
                                            id="address_line_2"
                                            type="text"
                                            value={data.address_line_2}
                                            onChange={(e) => setData('address_line_2', e.target.value)}
                                            placeholder={t('Apartment, Suite, Unit')}
                                            className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="city" className="text-xs font-medium text-gray-900 dark:text-white">{t('City')}</Label>
                                        <Input
                                            id="city"
                                            type="text"
                                            value={data.city}
                                            onChange={(e) => setData('city', e.target.value)}
                                            placeholder={t('Dhaka')}
                                            className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="state" className="text-xs font-medium text-gray-900 dark:text-white">{t('State / Division')}</Label>
                                        <Input
                                            id="state"
                                            type="text"
                                            value={data.state}
                                            onChange={(e) => setData('state', e.target.value)}
                                            placeholder={t('Dhaka')}
                                            className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white"
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
                                            className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 4: Financial & Payroll Details */}
                        {currentStep === 4 && (
                            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                                    <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                                        4. {t('Payroll & Financial Information')}
                                    </h3>
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="tax_payer_id" className="text-xs font-medium text-gray-900 dark:text-white">{t('NID / Passport / Tax Payer ID')}</Label>
                                    <Input
                                        id="tax_payer_id"
                                        type="text"
                                        value={data.tax_payer_id}
                                        onChange={(e) => setData('tax_payer_id', e.target.value)}
                                        placeholder={t('NID-9382109831')}
                                        className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="bank_name" className="text-xs font-medium text-gray-900 dark:text-white">{t('Bank / Mobile Wallet Name')}</Label>
                                        <Input
                                            id="bank_name"
                                            type="text"
                                            value={data.bank_name}
                                            onChange={(e) => setData('bank_name', e.target.value)}
                                            placeholder={t('City Bank / bKash / Nagad')}
                                            className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="account_holder_name" className="text-xs font-medium text-gray-900 dark:text-white">{t('Account Holder Name')}</Label>
                                        <Input
                                            id="account_holder_name"
                                            type="text"
                                            value={data.account_holder_name}
                                            onChange={(e) => setData('account_holder_name', e.target.value)}
                                            placeholder={t('Name on account')}
                                            className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="account_number" className="text-xs font-medium text-gray-900 dark:text-white">{t('Account / Mobile No')}</Label>
                                        <Input
                                            id="account_number"
                                            type="text"
                                            value={data.account_number}
                                            onChange={(e) => setData('account_number', e.target.value)}
                                            placeholder={t('11029381029')}
                                            className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="bank_identifier_code" className="text-xs font-medium text-gray-900 dark:text-white">{t('SWIFT / Routing Code')}</Label>
                                        <Input
                                            id="bank_identifier_code"
                                            type="text"
                                            value={data.bank_identifier_code}
                                            onChange={(e) => setData('bank_identifier_code', e.target.value)}
                                            placeholder={t('CBLDBDHX')}
                                            className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 5: Password Credentials & Security */}
                        {currentStep === 5 && (
                            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                                    <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                                        5. {t('Account Security')}
                                    </h3>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="hours_per_day" className="text-xs font-medium text-gray-900 dark:text-white">{t('Hours Per Day')}</Label>
                                        <Input
                                            id="hours_per_day"
                                            type="number"
                                            value={data.hours_per_day}
                                            onChange={(e) => setData('hours_per_day', e.target.value)}
                                            placeholder="8"
                                            className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="days_per_week" className="text-xs font-medium text-gray-900 dark:text-white">{t('Days Per Week')}</Label>
                                        <Input
                                            id="days_per_week"
                                            type="number"
                                            value={data.days_per_week}
                                            onChange={(e) => setData('days_per_week', e.target.value)}
                                            placeholder="5"
                                            className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    <div className="space-y-1">
                                        <Label htmlFor="password" className="text-xs font-medium text-gray-900 dark:text-white">{t('Password')} *</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            required
                                            placeholder={t('••••••••')}
                                            className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white"
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
                                            className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white"
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
                                    onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                                    className="text-xs"
                                >
                                    {t('Previous')}
                                </Button>
                            ) : <div />}

                            {currentStep < 5 ? (
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => setCurrentStep((prev) => Math.min(5, prev + 1))}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-6"
                                >
                                    {t('Next Step')}
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="py-2 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-md transition-all"
                                >
                                    {processing ? t('Submitting Profile...') : t('Submit Registration Request')}
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Business Onboarding (Client / Vendor) */
                    <div className="space-y-3 pt-1">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="name" className="text-xs font-medium text-gray-900 dark:text-white">{t('Contact Person Name')} *</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                    placeholder={t('Enter contact person name')}
                                    className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white"
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
                                    className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="business_name" className="text-xs font-medium text-gray-900 dark:text-white">{t('Company / Organization Name')} *</Label>
                            <Input
                                id="business_name"
                                type="text"
                                value={data.business_name}
                                onChange={(e) => setData('business_name', e.target.value)}
                                placeholder={t('e.g. Acme Corporation')}
                                className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="password" className="text-xs font-medium text-gray-900 dark:text-white">{t('Password')} *</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    required
                                    placeholder={t('••••••••')}
                                    className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white"
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
                                    className="w-full px-3 py-1.5 text-xs border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={processing}
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm"
                        >
                            {processing ? t('Submitting...') : t('Submit Registration Request')}
                        </Button>
                    </div>
                )}

                <div className="text-center text-xs text-gray-600 dark:text-gray-400 pt-1">
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
