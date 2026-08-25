import { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Save, Printer, FileText, Mail, Globe, Phone, PenTool } from 'lucide-react';
import { formatCurrency } from '@/utils/helpers';
import { toast } from 'sonner';
import { 
    DOCUMENT_CATEGORIES, 
    getDocumentName, 
    DEFAULT_TEMPLATES, 
    resolveTemplate 
} from './documentUtils';


interface Employee {
    id: number;
    employee_id_code: string;
    name: string;
    email: string;
    designation: string;
    department: string;
    basic_salary: number;
    date_of_joining: string;
    employment_type?: string;
    branch?: string;
    work_mode?: string;
    work_location_country?: string;
    work_location?: string;
    bank_name?: string;
    account_holder_name?: string;
    account_number?: string;
    bank_identifier_code?: string;
    bank_branch?: string;
    bank_country?: string;
    bank_notes?: string;
    tax_payer_id?: string;
    salary_type?: string;
}

interface IndexProps {
    employees: Employee[];
    companySettings: Record<string, string>;
    prefill?: {
        employee_id?: string | number;
        document_type?: string;
        payload?: any;
        issued_date?: string;
    };
}


// Format date specifically as "DD MMM YYYY" (e.g. 01 Jan 2024)
const formatDocumentDate = (dateStr: string) => {
    try {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const day = String(date.getDate()).padStart(2, '0');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    } catch (e) {
        return dateStr;
    }
};

export default function Index({ employees, companySettings, prefill }: IndexProps) {
    const { t } = useTranslation();
    const printRef = useRef<HTMLDivElement>(null);
    const signatureInputRef = useRef<HTMLInputElement>(null);

    // 1. ALL State Hooks (Declared at top before any useEffect)
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(() => {
        return localStorage.getItem('doc_builder_last_employee_id') || '';
    });
    const [documentType, setDocumentType] = useState<string>(() => {
        return localStorage.getItem('doc_builder_last_document_type') || 'offer_letter';
    });
    const [issuedDate, setIssuedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [overrideDate, setOverrideDate] = useState<string>('');

    // Dynamic fields (Quick-fill overrides)
    const [customCompanyName, setCustomCompanyName] = useState<string>('');
    const [customParagraph, setCustomParagraph] = useState<string>('');
    const [expiryDate, setExpiryDate] = useState<string>('');
    const [noticePeriod, setNoticePeriod] = useState<string>('30');
    const [probationPeriod, setProbationPeriod] = useState<string>('3');
    const [severanceAmount, setSeveranceAmount] = useState<string>('');
    const [workLocation, setWorkLocation] = useState<string>('');
    const [reportingTo, setReportingTo] = useState<string>('');
    const [newDesignation, setNewDesignation] = useState<string>('');
    const [newSalary, setNewSalary] = useState<string>('');
    const [promotionEffectiveDate, setPromotionEffectiveDate] = useState<string>('');
    const [terminationReason, setTerminationReason] = useState<string>('Performance Issues');
    const [terminationEffectiveDate, setTerminationEffectiveDate] = useState<string>('');
    const [workingDays, setWorkingDays] = useState<string>('Sunday through Thursday');
    const [workingHours, setWorkingHours] = useState<string>('9:00 AM to 6:00 PM (1-hour lunch break)');
    const [annualLeave, setAnnualLeave] = useState<string>('20 Days Paid Annual Leave + Public Holidays');
    
    // Quick-fill override fields
    const [overrideDesignation, setOverrideDesignation] = useState<string>('');
    const [overrideDepartment, setOverrideDepartment] = useState<string>('');
    const [overrideEmploymentType, setOverrideEmploymentType] = useState<string>('Full-Time');
    const [overrideJobType, setOverrideJobType] = useState<string>('-');

    // Authorised signatory options
    const [typedSignatoryName, setTypedSignatoryName] = useState<string>('');
    const [signatureImage, setSignatureImage] = useState<string | null>(null);

    const [payPeriod, setPayPeriod] = useState<string>(new Date().toISOString().substring(0, 7)); // YYYY-MM
    const [hasSignature, setHasSignature] = useState<boolean>(true);

    // 2. Derived Computations
    const currentEmployee = employees?.find((e: any) => String(e.id) === String(selectedEmployeeId)) || null;
    const isYearlySalary = currentEmployee?.salary_type === 'yearly' || currentEmployee?.salary_type === 'year' || currentEmployee?.salary_type === 'annual';
    const rawBasicSalary = parseFloat(currentEmployee?.basic_salary || 0);
    const displayMonthlySalary = isYearlySalary ? (rawBasicSalary / 12) : rawBasicSalary;
    const displayYearlySalary = isYearlySalary ? rawBasicSalary : (rawBasicSalary * 12);

    // 3. Handlers
    const handleEmployeeChange = (val: string) => {
        setSelectedEmployeeId(val);
        if (val) {
            localStorage.setItem('doc_builder_last_employee_id', val);
        } else {
            localStorage.removeItem('doc_builder_last_employee_id');
        }
    };

    // 4. Effects (Placed AFTER all state declarations)
    useEffect(() => {
        let finalDocType = localStorage.getItem('doc_builder_last_document_type') || 'offer_letter';
        let hasPayloadParagraph = false;

        if (prefill) {
            if (prefill.employee_id) {
                const empIdStr = String(prefill.employee_id);
                setSelectedEmployeeId(empIdStr);
                localStorage.setItem('doc_builder_last_employee_id', empIdStr);
            }
            if (prefill.document_type) {
                setDocumentType(prefill.document_type);
                finalDocType = prefill.document_type;
                localStorage.setItem('doc_builder_last_document_type', prefill.document_type);
            }
            if (prefill.issued_date) {
                setIssuedDate(prefill.issued_date);
            }
            if (prefill.payload) {
                const p = prefill.payload;
                if (p.customCompanyName !== undefined) setCustomCompanyName(p.customCompanyName || '');
                if (p.customParagraph !== undefined) {
                    setCustomParagraph(p.customParagraph || '');
                    hasPayloadParagraph = true;
                }
                if (p.expiryDate !== undefined) setExpiryDate(p.expiryDate || '');
                if (p.noticePeriod !== undefined) setNoticePeriod(p.noticePeriod || '30');
                if (p.probationPeriod !== undefined) setProbationPeriod(p.probationPeriod || '3');
                if (p.severanceAmount !== undefined) setSeveranceAmount(p.severanceAmount || '');
                if (p.workLocation !== undefined) setWorkLocation(p.workLocation || '');
                if (p.reportingTo !== undefined) setReportingTo(p.reportingTo || '');
                if (p.payPeriod !== undefined) setPayPeriod(p.payPeriod || '');
                if (p.hasSignature !== undefined) setHasSignature(p.hasSignature !== false);
                if (p.overrideDate !== undefined) setOverrideDate(p.overrideDate || '');
                if (p.overrideDesignation !== undefined) setOverrideDesignation(p.overrideDesignation || '');
                if (p.overrideDepartment !== undefined) setOverrideDepartment(p.overrideDepartment || '');
                if (p.overrideEmploymentType !== undefined) setOverrideEmploymentType(p.overrideEmploymentType || 'Full-Time');
                if (p.overrideJobType !== undefined) setOverrideJobType(p.overrideJobType || '-');
                if (p.typedSignatoryName !== undefined) setTypedSignatoryName(p.typedSignatoryName || '');
                if (p.signatureImage !== undefined) setSignatureImage(p.signatureImage || null);
                if (p.newDesignation !== undefined) setNewDesignation(p.newDesignation || '');
                if (p.newSalary !== undefined) setNewSalary(p.newSalary || '');
                if (p.promotionEffectiveDate !== undefined) setPromotionEffectiveDate(p.promotionEffectiveDate || '');
                if (p.terminationReason !== undefined) setTerminationReason(p.terminationReason || 'Performance Issues');
                if (p.terminationEffectiveDate !== undefined) setTerminationEffectiveDate(p.terminationEffectiveDate || '');
            }
        } else {
            const urlParams = new URLSearchParams(window.location.search);
            const empId = urlParams.get('employee_id');
            const docType = urlParams.get('document_type');
            if (empId) {
                setSelectedEmployeeId(empId);
                localStorage.setItem('doc_builder_last_employee_id', empId);
            }
            if (docType) {
                setDocumentType(docType);
                finalDocType = docType;
                localStorage.setItem('doc_builder_last_document_type', docType);
            }
        }

        // Prefill default template on load ONLY if not loaded from a saved payload
        if (!hasPayloadParagraph) {
            if (DEFAULT_TEMPLATES[finalDocType] !== undefined) {
                setCustomParagraph(DEFAULT_TEMPLATES[finalDocType]);
            }
        }

        if (employees && employees.length === 1) {
            const singleEmpId = String(employees[0].id);
            setSelectedEmployeeId(singleEmpId);
            localStorage.setItem('doc_builder_last_employee_id', singleEmpId);
        } else if (!selectedEmployeeId) {
            const savedEmpId = localStorage.getItem('doc_builder_last_employee_id');
            if (savedEmpId && employees.some(e => String(e.id) === savedEmpId)) {
                setSelectedEmployeeId(savedEmpId);
            }
        }
    }, [prefill, employees]);

    // Auto fill fields when employee changes
    useEffect(() => {
        if (currentEmployee) {
            setCustomCompanyName(companySettings.company_name || 'Dynime LLC.');
            setOverrideDesignation(currentEmployee.designation || '');
            setOverrideDepartment(currentEmployee.department || '');
            setWorkLocation(currentEmployee.branch || '');
            
            // Match values with database
            const empType = currentEmployee.employment_type || 'Full Time';
            setOverrideEmploymentType(empType);
            setOverrideJobType(empType);

            // ALSO resolve and set default template for the current documentType if not loaded from history
            const urlParams = new URLSearchParams(window.location.search);
            const hasPrefillPayload = prefill && prefill.payload && prefill.payload.customParagraph !== undefined;
            if (!hasPrefillPayload && DEFAULT_TEMPLATES[documentType] !== undefined) {
                const resolved = resolveTemplate(
                    DEFAULT_TEMPLATES[documentType],
                    currentEmployee,
                    currentEmployee.designation || '',
                    currentEmployee.department || '',
                    companySettings.company_name || 'Dynime LLC.',
                    formatDocumentDate(currentEmployee.date_of_joining || new Date().toISOString().split('T')[0]),
                    formatDocumentDate(issuedDate),
                    probationPeriod,
                    newDesignation,
                    newSalary,
                    workingDays,
                    workingHours,
                    annualLeave,
                    noticePeriod,
                    workLocation
                );
                setCustomParagraph(resolved);
            }
        }
    }, [selectedEmployeeId, currentEmployee, workingDays, workingHours, annualLeave, noticePeriod, workLocation]);

    const handleDocumentTypeChange = (value: string) => {
        setDocumentType(value);
        if (value) {
            localStorage.setItem('doc_builder_last_document_type', value);
        }
        if (DEFAULT_TEMPLATES[value] !== undefined) {
            const resolved = resolveTemplate(
                DEFAULT_TEMPLATES[value],
                currentEmployee,
                overrideDesignation || currentEmployee?.designation || '',
                overrideDepartment || currentEmployee?.department || '',
                customCompanyName || companySettings.company_name || 'Dynime LLC.',
                formatDocumentDate(overrideDate || currentEmployee?.date_of_joining || new Date().toISOString().split('T')[0]),
                formatDocumentDate(issuedDate),
                probationPeriod,
                newDesignation,
                newSalary,
                workingDays,
                workingHours,
                annualLeave,
                noticePeriod,
                workLocation
            );
            setCustomParagraph(resolved);
        } else {
            setCustomParagraph('');
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSignatureImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePrint = () => {
        if (!selectedEmployeeId) return;

        const payload = {
            customCompanyName,
            customParagraph,
            expiryDate,
            noticePeriod,
            probationPeriod,
            severanceAmount,
            workLocation,
            reportingTo,
            payPeriod,
            hasSignature,
            overrideDate,
            overrideDesignation,
            overrideDepartment,
            overrideEmploymentType,
            overrideJobType,
            typedSignatoryName,
            signatureImage,
            newDesignation,
            newSalary,
            promotionEffectiveDate,
            terminationReason,
            terminationEffectiveDate
        };

        // First, save the document to the history database
        router.post(route('hrm.document-builder.store'), {
            employee_id: selectedEmployeeId,
            document_type: documentType,
            payload: payload,
            issued_date: issuedDate
        }, {
            preserveScroll: true,
            onSuccess: () => {
                // Trigger print dialog once saved successfully
                let shortType = 'DOC';
                switch (documentType) {
                    case 'offer_letter':
                        shortType = 'OL';
                        break;
                    case 'employment_agreement':
                        shortType = 'AP';
                        break;
                    case 'payslip':
                        shortType = 'PS';
                        break;
                    case 'experience_letter':
                        shortType = 'EL';
                        break;
                    case 'relieving_letter':
                        shortType = 'RL';
                        break;
                    case 'promotion_letter':
                        shortType = 'PL';
                        break;
                    case 'termination_letter':
                        shortType = 'TL';
                        break;
                }

                const empId = currentEmployee ? currentEmployee.employee_id_code : 'GUEST';
                const originalTitle = document.title;

                // Temporarily set document title which browsers use as default filename for "Print to PDF"
                document.title = `${shortType}-${empId}`;

                window.print();

                // Restore original page title
                setTimeout(() => {
                    document.title = originalTitle;
                }, 1000);
            }
        });
    };

    const handleAskSignature = () => {
        if (!selectedEmployeeId) return;

        const payload = {
            customCompanyName,
            customParagraph,
            expiryDate,
            noticePeriod,
            probationPeriod,
            severanceAmount,
            workLocation,
            reportingTo,
            payPeriod,
            hasSignature,
            overrideDate,
            overrideDesignation,
            overrideDepartment,
            overrideEmploymentType,
            overrideJobType,
            typedSignatoryName,
            signatureImage,
            newDesignation,
            newSalary,
            promotionEffectiveDate,
            terminationReason,
            terminationEffectiveDate
        };

        router.post(route('hrm.document-builder.store'), {
            employee_id: selectedEmployeeId,
            document_type: documentType,
            payload: payload,
            issued_date: issuedDate
        }, {
            preserveScroll: true,
            onSuccess: (page) => {
                const flash = page.props.flash as any;
                if (flash?.sign_link) {
                    navigator.clipboard.writeText(flash.sign_link);
                    toast.success(t('Document generated! Signing link copied to clipboard.'));
                } else {
                    toast.success(t('Document generated and sent for signature.'));
                }
            }
        });
    };

    const getDocumentTitle = () => {
        switch (documentType) {
            case 'offer_letter':
                return t('LETTER OF OFFER');
            case 'employment_agreement':
                return t('EMPLOYMENT AGREEMENT');
            case 'payslip':
                return t('PAYSLIP');
            case 'experience_letter':
                return t('EXPERIENCE LETTER');
            case 'relieving_letter':
                return t('RELIEVING LETTER');
            case 'promotion_letter':
                return t('LETTER OF PROMOTION');
            case 'termination_letter':
                return t('LETTER OF TERMINATION');
            default:
                // Find matching label from categories
                for (const cat of DOCUMENT_CATEGORIES) {
                    const match = cat.types.find(type => type.id === documentType);
                    if (match) {
                        return t(match.label.toUpperCase());
                    }
                }
                return t('DOCUMENT');
        }
    };

    const getTenureString = (joiningDateStr: string, releaseDateStr: string) => {
        try {
            const start = new Date(joiningDateStr);
            const end = new Date(releaseDateStr);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const months = Math.round(diffDays / 30);
            return `${months} months`;
        } catch (e) {
            return '9 months';
        }
    };

    const numberToWords = (num: number) => {
        if (num === 400) return 'Four Hundred only';
        return `${num} only`;
    };

    const activeDate = overrideDate || (currentEmployee ? currentEmployee.date_of_joining : issuedDate);
    const activeDesignation = overrideDesignation || (currentEmployee ? currentEmployee.designation : '');
    const activeDepartment = overrideDepartment || (currentEmployee ? currentEmployee.department : '');

    const resolvedCustomParagraph = resolveTemplate(
        customParagraph,
        currentEmployee,
        activeDesignation,
        activeDepartment,
        customCompanyName || companySettings.company_name || 'Dynime LLC.',
        formatDocumentDate(activeDate),
        formatDocumentDate(issuedDate),
        probationPeriod,
        newDesignation,
        newSalary,
        workingDays,
        workingHours,
        annualLeave,
        noticePeriod,
        workLocation
    );


    return (
        <AuthenticatedLayout
            breadcrumbs={[{ label: t('HRM'), href: route('hrm.index') }, { label: t('Document Builder') }]}
            pageTitle={t('HR Document Builder')}
        >
            <Head title={t('HR Document Builder')} />

            {/* Custom stylesheet injected for perfect print layout & handwriting cursive font */}
            <style dangerouslySetInnerHTML={{ __html: `
                @font-face {
                    font-family: 'Autography';
                    src: url('/fonts/Autography.otf') format('opentype');
                }
                @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Playpen+Sans:wght@400;600&family=Alex+Brush&family=Mr+De+Haviland&family=Allura&display=swap');
                @page {
                    size: auto;
                    margin: 0mm !important;
                }
                @media print {
                    html, body {
                        margin: 0;
                        padding: 0;
                        background: #ffffff;
                    }
                    body * {
                        visibility: hidden;
                    }
                    #printable-document, #printable-document * {
                        visibility: visible;
                    }
                    #printable-document {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        min-height: auto !important;
                        height: auto !important;
                        margin: 0;
                        padding: 36px 36px 36px 36px !important;
                        box-shadow: none;
                        border: none;
                        background: #ffffff;
                        display: block !important;
                    }
                }
            `}} />

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                
                {/* Configuration Controls Panel (Left Panel) */}
                <div className="xl:col-span-5 space-y-6 print:hidden">
                    <Card className="border border-gray-200 shadow-sm rounded-xl">
                        <CardHeader className="pb-4 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-md font-semibold text-gray-900">{t('Document Configurations')}</h3>
                            <p className="text-xs text-gray-500">{t('Fill details to dynamically compile employee documents')}</p>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            
                            {/* Employee Selector */}
                            <div className="space-y-1.5">
                                <Label htmlFor="employee-select">{t('Select Employee')}</Label>
                                <Select value={selectedEmployeeId} onValueChange={handleEmployeeChange}>
                                    <SelectTrigger id="employee-select" className="w-full">
                                        <SelectValue placeholder={t('Choose an employee...')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employees.map(emp => (
                                            <SelectItem key={emp.id} value={String(emp.id)}>
                                                {emp.name} ({emp.employee_id_code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Document Type Selector */}
                            <div className="space-y-1.5">
                                <Label htmlFor="doc-type-select">{t('Document Type')}</Label>
                                <Select value={documentType} onValueChange={handleDocumentTypeChange}>
                                    <SelectTrigger id="doc-type-select" className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent searchable={true}>
                                        {DOCUMENT_CATEGORIES.map(category => [
                                            <SelectItem 
                                                key={`header_${category.name}`} 
                                                value={`header_${category.name}`} 
                                                disabled 
                                                className="font-bold text-primary bg-muted/40 text-xs py-1.5 border-y select-none"
                                            >
                                                📂 {category.name.toUpperCase()}
                                            </SelectItem>,
                                            ...category.types.map(type => (
                                                <SelectItem key={type.id} value={type.id} className="pl-6 text-xs">
                                                    {type.label}
                                                </SelectItem>
                                            ))
                                        ])}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Re-issue / Override date */}
                            <div className="space-y-1.5">
                                <Label htmlFor="override-date">{t('Re-issue / override date (Optional)')}</Label>
                                <Input
                                    id="override-date"
                                    type="date"
                                    value={overrideDate}
                                    onChange={(e) => setOverrideDate(e.target.value)}
                                />
                                <p className="text-[10px] text-gray-400 mt-1">
                                    {t("Effective date is taken from the employee's joining date automatically. Set this only when back-dating or re-issuing.")}
                                </p>
                            </div>

                            {/* Custom Company Name */}
                            <div className="space-y-1.5">
                                <Label htmlFor="company-name-input">{t('Custom company name (Optional)')}</Label>
                                <Input
                                    id="company-name-input"
                                    placeholder="e.g. Dynime LLC"
                                    value={customCompanyName}
                                    onChange={(e) => setCustomCompanyName(e.target.value)}
                                />
                            </div>

                            {/* Conditional Inputs based on document type */}
                            {documentType === 'offer_letter' && (
                                <div className="space-y-1.5">
                                    <Label htmlFor="offer-expiry">{t('Offer valid until')}</Label>
                                    <Input
                                        id="offer-expiry"
                                        type="date"
                                        value={expiryDate}
                                        onChange={(e) => setExpiryDate(e.target.value)}
                                    />
                                </div>
                            )}

                            {documentType === 'promotion_letter' && (
                                <div className="space-y-4 border border-blue-100 bg-blue-50/30 rounded-xl p-3.5">
                                    <div className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">{t('Promotion Details')}</div>
                                    <div className="space-y-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="new-designation">{t('New Designation')}</Label>
                                            <Input
                                                id="new-designation"
                                                placeholder={t('e.g. Senior Operations Manager')}
                                                value={newDesignation}
                                                onChange={(e) => setNewDesignation(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="new-salary">{isYearlySalary ? t('New Gross Salary ($ / year)') : t('New Gross Salary ($ / month)')}</Label>
                                            <Input
                                                id="new-salary"
                                                type="number"
                                                placeholder={isYearlySalary ? t('e.g. 36000') : t('e.g. 3000')}
                                                value={newSalary}
                                                onChange={(e) => setNewSalary(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="promotion-date">{t('Effective Date')}</Label>
                                            <Input
                                                id="promotion-date"
                                                type="date"
                                                value={promotionEffectiveDate}
                                                onChange={(e) => setPromotionEffectiveDate(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {documentType === 'termination_letter' && (
                                <div className="space-y-4 border border-red-100 bg-red-50/30 rounded-xl p-3.5">
                                    <div className="text-xs font-bold text-red-800 uppercase tracking-wider mb-1">{t('Termination Details')}</div>
                                    <div className="space-y-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="termination-reason">{t('Reason for Termination')}</Label>
                                            <Input
                                                id="termination-reason"
                                                placeholder={t('e.g. Redundancy / Business Restructuring')}
                                                value={terminationReason}
                                                onChange={(e) => setTerminationReason(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="termination-date">{t('Termination Effective Date')}</Label>
                                            <Input
                                                id="termination-date"
                                                type="date"
                                                value={terminationEffectiveDate}
                                                onChange={(e) => setTerminationEffectiveDate(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="severance-pay">{t('Severance Pay ($)')}</Label>
                                            <Input
                                                id="severance-pay"
                                                type="number"
                                                placeholder={t('e.g. 1500')}
                                                value={severanceAmount}
                                                onChange={(e) => setSeveranceAmount(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Quick-fill missing fields accordion/section */}
                            <div className="border border-gray-200 rounded-xl p-4 space-y-4">
                                <div className="font-semibold text-xs uppercase tracking-wider text-gray-500">
                                    {t('Quick-fill missing fields')} <span className="text-[9px] lowercase font-normal">({t('overrides this document only')})</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="override-designation">{t('Designation')}</Label>
                                        <Input
                                            id="override-designation"
                                            value={overrideDesignation}
                                            onChange={(e) => setOverrideDesignation(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="override-department">{t('Department')}</Label>
                                        <Input
                                            id="override-department"
                                            value={overrideDepartment}
                                            onChange={(e) => setOverrideDepartment(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="override-employment-type">{t('Employment type')}</Label>
                                        <Select value={overrideEmploymentType} onValueChange={setOverrideEmploymentType}>
                                            <SelectTrigger id="override-employment-type">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Full Time">{t('Full Time')}</SelectItem>
                                                <SelectItem value="Part Time">{t('Part Time')}</SelectItem>
                                                <SelectItem value="Contract">{t('Contract')}</SelectItem>
                                                <SelectItem value="Internship">{t('Internship')}</SelectItem>
                                                <SelectItem value="Temporary">{t('Temporary')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="override-job-type">{t('Job type')}</Label>
                                        <Input
                                            id="override-job-type"
                                            value={overrideJobType}
                                            onChange={(e) => setOverrideJobType(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="work-location">{t('Work location')}</Label>
                                        <Input
                                            id="work-location"
                                            value={workLocation}
                                            onChange={(e) => setWorkLocation(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="reporting-to">{t('Reporting to')}</Label>
                                        <Input
                                            id="reporting-to"
                                            value={reportingTo}
                                            onChange={(e) => setReportingTo(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="working-days">{t('Working Days')}</Label>
                                        <Input
                                            id="working-days"
                                            value={workingDays}
                                            placeholder="e.g. Sunday through Thursday"
                                            onChange={(e) => setWorkingDays(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="working-hours">{t('Working Hours')}</Label>
                                        <Input
                                            id="working-hours"
                                            value={workingHours}
                                            placeholder="e.g. 9:00 AM to 6:00 PM"
                                            onChange={(e) => setWorkingHours(e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-1.5">
                                        <Label htmlFor="annual-leave">{t('Paid Annual Leave & Holidays')}</Label>
                                        <Input
                                            id="annual-leave"
                                            value={annualLeave}
                                            placeholder="e.g. 20 Days Paid Annual Leave + Public Holidays"
                                            onChange={(e) => setAnnualLeave(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Custom Paragraph & Dynamic Variables */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="custom-notes" className="text-xs font-semibold text-slate-800">
                                        {!['offer_letter', 'employment_agreement', 'payslip', 'experience_letter', 'relieving_letter', 'promotion_letter', 'termination_letter'].includes(documentType) 
                                            ? t('Document Body Content') 
                                            : t('Custom paragraph / Clauses (Appended to body)')
                                        }
                                    </Label>
                                    <span className="text-[10px] text-indigo-600 font-medium">{t('Supports dynamic tags')}</span>
                                </div>

                                {/* Quick Insert Dynamic Variables Pill Bar */}
                                <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2 space-y-1.5">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        ⚡ {t('Quick Insert Dynamic Variables')}
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {[
                                            { tag: '{employee_name}', label: t('Employee Name') },
                                            { tag: '{employee_code}', label: t('Employee ID') },
                                            { tag: '{joining_date}', label: t('Joining Date') },
                                            { tag: '{working_days}', label: t('Working Days') },
                                            { tag: '{working_hours}', label: t('Working Hours') },
                                            { tag: '{holidays_count}', label: t('Holidays / Leave') },
                                            { tag: '{basic_salary}', label: t('Salary') },
                                            { tag: '{designation}', label: t('Designation') },
                                            { tag: '{department}', label: t('Department') },
                                            { tag: '{company_name}', label: t('Company Name') },
                                            { tag: '{probation_period}', label: t('Probation') },
                                            { tag: '{notice_period}', label: t('Notice Period') },
                                            { tag: '{work_location}', label: t('Work Location') },
                                            { tag: '{branch_address}', label: t('Branch Address') },
                                        ].map(({ tag, label }) => (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => setCustomParagraph(prev => (prev ? prev + ' ' + tag : tag))}
                                                className="text-[10px] bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-mono px-1.5 py-0.5 rounded transition shadow-2xs"
                                                title={label}
                                            >
                                                + {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <Textarea
                                    id="custom-notes"
                                    placeholder={!['offer_letter', 'employment_agreement', 'payslip', 'experience_letter', 'relieving_letter', 'promotion_letter', 'termination_letter'].includes(documentType)
                                        ? t('Type the official content/body of the document here with dynamic tags like {employee_name}, {joining_date}, {working_days}, {working_hours}, {holidays_count}...')
                                        : t('Add any extra context, clauses, or notes with dynamic tags...')
                                    }
                                    rows={!['offer_letter', 'employment_agreement', 'payslip', 'experience_letter', 'relieving_letter', 'promotion_letter', 'termination_letter'].includes(documentType) ? 10 : 6}
                                    value={customParagraph}
                                    onChange={(e) => setCustomParagraph(e.target.value)}
                                    className="font-mono text-xs"
                                />
                            </div>

                            {/* Authorised signature settings section */}
                            <div className="border border-gray-200 rounded-xl p-4 space-y-4">
                                <div className="font-semibold text-xs uppercase tracking-wider text-gray-500">
                                    {t('Authorised signature (optional)')}
                                </div>
                                <p className="text-[10px] text-gray-400">
                                    {t("Upload an official signature image. Leave blank to show the default system-generated placeholder.")}
                                </p>
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="signature-upload">{t('Upload signature image (PNG with transparent background works best)')}</Label>
                                        <Input
                                            id="signature-upload"
                                            type="file"
                                            ref={signatureInputRef}
                                            accept="image/png, image/jpeg"
                                            onChange={handleImageUpload}
                                        />
                                    </div>
                                    {signatureImage && (
                                        <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-100 mt-2">
                                            <div className="h-10 w-20 bg-white border rounded flex items-center justify-center overflow-hidden p-1">
                                                <img src={signatureImage} alt="Signature preview" className="h-full object-contain" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] text-gray-500 font-medium truncate">{t('Uploaded signature image')}</p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 text-xs px-2 font-bold shrink-0"
                                                onClick={() => {
                                                    setSignatureImage(null);
                                                    if (signatureInputRef.current) {
                                                        signatureInputRef.current.value = '';
                                                    }
                                                }}
                                            >
                                                {t('Remove')}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
                                <Button
                                    type="button"
                                    onClick={handlePrint}
                                    disabled={!selectedEmployeeId}
                                    variant="outline"
                                    className="flex items-center justify-center gap-1.5 border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold"
                                >
                                    <Printer className="h-4 w-4" />
                                    {t('Print / PDF')}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleAskSignature}
                                    disabled={!selectedEmployeeId}
                                    className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                                >
                                    <PenTool className="h-4 w-4" />
                                    {t('Ask signature')}
                                </Button>
                            </div>

                        </CardContent>
                    </Card>
                </div>

                {/* Real-time A4 Preview Panel (Right Panel) - Exactly matching user PDF layout */}
                <div className="xl:col-span-7 flex justify-center">
                    {currentEmployee ? (
                        <div
                            id="printable-document"
                            ref={printRef}
                            className="bg-white w-[794px] min-h-[1123px] pt-[50px] pb-[50px] px-[36px] border border-[#e5e5ea] shadow-md relative flex flex-col justify-between font-sans text-[#1c1c1e] text-[13px] leading-relaxed rounded-lg"
                        >
                            {/* Document Header */}
                            <div>
                                <div className="flex items-start justify-between border-b border-[#e5e5ea] pb-4 mb-8">
                                    <div className="flex items-center gap-4">
                                        {/* Official Dynime Logo Image */}
                                        <img src="https://cdn.dynime.com/Dynime%20Logo/LOGO%20PNG/logo%20SVG/dynime-logo.svg" alt="Dynime" className="h-10 object-contain" />
                                        <div className="border-l border-[#e5e5ea] pl-4">
                                            <h2 className="font-bold text-[#1c1c1e] text-sm tracking-wide">{customCompanyName || 'Dynime LLC.'}</h2>
                                            <p className="text-[10px] text-[#8e8e93] mt-1 flex items-center gap-2">
                                                <span className="flex items-center gap-1"><Mail className="h-3 w-3 text-[#8e8e93]" /> {companySettings.company_email || 'contact@dynime.com'}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1"><Globe className="h-3 w-3 text-[#8e8e93]" /> {companySettings.company_website || 'dynime.com'}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-[#8e8e93]" /> {companySettings.company_telephone || '+16468840271'}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <h3 className="font-bold text-[#1c1c1e] text-sm uppercase tracking-wider">{getDocumentTitle()}</h3>
                                        <div className="text-[11px] text-[#787880] mt-1">
                                            {documentType === 'offer_letter' && (
                                                <p>{t('Joining Date')}: <strong>{formatDocumentDate(activeDate)}</strong></p>
                                            )}
                                            {documentType === 'employment_agreement' && (
                                                <p>{t('Joining Date')}: <strong>{formatDocumentDate(activeDate)}</strong></p>
                                            )}
                                            {documentType === 'payslip' && (
                                                <div className="space-y-0.5">
                                                    <p>{t('Issued')}: <strong>{formatDocumentDate(issuedDate)}</strong></p>
                                                    <p>{t('Period')}: <strong>{new Date(payPeriod + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</strong></p>
                                                </div>
                                            )}
                                            {(documentType === 'experience_letter' || documentType === 'relieving_letter') && (
                                                <p>{t('Issued')}: <strong>{formatDocumentDate(issuedDate)}</strong></p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Subject Details / Recipient info */}
                                <div className="mb-6">
                                    <h4 className="font-bold text-[#1c1c1e] text-sm">{currentEmployee.name}</h4>
                                    <p className="text-[#787880] text-[12px]">{activeDesignation}</p>
                                    {activeDepartment && <p className="text-[#787880] text-[12px]">{activeDepartment}</p>}
                                    <p className="text-[#787880] text-[12px]">{currentEmployee.email}</p>
                                    {workLocation && <p className="text-[#787880] text-[12px]">{workLocation}</p>}
                                </div>

                                {/* Main Letter / Document Content */}
                                <div className="space-y-5 text-[#1c1c1e] leading-relaxed text-[13px]">
                                    
                                    {/* OFFER LETTER */}
                                    {documentType === 'offer_letter' && (
                                        <div className="space-y-4">
                                            <p className="font-bold text-[#1c1c1e] text-sm">Dear {currentEmployee.name.split(' ')[0]},</p>
                                            <p>
                                                We are delighted to offer you the position of <strong className="text-[#1c1c1e]">{activeDesignation}</strong> in the <strong className="text-[#1c1c1e]">{activeDepartment}</strong> department at <strong className="text-[#1c1c1e]">{customCompanyName}</strong>. This letter sets out the principal terms of your employment.
                                            </p>
                                            
                                            {/* Details Box */}
                                            <div className="border border-[#e5e5ea] rounded-xl p-5 text-[12px]">
                                                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                                                    <div><span className="text-[#8e8e93]">{t('Designation')}:</span> <strong className="text-[#1c1c1e]">{activeDesignation}</strong></div>
                                                    <div><span className="text-[#8e8e93]">{t('Department')}:</span> <strong className="text-[#1c1c1e]">{activeDepartment}</strong></div>
                                                    <div><span className="text-[#8e8e93]">{t('Employment type')}:</span> <strong className="text-[#1c1c1e]">{overrideEmploymentType}</strong></div>
                                                    <div><span className="text-[#8e8e93]">{t('Job type')}:</span> <strong className="text-[#1c1c1e]">{overrideJobType}</strong></div>
                                                    <div><span className="text-[#8e8e93]">{t('Work location')}:</span> <strong className="text-[#1c1c1e]">{workLocation || '—'}</strong></div>
                                                    <div><span className="text-[#8e8e93]">{t('Joining date')}:</span> <strong className="text-[#1c1c1e]">{formatDocumentDate(activeDate)}</strong></div>
                                                    <div><span className="text-[#8e8e93]">{t('Reporting to')}:</span> <strong className="text-[#1c1c1e]">{reportingTo || '—'}</strong></div>
                                                </div>
                                                <div className="mt-3 border-t border-[#e5e5ea] pt-3">
                                                    <span className="text-[#8e8e93]">{t('Gross compensation')}:</span> <strong className="text-[#1c1c1e]">{isYearlySalary ? `${formatCurrency(displayYearlySalary)} / year (${formatCurrency(displayMonthlySalary)} / month)` : `${formatCurrency(displayMonthlySalary)} / month`}</strong>
                                                </div>
                                            </div>

                                            {/* Earnings and Deductions tables side-by-side */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="border border-[#e5e5ea] rounded-xl overflow-hidden">
                                                    <div className="bg-[#f4f4f5] border-b border-[#e5e5ea] px-4 py-2 font-semibold text-[#1c1c1e] text-xs uppercase tracking-wider">{isYearlySalary ? t('EARNINGS (YEARLY)') : t('EARNINGS (MONTHLY)')}</div>
                                                    <div className="p-4 space-y-2 text-xs">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[#787880]">{t('Basic salary')}</span>
                                                            <span className="font-semibold text-[#1c1c1e]">{formatCurrency(isYearlySalary ? displayYearlySalary : displayMonthlySalary)}</span>
                                                        </div>
                                                        <div className="text-[#8e8e93] italic text-[11px]">
                                                            {t('N/A - no allowances configured')}
                                                        </div>
                                                        <div className="flex justify-between items-center border-t border-[#e5e5ea] pt-2 font-bold text-[#1c1c1e] mt-4">
                                                            <span>{t('Gross (CTC)')}</span>
                                                            <span>{formatCurrency(isYearlySalary ? displayYearlySalary : displayMonthlySalary)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="border border-[#e5e5ea] rounded-xl overflow-hidden">
                                                    <div className="bg-[#f4f4f5] border-b border-[#e5e5ea] px-4 py-2 font-semibold text-[#1c1c1e] text-xs uppercase tracking-wider">{isYearlySalary ? t('DEDUCTIONS (YEARLY)') : t('DEDUCTIONS (MONTHLY)')}</div>
                                                    <div className="p-4 space-y-2 text-xs flex flex-col justify-between h-[104px]">
                                                        <div className="text-[#8e8e93] italic text-[11px]">
                                                            {t('N/A - no deductions configured')}
                                                        </div>
                                                        <div className="flex justify-between items-center border-t border-[#e5e5ea] pt-2 font-bold text-[#1c1c1e]">
                                                            <span>{t('Net take-home')}</span>
                                                            <span>{formatCurrency(isYearlySalary ? displayYearlySalary : displayMonthlySalary)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* EMPLOYMENT AGREEMENT */}
                                    {documentType === 'employment_agreement' && (
                                        <div className="space-y-4">
                                            <p>
                                                This Employment Agreement (the "Agreement") is entered into on {formatDocumentDate(activeDate)} between <strong className="text-[#1c1c1e]">{customCompanyName}</strong> (the "Company") and <strong className="text-[#1c1c1e]">{currentEmployee.name}</strong> (the "Employee").
                                            </p>
                                            
                                            {/* Details Box */}
                                            <div className="grid grid-cols-2 gap-x-8 gap-y-3 border border-[#e5e5ea] rounded-xl p-5 text-[12px]">
                                                <div><span className="text-[#8e8e93]">{t('Designation')}:</span> <strong className="text-[#1c1c1e]">{activeDesignation}</strong></div>
                                                <div><span className="text-[#8e8e93]">{t('Joining date')}:</span> <strong className="text-[#1c1c1e]">{formatDocumentDate(activeDate)}</strong></div>
                                                <div><span className="text-[#8e8e93]">{t('Employment type')}:</span> <strong className="text-[#1c1c1e]">{overrideEmploymentType}</strong></div>
                                                <div><span className="text-[#8e8e93]">{t('Job type')}:</span> <strong className="text-[#1c1c1e]">{overrideJobType}</strong></div>
                                                <div><span className="text-[#8e8e93]">{t('Work location')}:</span> <strong className="text-[#1c1c1e]">{workLocation || '—'}</strong></div>
                                                <div><span className="text-[#8e8e93]">{t('Gross salary')}:</span> <strong className="text-[#1c1c1e]">{isYearlySalary ? `${formatCurrency(displayYearlySalary)} / year (${formatCurrency(displayMonthlySalary)} / month)` : `${formatCurrency(displayMonthlySalary)} / month`}</strong></div>
                                            </div>

                                            {/* Earnings and Deductions tables side-by-side */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="border border-[#e5e5ea] rounded-xl overflow-hidden">
                                                    <div className="bg-[#f4f4f5] border-b border-[#e5e5ea] px-4 py-2 font-semibold text-[#1c1c1e] text-xs uppercase tracking-wider">{isYearlySalary ? t('EARNINGS (YEARLY)') : t('EARNINGS (MONTHLY)')}</div>
                                                    <div className="p-4 space-y-2 text-xs">
                                                        <div className="flex justify-between font-semibold text-[#1c1c1e]">
                                                            <span>{t('Basic salary')}</span>
                                                            <span>{formatCurrency(isYearlySalary ? displayYearlySalary : displayMonthlySalary)}</span>
                                                        </div>
                                                        <div className="text-[#8e8e93] italic">
                                                            {t('N/A - no allowances configured')}
                                                        </div>
                                                        <div className="flex justify-between border-t border-[#e5e5ea] pt-2 font-bold text-[#1c1c1e]">
                                                            <span>{t('Gross (CTC)')}</span>
                                                            <span>{formatCurrency(isYearlySalary ? displayYearlySalary : displayMonthlySalary)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="border border-[#e5e5ea] rounded-xl overflow-hidden">
                                                    <div className="bg-[#f4f4f5] border-b border-[#e5e5ea] px-4 py-2 font-semibold text-[#1c1c1e] text-xs uppercase tracking-wider">{isYearlySalary ? t('DEDUCTIONS (YEARLY)') : t('DEDUCTIONS (MONTHLY)')}</div>
                                                    <div className="p-4 space-y-2 text-xs flex flex-col justify-between h-[104px]">
                                                        <div className="text-[#8e8e93] italic">
                                                            {t('N/A - no deductions configured')}
                                                        </div>
                                                        <div className="flex justify-between border-t border-[#e5e5ea] pt-2 font-bold text-[#1c1c1e]">
                                                            <span>{t('Net take-home')}</span>
                                                            <span>{formatCurrency(currentEmployee.basic_salary)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Agreement terms (Editable body content) */}
                                            {resolvedCustomParagraph && (
                                                <div className="mt-4 text-[13px] text-[#1c1c1e] whitespace-pre-wrap leading-relaxed text-justify">
                                                    {resolvedCustomParagraph}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* PAYSLIP */}
                                    {documentType === 'payslip' && (
                                        <div className="space-y-4">
                                            {/* Employee details grid */}
                                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 border border-[#e5e5ea] rounded-xl p-5 text-[12px]">
                                                <div><span className="text-[#8e8e93]">{t('Employee')}:</span> <strong className="text-[#1c1c1e]">{currentEmployee.name}</strong></div>
                                                <div><span className="text-[#8e8e93]">{t('Employee Code')}:</span> <strong className="text-[#1c1c1e]">{currentEmployee.employee_id_code}</strong></div>
                                                <div><span className="text-[#8e8e93]">{t('Designation')}:</span> <strong className="text-[#1c1c1e]">{activeDesignation}</strong></div>
                                                <div><span className="text-[#8e8e93]">{t('Department')}:</span> <strong className="text-[#1c1c1e]">{activeDepartment}</strong></div>
                                                <div><span className="text-[#8e8e93]">{t('Job type')}:</span> <strong className="text-[#1c1c1e]">{overrideJobType}</strong></div>
                                                <div><span className="text-[#8e8e93]">{t('Joining date')}:</span> <strong className="text-[#1c1c1e]">{formatDocumentDate(activeDate)}</strong></div>
                                                <div className="col-span-2 mt-1 border-t border-[#e5e5ea] pt-2"><span className="text-[#8e8e93]">{t('Pay period')}:</span> <strong className="text-[#1c1c1e]">{new Date(payPeriod + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</strong></div>
                                            </div>

                                            {/* Earnings and Deductions tables side-by-side */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="border border-[#e5e5ea] rounded-xl overflow-hidden">
                                                    <div className="bg-[#f4f4f5] border-b border-[#e5e5ea] px-4 py-2 font-semibold text-[#1c1c1e] text-xs uppercase tracking-wider">{t('EARNINGS')}</div>
                                                    <div className="p-4 space-y-2 text-xs">
                                                        <div className="flex justify-between font-semibold text-[#1c1c1e]">
                                                            <span>{t('Basic Salary')}</span>
                                                            <span>{formatCurrency(currentEmployee.basic_salary)}</span>
                                                        </div>
                                                        <div className="flex justify-between border-t border-[#e5e5ea] pt-2 font-bold text-[#1c1c1e] mt-6">
                                                            <span>{t('Gross Earnings')}</span>
                                                            <span>{formatCurrency(currentEmployee.basic_salary)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="border border-[#e5e5ea] rounded-xl overflow-hidden">
                                                    <div className="bg-[#f4f4f5] border-b border-[#e5e5ea] px-4 py-2 font-semibold text-[#1c1c1e] text-xs uppercase tracking-wider">{t('DEDUCTIONS')}</div>
                                                    <div className="p-4 space-y-2 text-xs flex flex-col justify-between h-[104px]">
                                                        <div className="text-[#8e8e93] italic">
                                                            {t('No deductions')}
                                                        </div>
                                                        <div className="flex justify-between border-t border-[#e5e5ea] pt-2 font-bold text-[#1c1c1e]">
                                                            <span>{t('Total Deductions')}</span>
                                                            <span>$0.00</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Net Pay Box */}
                                            <div className="border-2 border-[#1c1c1e] rounded-xl p-4 flex justify-between items-center bg-white text-[#1c1c1e]">
                                                <div>
                                                    <span className="font-bold uppercase tracking-wider text-[10px] text-[#8e8e93] block">{t('NET PAY')}</span>
                                                    <span className="text-[11px] text-[#787880] italic">{numberToWords(currentEmployee.basic_salary)}</span>
                                                </div>
                                                <span className="text-2xl font-extrabold">{formatCurrency(currentEmployee.basic_salary)}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* EXPERIENCE LETTER */}
                                    {documentType === 'experience_letter' && (
                                        <div className="space-y-4">
                                            <h3 className="font-bold text-center text-sm uppercase tracking-wider border-b border-[#e5e5ea] pb-2 mb-4">{t('TO WHOM IT MAY CONCERN')}</h3>
                                            <div className="text-[13px] text-[#1c1c1e] whitespace-pre-wrap leading-relaxed text-justify">
                                                {resolvedCustomParagraph}
                                            </div>
                                        </div>
                                    )}

                                    {/* RELIEVING LETTER */}
                                    {documentType === 'relieving_letter' && (
                                        <div className="space-y-4">
                                            <h3 className="font-bold text-center text-sm uppercase tracking-wider border-b border-[#e5e5ea] pb-2 mb-4">{t('TO WHOM IT MAY CONCERN')}</h3>
                                            <div className="text-[13px] text-[#1c1c1e] whitespace-pre-wrap leading-relaxed text-justify">
                                                {resolvedCustomParagraph}
                                            </div>
                                        </div>
                                    )}

                                    {/* PROMOTION LETTER */}
                                    {documentType === 'promotion_letter' && (
                                        <div className="space-y-4">
                                            <p className="font-bold text-[#1c1c1e] text-sm">Dear {currentEmployee.name.split(' ')[0]},</p>
                                            <p>
                                                We are extremely pleased to inform you that you have been promoted to the position of <strong className="text-[#1c1c1e]">{newDesignation || t('[New Designation]')}</strong> in recognition of your outstanding performance, dedication, and contributions to <strong className="text-[#1c1c1e]">{customCompanyName}</strong>.
                                            </p>
                                            <p>
                                                This promotion will be effective from <strong className="text-[#1c1c1e]">{promotionEffectiveDate ? formatDocumentDate(promotionEffectiveDate) : formatDocumentDate(issuedDate)}</strong>.
                                            </p>
                                            
                                            {/* Details Box */}
                                            <div className="border border-[#e5e5ea] rounded-xl p-5 text-[12px] space-y-2">
                                                <div className="text-xs font-bold text-blue-800 uppercase tracking-wider border-b border-[#e5e5ea] pb-1 mb-2">{t('Updated Terms')}</div>
                                                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                                                    <div><span className="text-[#8e8e93]">{t('Previous Designation')}:</span> <span className="text-slate-500 line-through">{activeDesignation}</span></div>
                                                    <div><span className="text-[#8e8e93]">{t('New Designation')}:</span> <strong className="text-[#1c1c1e]">{newDesignation || t('[New Designation]')}</strong></div>
                                                    <div><span className="text-[#8e8e93]">{t('Department')}:</span> <strong className="text-[#1c1c1e]">{activeDepartment}</strong></div>
                                                    <div><span className="text-[#8e8e93]">{t('Effective Date')}:</span> <strong className="text-[#1c1c1e]">{promotionEffectiveDate ? formatDocumentDate(promotionEffectiveDate) : formatDocumentDate(issuedDate)}</strong></div>
                                                </div>
                                                <div className="mt-3 border-t border-[#e5e5ea] pt-3 flex justify-between items-center">
                                                    <div>
                                                        <span className="text-[#8e8e93]">{t('Previous Salary')}:</span> <span className="text-slate-500 line-through mr-4">{formatCurrency(currentEmployee.basic_salary)} {isYearlySalary ? t('/ year') : t('/ month')}</span>
                                                        <span className="text-[#8e8e93]">{t('New Gross Compensation')}:</span> <strong className="text-[#1c1c1e]">{newSalary ? formatCurrency(parseFloat(newSalary)) : formatCurrency(currentEmployee.basic_salary)} {isYearlySalary ? t('/ year') : t('/ month')}</strong>
                                                    </div>
                                                </div>
                                            </div>

                                            {resolvedCustomParagraph && (
                                                <div className="mt-4 text-[13px] text-[#1c1c1e] whitespace-pre-wrap leading-relaxed text-justify">
                                                    {resolvedCustomParagraph}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* TERMINATION LETTER */}
                                    {documentType === 'termination_letter' && (
                                        <div className="space-y-4">
                                            <p className="font-bold text-[#1c1c1e] text-sm">Dear {currentEmployee.name.split(' ')[0]},</p>
                                            <p>
                                                This letter serves as official notification that your employment with <strong className="text-[#1c1c1e]">{customCompanyName}</strong> is being terminated.
                                            </p>
                                            <p>
                                                Your final day of employment with the company will be <strong className="text-[#1c1c1e]">{terminationEffectiveDate ? formatDocumentDate(terminationEffectiveDate) : formatDocumentDate(issuedDate)}</strong>.
                                            </p>
                                            
                                            {/* Details Box */}
                                            <div className="border border-[#e5e5ea] rounded-xl p-5 text-[12px] space-y-2">
                                                <div className="text-xs font-bold text-red-800 uppercase tracking-wider border-b border-[#e5e5ea] pb-1 mb-2">{t('Termination Settlement details')}</div>
                                                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                                                    <div><span className="text-[#8e8e93]">{t('Termination Reason')}:</span> <strong className="text-[#1c1c1e]">{terminationReason || t('Performance Issues')}</strong></div>
                                                    <div><span className="text-[#8e8e93]">{t('Last Working Day')}:</span> <strong className="text-[#1c1c1e]">{terminationEffectiveDate ? formatDocumentDate(terminationEffectiveDate) : formatDocumentDate(issuedDate)}</strong></div>
                                                    <div><span className="text-[#8e8e93]">{t('Notice Period (Days)')}:</span> <strong className="text-[#1c1c1e]">{noticePeriod || '30'}</strong></div>
                                                    <div><span className="text-[#8e8e93]">{t('Severance Package')}:</span> <strong className="text-[#1c1c1e]">{severanceAmount ? formatCurrency(parseFloat(severanceAmount)) : t('None / Standard settlement')}</strong></div>
                                                </div>
                                            </div>

                                            {resolvedCustomParagraph && (
                                                <div className="mt-4 text-[13px] text-[#1c1c1e] whitespace-pre-wrap leading-relaxed text-justify">
                                                    {resolvedCustomParagraph}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* GENERAL DOCUMENT / CUSTOM TEMPLATE */}
                                    {!['offer_letter', 'employment_agreement', 'payslip', 'experience_letter', 'relieving_letter', 'promotion_letter', 'termination_letter'].includes(documentType) && (
                                        <div className="space-y-4">
                                            <p className="font-bold text-[#1c1c1e] text-sm">
                                                {t('Dear')} {currentEmployee.name},
                                            </p>
                                            
                                            {/* Standard Employee Info Box */}
                                            <div className="border border-[#e5e5ea] rounded-xl p-5 text-[12px] bg-[#f9f9fa]/50">
                                                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                                                    <div><span className="text-[#8e8e93]">{t('Employee Name')}:</span> <strong className="text-[#1c1c1e]">{currentEmployee.name}</strong></div>
                                                    <div><span className="text-[#8e8e93]">{t('Employee ID')}:</span> <strong className="text-[#1c1c1e]">{currentEmployee.employee_id_code}</strong></div>
                                                    <div><span className="text-[#8e8e93]">{t('Designation')}:</span> <strong className="text-[#1c1c1e]">{activeDesignation}</strong></div>
                                                    <div><span className="text-[#8e8e93]">{t('Department')}:</span> <strong className="text-[#1c1c1e]">{activeDepartment}</strong></div>
                                                    {workLocation && (
                                                        <div><span className="text-[#8e8e93]">{t('Location')}:</span> <strong className="text-[#1c1c1e]">{workLocation}</strong></div>
                                                    )}
                                                    <div><span className="text-[#8e8e93]">{t('Date')}:</span> <strong className="text-[#1c1c1e]">{formatDocumentDate(activeDate)}</strong></div>
                                                </div>
                                            </div>

                                            {/* Main Editable Body Text */}
                                            <div className="mt-6 text-[#1c1c1e] whitespace-pre-wrap min-h-[220px] text-justify leading-relaxed">
                                                {resolvedCustomParagraph || (
                                                    <span className="text-gray-400 italic">
                                                        {t('[Document Body Content]')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Custom Appended Paragraph */}
                                    {resolvedCustomParagraph && ['offer_letter', 'payslip'].includes(documentType) && (
                                        <p className="mt-4 border-t border-[#e5e5ea] pt-4 text-[#787880] italic">
                                            {resolvedCustomParagraph}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Signatures, Stamps, and Footer block - Exactly matches the user's PDF */}
                            <div className="mt-12">
                                <div className="flex justify-between items-end mb-8">
                                    <div className="space-y-3">
                                        {/* Official Circular Seal Image */}
                                        {hasSignature && (
                                            <div className="relative h-24 w-24">
                                                <img src="https://cdn.dynime.com/Dynime%20Logo/Seal/seal.png" alt="Dynime Seal" className="h-24 w-24 object-contain" />
                                            </div>
                                        )}
                                        <div className="text-[11px] space-y-0.5">
                                            <p className="text-[#8e8e93] uppercase font-bold text-[9px] tracking-wider mb-1">{t('SYSTEM GENERATED - NO SIGNATURE REQUIRED')}</p>
                                            <p className="font-bold text-[#1c1c1e]">{t('Authorised Signatory')}</p>
                                            <p className="text-[#787880]">Director, {customCompanyName}</p>
                                            <p className="text-[#787880]">{t('Date')}: {formatDocumentDate(activeDate)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right text-[11px] space-y-1">
                                        {prefill?.payload?.employee_signature ? (
                                            <div className="h-16 w-48 flex justify-end items-end mb-1 overflow-hidden">
                                                <img src={prefill.payload.employee_signature} alt="Employee Signature" className="h-16 object-contain" />
                                            </div>
                                        ) : signatureImage ? (
                                            <div className="h-16 w-32 flex justify-end items-end mb-1">
                                                <img src={signatureImage} alt="Signature" className="h-16 object-contain" />
                                            </div>
                                        ) : (
                                            <div className="font-normal text-[#1c1c1e] mb-1 h-12 flex items-end justify-end text-right pr-2 whitespace-nowrap w-60 ml-auto overflow-visible select-none" style={{ fontFamily: "'Caveat', cursive", fontSize: '24px', letterSpacing: '0.5px' }}>
                                                 {currentEmployee.name}
                                              </div>
                                        )}
                                        <div className="w-60 h-px bg-[#d1d1d6] ml-auto"></div>
                                        <p className="font-bold text-[#1c1c1e] mt-1">{currentEmployee.name}</p>
                                        <p className="text-[#787880]">{t('Employee Acceptance')}</p>
                                        <p className="text-[#787880]">
                                            {t('Date')}: {prefill?.payload?.employee_signature_date ? formatDocumentDate(prefill.payload.employee_signature_date.split(' ')[0]) : formatDocumentDate(activeDate)}
                                        </p>
                                    </div>
                                </div>

                                {/* Footer reference area - 100% Match */}
                                <div className="border-t border-[#e5e5ea] pt-4 text-[10px] text-[#787880]">
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div className="text-left space-y-1">
                                            <span className="block text-[9px] text-[#8e8e93] font-bold uppercase tracking-wider">{t('ISSUED BY')}</span>
                                            <span className="text-[#1c1c1e] font-bold">{customCompanyName}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="block text-[9px] text-[#8e8e93] font-bold uppercase tracking-wider">{t('CONTACT')}</span>
                                            <div className="text-[#787880] flex flex-col items-center justify-center gap-0.5">
                                                <span className="flex items-center gap-1">
                                                    <Mail className="h-3 w-3 text-[#8e8e93]" /> {companySettings.company_email || 'contact@dynime.com'}
                                                    <span className="text-[#e5e5ea]">•</span>
                                                    <Globe className="h-3 w-3 text-[#8e8e93]" /> {companySettings.company_website || 'dynime.com'}
                                                </span>
                                                <span className="flex items-center gap-1 text-[9px]">
                                                    <Phone className="h-2.5 w-2.5 text-[#8e8e93]" /> {companySettings.company_telephone || '+16468840271'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <span className="block text-[9px] text-[#8e8e93] font-bold uppercase tracking-wider">{t('REFERENCE')}</span>
                                            <span className="text-[#1c1c1e] font-semibold">{getDocumentTitle()} • {formatDocumentDate(issuedDate)}</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex justify-between items-center text-[9px] text-[#8e8e93] border-t border-dashed border-[#e5e5ea] pt-2">
                                        <p>{t('This is an electronically generated document and is valid without a physical signature.')}</p>
                                        <p>© {new Date().getFullYear()} {customCompanyName}</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl w-[794px] h-[1123px] flex flex-col items-center justify-center text-gray-400 p-8">
                            <FileText className="h-12 w-12 text-gray-300 mb-3" />
                            <p className="text-sm font-semibold">{t('Pick an employee to start')}</p>
                        </div>
                    )}
                </div>

            </div>
        </AuthenticatedLayout>
    );
}
