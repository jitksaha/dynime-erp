import { Head, useForm, usePage, router } from "@inertiajs/react";
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
import { Trash2 } from 'lucide-react';
import { CreateEmployeeFormData } from './types';
import { useEffect, useState } from 'react';
import { useFormFields } from '@/hooks/useFormFields';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MediaLibraryModal from "@/components/MediaLibraryModal";
import MediaPicker from "@/components/MediaPicker";
import { getImagePath, formatCurrency } from "@/utils/helpers";
import axios from 'axios';
import { usePersistentForm } from "@/hooks/usePersistentForm";

export default function Create() {
    const { users = [], roles = {}, branches, departments, designations, shifts, documentTypes, generatedEmployeeId, companyAllSetting = {} } = usePage<any>().props;
    const [activeTab, setActiveTab] = useState(() => {
        try {
            return localStorage.getItem('employee_create_active_tab') || 'personal';
        } catch (e) {
            return 'personal';
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('employee_create_active_tab', activeTab);
        } catch (e) {}
    }, [activeTab]);
    const [filteredBranches, setFilteredBranches] = useState(branches || []);
    const [filteredDepartments, setFilteredDepartments] = useState(departments || []);
    const [filteredDesignations, setFilteredDesignations] = useState(designations || []);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    const { t } = useTranslation();

    // MAMP user creation state
    const [localUsers, setLocalUsers] = useState<any[]>(users);
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [newUserForm, setNewUserForm] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        mobile_no: '',
        type: '',
        is_enable_login: true,
    });
    const [newUserErrors, setNewUserErrors] = useState<any>({});
    const [newUserProcessing, setNewUserProcessing] = useState(false);

    useEffect(() => {
        setLocalUsers(users || []);
    }, [users]);

    const handleCreateUserSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setNewUserProcessing(true);
        setNewUserErrors({});
        try {
            // Store current users so we can detect the new one after reload
            const prevLocalUsers = [...localUsers];

            await axios.post(route('users.store'), newUserForm, {
                headers: {
                    'Accept': 'application/json',
                },
                maxRedirects: 0,
                validateStatus: (status) => status < 400,
            });

            // Reset form and close dialog immediately on success
            setNewUserForm({
                name: '',
                email: '',
                password: '',
                password_confirmation: '',
                mobile_no: '',
                type: '',
                is_enable_login: true,
            });
            setIsAddUserOpen(false);

            // Reload only the users prop via Inertia to get the updated list
            router.reload({
                only: ['users'],
                onSuccess: (page: any) => {
                    const updatedUsers: any[] = page.props.users || [];
                    setLocalUsers(updatedUsers);
                    const newlyAddedUser = updatedUsers.find(
                        (u: any) => !prevLocalUsers.some((oldU: any) => oldU.id === u.id)
                    );
                    if (newlyAddedUser) {
                        setData('user_id', newlyAddedUser.id.toString());
                    }
                },
            });
        } catch (error: any) {
            console.error(error);
            if (error.response?.data?.errors) {
                setNewUserErrors(error.response.data.errors);
            } else if (error.response?.data?.message) {
                setNewUserErrors({ name: [error.response.data.message] });
            } else {
                setNewUserErrors({ name: [t('Something went wrong. Please check your inputs.')] });
            }
        } finally {
            setNewUserProcessing(false);
        }
    };

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


    const { data, setData, post, setError, processing, errors, clearStorage, transform } = usePersistentForm<CreateEmployeeFormData>('employee_create_form', {
        employee_id: generatedEmployeeId,
        avatar: null,
        date_of_birth: '',
        gender: 'Male',
        shift_id: '',
        date_of_joining: '',
        employment_type: 'Full Time',
        employment_status: 'probation',
        probation_percentage: '70',
        probation_period: '3',
        work_mode: '',
        work_location_country: '',
        address_line_1: '',
        address_line_2: '',
        city: '',
        state: '',
        country: '',
        postal_code: '',
        emergency_contact_name: '',
        emergency_contact_relationship: '',
        emergency_contact_number: '',
        bank_name: '',
        account_holder_name: '',
        account_number: '',
        bank_identifier_code: '',
        bank_branch: '',
        bank_country: '',
        bank_notes: '',
        tax_payer_id: '',
        payment_method: 'bank_transfer',
        payment_details: {
            bank_country: 'Other',
            bank_name: '',
            account_holder_name: '',
            account_number: '',
            bank_identifier_code: '',
            bank_branch: '',
            tax_payer_id: '',
            bank_notes: ''
        },
        basic_salary: '',
        salary_type: 'yearly',
        hours_per_day: '',
        days_per_week: '',
        rate_per_hour: '',
        user_id: '',
        branch_id: '',
        department_id: '',
        designation_id: '',
        documents: [],
    });

    // On mount: clean up any document rows restored from localStorage that have no valid File object
    // (File objects can't survive localStorage serialization and are saved as null)
    useEffect(() => {
        if (data.documents && data.documents.length > 0) {
            const validDocs = data.documents.filter((doc: any) => (doc.file instanceof File) || (typeof doc.file === 'string' && doc.file !== ''));
            if (validDocs.length !== data.documents.length) {
                setData('documents', validDocs);
            }
        }
    }, []); // run once on mount


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
        return data.user_id !== '' &&
            data.employment_type !== '' &&
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

    const biometricFields = useFormFields('biometricEmployeeIdFields', data, setData, errors, 'create');
    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        transform((data) => {
            const transformed = { ...data };
            if (transformed.avatar === null || transformed.avatar === 'null') {
                delete transformed.avatar;
            }
            if (transformed.documents) {
                transformed.documents = transformed.documents.filter(doc => doc.file && doc.document_type_id);
            }
            return transformed;
        });

        post(route('hrm.employees.store'), {
            forceFormData: true,
            onSuccess: () => {
                clearStorage();
                try {
                    localStorage.removeItem('employee_create_active_tab');
                } catch (e) {}
            },
            onError: (errs) => {
                // Switch to the first tab that has an error so the user can see it
                const tabFieldMap: Record<string, string[]> = {
                    personal: ['employee_id', 'date_of_birth', 'gender', 'avatar'],
                    employment: ['user_id', 'shift_id', 'date_of_joining', 'employment_type', 'employment_status', 'probation_percentage', 'probation_period', 'work_mode', 'work_location_country', 'branch_id', 'department_id', 'designation_id'],
                    contact: ['address_line_1', 'address_line_2', 'city', 'state', 'country', 'postal_code', 'emergency_contact_name', 'emergency_contact_relationship', 'emergency_contact_number'],
                    payroll: ['payment_method'],
                    hours: ['basic_salary', 'salary_type', 'hours_per_day', 'days_per_week', 'rate_per_hour'],
                    documents: [],
                };
                for (const [tab, fields] of Object.entries(tabFieldMap)) {
                    const hasError = fields.some(f => errs[f]) || (tab === 'documents' && Object.keys(errs).some(k => k.startsWith('documents')));
                    if (hasError) {
                        setActiveTab(tab);
                        break;
                    }
                }
            },
        });
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('HRM'), url: route('hrm.index') },
                { label: t('Employees'), url: route('hrm.employees.index') },
                { label: t('Create') }
            ]}
            pageTitle={t('Create Employee')}
            backUrl={route('hrm.employees.index')}
        >
            <Head title={t('Create Employee')} />

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
                                        <div className="relative cursor-pointer group" onClick={() => setIsMediaModalOpen(true)}>
                                            <img
                                                src={avatarPreview || '/default-avatar.png'}
                                                alt="Avatar Preview"
                                                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md group-hover:opacity-85 transition-opacity"
                                                onError={(e) => { e.currentTarget.src = '/default-avatar.png'; }}
                                            />
                                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-white text-xs font-semibold">{t('Browse')}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center gap-1">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setIsMediaModalOpen(true)}
                                                className="font-semibold text-xs"
                                            >
                                                {t('Select Profile Picture')}
                                            </Button>
                                            <p className="text-[10px] text-slate-400">{t('Select from Media Library')}</p>
                                        </div>
                                        <InputError message={errors.avatar} />

                                        <MediaLibraryModal
                                            isOpen={isMediaModalOpen}
                                            onClose={() => setIsMediaModalOpen(false)}
                                            onSelect={(selected) => {
                                                const selectedUrl = Array.isArray(selected) ? selected[0] : selected;
                                                if (selectedUrl) {
                                                    setData('avatar', selectedUrl);
                                                    setAvatarPreview(getImagePath(selectedUrl));
                                                }
                                                setIsMediaModalOpen(false);
                                            }}
                                            multiple={false}
                                        />
                                    </div>

                                                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <Label htmlFor="user_id" required className="mb-0">{t('User')}</Label>
                                            <Button
                                                type="button"
                                                variant="link"
                                                size="sm"
                                                className="h-auto p-0 text-blue-600 hover:text-blue-700 font-medium"
                                                onClick={() => setIsAddUserOpen(true)}
                                            >
                                                + {t('Add New User')}
                                            </Button>
                                        </div>
                                        <Select value={data.user_id?.toString() || ''} onValueChange={(value) => setData('user_id', value)} required>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('Select User')} />
                                            </SelectTrigger>
                                            <SelectContent searchable={true}>
                                                {localUsers.map((item: any) => (
                                                    <SelectItem key={item.id} value={item.id.toString()}>
                                                        {item.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-sm text-muted-foreground mt-1">{t('Note: Company users will be applicable for create employee.')}</p>
                                        <InputError message={errors.user_id} />
                                    </div>

                                    <div>
                                        <Label htmlFor="user_phone">{t('Phone Number')}</Label>
                                        <Input
                                            id="user_phone"
                                            type="text"
                                            value={localUsers.find((u: any) => u.id.toString() === data.user_id?.toString())?.mobile_no || ''}
                                            disabled
                                            placeholder={t('No Phone Number')}
                                            className="bg-slate-50 cursor-not-allowed"
                                        />
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
                                            disabled={!data.user_id}
                                            required
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={data.user_id ? t('Select Branch') : t('Select User first')} />
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
                                        {data.payment_method && (() => {
                                            const feeType = companyAllSetting[`payroll_method_fee_type_${data.payment_method}`] || 'percentage';
                                            const percentageFee = parseFloat(companyAllSetting[`payroll_method_fee_percentage_${data.payment_method}`] || '0') || 0;
                                            const fixedFee = parseFloat(companyAllSetting[`payroll_method_fee_fixed_${data.payment_method}`] || '0') || 0;
                                            const basicSalary = parseFloat(data.basic_salary || '0') || 0;

                                            let feeText = '';
                                            let estimatedCharge = 0;

                                            if (feeType === 'percentage') {
                                                feeText = `${percentageFee}%`;
                                                estimatedCharge = (basicSalary * percentageFee) / 100;
                                            } else if (feeType === 'fixed') {
                                                feeText = `${formatCurrency(fixedFee)}`;
                                                estimatedCharge = fixedFee;
                                            } else if (feeType === 'both') {
                                                feeText = `${percentageFee}% + ${formatCurrency(fixedFee)}`;
                                                estimatedCharge = ((basicSalary * percentageFee) / 100) + fixedFee;
                                            }

                                            return (
                                                <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm flex flex-col gap-1">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-slate-500 font-medium">{t('Transaction Fee')}:</span>
                                                        <span className="font-semibold text-slate-800">{feeText}</span>
                                                    </div>
                                                    {basicSalary > 0 && (
                                                        <div className="flex justify-between items-center border-t border-slate-200/60 pt-1 mt-1">
                                                            <span className="text-slate-500 font-medium">{t('Estimated Charge')}:</span>
                                                            <span className="font-bold text-primary">{formatCurrency(estimatedCharge)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
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
                                        {data.salary_type === 'yearly' && data.basic_salary && !isNaN(parseFloat(data.basic_salary)) && (
                                            <div className="mt-2 text-xs font-semibold text-slate-500 flex justify-between">
                                                <span>{t('Monthly Equivalent:')}</span>
                                                <span className="text-primary font-bold">{formatCurrency(parseFloat(data.basic_salary) / 12)}</span>
                                            </div>
                                        )}
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

                                {data.documents.map((document: any, index: number) => (
                                    <Card key={index} className="p-4">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div>
                                                <Label required>{t('Document Type')}</Label>
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
                                                <InputError message={errors[`documents.${index}.document_type_id`]} />
                                            </div>
                                            <div>
                                                <MediaPicker
                                                    label={t('Document File')}
                                                    value={document.file}
                                                    onChange={(value) => updateDocument(index, 'file', value)}
                                                    placeholder={t('Select or upload document...')}
                                                    showPreview={true}
                                                    required
                                                />
                                                <InputError message={errors[`documents.${index}.file`]} />
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



                                <div className="flex justify-between">
                                    <Button type="button" variant="outline" onClick={() => setActiveTab('hours')}>
                                        {t('Previous')}
                                    </Button>
                                    <div className="flex gap-2">
                                        <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                            {t('Cancel')}
                                        </Button>
                                        <Button type="submit" disabled={processing}>
                                            {processing ? t('Creating...') : t('Create')}
                                        </Button>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </form>
                </CardContent>
            </Card>

            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{t('Create New User')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateUserSubmit} className="space-y-4 mt-2">
                        <div>
                            <Label htmlFor="new_name" required>{t('Name')}</Label>
                            <Input
                                id="new_name"
                                value={newUserForm.name}
                                onChange={(e) => setNewUserForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder={t('Enter full name')}
                                required
                                className="mt-1"
                            />
                            <InputError message={newUserErrors.name} />
                        </div>
                        <div>
                            <Label htmlFor="new_email" required>{t('Email')}</Label>
                            <Input
                                id="new_email"
                                type="email"
                                value={newUserForm.email}
                                onChange={(e) => setNewUserForm(prev => ({ ...prev, email: e.target.value }))}
                                placeholder={t('Enter email address')}
                                required
                                className="mt-1"
                            />
                            <InputError message={newUserErrors.email} />
                        </div>
                        <div>
                            <PhoneInputComponent
                                label={t('Mobile Number')}
                                value={newUserForm.mobile_no}
                                onChange={(value) => setNewUserForm(prev => ({ ...prev, mobile_no: value }))}
                                placeholder="+1234567890"
                                error={newUserErrors.mobile_no}
                                className="mt-1"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="new_password" required>{t('Password')}</Label>
                                <Input
                                    id="new_password"
                                    type="password"
                                    value={newUserForm.password}
                                    onChange={(e) => setNewUserForm(prev => ({ ...prev, password: e.target.value }))}
                                    placeholder={t('Enter password')}
                                    required
                                    className="mt-1"
                                />
                                <InputError message={newUserErrors.password} />
                            </div>
                            <div>
                                <Label htmlFor="new_password_confirmation" required>{t('Confirm Password')}</Label>
                                <Input
                                    id="new_password_confirmation"
                                    type="password"
                                    value={newUserForm.password_confirmation}
                                    onChange={(e) => setNewUserForm(prev => ({ ...prev, password_confirmation: e.target.value }))}
                                    placeholder={t('Confirm password')}
                                    required
                                    className="mt-1"
                                />
                                <InputError message={newUserErrors.password_confirmation} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="new_type" required>{t('Role')}</Label>
                                <Select value={newUserForm.type} onValueChange={(value) => setNewUserForm(prev => ({ ...prev, type: value }))} required>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder={t('Select Role')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(roles).map(([id, label]) => (
                                            <SelectItem key={id} value={id}>
                                                {label as string}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={newUserErrors.type} />
                            </div>
                            <div>
                                <Label htmlFor="new_is_enable_login" required>{t('Login Status')}</Label>
                                <Select value={newUserForm.is_enable_login ? "1" : "0"} onValueChange={(value) => setNewUserForm(prev => ({ ...prev, is_enable_login: value === "1" }))}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">{t('Enabled')}</SelectItem>
                                        <SelectItem value="0">{t('Disabled')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={newUserErrors.is_enable_login} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)}>
                                {t('Cancel')}
                            </Button>
                            <Button type="submit" disabled={newUserProcessing}>
                                {newUserProcessing ? t('Creating...') : t('Create')}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}