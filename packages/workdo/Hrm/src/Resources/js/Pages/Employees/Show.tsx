import { Head, usePage, router } from "@inertiajs/react";
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2, FileText, ExternalLink, Copy, Check, PenTool } from 'lucide-react';
import { formatDate, getImagePath, getCurrencySymbol } from '@/utils/helpers';
import { useState } from 'react';
import { getDocumentName } from '../DocumentBuilder/Index';

export default function Show() {
    const { employee, documents, issuedDocuments } = usePage<any>().props;
    const { t } = useTranslation();
    const [copiedDocId, setCopiedDocId] = useState<number | null>(null);

    const handleCopySignLink = (id: number) => {
        const signUrl = window.location.origin + '/hrm/document-builder/sign/' + id;
        navigator.clipboard.writeText(signUrl).then(() => {
            setCopiedDocId(id);
            setTimeout(() => setCopiedDocId(null), 2000);
        });
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
                                    <div className="mt-1 text-xs">
                                        <a 
                                            href={window.location.origin + `/employee/verify/${employee.employee_id}`} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            className="text-blue-600 hover:text-blue-700 underline font-medium"
                                        >
                                            {t('Public Verification Link')}
                                        </a>
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
                                        </div>
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
        </AuthenticatedLayout>
    );
}