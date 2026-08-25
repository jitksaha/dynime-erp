import { useState, useEffect, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import PhoneInput from '@/components/ui/phone-input';
import { FileText, Save, Printer, Building2, User, History, Trash2, Search, Sparkles, MapPin, Mail, Phone, Globe, ShieldCheck, PenTool, Upload, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';

interface EmployeeItem {
    id: number;
    employee_id: string;
    name: string;
    email: string;
    phone: string;
    designation: string;
    department: string;
}

interface AgreementBuilderProps {
    companyInfo?: {
        name: string;
        email: string;
        phone: string;
        website: string;
        support_email: string;
        address: string;
    };
    employees?: EmployeeItem[];
}

export default function AgreementBuilder({ companyInfo, employees = [] }: AgreementBuilderProps) {
    const { t } = useTranslation();

    const company = companyInfo || {
        name: 'Dynime LLC.',
        email: 'contact@dynime.com',
        phone: '+1(646)8840271',
        website: 'dynime.com',
        support_email: 'support@dynime.com',
        address: '1209 Mountain Road PL STE N, Albuquerque, NM 87110, USA',
    };

    const logoUrl = "https://cdn.dynime.com/Dynime%20Logo/LOGO%20PNG/logo%20SVG/dynime-logo.svg";
    const sealUrl = "https://cdn.dynime.com/Dynime%20Logo/Seal/seal.png";

    // Auto-generate reference code helper
    const generateRefCode = (type: 'agreement' | 'quotation' | 'proposal' | 'notice') => {
        const prefix = type === 'quotation' ? 'QT' : type === 'proposal' ? 'PR' : type === 'notice' ? 'NT' : 'AG';
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        return `${prefix}-2026-${randomNum}`;
    };

    const [activeTab, setActiveTab] = useState<'builder' | 'history'>('builder');
    const [issueAs, setIssueAs] = useState<'company' | 'employee'>('company');
    const [docType, setDocType] = useState<'agreement' | 'quotation' | 'proposal' | 'notice'>('agreement');

    // Selected Employee for Issue As Employee
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [employeeSearch, setEmployeeSearch] = useState<string>('');

    // Document Fields
    const [title, setTitle] = useState('Service Agreement');
    const [reference, setReference] = useState(() => generateRefCode('agreement'));
    const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().split('T')[0]);

    // Notice Specific Fields
    const [noticeAudience, setNoticeAudience] = useState('All Employees & Stakeholders');
    const [noticeContact, setNoticeContact] = useState('HR & Administration Department | Email: hr@dynime.com | Phone: +1(646)8840271');

    // Client Fields
    const [clientName, setClientName] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [clientCompany, setClientCompany] = useState('');
    const [clientPhone, setClientPhone] = useState('');

    // Signature Fields
    const [signatureType, setSignatureType] = useState<'auto' | 'upload'>('auto');
    const [signerName, setSignerName] = useState('Jit Kumar');
    const [signerTitle, setSignerTitle] = useState('Client Authorized Signatory');
    const [signatureImage, setSignatureImage] = useState<string | null>(null);
    const [signatureFont, setSignatureFont] = useState<'dancing' | 'greatvibes' | 'pacifico'>('dancing');

    // Content Fields
    const [scopeOfWork, setScopeOfWork] = useState('');
    const [servicesText, setServicesText] = useState('');
    const [term, setTerm] = useState('This agreement remains in effect until all deliverables are completed and accepted.');
    const [paymentTerms, setPaymentTerms] = useState('50% advance, 50% on delivery. Invoices are payable within 14 days of issuance.');
    const [governingLaw, setGoverningLaw] = useState('Bangladesh');
    const [currency, setCurrency] = useState('USD');
    const [totalAgreedValue, setTotalAgreedValue] = useState('0');
    const [additionalClauses, setAdditionalClauses] = useState(
        `Confidentiality: Both parties agree to keep all shared information confidential.\nIntellectual Property: All deliverables transfer to the Client upon full payment.\nTermination: Either party may terminate this agreement with 14 days written notice.`
    );

    // History / Saved Docs State
    const [savedDocs, setSavedDocs] = useState<any[]>([]);

    // 1. Auto-restore draft or load saved history on mount
    useEffect(() => {
        const storedHistory = localStorage.getItem('dynime_agreements_history');
        if (storedHistory) {
            try {
                setSavedDocs(JSON.parse(storedHistory));
            } catch (e) {}
        }

        const storedDraft = localStorage.getItem('dynime_agreements_draft');
        if (storedDraft) {
            try {
                const draft = JSON.parse(storedDraft);
                if (draft.title) setTitle(draft.title);
                if (draft.reference) setReference(draft.reference);
                if (draft.noticeAudience) setNoticeAudience(draft.noticeAudience);
                if (draft.noticeContact) setNoticeContact(draft.noticeContact);
                if (draft.clientName) setClientName(draft.clientName);
                if (draft.clientEmail) setClientEmail(draft.clientEmail);
                if (draft.clientCompany) setClientCompany(draft.clientCompany);
                if (draft.clientPhone) setClientPhone(draft.clientPhone);
                if (draft.scopeOfWork) setScopeOfWork(draft.scopeOfWork);
                if (draft.servicesText) setServicesText(draft.servicesText);
                if (draft.term) setTerm(draft.term);
                if (draft.paymentTerms) setPaymentTerms(draft.paymentTerms);
                if (draft.governingLaw) setGoverningLaw(draft.governingLaw);
                if (draft.currency) setCurrency(draft.currency);
                if (draft.totalAgreedValue) setTotalAgreedValue(draft.totalAgreedValue);
                if (draft.additionalClauses) setAdditionalClauses(draft.additionalClauses);
                if (draft.signatureType) setSignatureType(draft.signatureType);
                if (draft.signerName) setSignerName(draft.signerName);
                if (draft.signerTitle) setSignerTitle(draft.signerTitle);
                if (draft.signatureImage) setSignatureImage(draft.signatureImage);
                if (draft.signatureFont) setSignatureFont(draft.signatureFont);
            } catch (e) {}
        }

        const params = new URLSearchParams(window.location.search);
        const urlType = params.get('type');
        if (urlType === 'quotation' || urlType === 'proposal' || urlType === 'agreement' || urlType === 'notice') {
            setDocType(urlType as any);
            setReference(generateRefCode(urlType as any));
            if (urlType === 'quotation') {
                setTitle('Service Quotation');
            } else if (urlType === 'proposal') {
                setTitle('Service Proposal');
            } else if (urlType === 'notice') {
                setTitle('Official Notice & Press Release');
                setScopeOfWork('This is an official notice issued to inform all members, clients, and partners regarding our revised operational schedule and upcoming company announcements.');
                setServicesText('1. Effective Date of Policy: Immediate Effect\n2. Mandatory Attendance for Quarterly Sync Meeting\n3. Contact Admin for Urgent Queries');
            } else {
                setTitle('Service Agreement');
            }
        }
    }, []);

    // 2. Auto-Save Draft on Change
    useEffect(() => {
        const draft = {
            docType, issueAs, title, reference, effectiveDate, noticeAudience, noticeContact,
            clientName, clientEmail, clientCompany, clientPhone,
            scopeOfWork, servicesText, term, paymentTerms,
            governingLaw, currency, totalAgreedValue, additionalClauses, selectedEmployeeId,
            signatureType, signerName, signerTitle, signatureImage, signatureFont
        };
        localStorage.setItem('dynime_agreements_draft', JSON.stringify(draft));
    }, [
        docType, issueAs, title, reference, effectiveDate, noticeAudience, noticeContact, clientName, clientEmail,
        clientCompany, clientPhone, scopeOfWork, servicesText, term, paymentTerms,
        governingLaw, currency, totalAgreedValue, additionalClauses, selectedEmployeeId,
        signatureType, signerName, signerTitle, signatureImage, signatureFont
    ]);

    // Handle Doc Type Change & Generate Auto Ref Code
    const handleDocTypeChange = (type: 'agreement' | 'quotation' | 'proposal' | 'notice') => {
        setDocType(type);
        setReference(generateRefCode(type));
        if (type === 'agreement') {
            setTitle('Service Agreement');
        } else if (type === 'quotation') {
            setTitle('Service Quotation');
        } else if (type === 'proposal') {
            setTitle('Service Proposal');
        } else if (type === 'notice') {
            setTitle('Official Notice & Press Release');
            if (!scopeOfWork) {
                setScopeOfWork('This is an official notice issued to inform all members, clients, and partners regarding our revised operational schedule and upcoming company announcements.');
            }
            if (!servicesText) {
                setServicesText('1. Effective Date of Policy: Immediate Effect\n2. Mandatory Attendance for Quarterly Sync Meeting\n3. Contact Admin for Urgent Queries');
            }
        }
    };

    // Handle Signature Image Upload
    const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error(t('Signature image size should be less than 5MB'));
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                setSignatureImage(result);
                toast.success(t('Signature image attached successfully!'));
            };
            reader.readAsDataURL(file);
        }
    };

    // Filter employees by search
    const filteredEmployees = useMemo(() => {
        if (!employeeSearch.trim()) return employees;
        const q = employeeSearch.toLowerCase();
        return employees.filter(emp =>
            emp.name.toLowerCase().includes(q) ||
            emp.email.toLowerCase().includes(q) ||
            emp.designation.toLowerCase().includes(q) ||
            emp.department.toLowerCase().includes(q) ||
            emp.employee_id.toLowerCase().includes(q)
        );
    }, [employees, employeeSearch]);

    // Selected Employee Object
    const selectedEmployee = useMemo(() => {
        return employees.find(e => e.id.toString() === selectedEmployeeId.toString()) || null;
    }, [employees, selectedEmployeeId]);

    const handleSave = () => {
        const newDoc = {
            id: Date.now(),
            docType,
            issueAs,
            title,
            reference: reference || generateRefCode(docType),
            effectiveDate,
            clientName,
            clientCompany,
            clientEmail,
            clientPhone,
            totalAgreedValue,
            currency,
            employeeName: selectedEmployee ? selectedEmployee.name : null,
            signatureType,
            signerName,
            signerTitle,
            createdAt: new Date().toISOString()
        };
        const updated = [newDoc, ...savedDocs];
        setSavedDocs(updated);
        localStorage.setItem('dynime_agreements_history', JSON.stringify(updated));
        toast.success(t('Document saved successfully!'));
    };

    const handleDeleteSaved = (id: number) => {
        const updated = savedDocs.filter(d => d.id !== id);
        setSavedDocs(updated);
        localStorage.setItem('dynime_agreements_history', JSON.stringify(updated));
        toast.success(t('Document removed from history'));
    };

    const handlePrint = () => {
        window.print();
    };

    // Format date string for preview display
    const formattedDate = new Date(effectiveDate || Date.now()).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    // Parse clauses
    const parsedClauses = additionalClauses
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .map(line => {
            if (line.includes(':')) {
                const parts = line.split(':');
                return { title: parts[0].trim(), body: parts.slice(1).join(':').trim() };
            }
            return { title: 'General Term', body: line };
        });

    // Parse services
    const parsedServices = servicesText
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);

    return (
        <AuthenticatedLayout>
            <Head title={t("Agreement & Quotation Builder")} />

            <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
                {/* Print Stylesheet for 100% Clean PDF Generation without browser headers/footers */}
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&family=Great+Vibes&family=Pacifico&family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');

                    #printable-document, #printable-document *:not(.signature-font) {
                        font-family: 'Poppins', sans-serif !important;
                    }

                    .signature-font-dancing {
                        font-family: 'Dancing Script', cursive !important;
                    }

                    .signature-font-greatvibes {
                        font-family: 'Great Vibes', cursive !important;
                    }

                    .signature-font-pacifico {
                        font-family: 'Pacifico', cursive !important;
                    }

                    @page {
                        size: A4 portrait;
                        margin: 0 !important;
                    }
                    @media print {
                        html, body {
                            height: auto !important;
                            overflow: visible !important;
                            background: #ffffff !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        nav, header, sidebar, .no-print, [role="navigation"], .lg\\:col-span-6:first-child {
                            display: none !important;
                        }
                        #printable-document {
                            position: absolute !important;
                            top: 0 !important;
                            left: 0 !important;
                            width: 100% !important;
                            max-width: 100% !important;
                            margin: 0 !important;
                            padding: 6mm 10mm !important;
                            border: none !important;
                            box-shadow: none !important;
                            background: #ffffff !important;
                            page-break-after: avoid !important;
                            page-break-inside: avoid !important;
                        }
                    }
                `}</style>

                {/* Top Action Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
                    <div className="flex items-center space-x-3">
                        <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                            <FileText className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                                {t('Agreement Builder')}
                            </h1>
                            <p className="text-xs text-slate-500">
                                {t('Generate professional agreements, quotations, and proposals with auto-save & PDF support')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={handleSave}
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1.5 font-semibold text-slate-700 bg-white border-slate-200 hover:bg-slate-50"
                        >
                            <Save className="h-4 w-4" />
                            {t('Save')}
                        </Button>
                        <Button
                            onClick={handlePrint}
                            size="sm"
                            className="flex items-center gap-1.5 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                        >
                            <Printer className="h-4 w-4" />
                            {t('Print / Save as PDF')}
                        </Button>
                    </div>
                </div>

                {/* Main Navigation Tabs */}
                <div className="flex items-center gap-2 border-b border-slate-200 no-print pb-2">
                    <button
                        onClick={() => setActiveTab('builder')}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                            activeTab === 'builder'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        {t('Document Builder')}
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                            activeTab === 'history'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        <History className="h-3.5 w-3.5" />
                        <span>{t('Saved History')}</span>
                        {savedDocs.length > 0 && (
                            <Badge className="bg-indigo-600 text-white text-[10px] px-1.5 py-0 h-4">
                                {savedDocs.length}
                            </Badge>
                        )}
                    </button>
                </div>

                {/* TAB 1: BUILDER MODE */}
                {activeTab === 'builder' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* LEFT COLUMN: BUILDER FORM CONTROLS (NO PRINT) */}
                        <div className="lg:col-span-6 space-y-4 no-print">
                            {/* Document Type & Issuer Selector */}
                            <Card className="border-slate-200/80 shadow-xs">
                                <CardHeader className="p-4 border-b border-slate-100 pb-3">
                                    <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
                                        <span>1. {t('Document Type & Issuer Settings')}</span>
                                        <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-50 border-emerald-200 font-mono">
                                            {t('Draft Auto-Saved')}
                                        </Badge>
                                    </h3>
                                </CardHeader>
                                <CardContent className="p-4 space-y-4">
                                     <div>
                                        <Label className="text-xs font-bold text-slate-700 mb-1.5 block">{t('Document Category')}</Label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleDocTypeChange('agreement')}
                                                className={`px-3 py-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                                                    docType === 'agreement'
                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                                }`}
                                            >
                                                {t('Agreement')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDocTypeChange('quotation')}
                                                className={`px-3 py-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                                                    docType === 'quotation'
                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                                }`}
                                            >
                                                {t('Quotation')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDocTypeChange('proposal')}
                                                className={`px-3 py-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                                                    docType === 'proposal'
                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                                }`}
                                            >
                                                {t('Proposal')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDocTypeChange('notice')}
                                                className={`px-3 py-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                                                    docType === 'notice'
                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                                }`}
                                            >
                                                {t('Notice / Press')}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-xs font-bold text-slate-700 mb-1.5 block">{t('Issue Document As')}</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setIssueAs('company')}
                                                className={`p-2.5 rounded-lg border text-left flex items-center space-x-2.5 transition-all ${
                                                    issueAs === 'company'
                                                        ? 'bg-indigo-50/80 border-indigo-300 text-indigo-900 font-semibold'
                                                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                                }`}
                                            >
                                                <Building2 className="h-4 w-4 text-indigo-600 shrink-0" />
                                                <div className="text-xs">
                                                    <p className="font-bold">{company.name}</p>
                                                    <p className="text-[10px] text-slate-500">{t('Company Entity')}</p>
                                                </div>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setIssueAs('employee')}
                                                className={`p-2.5 rounded-lg border text-left flex items-center space-x-2.5 transition-all ${
                                                    issueAs === 'employee'
                                                        ? 'bg-purple-50/80 border-purple-300 text-purple-900 font-semibold'
                                                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                                }`}
                                            >
                                                <User className="h-4 w-4 text-purple-600 shrink-0" />
                                                <div className="text-xs">
                                                    <p className="font-bold">{t('Employee Profile')}</p>
                                                    <p className="text-[10px] text-slate-500">{t('Issue on behalf')}</p>
                                                </div>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Employee Selector Dropdown */}
                                    {issueAs === 'employee' && (
                                        <div className="space-y-2 pt-2 border-t border-slate-100">
                                            <Label className="text-xs font-bold text-slate-700">{t('Select Representative Employee')}</Label>
                                            <div className="relative">
                                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                                                <Input
                                                    type="text"
                                                    value={employeeSearch}
                                                    onChange={(e) => setEmployeeSearch(e.target.value)}
                                                    placeholder={t('Search employee by name, email, role...')}
                                                    className="pl-8 text-xs h-8"
                                                />
                                            </div>

                                            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
                                                {filteredEmployees.length > 0 ? (
                                                    filteredEmployees.map((emp) => (
                                                        <div
                                                            key={emp.id}
                                                            onClick={() => setSelectedEmployeeId(emp.id.toString())}
                                                            className={`p-2 text-xs cursor-pointer flex items-center justify-between hover:bg-slate-50 transition-colors ${
                                                                selectedEmployeeId.toString() === emp.id.toString() ? 'bg-purple-50/80 font-bold text-purple-900' : ''
                                                            }`}
                                                        >
                                                            <div>
                                                                <p className="font-semibold text-slate-800">{emp.name}</p>
                                                                <p className="text-[10px] text-slate-500">{emp.designation || 'Staff'} · {emp.email}</p>
                                                            </div>
                                                            {selectedEmployeeId.toString() === emp.id.toString() && (
                                                                <Badge className="bg-purple-600 text-white text-[9px]">{t('Selected')}</Badge>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="p-3 text-xs text-slate-400 text-center">{t('No employees found')}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Document Title & Reference */}
                            <Card className="border-slate-200/80 shadow-xs">
                                <CardContent className="p-4 space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-xs font-bold text-slate-700">{docType === 'notice' ? t('Notice Title & Headline') : t('Document title')}</Label>
                                            <Input
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                placeholder={docType === 'notice' ? t('e.g. Official Notice: Office Schedule & Policy Update') : t('Title')}
                                                className="mt-1 text-xs"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs font-bold text-slate-700">{t('Reference / Code')}</Label>
                                            <Input
                                                value={reference}
                                                onChange={(e) => setReference(e.target.value)}
                                                className="mt-1 text-xs font-mono uppercase"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-xs font-bold text-slate-700">{docType === 'notice' ? t('Publish / Effective date') : t('Effective date')}</Label>
                                            <Input
                                                type="date"
                                                value={effectiveDate}
                                                onChange={(e) => setEffectiveDate(e.target.value)}
                                                className="mt-1 text-xs"
                                            />
                                        </div>
                                        {docType === 'notice' && (
                                            <div>
                                                <Label className="text-xs font-bold text-slate-700">{t('Target Audience / Recipient Scope')}</Label>
                                                <Input
                                                    value={noticeAudience}
                                                    onChange={(e) => setNoticeAudience(e.target.value)}
                                                    placeholder={t('e.g. All Employees & Stakeholders')}
                                                    className="mt-1 text-xs"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Client Information (Hidden for Notice / Press) */}
                            {docType !== 'notice' && (
                                <Card className="border-slate-200/80 shadow-xs">
                                    <CardContent className="p-4 space-y-3">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <Label className="text-xs font-bold text-slate-700">{t('Client name')}</Label>
                                                <Input
                                                    value={clientName}
                                                    onChange={(e) => setClientName(e.target.value)}
                                                    placeholder={t('Client Full Name')}
                                                    className="mt-1 text-xs"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs font-bold text-slate-700">{t('Client email')}</Label>
                                                <Input
                                                    type="email"
                                                    value={clientEmail}
                                                    onChange={(e) => setClientEmail(e.target.value)}
                                                    placeholder={t('client@example.com')}
                                                    className="mt-1 text-xs"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <Label className="text-xs font-bold text-slate-700">{t('Client company')}</Label>
                                                <Input
                                                    value={clientCompany}
                                                    onChange={(e) => setClientCompany(e.target.value)}
                                                    placeholder={t('Company Name')}
                                                    className="mt-1 text-xs"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs font-bold text-slate-700">{t('Client phone')}</Label>
                                                <PhoneInput
                                                    value={clientPhone}
                                                    onChange={(val) => setClientPhone(val || '')}
                                                    placeholder={t('Enter phone number')}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Announcement Body & Highlights */}
                            <Card className="border-slate-200/80 shadow-xs">
                                <CardContent className="p-4 space-y-3">
                                    <div>
                                        <Label className="text-xs font-bold text-slate-700">
                                            {docType === 'notice' ? t('Notice Details & Press Announcement Body') : t('Scope of work')}
                                        </Label>
                                        <Textarea
                                            value={scopeOfWork}
                                            onChange={(e) => setScopeOfWork(e.target.value)}
                                            placeholder={docType === 'notice' ? t('Enter complete notice body or press release announcement text...') : t('Describe the detailed scope of work or project goals...')}
                                            className="mt-1 text-xs min-h-[90px]"
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-xs font-bold text-slate-700">
                                            {docType === 'notice' ? t('Key Highlights & Important Points (one per line)') : t('Services (one per line)')}
                                        </Label>
                                        <Textarea
                                            value={servicesText}
                                            onChange={(e) => setServicesText(e.target.value)}
                                            placeholder={docType === 'notice' ? t('1. Effective Date: Immediate Effect\n2. Mandatory Townhall Attendance\n3. Contact HR for Details') : t('Web Application Development\nUI/UX Design Systems\nCloud Infrastructure Setup')}
                                            className="mt-1 text-xs min-h-[70px] font-mono"
                                        />
                                    </div>

                                    {docType === 'notice' && (
                                        <div>
                                            <Label className="text-xs font-bold text-slate-700">{t('Enquiries Contact Information')}</Label>
                                            <Input
                                                value={noticeContact}
                                                onChange={(e) => setNoticeContact(e.target.value)}
                                                placeholder={t('e.g. HR Department | Email: hr@dynime.com | Phone: +1(646)8840271')}
                                                className="mt-1 text-xs"
                                            />
                                        </div>
                                    )}

                                    {docType === 'notice' && (
                                        <div>
                                            <Label className="text-xs font-bold text-slate-700">
                                                {t('Additional Policy Notes / Guidelines (one per line, use "Title: Body")')}
                                            </Label>
                                            <Textarea
                                                value={additionalClauses}
                                                onChange={(e) => setAdditionalClauses(e.target.value)}
                                                className="mt-1 text-xs min-h-[70px] font-mono"
                                            />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Terms & Payment (Hidden for Notice / Press) */}
                            {docType !== 'notice' && (
                                <Card className="border-slate-200/80 shadow-xs">
                                    <CardContent className="p-4 space-y-3">
                                        <div>
                                            <Label className="text-xs font-bold text-slate-700">{t('Term')}</Label>
                                            <Textarea
                                                value={term}
                                                onChange={(e) => setTerm(e.target.value)}
                                                className="mt-1 text-xs min-h-[50px]"
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-xs font-bold text-slate-700">{t('Payment terms')}</Label>
                                            <Textarea
                                                value={paymentTerms}
                                                onChange={(e) => setPaymentTerms(e.target.value)}
                                                className="mt-1 text-xs min-h-[50px]"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <Label className="text-xs font-bold text-slate-700">{t('Governing law / Jurisdiction')}</Label>
                                                <Input
                                                    value={governingLaw}
                                                    onChange={(e) => setGoverningLaw(e.target.value)}
                                                    className="mt-1 text-xs"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs font-bold text-slate-700">{t('Currency')}</Label>
                                                <Input
                                                    value={currency}
                                                    onChange={(e) => setCurrency(e.target.value)}
                                                    className="mt-1 text-xs font-mono uppercase"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-xs font-bold text-slate-700">{t('Total agreed value')}</Label>
                                            <Input
                                                type="number"
                                                value={totalAgreedValue}
                                                onChange={(e) => setTotalAgreedValue(e.target.value)}
                                                className="mt-1 text-xs font-mono"
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-xs font-bold text-slate-700">
                                                {t('Additional clauses (one per line, use "Title: body")')}
                                            </Label>
                                            <Textarea
                                                value={additionalClauses}
                                                onChange={(e) => setAdditionalClauses(e.target.value)}
                                                className="mt-1 text-xs min-h-[80px] font-mono"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Section 6: Signature & Seal Settings */}
                            <Card className="border-slate-200/80 shadow-xs">
                                <CardContent className="p-4 space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                            <PenTool className="h-3.5 w-3.5 text-indigo-600" />
                                            {t('6. Signature & Seal Settings')}
                                        </Label>
                                        <Badge variant="outline" className="text-[10px] text-indigo-700 bg-indigo-50 font-mono">
                                            {t('Print & PDF Attached')}
                                        </Badge>
                                    </div>

                                    {/* Mode Switcher */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setSignatureType('auto')}
                                            className={`px-3 py-2 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
                                                signatureType === 'auto'
                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            <Sparkles className="h-3.5 w-3.5" />
                                            <span>{t('Auto Visual Sign')}</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSignatureType('upload')}
                                            className={`px-3 py-2 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
                                                signatureType === 'upload'
                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            <Upload className="h-3.5 w-3.5" />
                                            <span>{t('Upload Signature')}</span>
                                        </button>
                                    </div>

                                    {/* Common Signer Info */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-xs font-semibold text-slate-700">{t('Signer Name')}</Label>
                                            <Input
                                                value={signerName}
                                                onChange={(e) => setSignerName(e.target.value)}
                                                placeholder={clientName || 'e.g. Jit Kumar'}
                                                className="mt-1 text-xs"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs font-semibold text-slate-700">{t('Signer Title / Role')}</Label>
                                            <Input
                                                value={signerTitle}
                                                onChange={(e) => setSignerTitle(e.target.value)}
                                                placeholder="e.g. Authorized Signatory / CEO"
                                                className="mt-1 text-xs"
                                            />
                                        </div>
                                    </div>

                                    {/* Mode: Auto Visual Signature */}
                                    {signatureType === 'auto' && (
                                        <div className="space-y-3 pt-1">
                                            <div>
                                                <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">{t('Signature Font Style')}</Label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSignatureFont('dancing')}
                                                        style={{ fontFamily: "'Dancing Script', cursive" }}
                                                        className={`px-2 py-1.5 text-base border rounded-md text-center transition ${
                                                            signatureFont === 'dancing' ? 'border-indigo-600 bg-indigo-50/50 font-bold text-indigo-900' : 'border-slate-200 hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        Dancing
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSignatureFont('greatvibes')}
                                                        style={{ fontFamily: "'Great Vibes', cursive" }}
                                                        className={`px-2 py-1.5 text-lg border rounded-md text-center transition ${
                                                            signatureFont === 'greatvibes' ? 'border-indigo-600 bg-indigo-50/50 font-bold text-indigo-900' : 'border-slate-200 hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        Vibes
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSignatureFont('pacifico')}
                                                        style={{ fontFamily: "'Pacifico', cursive" }}
                                                        className={`px-2 py-1.5 text-sm border rounded-md text-center transition ${
                                                            signatureFont === 'pacifico' ? 'border-indigo-600 bg-indigo-50/50 font-bold text-indigo-900' : 'border-slate-200 hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        Pacifico
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Live Visual Signature Preview */}
                                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1 text-center">
                                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">{t('Live Visual Signature Preview')}</span>
                                                <div className="h-10 flex items-center justify-center">
                                                    <span
                                                        className={`signature-font text-2xl text-indigo-950 font-bold tracking-wide select-none ${
                                                            signatureFont === 'greatvibes'
                                                                ? 'signature-font-greatvibes'
                                                                : signatureFont === 'pacifico'
                                                                ? 'signature-font-pacifico'
                                                                : 'signature-font-dancing'
                                                        }`}
                                                    >
                                                        {signerName || clientName || 'Jit Kumar'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-700 font-semibold">
                                                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                                                    <span>{t('Digital Signature Attached to Print')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Mode: Upload Signature Image */}
                                    {signatureType === 'upload' && (
                                        <div className="space-y-3 pt-1">
                                            {signatureImage ? (
                                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <img src={signatureImage} alt="Uploaded Signature" className="h-12 max-w-[140px] object-contain border border-slate-200 bg-white p-1 rounded-md" />
                                                        <div className="text-xs">
                                                            <p className="font-bold text-slate-800">{t('Signature Attached')}</p>
                                                            <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                                                                <CheckCircle2 className="h-3 w-3" />
                                                                {t('Ready for Print & PDF')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setSignatureImage(null)}
                                                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-1.5 h-auto"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-4 text-center cursor-pointer bg-slate-50/50 hover:bg-indigo-50/20 transition-all relative">
                                                    <input
                                                        type="file"
                                                        accept="image/png,image/jpeg,image/svg+xml"
                                                        onChange={handleSignatureUpload}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    />
                                                    <Upload className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                                                    <p className="text-xs font-bold text-slate-700">{t('Click or drag to upload Signature Image')}</p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">{t('PNG with transparent background recommended (Max 5MB)')}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* RIGHT COLUMN: REAL-TIME LIVE A4 DOCUMENT PREVIEW */}
                        <div className="lg:col-span-6 sticky top-6">
                            <div
                                id="printable-document"
                                className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm text-slate-900 space-y-4 text-xs relative overflow-hidden"
                                style={{ fontFamily: "'Poppins', sans-serif" }}
                            >
                                {/* Header Section with Official Dynime SVG Logo */}
                                <div className="flex items-start justify-between border-b border-slate-200 pb-3.5">
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 block">
                                            {docType === 'quotation' ? 'SERVICE QUOTATION' : docType === 'proposal' ? 'SERVICE PROPOSAL' : docType === 'notice' ? 'OFFICIAL NOTICE & PRESS RELEASE' : 'SERVICE AGREEMENT'}
                                        </span>
                                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                            {title || (docType === 'quotation' ? 'Service Quotation' : docType === 'proposal' ? 'Service Proposal' : docType === 'notice' ? 'Official Notice & Press Release' : 'Service Agreement')}
                                        </h2>
                                        <div className="text-[11px] text-slate-500 font-mono space-y-0.5 pt-0.5">
                                            <p className="flex items-center gap-1.5">
                                                <FileText className="h-3 w-3 text-slate-400 shrink-0" />
                                                <span>Reference: <strong className="text-slate-800">{reference}</strong></span>
                                            </p>
                                            <p className="flex items-center gap-1.5">
                                                <ShieldCheck className="h-3 w-3 text-slate-400 shrink-0" />
                                                <span>Effective date: <strong className="text-slate-800">{formattedDate}</strong></span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Top Right Official SVG Logo & Entity Info */}
                                    <div className="text-right space-y-1">
                                        <img src={logoUrl} alt="Dynime Logo" className="h-7 max-w-[130px] ml-auto object-contain" />
                                        <p className="text-xs font-bold text-slate-900">{company.name}</p>
                                        <p className="text-[10px] text-slate-500 font-mono flex items-center justify-end gap-1">
                                            <Globe className="h-3 w-3 text-slate-400 shrink-0" />
                                            <span>{company.website}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* 2 Column Info Header (Notice vs Agreement) */}
                                <div className="grid grid-cols-2 gap-4 text-[11px] border-b border-slate-200 pb-3.5">
                                    {/* Issuer Side: Company or Employee */}
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                            <Building2 className="h-3 w-3 text-slate-500" />
                                            {docType === 'notice' ? 'ISSUED BY' : 'SERVICE PROVIDER'}
                                        </span>

                                        {issueAs === 'employee' && selectedEmployee ? (
                                            <>
                                                <p className="font-bold text-slate-900 text-xs">{selectedEmployee.name}</p>
                                                <p className="text-indigo-700 font-semibold">{selectedEmployee.designation || 'Authorized Representative'}</p>
                                                <p className="text-slate-500 text-[10px]">On behalf of <strong>{company.name}</strong></p>
                                                {selectedEmployee.email && (
                                                    <p className="text-slate-600 font-mono flex items-center gap-1.5">
                                                        <Mail className="h-3 w-3 text-indigo-500 shrink-0" />
                                                        <span>{selectedEmployee.email}</span>
                                                    </p>
                                                )}
                                                {selectedEmployee.phone && (
                                                    <p className="text-slate-600 font-mono flex items-center gap-1.5">
                                                        <Phone className="h-3 w-3 text-indigo-500 shrink-0" />
                                                        <span>{selectedEmployee.phone}</span>
                                                    </p>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <p className="font-bold text-slate-900 text-xs">{company.name}</p>
                                                <p className="text-slate-600 font-mono flex items-center gap-1.5">
                                                    <Mail className="h-3 w-3 text-indigo-500 shrink-0" />
                                                    <span>{company.email}</span>
                                                </p>
                                                <p className="text-slate-600 font-mono flex items-center gap-1.5">
                                                    <Phone className="h-3 w-3 text-indigo-500 shrink-0" />
                                                    <span>{company.phone}</span>
                                                </p>
                                                <p className="text-slate-600 font-mono flex items-center gap-1.5">
                                                    <Globe className="h-3 w-3 text-indigo-500 shrink-0" />
                                                    <span>{company.website}</span>
                                                </p>
                                            </>
                                        )}
                                    </div>

                                    {/* Client or Recipient Audience Side */}
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                            <User className="h-3 w-3 text-slate-500" />
                                            {docType === 'notice' ? 'TARGET AUDIENCE / RECIPIENTS' : 'CLIENT'}
                                        </span>
                                        {docType === 'notice' ? (
                                            <>
                                                <p className="font-bold text-slate-900 text-xs">{noticeAudience || 'All Employees & Stakeholders'}</p>
                                                <p className="text-slate-500 text-[10px]">Official Distribution List</p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="font-bold text-slate-900 text-xs">{clientName || 'Client'}</p>
                                                {clientCompany && <p className="text-slate-700 font-medium">{clientCompany}</p>}
                                                {clientEmail && (
                                                    <p className="text-slate-600 font-mono flex items-center gap-1.5">
                                                        <Mail className="h-3 w-3 text-indigo-500 shrink-0" />
                                                        <span>{clientEmail}</span>
                                                    </p>
                                                )}
                                                {clientPhone && (
                                                    <p className="text-slate-600 font-mono flex items-center gap-1.5">
                                                        <Phone className="h-3 w-3 text-indigo-500 shrink-0" />
                                                        <span>{clientPhone}</span>
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Preamble Text */}
                                <p className="text-[11px] leading-relaxed text-slate-600">
                                    {docType === 'notice'
                                        ? `This Official Notice & Announcement is issued on ${formattedDate} by ${company.name} ("Company") for ${noticeAudience || 'All Stakeholders & Employees'}.`
                                        : `This ${docType === 'quotation' ? 'Service Quotation' : docType === 'proposal' ? 'Service Proposal' : 'Service Agreement'} (the "Agreement") is entered into on ${formattedDate} between ${company.name} ("Service Provider") and ${clientName || 'Client'} ("Client"). Each may be referred to individually as a "Party" and collectively as the "Parties".`
                                    }
                                </p>

                                {/* Body Dynamic Sections */}
                                <div className="space-y-3.5 text-[11px]">
                                    {/* Notice Details or Scope of Work */}
                                    {scopeOfWork && (
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-indigo-950">
                                                {docType === 'notice' ? 'Announcement & Notice Details' : 'Scope of Work'}
                                            </h4>
                                            <p className="text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">{scopeOfWork}</p>
                                        </div>
                                    )}

                                    {/* Key Highlights or Services */}
                                    {parsedServices.length > 0 && (
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-indigo-950">
                                                {docType === 'notice' ? 'Key Highlights & Important Points' : 'Services Included'}
                                            </h4>
                                            <ul className="list-disc list-inside space-y-1 text-slate-700 bg-slate-50/30 p-2 rounded-lg border border-slate-100">
                                                {parsedServices.map((srv, idx) => (
                                                    <li key={idx} className="font-medium">{srv}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Notice Contact Info */}
                                    {docType === 'notice' && noticeContact && (
                                        <div className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-100 text-indigo-900 space-y-0.5">
                                            <h5 className="font-bold text-xs uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                                                <Phone className="h-3 w-3 text-indigo-600" />
                                                Enquiries & Contact Person
                                            </h5>
                                            <p className="text-[11px] font-mono text-indigo-800">{noticeContact}</p>
                                        </div>
                                    )}

                                    {/* Additional Clauses / Policy Guidelines */}
                                    {docType === 'notice' ? (
                                        parsedClauses.length > 0 && (
                                            <div className="space-y-1.5">
                                                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-indigo-950">
                                                    Additional Guidelines & Directives
                                                </h4>
                                                {parsedClauses.map((clause, idx) => (
                                                    <div key={idx} className="space-y-0.5">
                                                        <h5 className="font-bold text-slate-800 text-[11px]">
                                                            {idx + 1}. {clause.title}
                                                        </h5>
                                                        <p className="text-slate-600 leading-relaxed">{clause.body}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    ) : (
                                        <>
                                            {/* Term */}
                                            <div className="space-y-0.5">
                                                <h4 className="font-bold text-slate-900 text-xs">
                                                    1. Term
                                                </h4>
                                                <p className="text-slate-600 leading-relaxed">{term}</p>
                                            </div>

                                            {/* Fees & Payment */}
                                            <div className="space-y-0.5">
                                                <h4 className="font-bold text-slate-900 text-xs">
                                                    2. Fees & Payment
                                                </h4>
                                                <p className="text-slate-600 leading-relaxed">{paymentTerms}</p>
                                                <p className="font-bold text-slate-900 pt-0.5">
                                                    Total agreed value: <span className="text-indigo-700 font-extrabold text-xs">{totalAgreedValue || '0.00'} {currency}</span>.
                                                </p>
                                            </div>

                                            {/* Additional Clauses */}
                                            {parsedClauses.map((clause, idx) => (
                                                <div key={idx} className="space-y-0.5">
                                                    <h4 className="font-bold text-slate-900 text-xs">
                                                        {idx + 3}. {clause.title}
                                                    </h4>
                                                    <p className="text-slate-600 leading-relaxed">{clause.body}</p>
                                                </div>
                                            ))}

                                            {/* Governing Law */}
                                            <div className="space-y-0.5">
                                                <h4 className="font-bold text-slate-900 text-xs">
                                                    {parsedClauses.length + 3}. Governing Law
                                                </h4>
                                                <p className="text-slate-600 leading-relaxed">
                                                    This Agreement is governed by and construed in accordance with the laws of <span className="font-semibold text-slate-900">{governingLaw}</span>.
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Official Authorization & Stamp Block */}
                                <div className="pt-4 border-t border-slate-200 space-y-3">
                                    <div className={docType === 'notice' ? 'flex justify-end' : 'grid grid-cols-2 gap-6'}>
                                        {/* Company Seal & Issuer Signature */}
                                        <div className={docType === 'notice' ? 'w-1/2 space-y-1.5' : 'space-y-1.5'}>
                                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                                                {docType === 'notice' ? 'ISSUED BY & OFFICIAL STAMP' : 'SERVICE PROVIDER AUTHORIZATION & SEAL'}
                                            </span>
                                            <div className="flex items-end gap-3">
                                                <div className="w-16 h-16 flex items-center justify-center shrink-0 pointer-events-none select-none">
                                                    <img
                                                        src={sealUrl}
                                                        alt="Dynime Official Seal"
                                                        className="w-full h-full object-contain filter drop-shadow-xs"
                                                    />
                                                </div>
                                                <div className="border-t border-slate-300 pt-1 w-full space-y-0.5 text-[11px]">
                                                    {issueAs === 'employee' && selectedEmployee ? (
                                                        <>
                                                            <p className="font-bold text-slate-900">{selectedEmployee.name}</p>
                                                            <p className="text-slate-600 text-[10px] font-medium">{selectedEmployee.designation || 'Authorized Representative'}</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <p className="font-bold text-slate-900">{company.name}</p>
                                                            <p className="text-slate-600 text-[10px]">Authorized Executive Signatory</p>
                                                        </>
                                                    )}
                                                    <p className="text-slate-500 font-mono text-[9px]">Date: {formattedDate}</p>
                                                    <p className="text-[8px] font-extrabold uppercase tracking-wider text-slate-400">
                                                        OFFICIAL STAMP & AUTHORIZATION
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column: Client Signature (Hidden for Notice) */}
                                        {docType !== 'notice' && (
                                            <div className="space-y-1.5">
                                                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                                                    CLIENT / RECIPIENT AUTHORIZATION
                                                </span>
                                                <div className="border-t border-slate-300 pt-1 w-full space-y-1 text-[11px]">
                                                    <div className="min-h-[38px] flex items-center">
                                                        {signatureType === 'upload' && signatureImage ? (
                                                            <img src={signatureImage} alt="Client Signature" className="h-9 max-w-[140px] object-contain" />
                                                        ) : (
                                                            <span className={`text-xl text-indigo-900 signature-font signature-font-${signatureFont}`}>
                                                                {signerName || clientName || 'Authorized Signatory'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="font-bold text-slate-900">{signerName || clientName || 'Client'}</p>
                                                    <p className="text-slate-600 text-[10px]">{signerTitle || 'Client Authorized Signatory'}</p>
                                                    <p className="text-slate-500 font-mono text-[9px]">Date: {formattedDate}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Corporate Multi-Column Redesigned Footer */}
                                <div className="pt-4 border-t border-slate-200 text-xs text-slate-600 space-y-2.5">
                                    {/* Top Row: Company Branding & Social Handle + Links */}
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                                        <div className="flex items-center space-x-2">
                                            <img src={logoUrl} alt="Dynime" className="h-5 object-contain" />
                                            <span className="font-bold text-slate-900 text-xs tracking-tight">{company.name}</span>
                                        </div>

                                        {/* Social Media Links & Handle @thedynime */}
                                        <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-full text-slate-600">
                                            <span className="text-[10px] font-semibold text-slate-700 font-mono">@thedynime</span>
                                            <div className="h-3 w-[1px] bg-slate-300"></div>
                                            <div className="flex items-center gap-2">
                                                <a href="https://facebook.com/thedynime" target="_blank" rel="noreferrer" title="Facebook @thedynime" className="text-slate-500 hover:text-indigo-600 transition-colors">
                                                    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                                </a>
                                                <a href="https://instagram.com/thedynime" target="_blank" rel="noreferrer" title="Instagram @thedynime" className="text-slate-500 hover:text-indigo-600 transition-colors">
                                                    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                                                </a>
                                                <a href="https://linkedin.com/company/thedynime" target="_blank" rel="noreferrer" title="LinkedIn @thedynime" className="text-slate-500 hover:text-indigo-600 transition-colors">
                                                    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.762-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                                                </a>
                                                <a href="https://wa.me/16468840271" target="_blank" rel="noreferrer" title="WhatsApp @thedynime" className="text-slate-500 hover:text-emerald-600 transition-colors">
                                                    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Middle Row: Detailed Contacts with Icons */}
                                    <div className="flex flex-wrap items-center justify-between gap-y-1.5 gap-x-3 text-[10px] text-slate-600 font-mono pt-0.5">
                                        <div className="flex items-center gap-1">
                                            <Mail className="h-3 w-3 text-indigo-600 shrink-0" />
                                            <span>{company.email}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Phone className="h-3 w-3 text-indigo-600 shrink-0" />
                                            <span>{company.phone}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Globe className="h-3 w-3 text-indigo-600 shrink-0" />
                                            <span>{company.website}</span>
                                        </div>
                                    </div>

                                    {/* Bottom Row: Address and Document Reference */}
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-1 text-[9px] text-slate-500 font-mono pt-1.5 border-t border-slate-100">
                                        <div className="flex items-center gap-1">
                                            <MapPin className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                                            <span>HQ: {company.address}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <FileText className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                                            <span>Reference: {reference}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: HISTORY MODE (NO PRINT) */}
                {activeTab === 'history' && (
                    <Card className="border-slate-200/80 shadow-xs no-print">
                        <CardHeader className="p-4 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900 text-sm">
                                {t('Saved Documents History')}
                            </h3>
                        </CardHeader>
                        <CardContent className="p-4">
                            {savedDocs.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {savedDocs.map((doc) => (
                                        <div key={doc.id} className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/50 px-2 rounded-lg transition-colors">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-900 text-sm">{doc.title}</span>
                                                    <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] uppercase font-mono">
                                                        {doc.reference}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-[10px] uppercase">
                                                        {doc.docType}
                                                    </Badge>
                                                    {doc.employeeName && (
                                                        <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">
                                                            Issuer: {doc.employeeName}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500">
                                                    Client: <span className="font-medium text-slate-700">{doc.clientName || 'N/A'}</span> ({doc.clientCompany || 'N/A'}) · Value: <span className="font-semibold text-slate-800">{doc.totalAgreedValue} {doc.currency}</span>
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-mono">
                                                    Saved: {new Date(doc.createdAt).toLocaleString()}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Button
                                                    onClick={() => handleDeleteSaved(doc.id)}
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-slate-500 space-y-2">
                                    <FileText className="h-10 w-10 mx-auto text-slate-300" />
                                    <p className="text-sm font-medium">{t('No saved documents in history')}</p>
                                    <p className="text-xs text-slate-400">{t('Created agreements, quotations, and proposals will appear here.')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
