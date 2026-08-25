import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, ArrowRight, ArrowLeft, Save, Sparkles, User, Phone, MapPin, Building, CreditCard, Laptop, ShieldCheck } from 'lucide-react';
import DeviceConfigStep, { DeviceData } from './Steps/DeviceConfigStep';
import axios from 'axios';

interface Props {
    employee: any;
    progress: {
        percentage: number;
        status: string;
        sections: Record<string, boolean>;
        completed_sections: string[];
    };
    branches: any[];
    departments: any[];
    designations: any[];
}

export default function OnboardingWizard({ employee, progress, branches, departments, designations }: Props) {
    const { t } = useTranslation();

    const [activeStepIndex, setActiveStepIndex] = useState(0);
    const [saving, setSaving] = useState(false);
    const [savedNotice, setSavedNotice] = useState(false);
    const [currentProgress, setCurrentProgress] = useState(progress);

    // Form states
    const [formData, setFormData] = useState({
        // Personal
        name: employee.user?.name || '',
        date_of_birth: employee.date_of_birth ? employee.date_of_birth.substring(0, 10) : '',
        gender: employee.gender || 'male',

        // Contact
        official_email: employee.official_email || employee.user?.email || '',
        whatsapp: employee.whatsapp || '',

        // Emergency
        emergency_contact_name: employee.emergency_contact_name || '',
        emergency_contact_relationship: employee.emergency_contact_relationship || '',
        emergency_contact_number: employee.emergency_contact_number || '',

        // Address
        address_line_1: employee.address_line_1 || '',
        address_line_2: employee.address_line_2 || '',
        city: employee.city || '',
        state: employee.state || '',
        country: employee.country || 'United States',
        postal_code: employee.postal_code || '',

        // Bank
        bank_name: employee.bank_name || '',
        account_holder_name: employee.account_holder_name || '',
        account_number: employee.account_number || '',
        bank_identifier_code: employee.bank_identifier_code || '',
        bank_branch: employee.bank_branch || '',
        bank_country: employee.bank_country || '',
        bank_notes: employee.bank_notes || '',

        // Devices
        devices: (employee.devices || []).map((d: any) => ({
            device_ownership: d.device_ownership,
            device_category: d.device_category,
            purchase_month_year: d.purchase_month_year,
            device_name: d.device_name,
            brand: d.brand,
            model: d.model,
            serial_number: d.serial_number,
            imei: d.imei,
            mobile_number: d.mobile_number,
            operating_system: d.operating_system,
            os_version: d.os_version,
            notes: d.notes,
        })) as DeviceData[],
    });

    const steps = [
        { id: 'personal', title: t('Personal Information'), icon: User },
        { id: 'contact', title: t('Contact & Emergency'), icon: Phone },
        { id: 'address', title: t('Address Details'), icon: MapPin },
        { id: 'employment', title: t('Employment Summary'), icon: Building },
        { id: 'bank', title: t('Bank & Payroll'), icon: CreditCard },
        { id: 'devices', title: t('Device Configuration'), icon: Laptop },
    ];

    const currentStep = steps[activeStepIndex];

    const saveCurrentStep = async () => {
        setSaving(true);
        try {
            const stepId = currentStep.id;
            let payloadData: any = {};

            if (stepId === 'personal') {
                payloadData = { name: formData.name, date_of_birth: formData.date_of_birth, gender: formData.gender };
            } else if (stepId === 'contact') {
                payloadData = {
                    official_email: formData.official_email,
                    whatsapp: formData.whatsapp,
                    emergency_contact_name: formData.emergency_contact_name,
                    emergency_contact_relationship: formData.emergency_contact_relationship,
                    emergency_contact_number: formData.emergency_contact_number,
                };
                // Also trigger emergency step save
                await axios.post(route('hrm.onboarding.save-step'), { step: 'emergency', data: payloadData });
            } else if (stepId === 'address') {
                payloadData = {
                    address_line_1: formData.address_line_1,
                    address_line_2: formData.address_line_2,
                    city: formData.city,
                    state: formData.state,
                    country: formData.country,
                    postal_code: formData.postal_code,
                };
            } else if (stepId === 'bank') {
                payloadData = {
                    bank_name: formData.bank_name,
                    account_holder_name: formData.account_holder_name,
                    account_number: formData.account_number,
                    bank_identifier_code: formData.bank_identifier_code,
                    bank_branch: formData.bank_branch,
                    bank_country: formData.bank_country,
                    bank_notes: formData.bank_notes,
                };
            } else if (stepId === 'devices') {
                payloadData = { devices: formData.devices };
            }

            const res = await axios.post(route('hrm.onboarding.save-step'), { step: stepId, data: payloadData });
            if (res.data.success && res.data.progress) {
                setCurrentProgress(res.data.progress);
            }
            setSavedNotice(true);
            setTimeout(() => setSavedNotice(false), 2500);
        } catch (e) {
            console.error('Failed to save onboarding step:', e);
        } finally {
            setSaving(false);
        }
    };

    const handleNext = async () => {
        await saveCurrentStep();
        if (activeStepIndex < steps.length - 1) {
            setActiveStepIndex(activeStepIndex + 1);
        }
    };

    const handlePrev = () => {
        if (activeStepIndex > 0) {
            setActiveStepIndex(activeStepIndex - 1);
        }
    };

    const isComplete = currentProgress.percentage >= 100 || currentProgress.status === 'completed';

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('HRM'), url: route('hrm.index') },
                { label: t('Employee Self-Onboarding') }
            ]}
            pageTitle={t('Employee Profile Completion')}
        >
            <Head title={t('Employee Self-Onboarding')} />

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header Card with Progress */}
                <Card className="bg-white border-slate-200 shadow-sm rounded-2xl p-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-600" />
                                {t('Complete Your Employee Profile')}
                            </h2>
                            <p className="text-xs text-slate-500 font-normal mt-0.5">
                                {t('Please complete all required sections. Progress is automatically saved per step.')}
                            </p>
                        </div>

                        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2.5 px-4 rounded-xl">
                            <div className="text-right">
                                <div className="text-xs text-slate-500 font-normal">{t('Completion')}</div>
                                <div className="text-sm font-semibold text-indigo-600 font-mono">{currentProgress.percentage}%</div>
                            </div>
                            <div className="w-24 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                                <div
                                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${currentProgress.percentage}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Step Navigation Tabs */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mt-6 pt-4 border-t border-slate-100">
                        {steps.map((s, idx) => {
                            const Icon = s.icon;
                            const isActive = idx === activeStepIndex;
                            const isSectionDone = currentProgress.sections[s.id as keyof typeof currentProgress.sections];

                            return (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={async () => {
                                        await saveCurrentStep();
                                        setActiveStepIndex(idx);
                                    }}
                                    className={`flex flex-col items-center text-center p-2.5 rounded-xl transition-all text-xs font-normal border ${
                                        isActive
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-sm font-medium'
                                            : isSectionDone
                                            ? 'bg-emerald-50/60 border-emerald-200/80 text-emerald-900'
                                            : 'bg-slate-50/70 border-slate-200/80 text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    <div className="flex items-center gap-1 mb-1">
                                        <Icon className="w-4 h-4 text-indigo-600 shrink-0" />
                                        {isSectionDone && <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />}
                                    </div>
                                    <span className="truncate max-w-[100px]">{s.title}</span>
                                </button>
                            );
                        })}
                    </div>
                </Card>

                {/* Form Content Card */}
                <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                    <CardContent className="p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                {React.createElement(currentStep.icon, { className: 'w-4 h-4 text-indigo-600' })}
                                {currentStep.title}
                            </h3>

                            {savedNotice && (
                                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 animate-fade-in">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    {t('Draft Saved')}
                                </span>
                            )}
                        </div>

                        {/* STEP 1: PERSONAL INFO */}
                        {currentStep.id === 'personal' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label className="text-xs font-medium text-slate-700">{t('Full Name')}</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="rounded-xl text-xs font-normal"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-700">{t('Date of Birth')}</Label>
                                    <Input
                                        type="date"
                                        value={formData.date_of_birth}
                                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                        className="rounded-xl text-xs font-normal"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-700">{t('Gender')}</Label>
                                    <Select
                                        value={formData.gender}
                                        onValueChange={(val) => setFormData({ ...formData, gender: val })}
                                    >
                                        <SelectTrigger className="rounded-xl text-xs font-normal">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">{t('Male')}</SelectItem>
                                            <SelectItem value="female">{t('Female')}</SelectItem>
                                            <SelectItem value="other">{t('Other')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: CONTACT & EMERGENCY */}
                        {currentStep.id === 'contact' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-700">{t('Official Email Address')}</Label>
                                        <Input
                                            type="email"
                                            value={formData.official_email}
                                            onChange={(e) => setFormData({ ...formData, official_email: e.target.value })}
                                            className="rounded-xl text-xs font-normal"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-700">{t('WhatsApp Mobile Number')}</Label>
                                        <Input
                                            placeholder="+8801712345678"
                                            value={formData.whatsapp}
                                            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                            className="rounded-xl text-xs font-normal"
                                        />
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-slate-100 space-y-4">
                                    <h4 className="text-xs font-semibold text-slate-800">{t('Emergency Contact Details')}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-medium text-slate-700">{t('Contact Person Name')}</Label>
                                            <Input
                                                placeholder="e.g. Jane Doe"
                                                value={formData.emergency_contact_name}
                                                onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                                                className="rounded-xl text-xs font-normal"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-medium text-slate-700">{t('Relationship')}</Label>
                                            <Input
                                                placeholder="e.g. Spouse, Parent, Brother"
                                                value={formData.emergency_contact_relationship}
                                                onChange={(e) => setFormData({ ...formData, emergency_contact_relationship: e.target.value })}
                                                className="rounded-xl text-xs font-normal"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-medium text-slate-700">{t('Emergency Phone Number')}</Label>
                                            <Input
                                                placeholder="+8801912345678"
                                                value={formData.emergency_contact_number}
                                                onChange={(e) => setFormData({ ...formData, emergency_contact_number: e.target.value })}
                                                className="rounded-xl text-xs font-normal"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: ADDRESS */}
                        {currentStep.id === 'address' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label className="text-xs font-medium text-slate-700">{t('Address Line 1')}</Label>
                                    <Input
                                        placeholder="Street address, P.O. box, company name"
                                        value={formData.address_line_1}
                                        onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })}
                                        className="rounded-xl text-xs font-normal"
                                    />
                                </div>

                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label className="text-xs font-medium text-slate-700">{t('Address Line 2 (Optional)')}</Label>
                                    <Input
                                        placeholder="Apartment, suite, unit, building, floor"
                                        value={formData.address_line_2}
                                        onChange={(e) => setFormData({ ...formData, address_line_2: e.target.value })}
                                        className="rounded-xl text-xs font-normal"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-700">{t('City')}</Label>
                                    <Input
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="rounded-xl text-xs font-normal"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-700">{t('State / Province')}</Label>
                                    <Input
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        className="rounded-xl text-xs font-normal"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-700">{t('Country')}</Label>
                                    <Input
                                        value={formData.country}
                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                        className="rounded-xl text-xs font-normal"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-700">{t('Postal / ZIP Code')}</Label>
                                    <Input
                                        value={formData.postal_code}
                                        onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                                        className="rounded-xl text-xs font-normal"
                                    />
                                </div>
                            </div>
                        )}

                        {/* STEP 4: EMPLOYMENT SUMMARY (READ ONLY) */}
                        {currentStep.id === 'employment' && (
                            <div className="space-y-4">
                                <div className="bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-xl text-xs text-amber-900 font-normal">
                                    {t('Employment details are managed by HR. If any detail below requires adjustment, please request HR edit.')}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs">
                                    <div>
                                        <span className="text-slate-500 font-normal">{t('Employee Code')}</span>
                                        <div className="font-semibold text-slate-800 font-mono mt-0.5">{employee.employee_id || '-'}</div>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 font-normal">{t('Date of Joining')}</span>
                                        <div className="font-semibold text-slate-800 mt-0.5">{employee.date_of_joining ? employee.date_of_joining.substring(0, 10) : '-'}</div>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 font-normal">{t('Department')}</span>
                                        <div className="font-semibold text-slate-800 mt-0.5">{employee.department?.department_name || '-'}</div>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 font-normal">{t('Designation')}</span>
                                        <div className="font-semibold text-slate-800 mt-0.5">{employee.designation?.designation_name || '-'}</div>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 font-normal">{t('Branch Location')}</span>
                                        <div className="font-semibold text-slate-800 mt-0.5">{employee.branch?.branch_name || '-'}</div>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 font-normal">{t('Employment Type')}</span>
                                        <div className="font-semibold text-slate-800 uppercase mt-0.5">{employee.employment_type || 'full_time'}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 5: BANK & PAYROLL */}
                        {currentStep.id === 'bank' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-700">{t('Bank Name')}</Label>
                                    <Input
                                        placeholder="e.g. Dutch-Bangla Bank / Chase Bank"
                                        value={formData.bank_name}
                                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                        className="rounded-xl text-xs font-normal"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-700">{t('Account Holder Name')}</Label>
                                    <Input
                                        value={formData.account_holder_name}
                                        onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
                                        className="rounded-xl text-xs font-normal"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-700">{t('Account Number')}</Label>
                                    <Input
                                        value={formData.account_number}
                                        onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                                        className="rounded-xl text-xs font-mono font-normal"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-700">{t('Bank Identifier Code (BIC / SWIFT / Routing)')}</Label>
                                    <Input
                                        value={formData.bank_identifier_code}
                                        onChange={(e) => setFormData({ ...formData, bank_identifier_code: e.target.value })}
                                        className="rounded-xl text-xs font-mono font-normal"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-700">{t('Bank Branch Name')}</Label>
                                    <Input
                                        value={formData.bank_branch}
                                        onChange={(e) => setFormData({ ...formData, bank_branch: e.target.value })}
                                        className="rounded-xl text-xs font-normal"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-700">{t('Bank Country')}</Label>
                                    <Input
                                        value={formData.bank_country}
                                        onChange={(e) => setFormData({ ...formData, bank_country: e.target.value })}
                                        className="rounded-xl text-xs font-normal"
                                    />
                                </div>
                            </div>
                        )}

                        {/* STEP 6: DEVICE CONFIGURATION */}
                        {currentStep.id === 'devices' && (
                            <DeviceConfigStep
                                devices={formData.devices}
                                onChange={(devs) => setFormData({ ...formData, devices: devs })}
                            />
                        )}

                        {/* Footer Controls */}
                        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handlePrev}
                                disabled={activeStepIndex === 0}
                                className="rounded-xl text-xs font-medium gap-1"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                {t('Previous')}
                            </Button>

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={saveCurrentStep}
                                    disabled={saving}
                                    className="rounded-xl text-xs font-medium gap-1 text-slate-700"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    {saving ? t('Saving...') : t('Save Draft')}
                                </Button>

                                <Button
                                    type="button"
                                    onClick={handleNext}
                                    disabled={saving}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium gap-1"
                                >
                                    {activeStepIndex === steps.length - 1 ? t('Save & Complete') : t('Save & Continue')}
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
