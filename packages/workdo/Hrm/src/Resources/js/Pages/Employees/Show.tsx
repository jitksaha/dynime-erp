import { Head, usePage, router } from "@inertiajs/react";
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2, FileText, ExternalLink, Copy, Check, PenTool, Mail, Phone, MapPin, Calendar, Briefcase, User, Flag } from 'lucide-react';
import { formatDate, getImagePath, getCurrencySymbol, formatCurrency } from '@/utils/helpers';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect, useRef } from 'react';
import { getDocumentName } from '../DocumentBuilder/Index';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { EmployeeProfileInspectionWizard } from '../../Components/EmployeeProfileInspectionWizard';

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

    const [copiedDocId, setCopiedDocId] = useState<number | null>(null);
    const [isIDCardModalOpen, setIsIDCardModalOpen] = useState(false);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [sealBase64, setSealBase64] = useState<string>('');

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

    const handleCopySignLink = (id: number) => {
        const signUrl = window.location.origin + '/hrm/document-builder/sign/' + id;
        navigator.clipboard.writeText(signUrl).then(() => {
            setCopiedDocId(id);
            setTimeout(() => setCopiedDocId(null), 2000);
        });
    };

    const handleDownloadIDCard = async () => {
        try {
            const verifyUrl = window.location.origin + `/employee/verify/${employee.employee_id}`;
            const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 150 });

            // Initialize jsPDF (CR80 vertical ID Card size: 54mm width, 86mm height)
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [54, 86]
            });

            // ------------------ FRONT SIDE ------------------
            // Background
            doc.setFillColor(250, 250, 252);
            doc.rect(0, 0, 54, 86, 'F');

            // Header Banner - Brand Violet (#635bff)
            doc.setFillColor(99, 91, 255);
            doc.rect(0, 0, 54, 22, 'F');

            // Light Blue / Cyan Accent Stripe (#635bff)
            doc.setFillColor(99, 91, 255);
            doc.triangle(0, 22, 54, 22, 54, 20.2, 'F');

            // Header Text (Company Name & Tagline)
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(255, 255, 255);
            doc.text('DYNIME LLC', 27, 10, { align: 'center' });
            
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(5);
            doc.setTextColor(186, 230, 253); // light sky blue text
            doc.text('SECURE IDENTIFICATION', 27, 14, { align: 'center' });

            // Fetch Avatar from Backend Base64 Route without CORS issues
            let base64Avatar = '';
            try {
                const response = await axios.get(route('hrm.employees.avatar-base64', employee.id));
                base64Avatar = response.data.base64;
            } catch (e) {
                console.error('Failed to fetch avatar from base64 endpoint', e);
            }

            let circularAvatar = '';
            if (base64Avatar) {
                try {
                    circularAvatar = await getCroppedCircularImage(base64Avatar);
                } catch (err) {
                    console.error('Failed to crop avatar to circle', err);
                    circularAvatar = base64Avatar;
                }
            }

            // Draw Photo Circle Container (with Brand Violet border)
            if (circularAvatar) {
                doc.setFillColor(255, 255, 255);
                doc.circle(27, 31, 9, 'F');
                doc.addImage(circularAvatar, 'PNG', 18, 22, 18, 18);
                doc.setDrawColor(99, 91, 255); // #635bff
                doc.setLineWidth(0.6);
                doc.circle(27, 31, 9, 'S');
            } else {
                // Fallback colored circle with initials
                doc.setFillColor(240, 239, 255);
                doc.circle(27, 31, 9, 'F');
                doc.setDrawColor(99, 91, 255); // #635bff
                doc.setLineWidth(0.6);
                doc.circle(27, 31, 9, 'S');

                const initials = (employee.user?.name || '')
                    .split(' ')
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();
                
                doc.setFont('Helvetica', 'bold');
                doc.setFontSize(8.5);
                doc.setTextColor(99, 91, 255);
                doc.text(initials, 27, 34, { align: 'center' });
            }

            // Employee Name
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(9.5);
            doc.setTextColor(15, 23, 42); // slate-900
            const nameText = employee.user?.name || 'Employee';
            const displayName = nameText.length > 18 ? nameText.substring(0, 16) + '..' : nameText;
            doc.text(displayName.toUpperCase(), 27, 43, { align: 'center' });

            // Designation Badge (Brand Violet theme with white text)
            doc.setFillColor(99, 91, 255); // #635bff
            doc.rect(13, 45.5, 28, 4, 'F');
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(6);
            doc.setTextColor(255, 255, 255); // white text
            const jobTitle = employee.designation?.designation_name || 'Staff Member';
            const displayTitle = jobTitle.length > 22 ? jobTitle.substring(0, 20) + '..' : jobTitle;
            doc.text(displayTitle.toUpperCase(), 27, 48.5, { align: 'center' });

            // Details Grid
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(5);
            
            // Centered EMP ID Highlight spanning the columns
            doc.setFillColor(240, 239, 255); // bg-[#635bff]/10
            doc.rect(4, 51.5, 46, 4.5, 'F');
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(6);
            doc.setTextColor(99, 91, 255);
            doc.text('ID: ' + (employee.employee_id || ''), 27, 54.7, { align: 'center' });

            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(5);
            doc.setTextColor(100, 116, 139);
            doc.text('JOINED: ' + formatDate(employee.date_of_joining), 4, 59.5);
            doc.text('BIRTH: ' + formatDate(employee.date_of_birth), 4, 63.5);
            doc.text('COUNTRY: ' + (employee.work_location_country || 'USA'), 4, 67.5);

            // Right Column
            doc.text('DEPT: ' + (employee.department?.department_name || '—'), 28, 59.5);
            doc.text('BRANCH: ' + (employee.branch?.branch_name || '—'), 28, 63.5);
            doc.text('MAIL: ' + (employee.user?.email || '—'), 28, 67.5);
            const empPhone = employee.user?.mobile_no || employee.payment_details?.recipient_phone || '—';
            doc.text('PHONE: ' + empPhone, 4, 71.5);

            // Verification QR Code - with a clean 3mm bottom padding/margin
            doc.addImage(qrDataUrl, 'PNG', 38, 71, 12, 12);
            doc.setDrawColor(99, 91, 255);
            doc.setLineWidth(0.3);
            doc.rect(38, 71, 12, 12, 'S');

            // ------------------ BACK SIDE ------------------
            doc.addPage([54, 86], 'portrait');

            // Background
            doc.setFillColor(250, 250, 252);
            doc.rect(0, 0, 54, 86, 'F');

            // Header Banner - Brand Violet (#635bff)
            doc.setFillColor(99, 91, 255);
            doc.rect(0, 0, 54, 15, 'F');

            // Accent Stripe - Brand Violet (#635bff)
            doc.setFillColor(99, 91, 255);
            doc.triangle(0, 15, 54, 15, 54, 13.5, 'F');

            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(255, 255, 255);
            doc.text('DYNIME LLC', 27, 7.5, { align: 'center' });
            
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(5);
            doc.setTextColor(186, 230, 253);
            doc.text('SECURITY & ACCESS CONTROL', 27, 11.5, { align: 'center' });

            // Headquarters
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(6.5);
            doc.setTextColor(99, 91, 255);
            doc.text('HEADQUARTERS', 27, 21, { align: 'center' });

            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(5.2);
            doc.setTextColor(71, 85, 105);
            doc.text('1209 Mountain Road PL NE', 27, 24.5, { align: 'center' });
            doc.text('Albuquerque, NM 87110, USA', 27, 27.5, { align: 'center' });

            // Guidelines
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(6.5);
            doc.setTextColor(99, 91, 255);
            doc.text('CARD RULES & GUIDELINES', 27, 33.5, { align: 'center' });

            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(3.8);
            doc.setTextColor(100, 116, 139);
            
            const rules = [
                'This ID card is the property of the company.',
                'Must be worn and displayed at all times on premises.',
                'Non-transferable; for authorized holder only.',
                'Report loss or theft to HR immediately.',
                'Do not alter, damage, or duplicate this card.',
                'Return upon resignation or termination.',
                'If found, return to HR/Admin office.'
            ];
            
            let ruleY = 37.5;
            rules.forEach(rule => {
                doc.text('•  ' + rule, 6, ruleY);
                ruleY += 2.2;
            });

            // Contact info
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(4.5);
            doc.setTextColor(71, 85, 105);
            doc.text('Email: contact@dynime.com', 27, 54, { align: 'center' });
            doc.text('Phone: +1 (646) 884-0271', 27, 57, { align: 'center' });
            
            // WhatsApp contact
            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(71, 85, 105);
            doc.text('WhatsApp: +1 (646) 884-0271', 27, 60.5, { align: 'center' });
            
            doc.setTextColor(99, 91, 255);
            doc.text('www.dynime.com', 27, 64, { align: 'center' });

            // Line separator
            doc.setDrawColor(226, 232, 240); // slate-200
            doc.setLineWidth(0.3);
            doc.line(12, 66.5, 42, 66.5);

            // Fetch and draw official Company Seal
            let activeSealBase64 = sealBase64;
            if (!activeSealBase64) {
                try {
                    const response = await axios.get(route('hrm.employees.seal-base64'));
                    activeSealBase64 = response.data.base64;
                } catch (e) {
                    console.error('Failed to load seal dynamically in download handler', e);
                }
            }

            if (activeSealBase64) {
                doc.addImage(activeSealBase64, 'PNG', 21.5, 68, 11, 11);
            }

            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(4.5);
            doc.setTextColor(100, 116, 139);
            doc.text('OFFICIAL COMPANY SEAL', 27, 81.5, { align: 'center' });

            doc.save(`employee-id-${employee.employee_id}.pdf`);
        } catch (error) {
            console.error('Failed to generate ID Card PDF', error);
        }
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
                            <h3 className="text-xl font-semibold mb-2">{employee.user?.name}</h3>
                            <p className="text-muted-foreground mb-4">{employee.user?.email}</p>
                            
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
                                        <button 
                                            onClick={() => setIsWizardOpen(true)}
                                            className="mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-md text-xs font-bold hover:bg-slate-800 transition shadow-sm w-full"
                                        >
                                            <PenTool className="w-3.5 h-3.5 text-indigo-400" />
                                            {t('Verify & Inspect Profile (Wizard)')}
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

                {/* Right Content - Tabs */}
                <div className="lg:col-span-3">
                    <Card className="shadow-sm">
                        <CardContent className="p-6">
                            <Tabs defaultValue="employment" className="w-full">
                                <TabsList className="grid w-full grid-cols-5">
                                    <TabsTrigger value="employment">{t('Employment')}</TabsTrigger>
                                    <TabsTrigger value="contact">{t('Contact')}</TabsTrigger>
                                    <TabsTrigger value="payroll">{t('Payroll')}</TabsTrigger>
                                    <TabsTrigger value="hours">{t('Hours & Rates')}</TabsTrigger>
                                    <TabsTrigger value="documents">{t('Documents')}</TabsTrigger>
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
                                    </div>
                                </TabsContent>

                                <TabsContent value="payroll" className="space-y-6 mt-6">
                                    <div className="bg-slate-50/50 p-4 border border-dashed rounded-xl mb-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('Payment Method')}</p>
                                                <h4 className="text-base font-semibold text-slate-900 mt-0.5">
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
                                        {employee.payment_method && (() => {
                                            const feeType = companyAllSetting[`payroll_method_fee_type_${employee.payment_method}`] || 'percentage';
                                            const percentageFee = parseFloat(companyAllSetting[`payroll_method_fee_percentage_${employee.payment_method}`] || '0') || 0;
                                            const fixedFee = parseFloat(companyAllSetting[`payroll_method_fee_fixed_${employee.payment_method}`] || '0') || 0;
                                            const basicSalary = parseFloat(employee.basic_salary || '0') || 0;

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
                                                <div className="mt-3 p-3 bg-white/60 border border-slate-100 rounded-lg text-xs flex flex-col gap-1 max-w-sm">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-slate-500 font-medium">{t('Transaction Fee')}:</span>
                                                        <span className="font-semibold text-slate-800">{feeText}</span>
                                                    </div>
                                                    {basicSalary > 0 && (
                                                        <div className="flex justify-between items-center border-t border-slate-100 pt-1 mt-1">
                                                            <span className="text-slate-500 font-medium">{t('Estimated Charge')}:</span>
                                                            <span className="font-bold text-primary">{formatCurrency(estimatedCharge)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
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
                            </Tabs>
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
                            <div className="w-[270px] h-[430px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden relative flex flex-col justify-between select-none pb-2">
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
                            <div className="w-[270px] h-[430px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden relative flex flex-col justify-between p-4 select-none">
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
                                onClick={handleDownloadIDCard}
                                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <FileText className="w-4 h-4" />
                                {t('Download PDF')}
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

            {/* Profile Inspection Step-by-Step Wizard */}
            <EmployeeProfileInspectionWizard
                employee={employee}
                isOpen={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
            />
        </AuthenticatedLayout>
    );
}