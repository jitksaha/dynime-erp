import { Head, useForm, usePage } from "@inertiajs/react";
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from "@/components/ui/button";
import { Label } from '@/components/ui/label';
import InputError from '@/components/ui/input-error';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PhoneInputComponent } from '@/components/ui/phone-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditEmployeeFormData } from './types';
import { useEffect, useState } from 'react';
import { Eye, Trash2 } from 'lucide-react';
import { router } from '@inertiajs/react';
import { getImagePath } from '@/utils/helpers';
import { useFormFields } from '@/hooks/useFormFields';

export default function Edit() {
    const { employee, users, branches, departments, designations, shifts, existingDocuments, documentTypes, companyAllSetting = {} } = usePage<any>().props;
    const [activeTab, setActiveTab] = useState('personal');
    const [filteredBranches, setFilteredBranches] = useState(branches || []);
    const [filteredDepartments, setFilteredDepartments] = useState(departments || []);
    const [filteredDesignations, setFilteredDesignations] = useState(designations || []);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(employee.user?.avatar ? getImagePath(employee.user.avatar) : null);
    const { t } = useTranslation();

    const paymentMethods = [
        { value: 'bank_transfer', label: t('Bank Transfer') },
        { value: 'cards_transfer', label: t('Cards Transfer') },
        { value: 'paypal', label: t('PayPal') },
        { value: 'kast', label: t('Kast') },
        { value: 'redotpay', label: t('Redotpay') },
        { value: 'remitly', label: t('Remitly') },
        { value: 'western_union', label: t('Western Union') },
        { value: 'binance_bybit', label: t('Binance / Bybit') }
    ];

    const enabledMethods = paymentMethods.filter(method => {
        const val = companyAllSetting[`payroll_method_enabled_${method.value}`];
        return val === undefined ? (method.value === 'bank_transfer') : (val === 'on');
    });

    const handleDetailChange = (key: string, value: string) => {
        const updatedDetails = {
            ...(data.payment_details || {}),
            [key]: value
        };
        
        setData(prev => {
            const newState = {
                ...prev,
                payment_details: updatedDetails
            };
            if (key === 'bank_name') newState.bank_name = value;
            if (key === 'account_holder_name') newState.account_holder_name = value;
            if (key === 'account_number') newState.account_number = value;
            if (key === 'bank_identifier_code') newState.bank_identifier_code = value;
            if (key === 'bank_branch') newState.bank_branch = value;
            if (key === 'bank_country') newState.bank_country = value;
            if (key === 'bank_notes') newState.bank_notes = value;
            if (key === 'tax_payer_id') newState.tax_payer_id = value;
            return newState;
        });
    };

    const handleMethodChange = (method: string) => {
        setData(prev => ({
            ...prev,
            payment_method: method,
            payment_details: method === 'bank_transfer' ? {
                bank_country: 'Other',
                bank_name: '',
                account_holder_name: '',
                account_number: '',
                bank_identifier_code: '',
                bank_branch: '',
                tax_payer_id: '',
                bank_notes: ''
            } : {},
            bank_name: '',
            account_holder_name: '',
            account_number: '',
            bank_identifier_code: '',
            bank_branch: '',
            bank_country: method === 'bank_transfer' ? 'Other' : '',
            bank_notes: '',
            tax_payer_id: ''
        }));
    };


    const { data, setData, put, processing, errors } = useForm<EditEmployeeFormData>({
        employee_id: employee.employee_id ?? '',
        avatar: null,
        date_of_birth: employee.date_of_birth || '',
        gender: employee.gender || 'Male',
        shift_id: employee.shift?.toString() || '',
        date_of_joining: employee.date_of_joining || '',
        employment_type: employee.employment_type || 'Full Time',
        employment_status: employee.employment_status || 'probation',
        probation_percentage: employee.probation_percentage?.toString() || '70',
        probation_period: employee.probation_period?.toString() || '3',
        work_mode: employee.work_mode || '',
        work_location_country: employee.work_location_country || '',
        address_line_1: employee.address_line_1 ?? '',
        address_line_2: employee.address_line_2 ?? '',
        city: employee.city ?? '',
        state: employee.state ?? '',
        country: employee.country ?? '',
        postal_code: employee.postal_code ?? '',
        emergency_contact_name: employee.emergency_contact_name ?? '',
        emergency_contact_relationship: employee.emergency_contact_relationship ?? '',
        emergency_contact_number: employee.emergency_contact_number ?? '',
        bank_name: employee.bank_name ?? '',
        account_holder_name: employee.account_holder_name ?? '',
        account_number: employee.account_number ?? '',
        bank_identifier_code: employee.bank_identifier_code ?? '',
        bank_branch: employee.bank_branch ?? '',
        bank_country: employee.bank_country ?? '',
        bank_notes: employee.bank_notes ?? '',
        tax_payer_id: employee.tax_payer_id ?? '',
        payment_method: employee.payment_method || 'bank_transfer',
        payment_details: employee.payment_details || (employee.payment_method === 'bank_transfer' || !employee.payment_method ? {
            bank_country: employee.bank_country || 'Other',
            bank_name: employee.bank_name || '',
            account_holder_name: employee.account_holder_name || '',
            account_number: employee.account_number || '',
            bank_identifier_code: employee.bank_identifier_code || '',
            bank_branch: employee.bank_branch || '',
            tax_payer_id: employee.tax_payer_id || '',
            bank_notes: employee.bank_notes || ''
        } : {}),
        basic_salary: employee.basic_salary?.toString() || '',
        salary_type: employee.salary_type || 'yearly',
        hours_per_day: employee.hours_per_day?.toString() || '',
        days_per_week: employee.days_per_week?.toString() || '',
        rate_per_hour: employee.rate_per_hour?.toString() || '',
        user_id: employee.user_id?.toString() || '',
        branch_id: employee.branch_id?.toString() || '',
        department_id: employee.department_id?.toString() || '',
        designation_id: employee.designation_id?.toString() || '',
        documents: [],
    });

    useEffect(() => {
        setFilteredBranches(branches || []);
        if (!data.user_id) {
            setData('branch_id', '');
        }
    }, [data.user_id]);

    useEffect(() => {
        if (data.branch_id) {
            const branchDepartments = departments.filter(dept => {
                if (!dept.branch_id) return false;
                const branchIds = dept.branch_id.toString().split(',');
                return branchIds.includes(data.branch_id.toString());
            });
            setFilteredDepartments(branchDepartments);
            if (data.department_id && !branchDepartments.find(dept => dept.id.toString() === data.department_id)) {
                setData('department_id', '');
                setData('designation_id', '');
            }
        } else {
            setFilteredDepartments([]);
            setData('department_id', '');
            setData('designation_id', '');
        }
    }, [data.branch_id]);

    useEffect(() => {
        if (data.department_id) {
            const departmentDesignations = designations.filter(desig => {
                if (!desig.department_id) return false;
                const deptIds = desig.department_id.toString().split(',');
                return deptIds.includes(data.department_id.toString());
            });
            setFilteredDesignations(departmentDesignations);
            if (data.designation_id && !departmentDesignations.find(desig => desig.id.toString() === data.designation_id)) {
                setData('designation_id', '');
            }
        } else {
            setFilteredDesignations([]);
            setData('designation_id', '');
        }
    }, [data.department_id]);

    const validatePersonalTab = () => {
        return data.employee_id.trim() !== '' &&
            data.date_of_birth !== '' &&
            data.gender !== '';
    };

    const validateEmploymentTab = () => {
        return data.employment_type !== '' &&
            data.work_mode !== '' &&
            data.work_location_country !== '' &&
            data.shift_id !== '' &&
            data.branch_id !== '' &&
            data.department_id !== '' &&
            data.designation_id !== '';
    };

    const validateContactTab = () => {
        return data.address_line_1.trim() !== '' &&
            data.city.trim() !== '' &&
            data.state.trim() !== '' &&
            data.country.trim() !== '' &&
            data.postal_code.trim() !== '' &&
            data.emergency_contact_name.trim() !== '' &&
            data.emergency_contact_relationship.trim() !== '' &&
            data.emergency_contact_number.trim() !== '';
    };

    const validatePayrollTab = () => {
        if (!data.payment_method) return false;
        const details = data.payment_details || {};
        if (data.payment_method === 'bank_transfer') {
            const country = details.bank_country || 'Other';
            if (country === 'US') {
                return !!(details.account_holder_name?.trim() && details.routing_number?.trim() && details.account_number?.trim() && details.bank_name?.trim());
            } else if (country === 'EU') {
                return !!(details.account_holder_name?.trim() && details.iban?.trim() && details.bank_name?.trim());
            } else if (country === 'UK') {
                return !!(details.account_holder_name?.trim() && details.sort_code?.trim() && details.account_number?.trim() && details.bank_name?.trim());
            } else {
                return !!(details.account_holder_name?.trim() && details.account_number?.trim() && details.bank_name?.trim());
            }
        }
        if (data.payment_method === 'cards_transfer') {
            return !!(details.cardholder_name?.trim() && details.card_number?.trim() && details.expiry_date?.trim());
        }
        if (data.payment_method === 'paypal') {
            return !!details.paypal_email?.trim();
        }
        if (data.payment_method === 'kast') {
            return !!details.kast_username?.trim();
        }
        if (data.payment_method === 'redotpay') {
            return !!details.redotpay_id?.trim();
        }
        if (data.payment_method === 'remitly') {
            return !!(details.recipient_name?.trim() && details.recipient_phone?.trim() && details.recipient_country?.trim());
        }
        if (data.payment_method === 'western_union') {
            return !!(details.recipient_name?.trim() && details.recipient_city?.trim() && details.recipient_country?.trim());
        }
        if (data.payment_method === 'binance_bybit') {
            return !!(details.wallet_address?.trim() && details.network?.trim());
        }
        return true;
    };

    const calculateRatePerHour = (salaryVal: string, hoursVal: string, daysVal: string, salaryTypeVal?: string) => {
        let salary = parseFloat(salaryVal);
        const hours = parseFloat(hoursVal);
        const days = parseFloat(daysVal);
        const salaryType = salaryTypeVal || data.salary_type || 'yearly';

        if (!isNaN(salary) && !isNaN(hours) && hours > 0) {
            if (salaryType === 'yearly') {
                salary = salary / 12;
            }

            let rate = 0;
            if (hours > 24) {
                // If hours represents monthly hours (like 266.66)
                rate = salary / hours;
            } else if (!isNaN(days) && days > 0) {
                // Standard calculation: monthly salary / (hours/day * days/week * 4.333)
                rate = salary / (hours * days * 4.333);
            } else {
                rate = salary / (hours * 22);
            }
            return rate > 0 ? rate.toFixed(2) : '';
        }
        return '';
    };

    const validateHoursTab = () => {
        return data.basic_salary?.trim() !== '' &&
            data.hours_per_day?.trim() !== '' &&
            data.days_per_week?.trim() !== '' &&
            data.rate_per_hour?.trim() !== '';
    };

    const addDocument = () => {
        setData('documents', [...data.documents, { document_type_id: '', file: '' }]);
    };

    const removeDocument = (index: number) => {
        const newDocuments = data.documents.filter((_, i) => i !== index);
        setData('documents', newDocuments);
    };

    const updateDocument = (index: number, field: string, value: any) => {
        const newDocuments = [...data.documents];
        newDocuments[index] = { ...newDocuments[index], [field]: value };
        setData('documents', newDocuments);
    };

    const biometricFields = useFormFields('biometricEmployeeIdFields', data, setData, errors, 'edit');

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        const { documents, ...employeeData } = data;

        // Check if there are documents with actual files or a new avatar
        const documentsWithFiles = documents.filter(doc => doc.file && doc.document_type_id);

        if (documentsWithFiles.length > 0 || data.avatar) {
            // Use FormData
            const formData = new FormData();

            // Add employee fields
            Object.keys(employeeData).forEach(key => {
                if (key !== 'avatar') {
                    if (key === 'payment_details' && typeof employeeData[key] === 'object' && employeeData[key] !== null) {
                        formData.append(key, JSON.stringify(employeeData[key]));
                    } else {
                        formData.append(key, employeeData[key]);
                    }
                }
            });

            // Append avatar if present
            if (data.avatar) {
                formData.append('avatar', data.avatar);
            }

            // Add only documents with files
            documentsWithFiles.forEach((document, index) => {
                formData.append(`documents[${index}][document_type_id]`, document.document_type_id);
                formData.append(`documents[${index}][file]`, document.file);
            });

            formData.append('_method', 'PUT');

            router.post(route('hrm.employees.update', employee.id), formData, {
                forceFormData: true,
                preserveState: false,
            });
        } else {
            // If no documents with files and no avatar, send regular form data
            put(route('hrm.employees.update', employee.id), {
                data: employeeData
            });
        }
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('HRM'), url: route('hrm.index') },
                { label: t('Employees'), url: route('hrm.employees.index') },
                { label: t('Edit') }
            ]}
            pageTitle={t('Edit Employee')}
            backUrl={route('hrm.employees.index')}
        >
            <Head title={t('Edit Employee')} />

            <Card className="shadow-sm">
                <CardContent>
                    <form onSubmit={submit} className="pt-5">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-6">
                                <TabsTrigger value="personal">{t('Personal')}</TabsTrigger>
                                <TabsTrigger value="employment">{t('Employment')}</TabsTrigger>
                                <TabsTrigger value="contact">{t('Contact')}</TabsTrigger>
                                <TabsTrigger value="payroll">{t('Payroll')}</TabsTrigger>
                                <TabsTrigger value="hours">{t('Hours & Rates')}</TabsTrigger>
                                <TabsTrigger value="documents">{t('Documents')}</TabsTrigger>
                            </TabsList>

                            <TabsContent value="personal" className="space-y-6 mt-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="md:col-span-2 flex flex-col items-center justify-center p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 gap-3">
                                        <div className="relative">
                                            <img
                                                src={avatarPreview || (employee.user?.avatar ? getImagePath(employee.user.avatar) : '/default-avatar.png')}
                                                alt="Avatar Preview"
                                                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                                                onError={(e) => { e.currentTarget.src = '/default-avatar.png'; }}
                                            />
                                        </div>
                                        <div className="flex flex-col items-center gap-1">
                                            <Label htmlFor="avatar" className="cursor-pointer bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors">
                                                {t('Upload Profile Picture')}
                                            </Label>
                                            <input
                                                id="avatar"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setData('avatar', file);
                                                        setAvatarPreview(URL.createObjectURL(file));
                                                    }
                                                }}
                                            />
                                            <p className="text-[10px] text-slate-400">{t('Allowed formats: JPG, PNG, JPEG. Max 2MB')}</p>
                                        </div>
                                        <InputError message={errors.avatar} />
                                    </div>

                                    <div>
                                        <Label htmlFor="employee_id">{t('Employee Id')}</Label>
                                        <Input
                                            id="employee_id"
                                            type="text"
                                            value={data.employee_id}
                                            onChange={(e) => setData('employee_id', e.target.value)}
                                            placeholder={t('Enter Employee Id')}
                                            required
                                        />
                                        <InputError message={errors.employee_id} />
                                    </div>

                                    <div>
                                        <Label required>{t('Date Of Birth')}</Label>
                                        <DatePicker
                                            value={data.date_of_birth}
                                            onChange={(date) => setData('date_of_birth', date)}
                                            placeholder={t('Select Date Of Birth')}
                                            required
                                        />
                                        <InputError message={errors.date_of_birth} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div>
                                        <Label>{t('Gender')}</Label>
                                        <RadioGroup value={data.gender || 'Male'} onValueChange={(value) => setData('gender', value)} className="flex gap-6 mt-2">
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="Male" id="gender_male" />
                                                <Label htmlFor="gender_male" className="cursor-pointer">{t('Male')}</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="Female" id="gender_female" />
                                                <Label htmlFor="gender_female" className="cursor-pointer">{t('Female')}</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="Other" id="gender_other" />
                                                <Label htmlFor="gender_other" className="cursor-pointer">{t('Other')}</Label>
                                            </div>
                                        </RadioGroup>
                                        <InputError message={errors.gender} />
                                    </div>
                                    {biometricFields.map((field) => (
                                        <div key={field.id}>
                                            {field.component}
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        type="button"
                                        onClick={() => setActiveTab('employment')}
                                        disabled={!validatePersonalTab()}
                                    >
                                        {t('Next')}
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="employment" className="space-y-6 mt-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                                    <div>
                                        <Label htmlFor="shift_id" required>{t('Shift')}</Label>
                                        <Select value={data.shift_id?.toString() || ''} onValueChange={(value) => setData('shift_id', value)} required>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('Select Shift')} />
                                            </SelectTrigger>
                                            <SelectContent searchable={true}>
                                                {shifts?.map((item: any) => (
                                                    <SelectItem key={item.id} value={item.id.toString()}>
                                                        {item.shift_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.shift_id} />
                                    </div>



                                    <div>
                                        <Label>{t('Date Of Joining')}</Label>
                                        <DatePicker
                                            value={data.date_of_joining}
                                            onChange={(date) => setData('date_of_joining', date)}
                                            placeholder={t('Select Date Of Joining')}
                                            required
                                        />
                                        <InputError message={errors.date_of_joining} />
                                    </div>

                                    <div>
                                         <Label htmlFor="employment_type" required>{t('Employment Type')}</Label>
                                         <Select value={data.employment_type || 'Full Time'} onValueChange={(value) => setData('employment_type', value)} required>
                                             <SelectTrigger>
                                                 <SelectValue placeholder={t('Select Employment Type')} />
                                             </SelectTrigger>
                                             <SelectContent>
                                                 <SelectItem value="Full Time">{t('Full Time')}</SelectItem>
                                                 <SelectItem value="Part Time">{t('Part Time')}</SelectItem>
                                                 <SelectItem value="Temporary">{t('Temporary')}</SelectItem>
                                                 <SelectItem value="Contract">{t('Contract')}</SelectItem>
                                             </SelectContent>
                                         </Select>
                                         <InputError message={errors.employment_type} />
                                     </div>

                                     <div>
                                         <Label htmlFor="employment_status" required>{t('Employment Status')}</Label>
                                         <Select value={data.employment_status || 'probation'} onValueChange={(value) => {
                                             setData((prev) => ({
                                                 ...prev,
                                                 employment_status: value,
                                                 probation_percentage: value === 'permanent' ? '' : prev.probation_percentage || '70',
                                                 probation_period: value === 'permanent' ? '' : prev.probation_period || '3'
                                             }));
                                         }} required>
                                             <SelectTrigger>
                                                 <SelectValue placeholder={t('Select Employment Status')} />
                                             </SelectTrigger>
                                             <SelectContent>
                                                 <SelectItem value="probation">{t('Probation')}</SelectItem>
                                                 <SelectItem value="permanent">{t('Permanent')}</SelectItem>
                                             </SelectContent>
                                         </Select>
                                         <InputError message={errors.employment_status} />
                                     </div>

                                     {data.employment_status === 'probation' && (
                                         <>
                                             <div>
                                                 <Label htmlFor="probation_percentage" required>{t('Probation Salary Percentage (%)')}</Label>
                                                 <Input
                                                     type="number"
                                                     id="probation_percentage"
                                                     min="50"
                                                     max="70"
                                                     value={data.probation_percentage}
                                                     onChange={(e) => setData('probation_percentage', e.target.value)}
                                                     placeholder="e.g. 70"
                                                     required
                                                 />
                                                 <InputError message={errors.probation_percentage} />
                                             </div>

                                             <div>
                                                 <Label htmlFor="probation_period" required>{t('Probation Period (Months)')}</Label>
                                                 <Input
                                                     type="number"
                                                     id="probation_period"
                                                     min="2"
                                                     max="6"
                                                     value={data.probation_period}
                                                     onChange={(e) => setData('probation_period', e.target.value)}
                                                     placeholder="e.g. 3"
                                                     required
                                                 />
                                                 <InputError message={errors.probation_period} />
                                             </div>
                                         </>
                                     )}

                                    <div>
                                        <Label htmlFor="work_mode" required>{t('Work Mode')}</Label>
                                        <Select value={data.work_mode || ''} onValueChange={(value) => setData('work_mode', value)} required>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('Select Work Mode')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Remote">{t('Remote')}</SelectItem>
                                                <SelectItem value="On-site">{t('On-site')}</SelectItem>
                                                <SelectItem value="Hybrid">{t('Hybrid')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.work_mode} />
                                    </div>

                                    <div>
                                        <Label htmlFor="work_location_country" required>{t('Work Location Country')}</Label>
                                        <Input
                                            id="work_location_country"
                                            type="text"
                                            value={data.work_location_country}
                                            onChange={(e) => setData('work_location_country', e.target.value)}
                                            placeholder={t('Enter Work Location Country (e.g. Bangladesh)')}
                                            required
                                        />
                                        <InputError message={errors.work_location_country} />
                                    </div>

                                    <div>
                                        <Label htmlFor="branch_id" required>{t('Branch')}</Label>
                                        <Select
                                            value={data.branch_id?.toString() || ''}
                                            onValueChange={(value) => setData('branch_id', value)}

                                            required
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('Select Branch')} />
                                            </SelectTrigger>
                                            <SelectContent searchable={true}>
                                                {filteredBranches?.map((item: any) => (
                                                    <SelectItem key={item.id} value={item.id.toString()}>
                                                        {item.branch_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.branch_id} />
                                    </div>

                                    <div>
                                        <Label htmlFor="department_id" required>{t('Department')}</Label>
                                        <Select
                                            value={data.department_id?.toString() || ''}
                                            onValueChange={(value) => setData('department_id', value)}
                                            disabled={!data.branch_id}
                                            required
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={data.branch_id ? t('Select Department') : t('Select Branch first')} />
                                            </SelectTrigger>
                                            <SelectContent searchable={true}>
                                                {filteredDepartments?.map((item: any) => (
                                                    <SelectItem key={item.id} value={item.id.toString()}>
                                                        {item.department_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.department_id} />
                                    </div>

                                    <div>
                                        <Label htmlFor="designation_id" required>{t('Designation')}</Label>
                                        <Select
                                            value={data.designation_id?.toString() || ''}
                                            onValueChange={(value) => setData('designation_id', value)}
                                            disabled={!data.department_id}
                                            required
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={data.department_id ? t('Select Designation') : t('Select Department first')} />
                                            </SelectTrigger>
                                            <SelectContent searchable={true}>
                                                {filteredDesignations?.map((item: any) => (
                                                    <SelectItem key={item.id} value={item.id.toString()}>
                                                        {item.designation_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.designation_id} />
                                    </div>
                                </div>

                                <div className="flex justify-between">
                                    <Button type="button" variant="outline" onClick={() => setActiveTab('personal')}>
                                        {t('Previous')}
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => setActiveTab('contact')}
                                        disabled={!validateEmploymentTab()}
                                    >
                                        {t('Next')}
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="contact" className="space-y-6 mt-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="address_line_1">{t('Address Line 1')}</Label>
                                        <Input
                                            id="address_line_1"
                                            type="text"
                                            value={data.address_line_1}
                                            onChange={(e) => setData('address_line_1', e.target.value)}
                                            placeholder={t('Enter Address Line 1')}
                                            required
                                        />
                                        <InputError message={errors.address_line_1} />
                                    </div>

                                    <div>
                                        <Label htmlFor="address_line_2">{t('Address Line 2')}</Label>
                                        <Input
                                            id="address_line_2"
                                            type="text"
                                            value={data.address_line_2}
                                            onChange={(e) => setData('address_line_2', e.target.value)}
                                            placeholder={t('Enter Address Line 2')}
                                        />
                                        <InputError message={errors.address_line_2} />
                                    </div>

                                    <div>
                                        <Label htmlFor="city">{t('City')}</Label>
                                        <Input
                                            id="city"
                                            type="text"
                                            value={data.city}
                                            onChange={(e) => setData('city', e.target.value)}
                                            placeholder={t('Enter City')}
                                            required
                                        />
                                        <InputError message={errors.city} />
                                    </div>

                                    <div>
                                        <Label htmlFor="state">{t('State')}</Label>
                                        <Input
                                            id="state"
                                            type="text"
                                            value={data.state}
                                            onChange={(e) => setData('state', e.target.value)}
                                            placeholder={t('Enter State')}
                                            required
                                        />
                                        <InputError message={errors.state} />
                                    </div>

                                    <div>
                                        <Label htmlFor="country">{t('Country')}</Label>
                                        <Input
                                            id="country"
                                            type="text"
                                            value={data.country}
                                            onChange={(e) => setData('country', e.target.value)}
                                            placeholder={t('Enter Country')}
                                            required
                                        />
                                        <InputError message={errors.country} />
                                    </div>

                                    <div>
                                        <Label htmlFor="postal_code">{t('Postal Code')}</Label>
                                        <Input
                                            id="postal_code"
                                            type="text"
                                            value={data.postal_code}
                                            onChange={(e) => setData('postal_code', e.target.value)}
                                            placeholder={t('Enter Postal Code')}
                                            required
                                        />
                                        <InputError message={errors.postal_code} />
                                    </div>

                                    <div>
                                        <Label htmlFor="emergency_contact_name">{t('Emergency Contact Name')}</Label>
                                        <Input
                                            id="emergency_contact_name"
                                            type="text"
                                            value={data.emergency_contact_name}
                                            onChange={(e) => setData('emergency_contact_name', e.target.value)}
                                            placeholder={t('Enter Emergency Contact Name')}
                                            required
                                        />
                                        <InputError message={errors.emergency_contact_name} />
                                    </div>

                                    <div>
                                        <Label htmlFor="emergency_contact_relationship">{t('Emergency Contact Relationship')}</Label>
                                        <Input
                                            id="emergency_contact_relationship"
                                            type="text"
                                            value={data.emergency_contact_relationship}
                                            onChange={(e) => setData('emergency_contact_relationship', e.target.value)}
                                            placeholder={t('Enter Emergency Contact Relationship')}
                                            required
                                        />
                                        <InputError message={errors.emergency_contact_relationship} />
                                    </div>
                                </div>

                                <div>
                                    <PhoneInputComponent
                                        label={t('Emergency Contact Number')}
                                        value={data.emergency_contact_number}
                                        onChange={(value) => setData('emergency_contact_number', value || '')}
                                        error={errors.emergency_contact_number}
                                        required
                                    />
                                </div>

                                <div className="flex justify-between">
                                    <Button type="button" variant="outline" onClick={() => setActiveTab('employment')}>
                                        {t('Previous')}
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => setActiveTab('payroll')}
                                        disabled={!validateContactTab()}
                                    >
                                        {t('Next')}
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="payroll" className="space-y-6 mt-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="md:col-span-2">
                                        <Label htmlFor="payment_method" required>{t('Payment Method')}</Label>
                                        <Select
                                            value={data.payment_method}
                                            onValueChange={(value) => handleMethodChange(value)}
                                        >
                                            <SelectTrigger id="payment_method">
                                                <SelectValue placeholder={t('Select Payment Method')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {enabledMethods.map((method) => (
                                                    <SelectItem key={method.value} value={method.value}>
                                                        {method.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.payment_method} />
                                    </div>
                                </div>

                                <div className="border-t pt-6">
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        {data.payment_method === 'bank_transfer' && (
                                            <>
                                                <div className="md:col-span-2">
                                                    <Label htmlFor="bank_country" required>{t('Bank Country')}</Label>
                                                    <Select
                                                        value={data.payment_details?.bank_country || 'Other'}
                                                        onValueChange={(val) => handleDetailChange('bank_country', val)}
                                                    >
                                                        <SelectTrigger id="bank_country">
                                                            <SelectValue placeholder={t('Select Country')} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Other">{t('Other (Standard SWIFT/BIC)')}</SelectItem>
                                                            <SelectItem value="US">{t('United States (ACH)')}</SelectItem>
                                                            <SelectItem value="EU">{t('Europe (SEPA IBAN)')}</SelectItem>
                                                            <SelectItem value="UK">{t('United Kingdom (FPS)')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div>
                                                    <Label htmlFor="account_holder_name" required>{t('Account Holder Name')}</Label>
                                                    <Input
                                                        id="account_holder_name"
                                                        value={data.payment_details?.account_holder_name || ''}
                                                        onChange={(e) => handleDetailChange('account_holder_name', e.target.value)}
                                                        placeholder={t('Enter Account Holder Name')}
                                                        required
                                                    />
                                                </div>

                                                <div>
                                                    <Label htmlFor="bank_name" required>{t('Bank Name')}</Label>
                                                    <Input
                                                        id="bank_name"
                                                        value={data.payment_details?.bank_name || ''}
                                                        onChange={(e) => handleDetailChange('bank_name', e.target.value)}
                                                        placeholder={t('Enter Bank Name')}
                                                        required
                                                    />
                                                </div>

                                                {data.payment_details?.bank_country === 'US' && (
                                                    <>
                                                        <div>
                                                            <Label htmlFor="routing_number" required>{t('Routing Number (ABA)')}</Label>
                                                            <Input
                                                                id="routing_number"
                                                                value={data.payment_details?.routing_number || ''}
                                                                onChange={(e) => handleDetailChange('routing_number', e.target.value)}
                                                                placeholder={t('9-digit Routing Number')}
                                                                required
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="account_number" required>{t('Account Number')}</Label>
                                                            <Input
                                                                id="account_number"
                                                                value={data.payment_details?.account_number || ''}
                                                                onChange={(e) => handleDetailChange('account_number', e.target.value)}
                                                                placeholder={t('Enter Account Number')}
                                                                required
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="account_type" required>{t('Account Type')}</Label>
                                                            <Select
                                                                value={data.payment_details?.account_type || 'Checking'}
                                                                onValueChange={(val) => handleDetailChange('account_type', val)}
                                                            >
                                                                <SelectTrigger id="account_type">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="Checking">{t('Checking')}</SelectItem>
                                                                    <SelectItem value="Savings">{t('Savings')}</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </>
                                                )}

                                                {data.payment_details?.bank_country === 'EU' && (
                                                    <>
                                                        <div>
                                                            <Label htmlFor="iban" required>{t('IBAN')}</Label>
                                                            <Input
                                                                id="iban"
                                                                value={data.payment_details?.iban || ''}
                                                                onChange={(e) => handleDetailChange('iban', e.target.value)}
                                                                placeholder={t('Enter IBAN')}
                                                                required
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="bic_swift">{t('BIC / SWIFT')}</Label>
                                                            <Input
                                                                id="bic_swift"
                                                                value={data.payment_details?.bic_swift || ''}
                                                                onChange={(e) => handleDetailChange('bic_swift', e.target.value)}
                                                                placeholder={t('Enter BIC/SWIFT Code')}
                                                            />
                                                        </div>
                                                    </>
                                                )}

                                                {data.payment_details?.bank_country === 'UK' && (
                                                    <>
                                                        <div>
                                                            <Label htmlFor="sort_code" required>{t('Sort Code')}</Label>
                                                            <Input
                                                                id="sort_code"
                                                                value={data.payment_details?.sort_code || ''}
                                                                onChange={(e) => handleDetailChange('sort_code', e.target.value)}
                                                                placeholder={t('6-digit Sort Code (e.g. 20-00-00)')}
                                                                required
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="account_number" required>{t('Account Number')}</Label>
                                                            <Input
                                                                id="account_number"
                                                                value={data.payment_details?.account_number || ''}
                                                                onChange={(e) => handleDetailChange('account_number', e.target.value)}
                                                                placeholder={t('8-digit Account Number')}
                                                                required
                                                            />
                                                        </div>
                                                    </>
                                                )}

                                                {(data.payment_details?.bank_country === 'Other' || !data.payment_details?.bank_country) && (
                                                    <>
                                                        <div>
                                                            <Label htmlFor="account_number" required>{t('Account Number / IBAN')}</Label>
                                                            <Input
                                                                id="account_number"
                                                                value={data.payment_details?.account_number || ''}
                                                                onChange={(e) => handleDetailChange('account_number', e.target.value)}
                                                                placeholder={t('Enter Account Number or IBAN')}
                                                                required
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="bank_branch">{t('Bank Branch')}</Label>
                                                            <Input
                                                                id="bank_branch"
                                                                value={data.payment_details?.bank_branch || ''}
                                                                onChange={(e) => handleDetailChange('bank_branch', e.target.value)}
                                                                placeholder={t('Enter Bank Branch')}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="bank_identifier_code">{t('SWIFT / BIC Code')}</Label>
                                                            <Input
                                                                id="bank_identifier_code"
                                                                value={data.payment_details?.bank_identifier_code || ''}
                                                                onChange={(e) => handleDetailChange('bank_identifier_code', e.target.value)}
                                                                placeholder={t('Enter SWIFT/BIC Code')}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="tax_payer_id">{t('Tax Payer ID / SSN')}</Label>
                                                            <Input
                                                                id="tax_payer_id"
                                                                value={data.payment_details?.tax_payer_id || ''}
                                                                onChange={(e) => handleDetailChange('tax_payer_id', e.target.value)}
                                                                placeholder={t('Enter Tax Payer ID')}
                                                            />
                                                        </div>
                                                    </>
                                                )}

                                                <div className="md:col-span-2">
                                                    <Label htmlFor="bank_notes">{t('Payment Notes')}</Label>
                                                    <textarea
                                                        id="bank_notes"
                                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                        value={data.payment_details?.bank_notes || ''}
                                                        onChange={(e) => handleDetailChange('bank_notes', e.target.value)}
                                                        placeholder={t('Enter any notes (e.g. intermediary bank details)')}
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {data.payment_method === 'cards_transfer' && (
                                            <>
                                                <div>
                                                    <Label htmlFor="cardholder_name" required>{t('Cardholder Name')}</Label>
                                                    <Input
                                                        id="cardholder_name"
                                                        value={data.payment_details?.cardholder_name || ''}
                                                        onChange={(e) => handleDetailChange('cardholder_name', e.target.value)}
                                                        placeholder={t('Enter Cardholder Name')}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="card_type" required>{t('Card Type')}</Label>
                                                    <Select
                                                        value={data.payment_details?.card_type || 'Visa'}
                                                        onValueChange={(val) => handleDetailChange('card_type', val)}
                                                    >
                                                        <SelectTrigger id="card_type">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Visa">{t('Visa')}</SelectItem>
                                                            <SelectItem value="Mastercard">{t('Mastercard')}</SelectItem>
                                                            <SelectItem value="Amex">{t('American Express')}</SelectItem>
                                                            <SelectItem value="UnionPay">{t('UnionPay')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label htmlFor="card_number" required>{t('Card Number')}</Label>
                                                    <Input
                                                        id="card_number"
                                                        value={data.payment_details?.card_number || ''}
                                                        onChange={(e) => handleDetailChange('card_number', e.target.value)}
                                                        placeholder={t('Enter 16-digit Card Number')}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="expiry_date" required>{t('Expiry Date (MM/YY)')}</Label>
                                                    <Input
                                                        id="expiry_date"
                                                        value={data.payment_details?.expiry_date || ''}
                                                        onChange={(e) => handleDetailChange('expiry_date', e.target.value)}
                                                        placeholder={t('MM/YY')}
                                                        required
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {data.payment_method === 'paypal' && (
                                            <div>
                                                <Label htmlFor="paypal_email" required>{t('PayPal Registered Email')}</Label>
                                                <Input
                                                    id="paypal_email"
                                                    type="email"
                                                    value={data.payment_details?.paypal_email || ''}
                                                    onChange={(e) => handleDetailChange('paypal_email', e.target.value)}
                                                    placeholder={t('paypal@example.com')}
                                                    required
                                                />
                                            </div>
                                        )}

                                        {data.payment_method === 'kast' && (
                                            <div>
                                                <Label htmlFor="kast_username" required>{t('Kast Username / Phone / Email')}</Label>
                                                <Input
                                                    id="kast_username"
                                                    value={data.payment_details?.kast_username || ''}
                                                    onChange={(e) => handleDetailChange('kast_username', e.target.value)}
                                                    placeholder={t('Enter Kast Username')}
                                                    required
                                                />
                                            </div>
                                        )}

                                        {data.payment_method === 'redotpay' && (
                                            <div>
                                                <Label htmlFor="redotpay_id" required>{t('Redotpay ID / Email / Phone')}</Label>
                                                <Input
                                                    id="redotpay_id"
                                                    value={data.payment_details?.redotpay_id || ''}
                                                    onChange={(e) => handleDetailChange('redotpay_id', e.target.value)}
                                                    placeholder={t('Enter Redotpay Identifier')}
                                                    required
                                                />
                                            </div>
                                        )}

                                        {data.payment_method === 'remitly' && (
                                            <>
                                                <div>
                                                    <Label htmlFor="recipient_name" required>{t('Recipient Full Name')}</Label>
                                                    <Input
                                                        id="recipient_name"
                                                        value={data.payment_details?.recipient_name || ''}
                                                        onChange={(e) => handleDetailChange('recipient_name', e.target.value)}
                                                        placeholder={t('Enter Recipient Name')}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="recipient_phone" required>{t('Recipient Phone Number')}</Label>
                                                    <Input
                                                        id="recipient_phone"
                                                        value={data.payment_details?.recipient_phone || ''}
                                                        onChange={(e) => handleDetailChange('recipient_phone', e.target.value)}
                                                        placeholder={t('+1234567890')}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="recipient_country" required>{t('Recipient Target Country')}</Label>
                                                    <Input
                                                        id="recipient_country"
                                                        value={data.payment_details?.recipient_country || ''}
                                                        onChange={(e) => handleDetailChange('recipient_country', e.target.value)}
                                                        placeholder={t('e.g. Philippines, India')}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="delivery_method" required>{t('Delivery Method')}</Label>
                                                    <Select
                                                        value={data.payment_details?.delivery_method || 'Bank Deposit'}
                                                        onValueChange={(val) => handleDetailChange('delivery_method', val)}
                                                    >
                                                        <SelectTrigger id="delivery_method">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Bank Deposit">{t('Bank Deposit')}</SelectItem>
                                                            <SelectItem value="Cash Pickup">{t('Cash Pickup')}</SelectItem>
                                                            <SelectItem value="Mobile Money">{t('Mobile Money')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label htmlFor="wallet_provider">{t('Recipient Bank / Mobile Wallet Name')}</Label>
                                                    <Input
                                                        id="wallet_provider"
                                                        value={data.payment_details?.wallet_provider || ''}
                                                        onChange={(e) => handleDetailChange('wallet_provider', e.target.value)}
                                                        placeholder={t('e.g. GCash, bKash, Metrobank')}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="wallet_number">{t('Account / Wallet Number')}</Label>
                                                    <Input
                                                        id="wallet_number"
                                                        value={data.payment_details?.wallet_number || ''}
                                                        onChange={(e) => handleDetailChange('wallet_number', e.target.value)}
                                                        placeholder={t('Enter account or wallet number')}
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {data.payment_method === 'western_union' && (
                                            <>
                                                <div>
                                                    <Label htmlFor="recipient_name" required>{t('Recipient Full Name')}</Label>
                                                    <Input
                                                        id="recipient_name"
                                                        value={data.payment_details?.recipient_name || ''}
                                                        onChange={(e) => handleDetailChange('recipient_name', e.target.value)}
                                                        placeholder={t('Must match official ID card')}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="recipient_city" required>{t('Recipient City')}</Label>
                                                    <Input
                                                        id="recipient_city"
                                                        value={data.payment_details?.recipient_city || ''}
                                                        onChange={(e) => handleDetailChange('recipient_city', e.target.value)}
                                                        placeholder={t('Enter City')}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="recipient_country" required>{t('Recipient Country')}</Label>
                                                    <Input
                                                        id="recipient_country"
                                                        value={data.payment_details?.recipient_country || ''}
                                                        onChange={(e) => handleDetailChange('recipient_country', e.target.value)}
                                                        placeholder={t('Enter Country')}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="recipient_phone">{t('Recipient Phone Number')}</Label>
                                                    <Input
                                                        id="recipient_phone"
                                                        value={data.payment_details?.recipient_phone || ''}
                                                        onChange={(e) => handleDetailChange('recipient_phone', e.target.value)}
                                                        placeholder={t('Enter Phone Number')}
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {data.payment_method === 'binance_bybit' && (
                                            <>
                                                <div>
                                                    <Label htmlFor="exchange" required>{t('Exchange / Platform')}</Label>
                                                    <Select
                                                        value={data.payment_details?.exchange || 'Binance'}
                                                        onValueChange={(val) => handleDetailChange('exchange', val)}
                                                    >
                                                        <SelectTrigger id="exchange">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Binance">{t('Binance')}</SelectItem>
                                                            <SelectItem value="Bybit">{t('Bybit')}</SelectItem>
                                                            <SelectItem value="External Wallet">{t('External Web3 Wallet')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label htmlFor="network" required>{t('Network')}</Label>
                                                    <Select
                                                        value={data.payment_details?.network || 'TRC20'}
                                                        onValueChange={(val) => handleDetailChange('network', val)}
                                                    >
                                                        <SelectTrigger id="network">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="TRC20">{t('TRON (TRC20)')}</SelectItem>
                                                            <SelectItem value="ERC20">{t('Ethereum (ERC20)')}</SelectItem>
                                                            <SelectItem value="BEP20">{t('BNB Smart Chain (BEP20)')}</SelectItem>
                                                            <SelectItem value="Solana">{t('Solana')}</SelectItem>
                                                            <SelectItem value="Polygon">{t('Polygon (MATIC)')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <Label htmlFor="wallet_address" required>{t('Wallet Address')}</Label>
                                                    <Input
                                                        id="wallet_address"
                                                        value={data.payment_details?.wallet_address || ''}
                                                        onChange={(e) => handleDetailChange('wallet_address', e.target.value)}
                                                        placeholder={t('Paste wallet address (verify network matches)')}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="coin" required>{t('Coin')}</Label>
                                                    <Select
                                                        value={data.payment_details?.coin || 'USDT'}
                                                        onValueChange={(val) => handleDetailChange('coin', val)}
                                                    >
                                                        <SelectTrigger id="coin">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="USDT">{t('USDT')}</SelectItem>
                                                            <SelectItem value="USDC">{t('USDC')}</SelectItem>
                                                            <SelectItem value="BTC">{t('BTC')}</SelectItem>
                                                            <SelectItem value="ETH">{t('ETH')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-between border-t pt-6">
                                    <Button type="button" variant="outline" onClick={() => setActiveTab('contact')}>
                                        {t('Previous')}
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => setActiveTab('hours')}
                                        disabled={!validatePayrollTab()}
                                    >
                                        {t('Next')}
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="hours" className="space-y-6 mt-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
                                    <div>
                                        <Label htmlFor="salary_type" required>{t('Salary Period')}</Label>
                                        <Select 
                                            value={data.salary_type || 'yearly'} 
                                            onValueChange={(value) => {
                                                setData(prev => ({
                                                    ...prev,
                                                    salary_type: value,
                                                    rate_per_hour: calculateRatePerHour(prev.basic_salary, prev.hours_per_day, prev.days_per_week, value)
                                                }));
                                            }}
                                        >
                                            <SelectTrigger id="salary_type">
                                                <SelectValue placeholder={t('Select Period')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="yearly">{t('Yearly')}</SelectItem>
                                                <SelectItem value="monthly">{t('Monthly')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.salary_type} />
                                    </div>

                                    <div>
                                        <Label htmlFor="basic_salary" required>{t('Basic Salary')}</Label>
                                        <Input
                                            id="basic_salary"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.basic_salary}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setData(prev => {
                                                    const hours = prev.hours_per_day || '8';
                                                    const days = prev.days_per_week || '5';
                                                    return {
                                                        ...prev,
                                                        basic_salary: val,
                                                        hours_per_day: hours,
                                                        days_per_week: days,
                                                        rate_per_hour: calculateRatePerHour(val, hours, days, prev.salary_type)
                                                    };
                                                });
                                            }}
                                            placeholder={t('Enter Basic Salary')}
                                            required
                                        />
                                        <InputError message={errors.basic_salary} />
                                    </div>

                                    <div>
                                        <Label htmlFor="hours_per_day" required>{t('Hours Per Day')}</Label>
                                        <Input
                                            id="hours_per_day"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.hours_per_day}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setData(prev => ({
                                                    ...prev,
                                                    hours_per_day: val,
                                                    rate_per_hour: calculateRatePerHour(prev.basic_salary, val, prev.days_per_week, prev.salary_type)
                                                }));
                                            }}
                                            placeholder={t('Enter Hours Per Day')}
                                            required
                                        />
                                        <InputError message={errors.hours_per_day} />
                                    </div>

                                    <div>
                                        <Label htmlFor="days_per_week" required>{t('Days Per Week')}</Label>
                                        <Input
                                            id="days_per_week"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.days_per_week}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setData(prev => ({
                                                    ...prev,
                                                    days_per_week: val,
                                                    rate_per_hour: calculateRatePerHour(prev.basic_salary, prev.hours_per_day, val, prev.salary_type)
                                                }));
                                            }}
                                            placeholder={t('Enter Days Per Week')}
                                            required
                                        />
                                        <InputError message={errors.days_per_week} />
                                    </div>

                                    <div>
                                        <Label htmlFor="rate_per_hour" required>{t('Rate Per Hour')}</Label>
                                        <Input
                                            id="rate_per_hour"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.rate_per_hour}
                                            onChange={(e) => setData('rate_per_hour', e.target.value)}
                                            placeholder={t('Enter Rate Per Hour')}
                                            required
                                        />
                                        <InputError message={errors.rate_per_hour} />
                                    </div>
                                </div>

                                <div className="flex justify-between">
                                    <Button type="button" variant="outline" onClick={() => setActiveTab('payroll')}>
                                        {t('Previous')}
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => setActiveTab('documents')}
                                        disabled={!validateHoursTab()}
                                    >
                                        {t('Next')}
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="documents" className="space-y-6 mt-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-medium">{t('Employee Documents')}</h3>
                                    <Button type="button" onClick={addDocument} variant="outline">
                                        {t('Add Document')}
                                    </Button>
                                </div>

                                {existingDocuments?.length > 0 ? (
                                    <div className="space-y-4">
                                        {existingDocuments.map((doc: any) => (
                                            <Card key={doc.id} className="p-4">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-medium">{doc.document_name}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {doc.file_path.split('/').pop()}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <a
                                                            href={getImagePath(doc.file_path)}
                                                            target="_blank"
                                                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </a>
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => {
                                                                if (confirm(t('Are you sure you want to delete this document?'))) {
                                                                    router.delete(route('hrm.employee-documents.destroy', [employee.id, doc.id]));
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        {t('No documents uploaded yet.')}
                                    </div>
                                )}

                                {data.documents.map((document: any, index: number) => (
                                    <Card key={index} className="p-4 border-dashed">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div>
                                                <Label>{t('Document Type')}</Label>
                                                <Select
                                                    value={document.document_type_id?.toString() || ''}
                                                    onValueChange={(value) => updateDocument(index, 'document_type_id', value)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={t('Select Document Type')} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {documentTypes?.map((type: any) => (
                                                            <SelectItem key={type.id} value={type.id.toString()}>
                                                                {type.document_name} {type.is_required && '*'}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label>{t('Document File')}</Label>
                                                <Input
                                                    type="file"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        updateDocument(index, 'file', file);
                                                    }}
                                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                                                />
                                                {document.file && (
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {document.file.name}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex justify-end mt-4">
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => removeDocument(index)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                {t('Remove')}
                                            </Button>
                                        </div>
                                    </Card>
                                ))}

                                {data.documents.length === 0 && existingDocuments?.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        {t('No documents added yet. Click "Add Document" to get started.')}
                                    </div>
                                )}

                                <div className="flex justify-between">
                                    <Button type="button" variant="outline" onClick={() => setActiveTab('hours')}>
                                        {t('Previous')}
                                    </Button>
                                    <div className="flex gap-2">
                                        <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                            {t('Cancel')}
                                        </Button>
                                        <Button type="submit" disabled={processing}>
                                            {processing ? t('Updating...') : t('Update')}
                                        </Button>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </form>
                </CardContent>
            </Card>
        </AuthenticatedLayout>
    );
}