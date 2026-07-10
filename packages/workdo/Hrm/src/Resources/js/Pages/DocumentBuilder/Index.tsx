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
import { Save, Printer, FileText, Mail, Globe, Phone } from 'lucide-react';
import { formatCurrency } from '@/utils/helpers';

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
}

interface IndexProps {
    employees: Employee[];
    companySettings: Record<string, string>;
}

export default function Index({ employees, companySettings }: IndexProps) {
    const { t } = useTranslation();
    const printRef = useRef<HTMLDivElement>(null);

    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [documentType, setDocumentType] = useState<string>('offer_letter');
    const [issuedDate, setIssuedDate] = useState<string>(new Date().toISOString().split('T')[0]);

    // Override date
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
    
    // Quick-fill override fields
    const [overrideDesignation, setOverrideDesignation] = useState<string>('');
    const [overrideDepartment, setOverrideDepartment] = useState<string>('');
    const [overrideEmploymentType, setOverrideEmploymentType] = useState<string>('Full-Time');
    const [overrideJobType, setOverrideJobType] = useState<string>('—');

    // Authorised signatory options
    const [typedSignatoryName, setTypedSignatoryName] = useState<string>('');
    const [signatureImage, setSignatureImage] = useState<string | null>(null);

    const [payPeriod, setPayPeriod] = useState<string>(new Date().toISOString().substring(0, 7)); // YYYY-MM
    const [hasSignature, setHasSignature] = useState<boolean>(true);

    const currentEmployee = employees.find(emp => String(emp.id) === selectedEmployeeId);

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
        }
    }, [selectedEmployeeId, currentEmployee]);

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

    const handleSaveToHistory = () => {
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
            preserveScroll: true
        });
    };

    const handlePrint = () => {
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

    // Format date specifically as "DD MMM YYYY" (e.g. 01 Jan 2024)
    const formatDocumentDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            const day = String(date.getDate()).padStart(2, '0');
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const month = months[date.getMonth()];
            const year = date.getFullYear();
            return `${day} ${month} ${year}`;
        } catch (e) {
            return dateStr;
        }
    };

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
                    margin: 0mm;
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
                                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
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
                                <Select value={documentType} onValueChange={setDocumentType}>
                                    <SelectTrigger id="doc-type-select" className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="offer_letter">{t('Offer Letter')}</SelectItem>
                                        <SelectItem value="employment_agreement">{t('Employment Agreement')}</SelectItem>
                                        <SelectItem value="payslip">{t('Payslip')}</SelectItem>
                                        <SelectItem value="experience_letter">{t('Experience Letter')}</SelectItem>
                                        <SelectItem value="relieving_letter">{t('Relieving Letter')}</SelectItem>
                                        <SelectItem value="promotion_letter">{t('Promotion Letter')}</SelectItem>
                                        <SelectItem value="termination_letter">{t('Termination Letter')}</SelectItem>
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
                                            <Label htmlFor="new-salary">{t('New Gross Salary ($ / month)')}</Label>
                                            <Input
                                                id="new-salary"
                                                type="number"
                                                placeholder={t('e.g. 1200')}
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
                                </div>
                            </div>

                            {/* Custom Paragraph */}
                            <div className="space-y-1.5">
                                <Label htmlFor="custom-notes">{t('Custom paragraph (optional, appended to the body)')}</Label>
                                <Textarea
                                    id="custom-notes"
                                    placeholder={t('Add any extra context, benefits, or notes...')}
                                    rows={4}
                                    value={customParagraph}
                                    onChange={(e) => setCustomParagraph(e.target.value)}
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
                                            accept="image/png, image/jpeg"
                                            onChange={handleImageUpload}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                <Button
                                    onClick={handleSaveToHistory}
                                    disabled={!selectedEmployeeId}
                                    className="flex-1"
                                >
                                    <Save className="h-4 w-4 mr-1.5" />
                                    {t('Save to History')}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handlePrint}
                                    disabled={!selectedEmployeeId}
                                    className="border-gray-300"
                                >
                                    <Printer className="h-4 w-4 mr-1.5" />
                                    {t('Print / PDF')}
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
                                        <img src="/logo_dynime.png" alt="Dynime" className="h-10 object-contain" />
                                        <div className="border-l border-[#e5e5ea] pl-4">
                                            <h2 className="font-bold text-[#1c1c1e] text-sm tracking-wide">{customCompanyName || 'Dynime LLC.'}</h2>
                                            <p className="text-[10px] text-[#8e8e93] mt-1 flex items-center gap-2">
                                                <span className="flex items-center gap-1"><Mail className="h-3 w-3 text-[#8e8e93]" /> {companySettings.company_email || 'contact@dynime.com'}</span>
                                                <span>·</span>
                                                <span className="flex items-center gap-1"><Globe className="h-3 w-3 text-[#8e8e93]" /> {companySettings.company_website || 'dynime.com'}</span>
                                                <span>·</span>
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
                                                    <span className="text-[#8e8e93]">{t('Gross compensation')}:</span> <strong className="text-[#1c1c1e]">{formatCurrency(currentEmployee.basic_salary)} / month</strong>
                                                </div>
                                            </div>

                                            {/* Earnings and Deductions tables side-by-side */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="border border-[#e5e5ea] rounded-xl overflow-hidden">
                                                    <div className="bg-[#f4f4f5] border-b border-[#e5e5ea] px-4 py-2 font-semibold text-[#1c1c1e] text-xs uppercase tracking-wider">{t('EARNINGS (MONTHLY)')}</div>
                                                    <div className="p-4 space-y-2 text-xs">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[#787880]">{t('Basic salary')}</span>
                                                            <span className="font-semibold text-[#1c1c1e]">{formatCurrency(currentEmployee.basic_salary)}</span>
                                                        </div>
                                                        <div className="text-[#8e8e93] italic text-[11px]">
                                                            {t('N/A — no allowances configured')}
                                                        </div>
                                                        <div className="flex justify-between items-center border-t border-[#e5e5ea] pt-2 font-bold text-[#1c1c1e] mt-4">
                                                            <span>{t('Gross (CTC)')}</span>
                                                            <span>{formatCurrency(currentEmployee.basic_salary)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="border border-[#e5e5ea] rounded-xl overflow-hidden">
                                                    <div className="bg-[#f4f4f5] border-b border-[#e5e5ea] px-4 py-2 font-semibold text-[#1c1c1e] text-xs uppercase tracking-wider">{t('DEDUCTIONS (MONTHLY)')}</div>
                                                    <div className="p-4 space-y-2 text-xs flex flex-col justify-between h-[104px]">
                                                        <div className="text-[#8e8e93] italic text-[11px]">
                                                            {t('N/A — no deductions configured')}
                                                        </div>
                                                        <div className="flex justify-between items-center border-t border-[#e5e5ea] pt-2 font-bold text-[#1c1c1e]">
                                                            <span>{t('Net take-home')}</span>
                                                            <span>{formatCurrency(currentEmployee.basic_salary)}</span>
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
                                                <div><span className="text-[#8e8e93]">{t('Gross salary')}:</span> <strong className="text-[#1c1c1e]">{formatCurrency(currentEmployee.basic_salary)} / month</strong></div>
                                            </div>

                                            {/* Earnings and Deductions tables side-by-side */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="border border-[#e5e5ea] rounded-xl overflow-hidden">
                                                    <div className="bg-[#f4f4f5] border-b border-[#e5e5ea] px-4 py-2 font-semibold text-[#1c1c1e] text-xs uppercase tracking-wider">{t('EARNINGS (MONTHLY)')}</div>
                                                    <div className="p-4 space-y-2 text-xs">
                                                        <div className="flex justify-between font-semibold text-[#1c1c1e]">
                                                            <span>{t('Basic salary')}</span>
                                                            <span>{formatCurrency(currentEmployee.basic_salary)}</span>
                                                        </div>
                                                        <div className="text-[#8e8e93] italic">
                                                            {t('N/A — no allowances configured')}
                                                        </div>
                                                        <div className="flex justify-between border-t border-[#e5e5ea] pt-2 font-bold text-[#1c1c1e]">
                                                            <span>{t('Gross (CTC)')}</span>
                                                            <span>{formatCurrency(currentEmployee.basic_salary)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="border border-[#e5e5ea] rounded-xl overflow-hidden">
                                                    <div className="bg-[#f4f4f5] border-b border-[#e5e5ea] px-4 py-2 font-semibold text-[#1c1c1e] text-xs uppercase tracking-wider">{t('DEDUCTIONS (MONTHLY)')}</div>
                                                    <div className="p-4 space-y-2 text-xs flex flex-col justify-between h-[104px]">
                                                        <div className="text-[#8e8e93] italic">
                                                            {t('N/A — no deductions configured')}
                                                        </div>
                                                        <div className="flex justify-between border-t border-[#e5e5ea] pt-2 font-bold text-[#1c1c1e]">
                                                            <span>{t('Net take-home')}</span>
                                                            <span>{formatCurrency(currentEmployee.basic_salary)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Agreement terms */}
                                            <ol className="list-decimal pl-5 space-y-3 text-[12px] text-[#787880] mt-4">
                                                <li>
                                                    <strong className="text-[#1c1c1e]">{t('Probation')}</strong><br/>
                                                    {t('The Employee shall serve a probation period of')} {probationPeriod} {t('months from the date of joining. Either party may terminate employment during this period with 7 (seven) days\' written notice.')}
                                                </li>
                                                <li>
                                                    <strong className="text-[#1c1c1e]">{t('Working Hours')}</strong><br/>
                                                    {t('Standard working hours are 9:00 AM to 6:00 PM, Sunday through Thursday, with a 1-hour lunch break. The Employee may be required to work additional hours as business needs demand.')}
                                                </li>
                                                <li>
                                                    <strong className="text-[#1c1c1e]">{t('Confidentiality')}</strong><br/>
                                                    {t('The Employee shall maintain strict confidentiality regarding all proprietary information, client data, business strategies and any non-public information of the Company, both during and after the term of employment.')}
                                                </li>
                                                <li>
                                                    <strong className="text-[#1c1c1e]">{t('Intellectual Property')}</strong><br/>
                                                    {t('All work product, inventions, software and creative works produced by the Employee during the course of employment shall be the exclusive property of the Company.')}
                                                </li>
                                            </ol>
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
                                            <p>
                                                This is to certify that <strong className="text-[#1c1c1e]">{currentEmployee.name}</strong> (Employee Code: {currentEmployee.employee_id_code}) was employed with <strong className="text-[#1c1c1e]">{customCompanyName}</strong> as <strong className="text-[#1c1c1e]">{activeDesignation}</strong> in the <strong className="text-[#1c1c1e]">{activeDepartment}</strong> department from <strong className="text-[#1c1c1e]">{formatDocumentDate(activeDate)}</strong> to <strong className="text-[#1c1c1e]">{formatDocumentDate(issuedDate)}</strong>, a total tenure of <strong className="text-[#1c1c1e]">{getTenureString(activeDate, issuedDate)}</strong>.
                                            </p>
                                            <p>
                                                During their tenure, we found them to be sincere, hardworking and professional. Their conduct and performance throughout the period of service were satisfactory.
                                            </p>
                                            <p>
                                                We wish them the very best in their future endeavours.
                                            </p>
                                        </div>
                                    )}

                                    {/* RELIEVING LETTER */}
                                    {documentType === 'relieving_letter' && (
                                        <div className="space-y-4">
                                            <h3 className="font-bold text-center text-sm uppercase tracking-wider border-b border-[#e5e5ea] pb-2 mb-4">{t('TO WHOM IT MAY CONCERN')}</h3>
                                            <p>
                                                This is to certify that <strong className="text-[#1c1c1e]">{currentEmployee.name}</strong> (Employee Code: {currentEmployee.employee_id_code}) was employed with <strong className="text-[#1c1c1e]">{customCompanyName}</strong> as <strong className="text-[#1c1c1e]">{activeDesignation}</strong> in the <strong className="text-[#1c1c1e]">{activeDepartment}</strong> department from <strong className="text-[#1c1c1e]">{formatDocumentDate(activeDate)}</strong> to <strong className="text-[#1c1c1e]">{formatDocumentDate(issuedDate)}</strong>, a total tenure of <strong className="text-[#1c1c1e]">{getTenureString(activeDate, issuedDate)}</strong>.
                                            </p>
                                            <p>
                                                They have been duly relieved of all their duties and responsibilities with effect from <strong className="text-[#1c1c1e]">{formatDocumentDate(issuedDate)}</strong>. All company dues have been settled.
                                            </p>
                                            <p>
                                                We wish them the very best in their future endeavours.
                                            </p>
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
                                                        <span className="text-[#8e8e93]">{t('Previous Salary')}:</span> <span className="text-slate-500 line-through mr-4">{formatCurrency(currentEmployee.basic_salary)} / month</span>
                                                        <span className="text-[#8e8e93]">{t('New Gross Compensation')}:</span> <strong className="text-[#1c1c1e]">{newSalary ? formatCurrency(parseFloat(newSalary)) : formatCurrency(currentEmployee.basic_salary)} / month</strong>
                                                    </div>
                                                </div>
                                            </div>

                                            <p>
                                                All other terms and conditions of your employment contract remain unchanged. We would like to take this opportunity to thank you for your excellent work and wish you continued success in your new role.
                                            </p>
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

                                            <p>
                                                Please return all company properties, including your employee ID, laptop, and office keys, on or before your last working day. Any accrued vacation time and final wages will be calculated and paid out in accordance with state laws.
                                            </p>
                                            <p>
                                                We thank you for the service you have provided during your tenure and wish you the best in your future endeavors.
                                            </p>
                                        </div>
                                    )}

                                    {/* Custom Appended Paragraph */}
                                    {customParagraph && (
                                        <p className="mt-4 border-t border-[#e5e5ea] pt-4 text-[#787880] italic">
                                            {customParagraph}
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
                                                <img src="/seal_dynime.png" alt="Dynime Seal" className="h-24 w-24 object-contain" />
                                            </div>
                                        )}
                                        <div className="text-[11px] space-y-0.5">
                                            <p className="text-[#8e8e93] uppercase font-bold text-[9px] tracking-wider mb-1">{t('SYSTEM GENERATED — NO SIGNATURE REQUIRED')}</p>
                                            <p className="font-bold text-[#1c1c1e]">{t('Authorised Signatory')}</p>
                                            <p className="text-[#787880]">Director, {customCompanyName}</p>
                                            <p className="text-[#787880]">{t('Date')}: {formatDocumentDate(activeDate)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right text-[11px] space-y-1">
                                        {signatureImage ? (
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
                                        <p className="text-[#787880]">{t('Date')}: {formatDocumentDate(activeDate)}</p>
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
                                                    <span className="text-[#e5e5ea]">·</span>
                                                    <Globe className="h-3 w-3 text-[#8e8e93]" /> {companySettings.company_website || 'dynime.com'}
                                                </span>
                                                <span className="flex items-center gap-1 text-[9px]">
                                                    <Phone className="h-2.5 w-2.5 text-[#8e8e93]" /> {companySettings.company_telephone || '+16468840271'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <span className="block text-[9px] text-[#8e8e93] font-bold uppercase tracking-wider">{t('REFERENCE')}</span>
                                            <span className="text-[#1c1c1e] font-semibold">{getDocumentTitle()} · {formatDocumentDate(issuedDate)}</span>
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
