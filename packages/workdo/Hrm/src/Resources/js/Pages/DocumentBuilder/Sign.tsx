import React, { useRef, useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    PenTool, 
    Type, 
    RotateCcw, 
    FileText, 
    Printer, 
    ArrowLeft, 
    Mail, 
    Globe, 
    Phone, 
    Check, 
    ExternalLink, 
    Copy 
} from 'lucide-react';
import { getDocumentTitle, getDocumentName } from './Index';

interface SignProps {
    document: {
        id: number;
        document_type: string;
        payload: any;
        issued_date: string;
    };
    employee: any;
    companySettings: Record<string, string>;
    isHR: boolean;
}

// Cursive font styles for typed signature options
const FONTS = [
    { name: 'Caveat, cursive', label: 'Caveat (Casual)' },
    { name: '"Brush Script MT", cursive', label: 'Brush Script (Classic)' },
    { name: '"Segoe Print", sans-serif', label: 'Segoe Print (Clean)' }
];

// Inline Signature Drawing Canvas Component
function SignatureCanvas({ onSave }: { onSave: (dataUrl: string | null) => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            ctx.strokeStyle = '#0f172a'; // Slate 900
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }
    }, []);

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        
        const rect = canvas.getBoundingClientRect();
        if ('touches' in e) {
            if (e.touches.length === 0) return { x: 0, y: 0 };
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
        } else {
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        
        const { x, y } = getCoordinates(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        e.preventDefault();
        
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        
        const { x, y } = getCoordinates(e);
        ctx.lineTo(x, y);
        ctx.stroke();
        setHasDrawn(true);
        onSave(canvas.toDataURL());
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
        onSave(null);
    };

    return (
        <div className="relative">
            <canvas
                ref={canvasRef}
                className="w-full h-40 bg-slate-50 border border-dashed border-slate-300 rounded-xl cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
            {hasDrawn && (
                <button
                    type="button"
                    onClick={clearCanvas}
                    className="absolute top-2 right-2 p-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-md text-[10px] font-semibold flex items-center gap-1 transition-all"
                >
                    <RotateCcw className="h-3 w-3" /> Clear
                </button>
            )}
        </div>
    );
}

export default function Sign({ document: docModel, employee: currentEmployee, companySettings, isHR }: SignProps) {
    const { t } = useTranslation();
    const isYearlySalary = currentEmployee?.salary_type === 'yearly';
    const printRef = useRef<HTMLDivElement>(null);

    const [activeTab, setActiveTab] = useState<'draw' | 'type'>('draw');
    const [typedName, setTypedName] = useState(currentEmployee.name);
    const [selectedFont, setSelectedFont] = useState(FONTS[0].name);
    const [signatureData, setSignatureData] = useState<string | null>(null);
    const [consentChecked, setConsentChecked] = useState(false);
    const [copied, setCopied] = useState(false);

    // Form submission hook
    const { data, setData, post, processing, errors } = useForm({
        signature_base64: ''
    });

    // Dynamic Google Fonts Loader
    useEffect(() => {
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
        return () => {
            document.head.removeChild(link);
        };
    }, []);

    // Generate Typed Signature Base64
    useEffect(() => {
        if (activeTab === 'type' && typedName.trim().length > 0) {
            const canvas = window.document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 150;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, 400, 150);
                ctx.fillStyle = '#0f172a'; // Slate 900
                ctx.font = `italic 32px ${selectedFont}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(typedName, 200, 75);
                setSignatureData(canvas.toDataURL());
            }
        }
    }, [activeTab, typedName, selectedFont]);

    useEffect(() => {
        if (signatureData) {
            setData('signature_base64', signatureData);
        } else {
            setData('signature_base64', '');
        }
    }, [signatureData]);

    const handleCopyLink = () => {
        const signUrl = window.location.origin + '/hrm/document-builder/sign/' + docModel.id;
        navigator.clipboard.writeText(signUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleSignSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.signature_base64 || !consentChecked) return;
        post(route('hrm.document-builder.sign-submit', docModel.id));
    };

    const handlePrintPDF = () => {
        const printContent = printRef.current?.innerHTML;
        if (printContent) {
            const style = window.document.createElement('style');
            style.innerHTML = `
                @page {
                    size: auto;
                    margin: 0 !important;
                }
                @media print {
                    body {
                        background: white !important;
                        color: black !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-container {
                        box-shadow: none !important;
                        border: none !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 1.5cm !important;
                    }
                }
            `;
            window.document.head.appendChild(style);
            window.print();
            style.remove();
        }
    };

    // Helper functions for preview parsing
    const payload = docModel.payload || {};
    const hasSignature = payload.hasSignature !== false;
    const customCompanyName = payload.customCompanyName || companySettings.company_name || 'Dynime LLC.';
    const activeDesignation = payload.overrideDesignation || currentEmployee.designation || '';
    const activeDepartment = payload.overrideDepartment || currentEmployee.department || '';
    const activeDate = payload.overrideDate || currentEmployee.date_of_joining || new Date().toISOString().split('T')[0];
    const issuedDate = docModel.issued_date || new Date().toISOString().split('T')[0];
    const workLocation = payload.workLocation || currentEmployee.branch || '';
    const overrideJobType = payload.overrideJobType || currentEmployee.employment_type || 'Full Time';
    const probationPeriod = payload.probationPeriod || '3';
    const newDesignation = payload.newDesignation || '';
    const newSalary = payload.newSalary || '';
    const promotionEffectiveDate = payload.promotionEffectiveDate || '';
    const terminationReason = payload.terminationReason || '';
    const terminationEffectiveDate = payload.terminationEffectiveDate || '';
    const noticePeriod = payload.noticePeriod || '';
    const severanceAmount = payload.severanceAmount || '';
    const customParagraph = payload.customParagraph || '';
    const payPeriod = payload.payPeriod || new Date().toISOString().substring(0, 7);
    const overrideEmploymentType = payload.overrideEmploymentType || currentEmployee.employment_type || 'Full Time';
    const reportingTo = payload.reportingTo || '';
    const documentType = docModel.document_type;
    const signatureImage = payload.signatureImage || null;

    const isSigned = !!payload.employee_signature;
    const signedAt = payload.employee_signature_date;

    const formatDocumentDate = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatCurrency = (val: any) => {
        const num = parseFloat(val);
        if (isNaN(num)) return '$0.00';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
    };

    const numberToWords = (num: any) => {
        const n = parseFloat(num);
        if (isNaN(n) || n === 0) return 'Zero Dollars';
        
        const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        
        const convertLessThanThousand = (v: number): string => {
            if (v === 0) return '';
            if (v < 20) return units[v];
            if (v < 100) return tens[Math.floor(v / 10)] + (v % 10 !== 0 ? ' ' + units[v % 10] : '');
            return units[Math.floor(v / 100)] + ' Hundred' + (v % 100 !== 0 ? ' and ' + convertLessThanThousand(v % 100) : '');
        };
        
        const integral = Math.floor(n);
        const cents = Math.round((n - integral) * 100);
        
        let words = '';
        if (integral > 0) {
            words += convertLessThanThousand(integral) + ' Dollar' + (integral > 1 ? 's' : '');
        }
        if (cents > 0) {
            words += (integral > 0 ? ' and ' : '') + convertLessThanThousand(cents) + ' Cent' + (cents > 1 ? 's' : '');
        }
        return words;
    };

    const getTenureString = (start: string, end: string) => {
        if (!start || !end) return '';
        const s = new Date(start);
        const e = new Date(end);
        let diffYears = e.getFullYear() - s.getFullYear();
        let diffMonths = e.getMonth() - s.getMonth();
        let diffDays = e.getDate() - s.getDate();
        if (diffDays < 0) {
            diffMonths -= 1;
            const daysInPrevMonth = new Date(e.getFullYear(), e.getMonth(), 0).getDate();
            diffDays += daysInPrevMonth;
        }
        if (diffMonths < 0) {
            diffYears -= 1;
            diffMonths += 12;
        }
        const tenureParts = [];
        if (diffYears > 0) tenureParts.push(`${diffYears} ${diffYears > 1 ? 'years' : 'year'}`);
        if (diffMonths > 0) tenureParts.push(`${diffMonths} ${diffMonths > 1 ? 'months' : 'month'}`);
        if (diffDays > 0 || tenureParts.length === 0) tenureParts.push(`${diffDays} ${diffDays > 1 ? 'days' : 'day'}`);
        return tenureParts.join(', ');
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            <Head title={`${t('Sign Document')} — ${getDocumentName(docModel.document_type)}`} />

            {/* Top Bar */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-row items-center justify-between shadow-sm no-print">
                <div className="flex items-center gap-3">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                            if (isHR) {
                                router.visit(route('hrm.document-builder.index'));
                            } else {
                                router.visit(route('hrm.index'));
                            }
                        }}
                        className="text-slate-600 hover:text-slate-900"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" /> {t('Dashboard')}
                    </Button>
                    <div className="h-4 w-px bg-slate-300"></div>
                    <span className="font-semibold text-slate-800 text-sm">{getDocumentName(docModel.document_type)}</span>
                    <Badge variant={isSigned ? "secondary" : "outline"} className={isSigned ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}>
                        {isSigned ? t('Signed Successfully') : t('Awaiting Signature')}
                    </Badge>
                </div>

                <div className="flex items-center gap-2">
                    {isHR && !isSigned && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyLink}
                            className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                        >
                            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                            {copied ? t('Copied!') : t('Copy Sign Link')}
                        </Button>
                    )}
                    {isSigned && (
                        <Button
                            onClick={handlePrintPDF}
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                        >
                            <Printer className="h-4 w-4 mr-2" /> {t('Print / PDF')}
                        </Button>
                    )}
                </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 flex flex-col lg:flex-row gap-8 p-6 max-w-7xl mx-auto w-full">
                
                {/* Signing Panel (Left Column) */}
                <div className="w-full lg:w-[420px] shrink-0 no-print">
                    {!isSigned ? (
                        <Card className="shadow-md border-slate-200 sticky top-6">
                            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                                    <PenTool className="h-5 w-5 text-indigo-600" />
                                    {t('Digital Signature Panel')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                {/* Toggle Tabs */}
                                <div className="flex bg-slate-100 rounded-lg p-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActiveTab('draw');
                                            setSignatureData(null);
                                        }}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${
                                            activeTab === 'draw' 
                                                ? 'bg-white text-slate-900 shadow-sm' 
                                                : 'text-slate-500 hover:text-slate-900'
                                        }`}
                                    >
                                        <PenTool className="h-3.5 w-3.5" />
                                        {t('Draw Signature')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActiveTab('type');
                                            setSignatureData(null);
                                        }}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${
                                            activeTab === 'type' 
                                                ? 'bg-white text-slate-900 shadow-sm' 
                                                : 'text-slate-500 hover:text-slate-900'
                                        }`}
                                    >
                                        <Type className="h-3.5 w-3.5" />
                                        {t('Type Signature')}
                                    </button>
                                </div>

                                <form onSubmit={handleSignSubmit} className="space-y-6">
                                    {activeTab === 'draw' ? (
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-slate-700 block">{t('Use mouse or touch screen to draw your signature below:')}</label>
                                            <SignatureCanvas onSave={setSignatureData} />
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-slate-700 block">{t('Type your full legal name:')}</label>
                                                <input
                                                    type="text"
                                                    value={typedName}
                                                    onChange={(e) => setTypedName(e.target.value)}
                                                    placeholder="Jit Kumar Saha"
                                                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-slate-700 block">{t('Select Font Style:')}</label>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {FONTS.map((font) => (
                                                        <button
                                                            key={font.name}
                                                            type="button"
                                                            onClick={() => setSelectedFont(font.name)}
                                                            className={`text-left px-4 py-3 border rounded-lg text-sm flex items-center justify-between transition-all ${
                                                                selectedFont === font.name
                                                                    ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900'
                                                                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                                                            }`}
                                                        >
                                                            <span style={{ fontFamily: font.name }} className="text-lg">{typedName || currentEmployee.name}</span>
                                                            <span className="text-[10px] text-slate-400 font-medium">{font.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Preview Signature in Card */}
                                    {signatureData && (
                                        <div className="space-y-2 border-t border-slate-100 pt-4">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t('Signature Preview')}</span>
                                            <div className="h-16 border border-slate-200 rounded-lg p-2 flex items-center justify-center bg-white overflow-hidden">
                                                <img src={signatureData} alt="Preview" className="h-12 object-contain" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Consent Checkbox */}
                                    <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                                        <input
                                            type="checkbox"
                                            id="consent"
                                            checked={consentChecked}
                                            onChange={(e) => setConsentChecked(e.target.checked)}
                                            className="mt-0.5 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                                        />
                                        <label htmlFor="consent" className="text-xs text-slate-600 leading-snug cursor-pointer select-none">
                                            {t('I agree that this is a legally binding electronic signature and I accept all terms, conditions, and policies stated in this document.')}
                                        </label>
                                    </div>

                                    {/* Submit Action */}
                                    <Button
                                        type="submit"
                                        disabled={processing || !data.signature_base64 || !consentChecked}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11"
                                    >
                                        {processing ? t('Completing Signature...') : t('Sign & Complete')}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="shadow-md border-slate-200 bg-emerald-50/20 border-emerald-100 sticky top-6">
                            <CardHeader className="border-b border-emerald-100/50 bg-emerald-50/50">
                                <CardTitle className="text-base font-bold text-emerald-850 flex items-center gap-2">
                                    <Check className="h-5 w-5 text-emerald-600" />
                                    {t('Document Signed Successfully')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6 text-sm text-slate-700">
                                <p>
                                    {t('This document has been digitally signed and sealed by employee')} <strong className="text-slate-900">{currentEmployee.name}</strong>.
                                </p>
                                <div className="p-4 bg-white border border-emerald-200 rounded-xl space-y-3">
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{t('Signed By')}</span>
                                        <strong className="text-slate-800 text-[13px]">{currentEmployee.name}</strong>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{t('Signed On')}</span>
                                        <strong className="text-slate-800 text-[13px]">{signedAt}</strong>
                                    </div>
                                    <div className="border-t border-slate-100 pt-3">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">{t('Signature')}</span>
                                        <div className="h-10 flex items-center bg-slate-50/30 p-1.5 rounded-lg border border-slate-100 justify-center">
                                            <img src={payload.employee_signature} alt="Signature" className="h-8 object-contain" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <Button
                                        onClick={handlePrintPDF}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11"
                                    >
                                        <Printer className="h-4 w-4 mr-2" /> {t('Print / Save PDF')}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            if (isHR) {
                                                router.visit(route('hrm.document-builder.index'));
                                            } else {
                                                router.visit(route('hrm.index'));
                                            }
                                        }}
                                        className="w-full text-slate-600 border-slate-200"
                                    >
                                        {t('Return to Dashboard')}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* A4 Document Preview (Right Column) */}
                <div className="flex-1 flex justify-center overflow-visible">
                    <div 
                        id="printable-document"
                        ref={printRef}
                        className="bg-white w-[794px] min-h-[1123px] pt-[50px] pb-[50px] px-[36px] border border-[#e5e5ea] shadow-md relative flex flex-col justify-between font-sans text-[#1c1c1e] text-[13px] leading-relaxed rounded-lg"
                        style={{ pageBreakAfter: 'always' }}
                    >
                        {/* Document Header */}
                        <div>
                            <div className="flex items-start justify-between border-b border-[#e5e5ea] pb-4 mb-8 text-left">
                                <div className="flex items-center gap-4">
                                    {/* Official Dynime Logo Image */}
                                    <img src="https://cdn.dynime.com/Dynime%20Logo/LOGO%20PNG/logo%20SVG/dynime-logo.svg" alt="Dynime" className="h-10 object-contain" />
                                    <div className="border-l border-[#e5e5ea] pl-4">
                                        <h2 className="font-bold text-[#1c1c1e] text-sm tracking-wide text-left">{customCompanyName || 'Dynime LLC.'}</h2>
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
                                    <h3 className="font-bold text-[#1c1c1e] text-sm uppercase tracking-wider">{getDocumentTitle(docModel.document_type)}</h3>
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
                            <div className="mb-6 text-left">
                                <h4 className="font-bold text-[#1c1c1e] text-sm">{currentEmployee.name}</h4>
                                <p className="text-[#787880] text-[12px]">{activeDesignation}</p>
                                {activeDepartment && <p className="text-[#787880] text-[12px]">{activeDepartment}</p>}
                                <p className="text-[#787880] text-[12px]">{currentEmployee.email}</p>
                                {workLocation && <p className="text-[#787880] text-[12px]">{workLocation}</p>}
                            </div>

                            {/* Main Letter / Document Content */}
                            <div className="space-y-5 text-[#1c1c1e] leading-relaxed text-[13px] text-justify">
                                
                                {/* OFFER LETTER */}
                                {documentType === 'offer_letter' && (
                                    <div className="space-y-4">
                                        <p className="font-bold text-[#1c1c1e] text-sm text-left">Dear {currentEmployee.name.split(' ')[0]},</p>
                                        <p>
                                            We are delighted to offer you the position of <strong className="text-[#1c1c1e]">{activeDesignation}</strong> in the <strong className="text-[#1c1c1e]">{activeDepartment}</strong> department at <strong className="text-[#1c1c1e]">{customCompanyName}</strong>. This letter sets out the principal terms of your employment.
                                        </p>
                                        
                                        {/* Details Box */}
                                        <div className="border border-[#e5e5ea] rounded-xl p-5 text-[12px] text-left">
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
                                                <span className="text-[#8e8e93]">{t('Gross compensation')}:</span> <strong className="text-[#1c1c1e]">{formatCurrency(currentEmployee.basic_salary)} {isYearlySalary ? t('/ year') : t('/ month')}</strong>
                                            </div>
                                        </div>

                                        {/* Earnings and Deductions tables side-by-side */}
                                        <div className="grid grid-cols-2 gap-4 text-left">
                                            <div className="border border-[#e5e5ea] rounded-xl overflow-hidden">
                                                <div className="bg-[#f4f4f5] border-b border-[#e5e5ea] px-4 py-2 font-semibold text-[#1c1c1e] text-xs uppercase tracking-wider">{isYearlySalary ? t('EARNINGS (YEARLY)') : t('EARNINGS (MONTHLY)')}</div>
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
                                                <div className="bg-[#f4f4f5] border-b border-[#e5e5ea] px-4 py-2 font-semibold text-[#1c1c1e] text-xs uppercase tracking-wider">{isYearlySalary ? t('DEDUCTIONS (YEARLY)') : t('DEDUCTIONS (MONTHLY)')}</div>
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
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-3 border border-[#e5e5ea] rounded-xl p-5 text-[12px] text-left">
                                            <div><span className="text-[#8e8e93]">{t('Designation')}:</span> <strong className="text-[#1c1c1e]">{activeDesignation}</strong></div>
                                            <div><span className="text-[#8e8e93]">{t('Joining date')}:</span> <strong className="text-[#1c1c1e]">{formatDocumentDate(activeDate)}</strong></div>
                                            <div><span className="text-[#8e8e93]">{t('Employment type')}:</span> <strong className="text-[#1c1c1e]">{overrideEmploymentType}</strong></div>
                                            <div><span className="text-[#8e8e93]">{t('Job type')}:</span> <strong className="text-[#1c1c1e]">{overrideJobType}</strong></div>
                                            <div><span className="text-[#8e8e93]">{t('Work location')}:</span> <strong className="text-[#1c1c1e]">{workLocation || '—'}</strong></div>
                                            <div><span className="text-[#8e8e93]">{t('Gross salary')}:</span> <strong className="text-[#1c1c1e]">{formatCurrency(currentEmployee.basic_salary)} {isYearlySalary ? t('/ year') : t('/ month')}</strong></div>
                                        </div>

                                        {/* Earnings and Deductions tables side-by-side */}
                                        <div className="grid grid-cols-2 gap-4 text-left">
                                            <div className="border border-[#e5e5ea] rounded-xl overflow-hidden">
                                                <div className="bg-[#f4f4f5] border-b border-[#e5e5ea] px-4 py-2 font-semibold text-[#1c1c1e] text-xs uppercase tracking-wider">{isYearlySalary ? t('EARNINGS (YEARLY)') : t('EARNINGS (MONTHLY)')}</div>
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
                                                <div className="bg-[#f4f4f5] border-b border-[#e5e5ea] px-4 py-2 font-semibold text-[#1c1c1e] text-xs uppercase tracking-wider">{isYearlySalary ? t('DEDUCTIONS (YEARLY)') : t('DEDUCTIONS (MONTHLY)')}</div>
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

                                        {/* Agreement terms (Editable body content) */}
                                        {customParagraph && (
                                            <div className="mt-4 text-[13px] text-[#1c1c1e] whitespace-pre-wrap leading-relaxed text-justify">
                                                {customParagraph}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* PAYSLIP */}
                                {documentType === 'payslip' && (
                                    <div className="space-y-4">
                                        {/* Employee details grid */}
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 border border-[#e5e5ea] rounded-xl p-5 text-[12px] text-left">
                                            <div><span className="text-[#8e8e93]">{t('Employee')}:</span> <strong className="text-[#1c1c1e]">{currentEmployee.name}</strong></div>
                                            <div><span className="text-[#8e8e93]">{t('Employee Code')}:</span> <strong className="text-[#1c1c1e]">{currentEmployee.employee_id_code}</strong></div>
                                            <div><span className="text-[#8e8e93]">{t('Designation')}:</span> <strong className="text-[#1c1c1e]">{activeDesignation}</strong></div>
                                            <div><span className="text-[#8e8e93]">{t('Department')}:</span> <strong className="text-[#1c1c1e]">{activeDepartment}</strong></div>
                                            <div><span className="text-[#8e8e93]">{t('Job type')}:</span> <strong className="text-[#1c1c1e]">{overrideJobType}</strong></div>
                                            <div><span className="text-[#8e8e93]">{t('Joining date')}:</span> <strong className="text-[#1c1c1e]">{formatDocumentDate(activeDate)}</strong></div>
                                            <div className="col-span-2 mt-1 border-t border-[#e5e5ea] pt-2"><span className="text-[#8e8e93]">{t('Pay period')}:</span> <strong className="text-[#1c1c1e]">{new Date(payPeriod + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</strong></div>
                                        </div>

                                        {/* Earnings and Deductions tables side-by-side */}
                                        <div className="grid grid-cols-2 gap-4 text-left">
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
                                        <div className="border-2 border-[#1c1c1e] rounded-xl p-4 flex justify-between items-center bg-white text-[#1c1c1e] text-left">
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
                                        <h3 className="font-bold text-center text-sm uppercase tracking-wider border-b border-[#e5e5ea] pb-2 mb-4">
                                            {t('TO WHOM IT MAY CONCERN')}
                                        </h3>
                                        <div className="text-[13px] text-[#1c1c1e] whitespace-pre-wrap leading-relaxed text-justify">
                                            {customParagraph}
                                        </div>
                                    </div>
                                )}

                                {/* RELIEVING LETTER */}
                                {documentType === 'relieving_letter' && (
                                    <div className="space-y-4">
                                        <h3 className="font-bold text-center text-sm uppercase tracking-wider border-b border-[#e5e5ea] pb-2 mb-4">
                                            {t('TO WHOM IT MAY CONCERN')}
                                        </h3>
                                        <div className="text-[13px] text-[#1c1c1e] whitespace-pre-wrap leading-relaxed text-justify">
                                            {customParagraph}
                                        </div>
                                    </div>
                                )}

                                {/* PROMOTION LETTER */}
                                {documentType === 'promotion_letter' && (
                                    <div className="space-y-4">
                                        <p className="font-bold text-[#1c1c1e] text-sm text-left">Dear {currentEmployee.name.split(' ')[0]},</p>
                                        <p>
                                            We are extremely pleased to inform you that you have been promoted to the position of <strong className="text-[#1c1c1e]">{newDesignation || t('[New Designation]')}</strong> in recognition of your outstanding performance, dedication, and contributions to <strong className="text-[#1c1c1e]">{customCompanyName}</strong>.
                                        </p>
                                        <p>
                                            This promotion will be effective from <strong className="text-[#1c1c1e]">{formatDocumentDate(promotionEffectiveDate || issuedDate)}</strong>.
                                        </p>

                                        {/* Promotion parameters Details Box */}
                                        <div className="border border-[#e5e5ea] rounded-xl p-5 text-[12px] text-left space-y-2">
                                            <div className="text-xs font-bold text-blue-800 uppercase tracking-wider border-b border-[#e5e5ea] pb-1 mb-2">{t('Updated Terms')}</div>
                                            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                                                <div><span className="text-[#8e8e93]">{t('Previous Designation')}:</span> <span className="text-slate-500 line-through">{activeDesignation}</span></div>
                                                <div><span className="text-[#8e8e93]">{t('New Designation')}:</span> <strong className="text-[#1c1c1e]">{newDesignation || t('[New Designation]')}</strong></div>
                                                <div><span className="text-[#8e8e93]">{t('Department')}:</span> <strong className="text-[#1c1c1e]">{activeDepartment}</strong></div>
                                                <div><span className="text-[#8e8e93]">{t('Effective Date')}:</span> <strong className="text-[#1c1c1e]">{formatDocumentDate(promotionEffectiveDate || issuedDate)}</strong></div>
                                            </div>
                                        </div>

                                        <div className="mt-3 border-t border-[#e5e5ea] pt-3 flex justify-between items-center text-left text-[12px]">
                                            <div>
                                                <span className="text-[#8e8e93]">{t('Previous Salary')}:</span> <span className="text-slate-500 line-through mr-4">{formatCurrency(currentEmployee.basic_salary)} {isYearlySalary ? t('/ year') : t('/ month')}</span>
                                                <span className="text-[#8e8e93]">{t('New Gross Compensation')}:</span> <strong className="text-[#1c1c1e]">{formatCurrency(newSalary ? parseFloat(newSalary) : currentEmployee.basic_salary)} {isYearlySalary ? t('/ year') : t('/ month')}</strong>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TERMINATION LETTER */}
                                {documentType === 'termination_letter' && (
                                    <div className="space-y-4">
                                        <p className="font-bold text-[#1c1c1e] text-sm text-left">Dear {currentEmployee.name.split(' ')[0]},</p>
                                        <p>
                                            This letter serves as official notification that your employment with <strong className="text-[#1c1c1e]">{customCompanyName}</strong> is being terminated.
                                        </p>
                                        <p>
                                            Your final day of employment with the company will be <strong className="text-[#1c1c1e]">{formatDocumentDate(terminationEffectiveDate || issuedDate)}</strong>.
                                        </p>

                                        {/* Details Box */}
                                        <div className="border border-[#e5e5ea] rounded-xl p-5 text-[12px] text-left">
                                            <div className="text-xs font-bold text-red-800 uppercase tracking-wider border-b border-[#e5e5ea] pb-1 mb-2">{t('Termination Settlement details')}</div>
                                            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                                                <div><span className="text-[#8e8e93]">{t('Termination Reason')}:</span> <strong className="text-[#1c1c1e]">{terminationReason || t('Performance Issues')}</strong></div>
                                                <div><span className="text-[#8e8e93]">{t('Last Working Day')}:</span> <strong className="text-[#1c1c1e]">{formatDocumentDate(terminationEffectiveDate || issuedDate)}</strong></div>
                                                <div><span className="text-[#8e8e93]">{t('Notice Period (Days)')}:</span> <strong className="text-[#1c1c1e]">{noticePeriod || '30'}</strong></div>
                                                <div><span className="text-[#8e8e93]">{t('Severance Package')}:</span> <strong className="text-[#1c1c1e]">{severanceAmount ? formatCurrency(parseFloat(severanceAmount)) : t('None / Standard settlement')}</strong></div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* GENERAL DOCUMENT / CUSTOM TEMPLATE */}
                                {!['offer_letter', 'employment_agreement', 'payslip', 'experience_letter', 'relieving_letter', 'promotion_letter', 'termination_letter'].includes(documentType) && (
                                    <div className="space-y-4 text-left">
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
                                            {customParagraph || (
                                                <span className="text-gray-400 italic">
                                                    {t('[Document Body Content]')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Custom Appended Paragraph */}
                                {customParagraph && ['offer_letter', 'payslip'].includes(documentType) && (
                                    <p className="mt-4 border-t border-[#e5e5ea] pt-4 text-[#787880] italic text-left">
                                        {customParagraph}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Signatures, Stamps, and Footer block - Exactly matches the user's PDF */}
                        <div className="mt-12 text-left">
                            <div className="flex justify-between items-end mb-8">
                                <div className="space-y-3">
                                    {/* Official Circular Seal Image */}
                                    {hasSignature && (
                                        <div className="relative h-24 w-24">
                                            <img src="https://cdn.dynime.com/Dynime%20Logo/Seal/seal.png" alt="Dynime Seal" className="h-24 w-24 object-contain" />
                                        </div>
                                    )}
                                    <div className="text-[11px] space-y-0.5">
                                        <p className="text-[#8e8e93] uppercase font-bold text-[9px] tracking-wider mb-1">{t('SYSTEM GENERATED — NO SIGNATURE REQUIRED')}</p>
                                        <p className="font-bold text-[#1c1c1e]">{t('Authorised Signatory')}</p>
                                        <p className="text-[#787880]">Director, {customCompanyName}</p>
                                        <p className="text-[#787880]">Date: {formatDocumentDate(activeDate)}</p>
                                    </div>
                                </div>
                                
                                <div className="text-right text-[11px] space-y-1">
                                    {isSigned ? (
                                        <div className="h-16 w-48 flex justify-end items-end mb-1 overflow-hidden">
                                            <img src={payload.employee_signature} alt="Employee Signature" className="h-16 object-contain" />
                                        </div>
                                    ) : signatureData ? (
                                        <div className="h-16 w-48 flex justify-end items-end mb-1 overflow-hidden">
                                            <img src={signatureData} alt="Employee Signature" className="h-16 object-contain" />
                                        </div>
                                    ) : (
                                        <div className="border border-dashed border-amber-300 rounded-lg bg-amber-50/50 text-amber-700 font-semibold px-4 py-3 text-xs mb-1 w-48 text-center select-none">
                                            {t('Awaiting Digital Signature')}
                                        </div>
                                    )}
                                    <div className="w-48 h-px bg-[#d1d1d6] ml-auto"></div>
                                    <p className="font-bold text-[#1c1c1e] mt-1">{currentEmployee.name}</p>
                                    <p className="text-[#787880]">{t('Employee Acceptance')}</p>
                                    <p className="text-[#787880]">
                                        {t('Date')}: {isSigned ? formatDocumentDate(signedAt.split(' ')[0]) : consentChecked ? formatDocumentDate(new Date().toISOString().split('T')[0]) : t('Pending')}
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
                                        <div className="text-[#787880] flex flex-col items-center justify-center gap-0.5 font-medium">
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
                                        <span className="text-[#1c1c1e] font-semibold">{getDocumentTitle(docModel.document_type)} · {formatDocumentDate(issuedDate)}</span>
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-between items-center text-[9px] text-[#8e8e93] border-t border-dashed border-[#e5e5ea] pt-2">
                                    <p>{t('This is an electronically generated document and is valid without a physical signature.')}</p>
                                    <p>© {new Date().getFullYear()} {customCompanyName}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
            </div>
        </div>
    );
}
