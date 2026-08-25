import { Head, usePage, router } from "@inertiajs/react";
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { Eye, EyeOff, Trash2, FileText, ExternalLink, Copy, Check, PenTool, Mail, Phone, MapPin, Calendar, Briefcase, User, Flag, Globe, Key, ShieldCheck, Lock, DollarSign, AlertCircle, Tag, Gift, Sparkles, Laptop, Save, Clock, Smartphone, Edit, Printer } from 'lucide-react';
import { formatDate, getImagePath, getCurrencySymbol, formatCurrency } from '@/utils/helpers';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect, useRef } from 'react';
import { getDocumentName } from '../DocumentBuilder/documentUtils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { EmployeeProfileInspectionWizard } from '../../Components/EmployeeProfileInspectionWizard';
import DeviceConfigStep, { DeviceData } from '../Onboarding/Steps/DeviceConfigStep';

const getCroppedCircularImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const size = Math.min(img.width, img.height);
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.beginPath();
                ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
                ctx.clip();
                ctx.drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, size, size);
                resolve(canvas.toDataURL('image/png'));
            } else {
                resolve(base64Str);
            }
        };
        img.onerror = () => {
            resolve(base64Str);
        };
        img.src = base64Str;
    });
};

function IDCardQRCodeCanvas({ text }: { text: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current && text) {
            QRCode.toCanvas(canvasRef.current, text, {
                width: 60,
                margin: 1,
                color: {
                    dark: '#0A1931',
                    light: '#FFFFFF'
                }
            }, (error) => {
                if (error) console.error('QR code generation failed:', error);
            });
        }
    }, [text]);

    return <canvas ref={canvasRef} className="w-[60px] h-[60px]" />;
}

export default function Show() {
    const { auth, employee, documents, issuedDocuments, companyAllSetting = {} } = usePage<any>().props;
    const { t } = useTranslation();
    const isEmployee = auth?.user?.id === employee?.user_id;

    const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
    const [changeMethod, setChangeMethod] = useState(employee?.payment_method || 'bank_transfer');
    const [changeDetails, setChangeDetails] = useState<any>(employee?.payment_details || {});

    const [redotpayAccountId, setRedotpayAccountId] = useState(employee?.payment_details?.redotpay_user_id || '');
    const [redotpayCardNumber, setRedotpayCardNumber] = useState(employee?.payment_details?.redotpay_card_number || '');
    const [kastAccountId, setKastAccountId] = useState(employee?.payment_details?.kast_user_id || '');
    const [kastCardNumber, setKastCardNumber] = useState(employee?.payment_details?.kast_card_number || '');
    const [savingAccountId, setSavingAccountId] = useState(false);

    const handleSaveAccountId = (field: string, val: string) => {
        setSavingAccountId(true);
        router.post(route('hrm.employees.save-probation-account', { employee: employee.id }), {
            [field]: val
        }, {
            preserveScroll: true,
            onFinish: () => setSavingAccountId(false)
        });
    };

    const [showOfficialPassword, setShowOfficialPassword] = useState(false);
    const [copiedEmail, setCopiedEmail] = useState(false);
    const [copiedWhatsapp, setCopiedWhatsapp] = useState(false);
    const [copiedPassword, setCopiedPassword] = useState(false);

    const handleCopyText = (text: string, type: 'email' | 'password' | 'whatsapp') => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        if (type === 'email') {
            setCopiedEmail(true);
            setTimeout(() => setCopiedEmail(false), 2000);
        } else if (type === 'whatsapp') {
            setCopiedWhatsapp(true);
            setTimeout(() => setCopiedWhatsapp(false), 2000);
        } else {
            setCopiedPassword(true);
            setTimeout(() => setCopiedPassword(false), 2000);
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

    const [copiedDocId, setCopiedDocId] = useState<number | null>(null);
    const [isIDCardModalOpen, setIsIDCardModalOpen] = useState(false);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [sealBase64, setSealBase64] = useState<string>('');

    const initialTab = typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('tab') || 'employment') : 'employment';
    const [activeTab, setActiveTab] = useState(initialTab);
    const [devices, setDevices] = useState<DeviceData[]>(
        (employee?.devices || []).map((d: any) => ({
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
        }))
    );
    const [savingDevices, setSavingDevices] = useState(false);
    const [deviceSavedNotice, setDeviceSavedNotice] = useState(false);
    const [isEditingDevices, setIsEditingDevices] = useState(false);

    const handleSaveDevices = async () => {
        setSavingDevices(true);
        try {
            await axios.post(route('hrm.onboarding.save-step'), {
                step: 'devices',
                data: { devices }
            });
            setDeviceSavedNotice(true);
            setIsEditingDevices(false);
            setTimeout(() => setDeviceSavedNotice(false), 2500);
            router.reload({ preserveScroll: true });
        } catch (err) {
            console.error('Failed to save device inventory', err);
        } finally {
            setSavingDevices(false);
        }
    };

    useEffect(() => {
        const fetchSeal = async () => {
            try {
                const response = await axios.get(route('hrm.employees.seal-base64'));
                setSealBase64(response.data.base64);
            } catch (err) {
                console.error('Failed to fetch seal base64', err);
            }
        };
        fetchSeal();
    }, []);

    const handleDetailChange = (key: string, value: any) => {
        setChangeDetails((prev: any) => ({
            ...prev,
            [key]: value
        }));
    };

    const handleRequestSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(route('hrm.payroll-requests.store'), {
            requested_payment_method: changeMethod,
            requested_payment_details: changeDetails,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsChangeModalOpen(false);
            }
        });
    };

    const handleCopySignLink = (id: number) => {
        const signUrl = window.location.origin + '/hrm/document-builder/sign/' + id;
        navigator.clipboard.writeText(signUrl).then(() => {
            setCopiedDocId(id);
            setTimeout(() => setCopiedDocId(null), 2000);
        });
    };

    const handlePrintIDCard = () => {
        const frontEl = document.getElementById('id-card-front');
        const backEl = document.getElementById('id-card-back');

        if (!frontEl || !backEl) return;

        // Get QR Code canvas dataURL so it renders reliably in print window
        const qrCanvas = frontEl.querySelector('canvas') as HTMLCanvasElement | null;
        const qrDataUrl = qrCanvas ? qrCanvas.toDataURL('image/png') : '';

        // Clone Front HTML and replace blank canvas with image
        let frontHtml = frontEl.outerHTML;
        if (qrCanvas && qrDataUrl) {
            frontHtml = frontHtml.replace(/<canvas[^>]*><\/canvas>/gi, `<img src="${qrDataUrl}" style="width:75px;height:75px;display:block;margin:0 auto;" alt="QR Code" />`);
        }

        const backHtml = backEl.outerHTML;

        const printWindow = window.open('', '_blank', 'width=950,height=750');
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>ID Card - ${employee.employee_id || 'Employee'}</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        @page {
                            margin: 0;
                            size: auto;
                        }
                        body {
                            margin: 0;
                            padding: 40px 20px;
                            background: #ffffff;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                        .id-card-wrapper {
                            display: flex;
                            flex-direction: row;
                            gap: 32px;
                            align-items: center;
                            justify-content: center;
                        }
                        @media print {
                            body {
                                padding: 25px 0;
                                margin: 0;
                                background: #ffffff;
                            }
                            .id-card-wrapper {
                                gap: 32px;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="id-card-wrapper">
                        ${frontHtml}
                        ${backHtml}
                    </div>
                    <script>
                        window.onload = function() {
                            setTimeout(function() {
                                window.print();
                                window.close();
                            }, 500);
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const getGenderText = (gender: string) => {
        // Handle both old numeric values and new string values
        const genders: any = { "0": "Male", "1": "Female", "2": "Other" };
        return genders[gender] || gender || "Male";
    };

    const getEmploymentTypeText = (type: string) => {
        const types: any = { "0": "Full Time", "1": "Part Time", "2": "Temporary", "3": "Contract" };
        return types[type] || type;
    };

    const handleDestroyIssuedDocument = (id: number) => {
        if (confirm(t('Are you sure you want to delete this document from history?'))) {
            router.delete(route('hrm.document-builder.destroy', id), {
                preserveScroll: true
            });
        }
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Employees'), url: route('hrm.employees.index') },
                { label: t('View Employee') }
            ]}
            pageTitle={t('Employee Details')}
            backUrl={route('hrm.employees.index')}
        >
            <Head title={t('Employee Details')} />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Sidebar - Profile */}
                <div className="lg:col-span-1">
                    <Card className="shadow-sm">
                        <CardContent className="p-6 text-center">
                            <div className="mb-4">
                                <img 
                                    src={employee.user?.avatar ? getImagePath(employee.user.avatar) : '/default-avatar.png'} 
                                    alt={employee.user?.name || 'Employee'}
                                    className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-gray-100"
                                    onError={(e) => { e.currentTarget.src = '/default-avatar.png'; }}
                                />
                            </div>
                            <h3 className="text-xl font-bold mb-1 flex items-center justify-center gap-1.5">
                                <span>{employee.user?.name}</span>
                                {Boolean(employee.is_verified) && <VerifiedBadge size="md" />}
                            </h3>
                            <p className="text-muted-foreground text-sm mb-2">{employee.user?.email}</p>

                            {(auth.user.type === 'company' || auth.user.type === 'hr' || auth.user.can?.('edit-employees')) && (
                                <div className="mb-4">
                                    <button
                                        type="button"
                                        onClick={() => router.post(route('hrm.employees.toggle-verification', employee.id))}
                                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-2xs ${
                                            Boolean(employee.is_verified)
                                                ? 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                                                : 'bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all'
                                        }`}
                                        title={t('Click to toggle official employee verification status')}
                                    >
                                        {Boolean(employee.is_verified) ? (
                                            <>
                                                <VerifiedBadge size="xs" />
                                                <span>{t('Official Verified Employee')}</span>
                                            </>
                                        ) : (
                                            <>
                                                <ShieldCheck className="h-4 w-4 text-slate-500 group-hover:text-white" />
                                                <span>{t('⚡ Mark as Verified Employee')}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                            
                            {employee.whatsapp && (
                                <div className="mb-4 flex justify-center">
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white shadow-2xs hover:border-emerald-400 hover:shadow-xs transition-all group">
                                        <a 
                                            href={`https://wa.me/${employee.whatsapp.replace(/[^0-9]/g, '')}`} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            title={t('Click to open WhatsApp')}
                                            className="flex items-center gap-2 text-slate-800 hover:text-emerald-600 transition-colors"
                                        >
                                            <span className="w-5 h-5 rounded-full bg-[#25D366] flex items-center justify-center text-white shrink-0 shadow-2xs">
                                                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                                                </svg>
                                            </span>
                                            <span className="font-semibold text-xs text-slate-800 font-mono tracking-tight">{employee.whatsapp}</span>
                                        </a>
                                        <button 
                                            onClick={() => handleCopyText(employee.whatsapp, 'whatsapp')} 
                                            title={t('Copy WhatsApp Number')}
                                            className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-md hover:bg-slate-100 ml-0.5"
                                        >
                                            {copiedWhatsapp ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            <div className="space-y-3 text-left">
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('Employee ID')}</p>
                                    <p className="font-medium">{employee.employee_id}</p>
                                    <div className="mt-2 flex flex-col gap-2">
                                        <a 
                                            href={window.location.origin + `/employee/verify/${employee.employee_id}`} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            className="text-blue-600 hover:text-blue-700 underline font-medium text-xs text-center"
                                        >
                                            {t('Public Verification Link')}
                                        </a>
                                        <button 
                                            onClick={() => setIsIDCardModalOpen(true)}
                                            className="mt-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md text-xs font-semibold hover:from-blue-700 hover:to-indigo-700 transition shadow-sm w-full"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            {t('Preview & Download ID Card')}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('Date of Birth')}</p>
                                    <p className="font-medium">{formatDate(employee.date_of_birth)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('Gender')}</p>
                                    <p className="font-medium">{t(getGenderText(employee.gender))}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('Branch')}</p>
                                    <p className="font-medium">{employee.branch?.branch_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('Department')}</p>
                                    <p className="font-medium">{employee.department?.department_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('Designation')}</p>
                                    <p className="font-medium">{employee.designation?.designation_name}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Content - Tabs & Work Email */}
                <div className="lg:col-span-3 space-y-6">
                    <Card className="shadow-sm">
                        <CardContent className="p-6">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-6">
                                    <TabsTrigger value="employment" className="flex items-center gap-1">
                                        <Briefcase className="w-3.5 h-3.5" />
                                        {t('Employment')}
                                    </TabsTrigger>
                                    <TabsTrigger value="contact" className="flex items-center gap-1">
                                        <Phone className="w-3.5 h-3.5" />
                                        {t('Contact')}
                                    </TabsTrigger>
                                    <TabsTrigger value="payroll" className="flex items-center gap-1">
                                        <DollarSign className="w-3.5 h-3.5" />
                                        {t('Payroll')}
                                    </TabsTrigger>
                                    <TabsTrigger value="hours" className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        {t('Hours & Rates')}
                                    </TabsTrigger>
                                    <TabsTrigger value="documents" className="flex items-center gap-1">
                                        <FileText className="w-3.5 h-3.5" />
                                        {t('Documents')}
                                    </TabsTrigger>
                                    <TabsTrigger value="devices" className="flex items-center gap-1">
                                        <Laptop className="w-3.5 h-3.5" />
                                        {t('Devices')}
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="employment" className="space-y-6 mt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                         <div>
                                             <p className="text-sm text-muted-foreground mb-1">{t('Employment Type')}</p>
                                             <p className="font-medium">{t(getEmploymentTypeText(employee.employment_type))}</p>
                                         </div>
                                         <div>
                                             <p className="text-sm text-muted-foreground mb-1">{t('Employment Status')}</p>
                                             <p className="font-medium capitalize">{employee.employment_status || 'probation'}</p>
                                         </div>
                                         {employee.employment_status === 'probation' && (
                                             <>
                                                 <div>
                                                     <p className="text-sm text-muted-foreground mb-1">{t('Probation Salary Percentage')}</p>
                                                     <p className="font-medium">{employee.probation_percentage || 70}%</p>
                                                 </div>
                                                 <div>
                                                     <p className="text-sm text-muted-foreground mb-1">{t('Probation Period')}</p>
                                                     <p className="font-medium">{employee.probation_period || 3} {t('Months')}</p>
                                                 </div>
                                             </>
                                         )}
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">{t('Date of Joining')}</p>
                                            <p className="font-medium">{formatDate(employee.date_of_joining)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">{t('Shift')}</p>
                                            <p className="font-medium">{employee.shift?.shift_name || 'N/A'}</p>
                                        </div>

                                        {/* Roles & Responsibilities Section (Read-Only for Employee) */}
                                        <div className="col-span-1 md:col-span-2 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                                                        <Briefcase className="w-4 h-4" />
                                                    </div>
                                                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                                        {t('Roles & Responsibilities')}
                                                    </h4>
                                                </div>
                                                <Badge variant="outline" className="text-[10px] text-slate-500 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-mono">
                                                    <Lock className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                                                    {t('Read Only - Managed by HR')}
                                                </Badge>
                                            </div>

                                            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans whitespace-pre-line shadow-2xs">
                                                {employee.roles_responsibilities ? (
                                                    employee.roles_responsibilities
                                                ) : (
                                                    <span className="italic text-slate-400">
                                                        {t('No official roles & responsibilities specified yet by HR.')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="contact" className="space-y-6 mt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">{t('Address Line 1')}</p>
                                            <p className="font-medium">{employee.address_line_1}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">{t('Address Line 2')}</p>
                                            <p className="font-medium">{employee.address_line_2 || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">{t('City')}</p>
                                            <p className="font-medium">{employee.city}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">{t('State')}</p>
                                            <p className="font-medium">{employee.state}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">{t('Country')}</p>
                                            <p className="font-medium">{employee.country}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">{t('Postal Code')}</p>
                                            <p className="font-medium">{employee.postal_code}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">{t('Emergency Contact Name')}</p>
                                            <p className="font-medium">{employee.emergency_contact_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">{t('Emergency Contact Relationship')}</p>
                                            <p className="font-medium">{employee.emergency_contact_relationship}</p>
                                        </div>
                                        <div>
                                             <p className="text-sm text-muted-foreground mb-1">{t('Emergency Contact Number')}</p>
                                             <p className="font-medium">{employee.emergency_contact_number}</p>
                                         </div>

                                         {employee.whatsapp && (
                                             <div className="col-span-1 md:col-span-2 p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                 <div className="flex items-center gap-3">
                                                     <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white shrink-0 shadow-xs">
                                                         <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                                             <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                                                         </svg>
                                                     </div>
                                                     <div>
                                                         <p className="text-xs text-emerald-800 font-extrabold uppercase tracking-wider">{t('Direct WhatsApp')}</p>
                                                         <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">{employee.whatsapp}</p>
                                                     </div>
                                                 </div>
                                                 <div className="flex items-center gap-2">
                                                     <button
                                                         type="button"
                                                         onClick={() => handleCopyText(employee.whatsapp, 'whatsapp')}
                                                         className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition"
                                                     >
                                                         {copiedWhatsapp ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                                         <span>{copiedWhatsapp ? t('Copied!') : t('Copy Number')}</span>
                                                     </button>
                                                     <a
                                                         href={`https://wa.me/${employee.whatsapp.replace(/[^0-9]/g, '')}`}
                                                         target="_blank"
                                                         rel="noreferrer"
                                                         className="px-3.5 py-1.5 bg-[#25D366] text-white hover:bg-[#20bd5a] text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 transition"
                                                     >
                                                         <ExternalLink className="w-3.5 h-3.5" />
                                                         <span>{t('Open WhatsApp')}</span>
                                                     </a>
                                                 </div>
                                             </div>
                                         )}          
                                    </div>
                                </TabsContent>

                                <TabsContent value="payroll" className="space-y-4 mt-4">
                                    {/* CARD 1: Salary & Compensation Transparency Summary (Neutral Compact Design) */}
                                    {(() => {
                                        const basicSalary = parseFloat(employee.basic_salary || '0') || 0;
                                        const isYearly = employee.salary_type === 'yearly';
                                        const monthlyBasic = isYearly ? basicSalary / 12 : basicSalary;
                                        const yearlyBasic = isYearly ? basicSalary : basicSalary * 12;

                                        const isProbation = employee.employment_status === 'probation';
                                        const probationPct = parseFloat(employee.probation_percentage || '70') || 70;
                                        const effectiveMonthlySalary = isProbation ? (monthlyBasic * probationPct) / 100 : monthlyBasic;

                                        const feeType = companyAllSetting[`payroll_method_fee_type_${employee.payment_method || 'bank_transfer'}`] || 'percentage';
                                        const percentageFee = parseFloat(companyAllSetting[`payroll_method_fee_percentage_${employee.payment_method || 'bank_transfer'}`] || '0') || 0;
                                        const fixedFee = parseFloat(companyAllSetting[`payroll_method_fee_fixed_${employee.payment_method || 'bank_transfer'}`] || '0') || 0;

                                        let feeText = '';
                                        let estimatedCharge = 0;

                                        if (feeType === 'percentage') {
                                            feeText = `${percentageFee}%`;
                                            estimatedCharge = (effectiveMonthlySalary * percentageFee) / 100;
                                        } else if (feeType === 'fixed') {
                                            feeText = `${formatCurrency(fixedFee)}`;
                                            estimatedCharge = fixedFee;
                                        } else if (feeType === 'both') {
                                            feeText = `${percentageFee}% + ${formatCurrency(fixedFee)}`;
                                            estimatedCharge = ((effectiveMonthlySalary * percentageFee) / 100) + fixedFee;
                                        }
                                        const netPayout = Math.max(0, effectiveMonthlySalary - estimatedCharge);

                                        return (
                                            <div className="bg-slate-50/70 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                                                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
                                                    <div className="flex items-center gap-2">
                                                        <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                                                            {t('Salary & Payroll Breakdown')}
                                                        </h4>
                                                    </div>
                                                    {isProbation ? (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                                            {t('Probation Active')} ({employee.probation_period || 3} {t('Months')})
                                                        </span>
                                                    ) : (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                            {t('Permanent Employee')}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    {/* Full Basic Salary Box */}
                                                    <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-0.5">
                                                        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">{t('Set Basic Salary')}</span>
                                                        <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                                                            {formatCurrency(monthlyBasic)} <span className="text-xs font-normal text-slate-500">/ {t('mo')}</span>
                                                        </div>
                                                        <p className="text-[11px] text-slate-500">
                                                            {formatCurrency(yearlyBasic)} / {t('yr')} ({t('Period:')} <span className="capitalize font-medium">{employee.salary_type || 'yearly'}</span>)
                                                        </p>
                                                    </div>

                                                    {/* Current Receiving Salary Box */}
                                                    <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 space-y-0.5">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">{t('Current Receiving Pay')}</span>
                                                            {isProbation && (
                                                                <span className="text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 px-1.5 py-0.2 rounded font-semibold">
                                                                    {probationPct}% {t('Rate')}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                                                            {formatCurrency(effectiveMonthlySalary)} <span className="text-xs font-normal">/ {t('mo')}</span>
                                                        </div>
                                                        <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
                                                            {isProbation ? `${t('Receiving')} ${probationPct}% ${t('of basic salary during probation')}` : t('Receiving 100% full basic salary')}
                                                        </p>
                                                    </div>

                                                    {/* Estimated Net Payout Box */}
                                                    <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-0.5">
                                                        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">{t('Estimated Net Payout')}</span>
                                                        <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                                                            {formatCurrency(netPayout)} <span className="text-xs font-normal text-slate-500">/ {t('mo')}</span>
                                                        </div>
                                                        <p className="text-[11px] text-slate-500">
                                                            {t('Fee:')} <span className="font-semibold text-slate-700 dark:text-slate-300">{feeText}</span> ({t('Charge:')} <span className="text-rose-600 dark:text-rose-400 font-semibold">{formatCurrency(estimatedCharge)}</span>)
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* CARD 2: Probation Preferred Payroll & Partner Payment Accounts (VISIBLE ONLY IF PROBATION) */}
                                    {employee.employment_status === 'probation' && (
                                        <div className="bg-slate-50/70 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                                            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-800">
                                                <div className="flex items-center gap-2">
                                                    <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                                                        {t('Probation Preferred Payroll Gateways (Supported Regions)')}
                                                    </h4>
                                                </div>
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                                    {t('Company Partner Promotion')}
                                                </span>
                                            </div>

                                            {/* Informational Text */}
                                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                                {companyAllSetting.probation_notice_text || t('During probation, we only accept RedotPay & Kast virtual card gateways for supported regions. Account creation & payroll transfers are Totally Free ($0.00).')}
                                            </p>

                                            {/* Gateways Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                                {/* RedotPay Partner Card (SUGGESTED BANNER) */}
                                                <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                                                            RedotPay (Virtual Card)
                                                        </span>
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-extrabold border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                                                            ⭐ {t('SUGGESTED GATEWAY')}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                                        <span>{t('Transaction Fee:')} <strong className="text-emerald-600 dark:text-emerald-400">{t('Totally Free ($0.00)')}</strong></span>
                                                    </div>

                                                    {/* Bonus Promotion Perks */}
                                                    <div className="space-y-1.5 text-[11px]">
                                                        <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-semibold bg-amber-50/80 dark:bg-amber-950/40 px-2 py-1 rounded border border-amber-200/80 dark:border-amber-800">
                                                            <Gift className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                                            <span>{t('$5 Instant Bonus via our link')} <span className="text-[10px] text-slate-500 font-normal">({t('T&C apply')})</span></span>
                                                        </div>
                                                    </div>

                                                    {/* Coupon Code OPENCLAW Strap */}
                                                    <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50/80 dark:bg-rose-950/40 border border-dashed border-rose-200 dark:border-rose-800 text-xs">
                                                        <div className="flex items-center gap-1.5">
                                                            <Tag className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                                                            <span className="text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                                                                {t('20% Discount Code:')}
                                                            </span>
                                                            <code className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 font-mono font-bold text-xs tracking-wider">
                                                                OPENCLAW
                                                            </code>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                navigator.clipboard.writeText('OPENCLAW');
                                                                alert(t('Coupon code OPENCLAW copied to clipboard!'));
                                                            }}
                                                            className="text-[11px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline flex items-center gap-1 shrink-0 ml-1"
                                                        >
                                                            <Copy className="w-3 h-3" />
                                                            {t('Copy')}
                                                        </button>
                                                    </div>

                                                    <a
                                                        href={companyAllSetting.probation_redotpay_link || "https://url.hk/i/en/cwqej"}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors"
                                                    >
                                                        <span>{t('Create Free RedotPay Account')}</span>
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </a>

                                                    {/* Account ID / User ID & Card Number Submission Fields */}
                                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                                                        <div>
                                                            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
                                                                {t('RedotPay User ID / Account ID:')}
                                                            </label>
                                                            <div className="flex gap-2">
                                                                <Input
                                                                    type="text"
                                                                    placeholder="e.g. 1556606624"
                                                                    value={redotpayAccountId}
                                                                    onChange={(e) => setRedotpayAccountId(e.target.value)}
                                                                    className="h-8 text-xs font-mono"
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    disabled={savingAccountId}
                                                                    onClick={() => handleSaveAccountId('redotpay_user_id', redotpayAccountId)}
                                                                    className="h-8 text-xs font-bold px-3"
                                                                >
                                                                    {t('Save')}
                                                                </Button>
                                                            </div>
                                                            {employee.payment_details?.redotpay_user_id && (
                                                                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-medium mt-0.5">
                                                                    ✓ Saved ID: {employee.payment_details.redotpay_user_id}
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
                                                                {t('RedotPay Virtual Card Number:')}
                                                            </label>
                                                            <div className="flex gap-2">
                                                                <Input
                                                                    type="text"
                                                                    placeholder="e.g. 4532 •••• •••• 8910"
                                                                    value={redotpayCardNumber}
                                                                    onChange={(e) => setRedotpayCardNumber(e.target.value)}
                                                                    className="h-8 text-xs font-mono"
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    disabled={savingAccountId}
                                                                    onClick={() => handleSaveAccountId('redotpay_card_number', redotpayCardNumber)}
                                                                    className="h-8 text-xs font-bold px-3"
                                                                >
                                                                    {t('Save')}
                                                                </Button>
                                                            </div>
                                                            {employee.payment_details?.redotpay_card_number && (
                                                                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-medium mt-0.5">
                                                                    ✓ Saved Card: {employee.payment_details.redotpay_card_number}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Kast Partner Card */}
                                                <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                                            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                                                            Kast (Virtual Card)
                                                        </span>
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-extrabold border border-purple-200 dark:border-purple-800">
                                                            {t('Supported Gateway')}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                                        <span>{t('Transaction Fee:')} <strong className="text-emerald-600 dark:text-emerald-400">{t('Totally Free ($0.00)')}</strong></span>
                                                    </div>

                                                    {/* Bonus Promotion & Cashback Perks */}
                                                    <div className="space-y-1.5 text-[11px]">
                                                        <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 font-semibold bg-purple-50/80 dark:bg-purple-950/40 px-2 py-1 rounded border border-purple-200/80 dark:border-purple-800">
                                                            <Gift className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                                                            <span>{t('$10 Signup Bonus via our link')} <span className="text-[10px] text-slate-500 font-normal">({t('T&C apply')})</span></span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50/80 dark:bg-emerald-950/40 px-2 py-1 rounded border border-emerald-200/80 dark:border-emerald-800">
                                                            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                            <span>{t('Cashback on every card purchase')}</span>
                                                        </div>
                                                    </div>

                                                    <a
                                                        href={companyAllSetting.probation_kast_link || "https://app.kast.xyz/referral/XJLR09R1"}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-colors"
                                                    >
                                                        <span>{t('Create Free Kast Account')}</span>
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </a>

                                                    {/* Account ID / User ID & Card Number Submission Fields */}
                                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                                                        <div>
                                                            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
                                                                {t('Kast User ID / Wallet:')}
                                                            </label>
                                                            <div className="flex gap-2">
                                                                <Input
                                                                    type="text"
                                                                    placeholder="e.g. @username or Wallet"
                                                                    value={kastAccountId}
                                                                    onChange={(e) => setKastAccountId(e.target.value)}
                                                                    className="h-8 text-xs font-mono"
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    disabled={savingAccountId}
                                                                    onClick={() => handleSaveAccountId('kast_user_id', kastAccountId)}
                                                                    className="h-8 text-xs font-bold px-3"
                                                                >
                                                                    {t('Save')}
                                                                </Button>
                                                            </div>
                                                            {employee.payment_details?.kast_user_id && (
                                                                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-medium mt-0.5">
                                                                    ✓ Saved ID: {employee.payment_details.kast_user_id}
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
                                                                {t('Kast Virtual Card Number:')}
                                                            </label>
                                                            <div className="flex gap-2">
                                                                <Input
                                                                    type="text"
                                                                    placeholder="e.g. 5241 •••• •••• 1234"
                                                                    value={kastCardNumber}
                                                                    onChange={(e) => setKastCardNumber(e.target.value)}
                                                                    className="h-8 text-xs font-mono"
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    disabled={savingAccountId}
                                                                    onClick={() => handleSaveAccountId('kast_card_number', kastCardNumber)}
                                                                    className="h-8 text-xs font-bold px-3"
                                                                >
                                                                    {t('Save')}
                                                                </Button>
                                                            </div>
                                                            {employee.payment_details?.kast_card_number && (
                                                                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-medium mt-0.5">
                                                                    ✓ Saved Card: {employee.payment_details.kast_card_number}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* CARD 3: Selected Payment Method Details */}
                                    <div className="bg-slate-50/50 p-5 border border-slate-200 dark:border-slate-800 rounded-2xl">
                                        <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t('Selected Payment Method')}</p>
                                                <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                                                    {employee.payment_method === 'bank_transfer' && t('Bank Transfer')}
                                                    {employee.payment_method === 'cards_transfer' && t('Cards Transfer')}
                                                    {employee.payment_method === 'paypal' && t('PayPal')}
                                                    {employee.payment_method === 'kast' && t('Kast')}
                                                    {employee.payment_method === 'redotpay' && t('Redotpay')}
                                                    {employee.payment_method === 'remitly' && t('Remitly')}
                                                    {employee.payment_method === 'western_union' && t('Western Union')}
                                                    {employee.payment_method === 'binance_bybit' && t('Binance / Bybit')}
                                                    {!employee.payment_method && t('Bank Transfer (Default)')}
                                                </h4>
                                            </div>
                                            {isEmployee && (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setChangeMethod(employee.payment_method || 'bank_transfer');
                                                        setChangeDetails(employee.payment_details || {});
                                                        setIsChangeModalOpen(true);
                                                    }}
                                                    className="font-semibold text-sm border-blue-200 text-blue-600 hover:bg-blue-50"
                                                >
                                                    {t('Request Payroll Change')}
                                                </Button>
                                            )}
                                        </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {(employee.payment_method === 'bank_transfer' || !employee.payment_method) && (
                                            <>
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-1">{t('Account Holder Name')}</p>
                                                    <p className="font-medium">{employee.payment_details?.account_holder_name || employee.account_holder_name || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-1">{t('Bank Name')}</p>
                                                    <p className="font-medium">{employee.payment_details?.bank_name || employee.bank_name || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-1">{t('Bank Country')}</p>
                                                    <p className="font-medium">{employee.payment_details?.bank_country || employee.bank_country || 'Other'}</p>
                                                </div>
                                                {employee.payment_details?.bank_country === 'US' ? (
                                                    <>
                                                        <div>
                                                            <p className="text-sm text-muted-foreground mb-1">{t('Routing Number (ABA)')}</p>
                                                            <p className="font-medium">{employee.payment_details?.routing_number || '-'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-muted-foreground mb-1">{t('Account Number')}</p>
                                                            <p className="font-medium">{employee.payment_details?.account_number || employee.account_number || '-'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-muted-foreground mb-1">{t('Account Type')}</p>
                                                            <p className="font-medium">{employee.payment_details?.account_type || '-'}</p>
                                                        </div>
                                                    </>
                                                ) : employee.payment_details?.bank_country === 'EU' ? (
                                                    <>
                                                        <div>
                                                            <p className="text-sm text-muted-foreground mb-1">{t('IBAN')}</p>
                                                            <p className="font-medium">{employee.payment_details?.iban || '-'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-muted-foreground mb-1">{t('BIC / SWIFT')}</p>
                                                            <p className="font-medium">{employee.payment_details?.bic_swift || '-'}</p>
                                                        </div>
                                                    </>
                                                ) : employee.payment_details?.bank_country === 'UK' ? (
                                                    <>
                                                        <div>
                                                            <p className="text-sm text-muted-foreground mb-1">{t('Sort Code')}</p>
                                                            <p className="font-medium">{employee.payment_details?.sort_code || '-'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-muted-foreground mb-1">{t('Account Number')}</p>
                                                            <p className="font-medium">{employee.payment_details?.account_number || employee.account_number || '-'}</p>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div>
                                                            <p className="text-sm text-muted-foreground mb-1">{t('Account Number / IBAN')}</p>
                                                            <p className="font-medium">{employee.payment_details?.account_number || employee.account_number || '-'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-muted-foreground mb-1">{t('SWIFT / BIC Code')}</p>
                                                            <p className="font-medium">{employee.payment_details?.bank_identifier_code || employee.bank_identifier_code || '-'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-muted-foreground mb-1">{t('Bank Branch')}</p>
                                                            <p className="font-medium">{employee.payment_details?.bank_branch || employee.bank_branch || '-'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-muted-foreground mb-1">{t('Tax Payer ID')}</p>
                                                            <p className="font-medium">{employee.payment_details?.tax_payer_id || employee.tax_payer_id || '-'}</p>
                                                        </div>
                                                    </>
                                                )}
                                                {employee.payment_details?.bank_notes && (
                                                    <div className="md:col-span-2">
                                                        <p className="text-sm text-muted-foreground mb-1">{t('Payment Notes')}</p>
                                                        <p className="font-medium bg-slate-55 p-2.5 rounded-lg border border-slate-100 text-sm whitespace-pre-wrap">{employee.payment_details.bank_notes}</p>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {employee.payment_method === 'cards_transfer' && (
                                            <>
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-1">{t('Cardholder Name')}</p>
                                                    <p className="font-medium">{employee.payment_details?.cardholder_name || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-1">{t('Card Type')}</p>
                                                    <p className="font-medium">{employee.payment_details?.card_type || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-1">{t('Card Number')}</p>
                                                    <p className="font-medium">{employee.payment_details?.card_number || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-1">{t('Expiry Date')}</p>
                                                    <p className="font-medium">{employee.payment_details?.expiry_date || '-'}</p>
                                                </div>
                                            </>
                                        )}

                                        {employee.payment_method === 'paypal' && (
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-1">{t('PayPal Registered Email')}</p>
                                                <p className="font-medium">{employee.payment_details?.paypal_email || '-'}</p>
                                            </div>
                                        )}

                                        {employee.payment_method === 'kast' && (
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-1">{t('Kast Username')}</p>
                                                <p className="font-medium">{employee.payment_details?.kast_username || '-'}</p>
                                            </div>
                                        )}

                                        {employee.payment_method === 'redotpay' && (
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-1">{t('Redotpay Identifier')}</p>
                                                <p className="font-medium">{employee.payment_details?.redotpay_id || '-'}</p>
                                            </div>
                                        )}

                                        {employee.payment_method === 'remitly' && (
                                            <>
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-1">{t('Recipient Name')}</p>
                                                    <p className="font-medium">{employee.payment_details?.recipient_name || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-1">{t('Recipient Phone')}</p>
                                                    <p className="font-medium">{employee.payment_details?.recipient_phone || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-1">{t('Recipient Country')}</p>
                                                    <p className="font-medium">{employee.payment_details?.recipient_country || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-1">{t('Delivery Method')}</p>
                                                    <p className="font-medium">{employee.payment_details?.delivery_method || '-'}</p>
                                                </div>
                                                {employee.payment_details?.wallet_provider && (
                                                    <div>
                                                        <p className="text-sm text-muted-foreground mb-1">{t('Bank/Wallet Provider')}</p>
                                                        <p className="font-medium">{employee.payment_details.wallet_provider}</p>
                                                    </div>
                                                )}
                                                {employee.payment_details?.wallet_number && (
                                                    <div>
                                                        <p className="text-sm text-muted-foreground mb-1">{t('Wallet Account Number')}</p>
                                                        <p className="font-medium">{employee.payment_details.wallet_number}</p>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {employee.payment_method === 'western_union' && (
                                            <>
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-1">{t('Recipient Full Name')}</p>
                                                    <p className="font-medium">{employee.payment_details?.recipient_name || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-1">{t('Recipient City')}</p>
                                                    <p className="font-medium">{employee.payment_details?.recipient_city || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-1">{t('Recipient Country')}</p>
                                                    <p className="font-medium">{employee.payment_details?.recipient_country || '-'}</p>
                                                </div>
                                                {employee.payment_details?.recipient_phone && (
                                                    <div>
                                                        <p className="text-sm text-muted-foreground mb-1">{t('Recipient Phone')}</p>
                                                        <p className="font-medium">{employee.payment_details.recipient_phone}</p>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {employee.payment_method === 'binance_bybit' && (
                                            <>
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-1">{t('Exchange')}</p>
                                                    <p className="font-medium">{employee.payment_details?.exchange || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-1">{t('Network')}</p>
                                                    <p className="font-medium">{employee.payment_details?.network || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-1">{t('Coin')}</p>
                                                    <p className="font-medium">{employee.payment_details?.coin || '-'}</p>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <p className="text-sm text-muted-foreground mb-1">{t('Wallet Address')}</p>
                                                    <p className="font-medium font-mono text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 break-all select-all">{employee.payment_details?.wallet_address || '-'}</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                                </TabsContent>

                                <TabsContent value="hours" className="space-y-6 mt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">{t('Hours Per Day')}</p>
                                            <p className="font-medium">{employee.hours_per_day || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">{t('Days Per Week')}</p>
                                            <p className="font-medium">{employee.days_per_week || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">{t('Rate Per Hour')}</p>
                                            <p className="font-medium">{employee.rate_per_hour ? `${getCurrencySymbol()}${employee.rate_per_hour}` : 'N/A'}</p>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="documents" className="space-y-8 mt-6">
                                    {/* Uploaded Documents */}
                                    <div className="space-y-4">
                                        <h4 className="text-base font-semibold text-gray-900 border-b pb-2">{t('Uploaded Documents')}</h4>
                                        {documents && documents.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {documents.map((doc: any, index: number) => (
                                                    <Card key={doc.id || index} className="p-4 border border-gray-100 hover:border-gray-200 transition-colors">
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex-1">
                                                                <p className="font-medium text-sm text-gray-900">{doc.document_name || doc.title || 'Document'}</p>
                                                                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">
                                                                    {doc.file_path ? doc.file_path.split('/').pop() : doc.document ? doc.document.split('/').pop() : 'No file'}
                                                                </p>
                                                            </div>
                                                            {(doc.file_path || doc.document) && (
                                                                <a
                                                                    href={getImagePath(doc.file_path || doc.document)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9 text-gray-500 hover:text-gray-900"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </Card>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6 border border-dashed rounded-lg text-muted-foreground text-sm">
                                                {t('No documents uploaded.')}
                                            </div>
                                        )}
                                    </div>

                                    {/* Generated Documents History */}
                                    <div className="space-y-4">
                                        <h4 className="text-base font-semibold text-gray-900 border-b pb-2">{t('Generated Documents (Issued Letters)')}</h4>
                                        {issuedDocuments && issuedDocuments.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {issuedDocuments.map((doc: any) => (
                                                     <Card key={doc.id} className="p-4 border border-gray-100 hover:border-gray-250 transition-colors shadow-sm bg-white">
                                                         <div className="flex justify-between items-start gap-4">
                                                             <div className="flex-1 min-w-0">
                                                                 <div className="flex items-center gap-2 flex-wrap">
                                                                     <p className="font-semibold text-sm text-gray-950 truncate">{getDocumentName(doc.document_type)}</p>
                                                                     {doc.payload?.employee_signature ? (
                                                                         <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-[10px] py-0 px-2 font-medium">
                                                                             {t('Signed')}
                                                                         </Badge>
                                                                     ) : (
                                                                         <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 text-[10px] py-0 px-2 font-medium">
                                                                             {t('Pending')}
                                                                         </Badge>
                                                                     )}
                                                                 </div>
                                                                 <div className="text-[11px] text-muted-foreground mt-1.5 space-y-0.5">
                                                                     <div>{t('Issued')}: {new Date(doc.issued_date).toLocaleDateString()}</div>
                                                                     {doc.payload?.employee_signature && (
                                                                         <div className="text-emerald-700 font-semibold">{t('Signed')}: {new Date(doc.payload.employee_signature_date).toLocaleDateString()}</div>
                                                                     )}
                                                                 </div>
                                                             </div>
                                                             <div className="flex items-center gap-1 shrink-0">
                                                                 {/* Signature Flow Actions */}
                                                                 {doc.payload?.employee_signature ? (
                                                                     <button
                                                                         type="button"
                                                                         onClick={() => router.visit(route('hrm.document-builder.sign', doc.id))}
                                                                         className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-indigo-50 h-8 w-8 text-indigo-600"
                                                                         title={t('Print / View Signed PDF')}
                                                                     >
                                                                         <ExternalLink className="h-4 w-4" />
                                                                     </button>
                                                                 ) : (
                                                                     <>
                                                                         <button
                                                                             type="button"
                                                                             onClick={() => handleCopySignLink(doc.id)}
                                                                             className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-amber-50 h-8 w-8 text-amber-600"
                                                                             title={copiedDocId === doc.id ? t('Copied!') : t('Copy Sign Link')}
                                                                         >
                                                                             {copiedDocId === doc.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                                                         </button>
                                                                         <button
                                                                             type="button"
                                                                             onClick={() => router.visit(route('hrm.document-builder.sign', doc.id))}
                                                                             className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-indigo-50 h-8 w-8 text-indigo-600"
                                                                             title={t('Sign Document')}
                                                                         >
                                                                             <PenTool className="h-4 w-4" />
                                                                         </button>
                                                                     </>
                                                                 )}
                                                                 
                                                                 {/* Standard Builder & History Actions */}
                                                                 <button
                                                                     type="button"
                                                                     onClick={() => {
                                                                         router.visit(route('hrm.document-builder.index'), {
                                                                             data: {
                                                                                 employee_id: doc.employee_id,
                                                                                 document_type: doc.document_type,
                                                                                 payload: doc.payload,
                                                                                 issued_date: doc.issued_date
                                                                             }
                                                                         });
                                                                     }}
                                                                     className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-slate-100 h-8 w-8 text-slate-500 hover:text-slate-700"
                                                                     title={t('Prepopulate Builder')}
                                                                 >
                                                                     <FileText className="h-4 w-4" />
                                                                 </button>
                                                                 <button
                                                                     type="button"
                                                                     onClick={() => handleDestroyIssuedDocument(doc.id)}
                                                                     className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-red-50 h-8 w-8 text-red-500 hover:text-red-700"
                                                                     title={t('Delete')}
                                                                 >
                                                                     <Trash2 className="h-4 w-4" />
                                                                 </button>
                                                             </div>
                                                         </div>
                                                     </Card>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6 border border-dashed rounded-lg text-muted-foreground text-sm">
                                                {t('No generated documents found.')}
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                {/* Devices & Hardware Inventory Tab */}
                                <TabsContent value="devices" className="space-y-6 mt-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                                <Laptop className="w-4 h-4 text-indigo-600" />
                                                {t('Hardware Assets & Devices Inventory')}
                                            </h4>
                                            <p className="text-xs text-slate-500 font-normal">
                                                {t('Company-provided hardware (laptops, desktops, phones) and BYOD devices associated with this profile.')}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {deviceSavedNotice && (
                                                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                                                    <Check className="w-3.5 h-3.5" />
                                                    {t('Inventory Saved!')}
                                                </span>
                                            )}
                                            {!isEditingDevices ? (
                                                <Button
                                                    type="button"
                                                    onClick={() => setIsEditingDevices(true)}
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium gap-1.5 shadow-sm"
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                    {t('Edit / Manage Devices')}
                                                </Button>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => setIsEditingDevices(false)}
                                                        className="rounded-xl text-xs font-medium"
                                                    >
                                                        {t('Cancel')}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        onClick={handleSaveDevices}
                                                        disabled={savingDevices}
                                                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium gap-1.5 shadow-sm"
                                                    >
                                                        <Save className="w-3.5 h-3.5" />
                                                        {savingDevices ? t('Saving Inventory...') : t('Save Device Inventory')}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {!isEditingDevices ? (
                                        devices.length === 0 ? (
                                            <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
                                                <Laptop className="w-10 h-10 text-slate-300 mx-auto" />
                                                <div>
                                                    <p className="text-sm font-medium text-slate-700">{t('No hardware devices registered yet.')}</p>
                                                    <p className="text-xs text-slate-400 font-normal">{t('Add laptops, desktop workstations, or smartphones assigned to this employee.')}</p>
                                                </div>
                                                <Button
                                                    type="button"
                                                    onClick={() => setIsEditingDevices(true)}
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl h-8 gap-1.5"
                                                >
                                                    <Laptop className="w-3.5 h-3.5" />
                                                    + {t('Add Device')}
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {devices.map((dev, idx) => (
                                                    <Card key={idx} className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
                                                        <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                {dev.device_category === 'desktop_laptop' ? (
                                                                    <Laptop className="w-4 h-4 text-indigo-600" />
                                                                ) : (
                                                                    <Smartphone className="w-4 h-4 text-purple-600" />
                                                                )}
                                                                <div>
                                                                    <h5 className="text-xs font-semibold text-slate-900">{dev.device_name || t('Registered Device')}</h5>
                                                                    <span className="text-[11px] text-slate-500 font-normal">
                                                                        {dev.device_category === 'desktop_laptop' ? t('Desktop / Laptop') : t('Mobile Phone')}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <Badge
                                                                variant="outline"
                                                                className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                                                    dev.device_ownership === 'company_provided'
                                                                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                                                        : 'bg-purple-50 text-purple-700 border-purple-200'
                                                                }`}
                                                            >
                                                                {dev.device_ownership === 'company_provided' ? t('Company Provided') : t('BYOD (Employee Owned)')}
                                                            </Badge>
                                                        </div>

                                                        <CardContent className="p-4 space-y-3 text-xs">
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div>
                                                                    <span className="text-slate-400 font-normal">{t('Brand / Model')}</span>
                                                                    <p className="font-medium text-slate-800 mt-0.5">{dev.brand || '-'} {dev.model ? `/ ${dev.model}` : ''}</p>
                                                                </div>

                                                                {dev.device_category === 'desktop_laptop' ? (
                                                                    <div>
                                                                        <span className="text-slate-400 font-normal">{t('Serial Number')}</span>
                                                                        <p className="font-mono font-medium text-slate-800 mt-0.5">{dev.serial_number || '-'}</p>
                                                                    </div>
                                                                ) : (
                                                                    <div>
                                                                        <span className="text-slate-400 font-normal">{t('IMEI Number')}</span>
                                                                        <p className="font-mono font-medium text-slate-800 mt-0.5">{dev.imei || '-'}</p>
                                                                    </div>
                                                                )}

                                                                <div>
                                                                    <span className="text-slate-400 font-normal">{t('Operating System')}</span>
                                                                    <p className="font-medium text-slate-800 mt-0.5">{dev.operating_system || '-'} {dev.os_version ? `(${dev.os_version})` : ''}</p>
                                                                </div>

                                                                {dev.device_ownership === 'company_provided' && (
                                                                    <div>
                                                                        <span className="text-slate-400 font-normal">{t('Purchase Date')}</span>
                                                                        <p className="font-medium text-slate-800 mt-0.5">{dev.purchase_month_year || '-'}</p>
                                                                    </div>
                                                                )}

                                                                {dev.mobile_number && (
                                                                    <div>
                                                                        <span className="text-slate-400 font-normal">{t('Mobile Number')}</span>
                                                                        <p className="font-medium text-slate-800 mt-0.5">{dev.mobile_number}</p>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {dev.notes && (
                                                                <div className="pt-2 border-t border-slate-100">
                                                                    <span className="text-slate-400 font-normal">{t('Notes & Accessories')}</span>
                                                                    <p className="text-slate-700 font-normal mt-0.5 italic text-[11px]">{dev.notes}</p>
                                                                </div>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        )
                                    ) : (
                                        <DeviceConfigStep devices={devices} onChange={setDevices} />
                                    )}
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>

                    {/* Official Work Email & Access Credentials Card */}
                    <Card className="shadow-sm border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/20 to-slate-50 overflow-hidden">
                        <div className="p-4 border-b border-indigo-100/60 bg-white/80 backdrop-blur-sm flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">{t('Official Work Email & Workspace Credentials')}</h3>
                                    <p className="text-xs text-slate-500">{t('Issued professional email account and webmail access details')}</p>
                                </div>
                            </div>
                            {employee.official_email ? (
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium px-3 py-1 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    {t('Active Webmail Account')}
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-slate-500 border-slate-200 font-normal">
                                    {t('Not Issued Yet')}
                                </Badge>
                            )}
                        </div>

                        <CardContent className="p-6">
                            {employee.official_email ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Left Side: Email & Password Credentials */}
                                    <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            <ShieldCheck className="w-4 h-4 text-indigo-500" />
                                            {t('Account Information')}
                                        </div>

                                        {/* Official Email */}
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold text-slate-600">{t('Official Email Address')}</Label>
                                            <div className="font-mono text-sm font-bold text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                                                <span className="truncate mr-2">{employee.official_email}</span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleCopyText(employee.official_email, 'email')}
                                                    className="h-7 px-2 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 shrink-0 gap-1"
                                                >
                                                    {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                                    {copiedEmail ? t('Copied') : t('Copy')}
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Official Password */}
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold text-slate-600">{t('Official Email Password')}</Label>
                                            <div className="font-mono text-sm font-bold text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                                                <input
                                                    type={showOfficialPassword ? "text" : "password"}
                                                    value={employee.official_email_password || ''}
                                                    readOnly
                                                    placeholder={employee.official_email_password ? '' : t('Password not recorded')}
                                                    className="bg-transparent border-none outline-none font-mono text-sm font-bold text-slate-900 w-full focus:ring-0 focus:outline-none select-all"
                                                />
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setShowOfficialPassword(!showOfficialPassword)}
                                                        className="h-7 w-7 p-0 text-slate-500 hover:text-slate-700"
                                                        title={showOfficialPassword ? t('Hide Password') : t('Show Password')}
                                                    >
                                                        {showOfficialPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleCopyText(employee.official_email_password || '', 'password')}
                                                        className="h-7 px-2 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 gap-1"
                                                    >
                                                        {copiedPassword ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                                        {copiedPassword ? t('Copied') : t('Copy')}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Webmail Portal Button */}
                                        <div className="pt-2">
                                            <a
                                                href="https://webmail.parknil.top/"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm rounded-lg shadow-sm transition-all"
                                            >
                                                <Globe className="w-4 h-4" />
                                                {t('Login to Webmail Portal')}
                                                <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-80" />
                                            </a>
                                        </div>
                                    </div>

                                    {/* Right Side: Copyable Actions & App Connection Setup */}
                                    <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Key className="w-4 h-4 text-emerald-500" />
                                                    {t('Mail App Setup & Configuration')}
                                                </span>
                                            </div>

                                            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                                                {t('Use these settings to add your official email to Apple Mail, Outlook, Gmail app, or Yahoo Mail:')}
                                            </p>

                                            {/* Configuration Specs Table / Box */}
                                            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-2 font-mono">
                                                <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                                                    <span className="text-slate-500 font-sans font-medium">{t('Incoming (IMAP)')}:</span>
                                                    <span className="font-bold text-slate-900">imap.stackmail.com (Port 993 SSL)</span>
                                                </div>
                                                <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                                                    <span className="text-slate-500 font-sans font-medium">{t('Outgoing (SMTP)')}:</span>
                                                    <span className="font-bold text-slate-900">smtp.stackmail.com (Port 465/587)</span>
                                                </div>
                                                <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                                                    <span className="text-slate-500 font-sans font-medium">{t('Username')}:</span>
                                                    <span className="font-bold text-indigo-600 truncate max-w-[180px]">{employee.official_email}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-slate-500 font-sans font-medium">{t('Security')}:</span>
                                                    <span className="font-bold text-slate-900">SSL/TLS / Normal Password</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 1-Click Copy Buttons Footer */}
                                        <div className="grid grid-cols-2 gap-3 pt-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => handleCopyText(employee.official_email, 'email')}
                                                className="w-full text-xs font-medium gap-1.5 h-9 bg-slate-50 hover:bg-slate-100"
                                            >
                                                {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                                                {copiedEmail ? t('Copied Email!') : t('Copy Email')}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => handleCopyText(employee.official_email_password || '', 'password')}
                                                className="w-full text-xs font-medium gap-1.5 h-9 bg-slate-50 hover:bg-slate-100"
                                            >
                                                {copiedPassword ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                                                {copiedPassword ? t('Copied Password!') : t('Copy Password')}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-white rounded-xl border border-dashed border-slate-200">
                                    <Mail className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                                    <h4 className="text-sm font-bold text-slate-700">{t('No Official Email Issued Yet')}</h4>
                                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                                        {t('An official work email has not been assigned to this employee. Use the Employee List action to issue an official email address and password.')}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            
            {/* ID CARD PREVIEW MODAL */}
            {isIDCardModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-950 dark:text-white flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-600" />
                                {t('Employee ID Card Preview')}
                            </h3>
                            <button 
                                onClick={() => setIsIDCardModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-lg p-1"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto max-h-[70vh] flex flex-col md:flex-row items-center justify-center gap-8 bg-slate-50 dark:bg-slate-950/40">
                            {/* FRONT SIDE */}
                            <div id="id-card-front" className="w-[270px] h-[430px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden relative flex flex-col justify-between select-none pb-2">
                                {/* Top curved banner */}
                                <div className="absolute top-0 inset-x-0 h-[92px] bg-[#635bff] flex flex-col items-center justify-center pt-2">
                                    <div className="absolute bottom-0 right-0 left-[-20%] h-1 bg-[#635bff] transform rotate-3 origin-bottom-left"></div>
                                    <div className="text-[14px] font-extrabold text-white tracking-wider uppercase">
                                        Dynime LLC
                                    </div>
                                    <div className="text-[7.5px] font-semibold text-blue-100 tracking-widest uppercase mt-0.5">
                                        Secure Identification
                                    </div>
                                </div>

                                {/* Employee Photo Container */}
                                <div className="mt-[74px] mx-auto z-10">
                                    <div className="w-[90px] h-[90px] rounded-full border-[3px] border-[#635bff] bg-white overflow-hidden shadow-md flex items-center justify-center">
                                        <img 
                                            src={employee.user?.avatar ? getImagePath(employee.user.avatar) : '/default-avatar.png'} 
                                            alt={employee.user?.name || 'Employee'}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.currentTarget.src = '/default-avatar.png'; }}
                                        />
                                    </div>
                                </div>

                                {/* Employee Basic Info */}
                                <div className="text-center mt-1 px-3">
                                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-tight truncate">
                                        {employee.user?.name}
                                    </h4>
                                    <div className="mt-0.5 inline-block px-2.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-[#635bff] text-white tracking-wide">
                                        {employee.designation?.designation_name || 'Staff Member'}
                                    </div>
                                </div>

                                {/* Detailed Columns Grid */}
                                <div className="px-3 mt-1 grid grid-cols-2 gap-x-2 gap-y-1 text-[8px] text-slate-600">
                                    <div className="col-span-2 flex items-center justify-center gap-1.5 bg-[#635bff]/10 p-1.5 rounded border border-[#635bff]/20">
                                        <span className="text-[#635bff] font-bold text-[7px] uppercase">{t('ID')}:</span>
                                        <span className="font-extrabold text-[#635bff]">{employee.employee_id}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 font-bold uppercase block text-[6.5px]">{t('Department')}</span>
                                        <span className="font-semibold block truncate text-slate-800">{employee.department?.department_name || '—'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 font-bold uppercase block text-[6.5px]">{t('Branch')}</span>
                                        <span className="font-semibold block truncate text-slate-800">{employee.branch?.branch_name || '—'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 font-bold uppercase block text-[6.5px]">{t('Birth Date')}</span>
                                        <span className="font-semibold block truncate text-slate-800">{formatDate(employee.date_of_birth)}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 font-bold uppercase block text-[6.5px]">{t('Joined')}</span>
                                        <span className="font-semibold block truncate text-slate-800">{formatDate(employee.date_of_joining)}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 font-bold uppercase block text-[6.5px]">{t('Country')}</span>
                                        <span className="font-semibold block truncate text-slate-800">{employee.work_location_country || 'USA'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 font-bold uppercase block text-[6.5px]">{t('Phone')}</span>
                                        <span className="font-semibold block truncate text-slate-800">{employee.user?.mobile_no || employee.payment_details?.recipient_phone || '—'}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-slate-400 font-bold uppercase block text-[6.5px]">{t('Email')}</span>
                                        <span className="font-semibold block truncate text-slate-800">{employee.user?.email || '—'}</span>
                                    </div>
                                </div>

                                {/* QR Code verification section */}
                                <div className="mt-1 mb-1.5 flex justify-center pb-1">
                                    <div className="p-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                                        <IDCardQRCodeCanvas text={window.location.origin + `/employee/verify/${employee.employee_id}`} />
                                    </div>
                                </div>

                                {/* Subtle footer line */}
                                <div className="h-1 bg-[#635bff] w-full"></div>
                            </div>

                            {/* BACK SIDE */}
                            <div id="id-card-back" className="w-[270px] h-[430px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden relative flex flex-col justify-between p-4 select-none">
                                <div>
                                    {/* Back Header banner */}
                                    <div className="h-[52px] bg-[#635bff] rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
                                        <div className="absolute bottom-0 right-0 left-[-20%] h-0.5 bg-[#635bff] transform rotate-3"></div>
                                        <div className="text-[13px] font-black text-white tracking-wider uppercase">
                                            Dynime LLC
                                        </div>
                                        <div className="text-[6.5px] font-semibold text-blue-100 tracking-widest uppercase mt-0.5">
                                            Security & Access Control
                                        </div>
                                    </div>

                                    {/* Headquarters Section */}
                                    <div className="text-center mt-2.5">
                                        <div className="text-[8.5px] font-bold text-[#635bff] uppercase tracking-wider">
                                            Headquarters
                                        </div>
                                        <div className="text-[7.5px] text-slate-500 mt-0.5 leading-relaxed">
                                            1209 Mountain Road PL NE<br />
                                            Albuquerque, NM 87110, USA
                                        </div>
                                    </div>

                                    {/* Card Guidelines */}
                                    <div className="mt-2.5 px-1">
                                        <div className="text-[8.5px] font-bold text-[#635bff] uppercase tracking-wider text-center">
                                            Card Rules & Guidelines
                                        </div>
                                        <ul className="text-[5.8px] text-slate-400 mt-1 space-y-0.5 list-disc pl-3.5 text-left leading-tight">
                                            <li>This ID card is the property of the company.</li>
                                            <li>It must be worn and displayed at all times while on company premises.</li>
                                            <li>This card is non-transferable and must be used only by the authorized holder.</li>
                                            <li>Loss or theft of this card must be reported to the HR/Admin department immediately.</li>
                                            <li>Do not alter, damage, or duplicate this card.</li>
                                            <li>Return this card to the company upon resignation, termination, or expiry.</li>
                                            <li>If found, please return to the company administration office.</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Footer & Contacts */}
                                <div className="border-t border-slate-100 pt-2 mb-1 space-y-1">
                                    <div className="flex flex-col items-center justify-center text-[7px] text-slate-500 space-y-1">
                                        {/* Contact Grid with Icons */}
                                        <div className="flex items-center gap-1.5 justify-center">
                                            <Mail className="w-2.5 h-2.5 text-[#635bff] shrink-0" />
                                            <span className="font-medium text-slate-600 text-[6.5px]">contact@dynime.com</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 justify-center">
                                            <Phone className="w-2.5 h-2.5 text-[#635bff] shrink-0" />
                                            <span className="font-semibold text-slate-700 text-[6.5px]">+1 (646) 884-0271</span>
                                        </div>
                                        
                                        {/* WhatsApp icon + text */}
                                        <div className="flex items-center gap-1.5 justify-center">
                                            <svg className="w-2.5 h-2.5 fill-current text-[#635bff] shrink-0" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L3 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                                            </svg>
                                            <span className="font-semibold text-slate-700 text-[6.5px]">+1 (646) 884-0271</span>
                                        </div>
                                        <div className="font-bold text-[#635bff] mt-0.5 text-[7px] tracking-wider">www.dynime.com</div>
                                    </div>

                                    {/* Company Seal centered block */}
                                    <div className="mt-2 flex flex-col items-center border-t border-slate-100 pt-2 w-full">
                                        {sealBase64 ? (
                                            <img 
                                                src={sealBase64} 
                                                alt="Dynime Seal" 
                                                className="w-[45px] h-[45px] object-contain mb-1"
                                            />
                                        ) : (
                                            <div className="w-[45px] h-[45px] bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mb-1 text-[7px] text-slate-300">
                                                Seal
                                            </div>
                                        )}
                                        <div className="text-[6px] text-slate-400 font-extrabold uppercase tracking-wider">Official Company Seal</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setIsIDCardModalOpen(false)}
                            >
                                {t('Close')}
                            </Button>
                            <Button 
                                size="sm" 
                                onClick={handlePrintIDCard}
                                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <Printer className="w-4 h-4" />
                                {t('Print / Save PDF')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            <Dialog open={isChangeModalOpen} onOpenChange={setIsChangeModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">{t('Request Payroll Information Change')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleRequestSubmit} className="space-y-4 pt-3 max-h-[75vh] overflow-y-auto px-1">
                        <div>
                            <Label htmlFor="request_method" required>{t('Payment Method')}</Label>
                            <Select value={changeMethod} onValueChange={(val) => {
                                setChangeMethod(val);
                                setChangeDetails({});
                            }}>
                                <SelectTrigger id="request_method">
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
                            
                            {changeMethod && (() => {
                                const feeType = companyAllSetting[`payroll_method_fee_type_${changeMethod}`] || 'percentage';
                                const percentageFee = parseFloat(companyAllSetting[`payroll_method_fee_percentage_${changeMethod}`] || '0') || 0;
                                const fixedFee = parseFloat(companyAllSetting[`payroll_method_fee_fixed_${changeMethod}`] || '0') || 0;
                                const basicSalary = parseFloat(employee.basic_salary || '0') || 0;

                                const feeText = feeType === 'percentage' 
                                    ? `${percentageFee}%` 
                                    : feeType === 'fixed' 
                                        ? `${formatCurrency(fixedFee)}` 
                                        : `${percentageFee}% + ${formatCurrency(fixedFee)}`;

                                const estimatedCharge = feeType === 'percentage'
                                    ? (basicSalary * percentageFee) / 100
                                    : feeType === 'fixed'
                                        ? fixedFee
                                        : ((basicSalary * percentageFee) / 100) + fixedFee;

                                return (
                                    <div className="mt-2 p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm flex flex-col gap-1">
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

                        <div className="border-t pt-4">
                            {changeMethod === 'bank_transfer' && (
                                <div className="space-y-4">
                                    <div>
                                        <Label required>{t('Bank Country')}</Label>
                                        <Select
                                            value={changeDetails?.bank_country || 'Other'}
                                            onValueChange={(val) => handleDetailChange('bank_country', val)}
                                        >
                                            <SelectTrigger>
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
                                        <Label required>{t('Account Holder Name')}</Label>
                                        <Input
                                            value={changeDetails?.account_holder_name || ''}
                                            onChange={(e) => handleDetailChange('account_holder_name', e.target.value)}
                                            placeholder={t('Enter Account Holder Name')}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label required>{t('Bank Name')}</Label>
                                        <Input
                                            value={changeDetails?.bank_name || ''}
                                            onChange={(e) => handleDetailChange('bank_name', e.target.value)}
                                            placeholder={t('Enter Bank Name')}
                                            required
                                        />
                                    </div>

                                    {changeDetails?.bank_country === 'US' ? (
                                        <div className="space-y-4">
                                            <div>
                                                <Label required>{t('Routing Number (ABA)')}</Label>
                                                <Input
                                                    value={changeDetails?.routing_number || ''}
                                                    onChange={(e) => handleDetailChange('routing_number', e.target.value)}
                                                    placeholder="e.g. 021000021"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Label required>{t('Account Number')}</Label>
                                                <Input
                                                    value={changeDetails?.account_number || ''}
                                                    onChange={(e) => handleDetailChange('account_number', e.target.value)}
                                                    placeholder={t('Enter Account Number')}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Label required>{t('Account Type')}</Label>
                                                <Select
                                                    value={changeDetails?.account_type || 'Checking'}
                                                    onValueChange={(val) => handleDetailChange('account_type', val)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={t('Select Account Type')} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Checking">{t('Checking')}</SelectItem>
                                                        <SelectItem value="Savings">{t('Savings')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    ) : changeDetails?.bank_country === 'EU' ? (
                                        <div className="space-y-4">
                                            <div>
                                                <Label required>{t('IBAN')}</Label>
                                                <Input
                                                    value={changeDetails?.iban || ''}
                                                    onChange={(e) => handleDetailChange('iban', e.target.value)}
                                                    placeholder="e.g. DE89370400440532013000"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Label required>{t('BIC / SWIFT')}</Label>
                                                <Input
                                                    value={changeDetails?.bic_swift || ''}
                                                    onChange={(e) => handleDetailChange('bic_swift', e.target.value)}
                                                    placeholder="e.g. DBKADEFFXXX"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    ) : changeDetails?.bank_country === 'UK' ? (
                                        <div className="space-y-4">
                                            <div>
                                                <Label required>{t('Sort Code')}</Label>
                                                <Input
                                                    value={changeDetails?.sort_code || ''}
                                                    onChange={(e) => handleDetailChange('sort_code', e.target.value)}
                                                    placeholder="e.g. 200000"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Label required>{t('Account Number')}</Label>
                                                <Input
                                                    value={changeDetails?.account_number || ''}
                                                    onChange={(e) => handleDetailChange('account_number', e.target.value)}
                                                    placeholder={t('Enter Account Number')}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div>
                                                <Label required>{t('Account Number')}</Label>
                                                <Input
                                                    value={changeDetails?.account_number || ''}
                                                    onChange={(e) => handleDetailChange('account_number', e.target.value)}
                                                    placeholder={t('Enter Account Number')}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Label required>{t('BIC / SWIFT')}</Label>
                                                <Input
                                                    value={changeDetails?.bic_swift || ''}
                                                    onChange={(e) => handleDetailChange('bic_swift', e.target.value)}
                                                    placeholder="e.g. DBKADEFFXXX"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Label>{t('Bank Branch')}</Label>
                                                <Input
                                                    value={changeDetails?.bank_branch || ''}
                                                    onChange={(e) => handleDetailChange('bank_branch', e.target.value)}
                                                    placeholder={t('Enter Bank Branch')}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {changeMethod === 'cards_transfer' && (
                                <div className="space-y-4">
                                    <div>
                                        <Label required>{t('Cardholder Full Name')}</Label>
                                        <Input
                                            value={changeDetails?.card_holder_name || ''}
                                            onChange={(e) => handleDetailChange('card_holder_name', e.target.value)}
                                            placeholder={t('Enter Cardholder Full Name')}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label required>{t('Card Number')}</Label>
                                        <Input
                                            value={changeDetails?.card_number || ''}
                                            onChange={(e) => handleDetailChange('card_number', e.target.value)}
                                            placeholder={t('Enter Card Number')}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label required>{t('Bank Name')}</Label>
                                        <Input
                                            value={changeDetails?.bank_name || ''}
                                            onChange={(e) => handleDetailChange('bank_name', e.target.value)}
                                            placeholder={t('Enter Bank Name')}
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            {changeMethod === 'paypal' && (
                                <div>
                                    <Label required>{t('PayPal Registered Email Address')}</Label>
                                    <Input
                                        type="email"
                                        value={changeDetails?.paypal_email || ''}
                                        onChange={(e) => handleDetailChange('paypal_email', e.target.value)}
                                        placeholder="email@example.com"
                                        required
                                    />
                                </div>
                            )}

                            {changeMethod === 'kast' && (
                                <div>
                                    <Label required>{t('Kast Account ID')}</Label>
                                    <Input
                                        value={changeDetails?.kast_account_id || ''}
                                        onChange={(e) => handleDetailChange('kast_account_id', e.target.value)}
                                        placeholder={t('Enter Kast Account ID')}
                                        required
                                    />
                                </div>
                            )}

                            {changeMethod === 'redotpay' && (
                                <div>
                                    <Label required>{t('Redotpay Pay ID / Wallet Address')}</Label>
                                    <Input
                                        value={changeDetails?.redotpay_wallet_address || ''}
                                        onChange={(e) => handleDetailChange('redotpay_wallet_address', e.target.value)}
                                        placeholder={t('Enter Redotpay ID/Address')}
                                        required
                                    />
                                </div>
                            )}

                            {(changeMethod === 'remitly' || changeMethod === 'western_union') && (
                                <div className="space-y-4">
                                    <div>
                                        <Label required>{t('Recipient Full Name')}</Label>
                                        <Input
                                            value={changeDetails?.recipient_name || ''}
                                            onChange={(e) => handleDetailChange('recipient_name', e.target.value)}
                                            placeholder={t('Enter Recipient Name')}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label required>{t('Recipient Phone Number')}</Label>
                                        <Input
                                            value={changeDetails?.recipient_phone || ''}
                                            onChange={(e) => handleDetailChange('recipient_phone', e.target.value)}
                                            placeholder={t('Enter Recipient Phone Number')}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label required>{t('Recipient Country')}</Label>
                                        <Input
                                            value={changeDetails?.recipient_country || ''}
                                            onChange={(e) => handleDetailChange('recipient_country', e.target.value)}
                                            placeholder={t('Enter Recipient Country')}
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            {changeMethod === 'binance_bybit' && (
                                <div className="space-y-4">
                                    <div>
                                        <Label required>{t('Crypto Network')}</Label>
                                        <Select
                                            value={changeDetails?.crypto_network || 'TRC20'}
                                            onValueChange={(val) => handleDetailChange('crypto_network', val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('Select Network')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="TRC20">{t('TRON (TRC20)')}</SelectItem>
                                                <SelectItem value="ERC20">{t('Ethereum (ERC20)')}</SelectItem>
                                                <SelectItem value="BSC">{t('BNB Smart Chain (BEP20)')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label required>{t('USDT Wallet Address')}</Label>
                                        <Input
                                            value={changeDetails?.wallet_address || ''}
                                            onChange={(e) => handleDetailChange('wallet_address', e.target.value)}
                                            placeholder={t('Enter USDT Address')}
                                            required
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => setIsChangeModalOpen(false)}>
                                {t('Cancel')}
                            </Button>
                            <Button type="submit">
                                {t('Submit Request')}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}