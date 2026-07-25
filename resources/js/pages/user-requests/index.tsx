import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Check, X, ShieldAlert, User, Calendar, Phone, Building2, Inbox, Key, Copy, Plus, Sparkles, MapPin, CreditCard, ShieldCheck } from "lucide-react";
import NoRecordsFound from '@/components/no-records-found';
import { Pagination } from "@/components/ui/pagination";
import { toast } from 'sonner';

interface UserRequest {
    id: number;
    name: string;
    email: string;
    role: string;
    questions: Record<string, any>;
    status: string;
    created_at: string;
}

interface InvitationCode {
    id: number;
    code: string;
    role: string;
    is_used: boolean;
    used_by_email?: string;
    created_at: string;
}

export default function Index() {
    const { t } = useTranslation();
    const { requests, invitationCodes = [] } = usePage<any>().props;

    const [isApproveOpen, setIsApproveOpen] = useState(false);
    const [isRejectOpen, setIsRejectOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<UserRequest | null>(null);
    const [detailModalRequest, setDetailModalRequest] = useState<UserRequest | null>(null);

    const [selectedGenRole, setSelectedGenRole] = useState('staff');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateCode = () => {
        setIsGenerating(true);
        router.post(route('user-requests.generate-invite'), { role: selectedGenRole }, {
            onSuccess: () => {
                toast.success(t('New invitation code generated!'));
                setIsGenerating(false);
            },
            onError: () => {
                toast.error(t('Failed to generate invitation code.'));
                setIsGenerating(false);
            }
        });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success(t('Code copied to clipboard!') + `: ${text}`);
    };

    const handleApprove = (request: UserRequest) => {
        setSelectedRequest(request);
        setIsApproveOpen(true);
    };

    const handleReject = (request: UserRequest) => {
        setSelectedRequest(request);
        setIsRejectOpen(true);
    };

    const confirmApprove = () => {
        if (!selectedRequest) return;
        router.post(route('user-requests.approve', selectedRequest.id), {}, {
            onSuccess: () => {
                toast.success(t('User request approved successfully. Employee profile created.'));
                setIsApproveOpen(false);
                setSelectedRequest(null);
            },
            onError: (errors) => {
                toast.error(errors.error || t('Failed to approve request.'));
            }
        });
    };

    const confirmReject = () => {
        if (!selectedRequest) return;
        router.post(route('user-requests.reject', selectedRequest.id), {}, {
            onSuccess: () => {
                toast.success(t('User request rejected successfully.'));
                setIsRejectOpen(false);
                setSelectedRequest(null);
            },
            onError: (errors) => {
                toast.error(errors.error || t('Failed to reject request.'));
            }
        });
    };

    const tableColumns = [
        {
            key: 'name',
            header: t('Name & Email'),
            render: (value: string, row: UserRequest) => (
                <div>
                    <div className="font-bold text-slate-900 dark:text-white">{row.name}</div>
                    <div className="text-xs text-slate-500">{row.email}</div>
                </div>
            )
        },
        {
            key: 'role',
            header: t('Applied Role'),
            render: (value: string) => (
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    value === 'staff' || value === 'hr'
                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300' 
                        : value === 'client'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                        : 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300'
                }`}>
                    {value}
                </span>
            )
        },
        {
            key: 'questions',
            header: t('Onboarding Details'),
            render: (value: any, row: UserRequest) => (
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setDetailModalRequest(row)}
                    className="text-xs gap-1.5"
                >
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    {t('View Full Onboarding Profile')}
                </Button>
            )
        },
        {
            key: 'created_at',
            header: t('Submitted Date'),
            render: (value: string) => new Date(value).toLocaleDateString()
        },
        {
            key: 'actions',
            header: t('Actions'),
            render: (value: any, row: UserRequest) => (
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        onClick={() => handleApprove(row)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                    >
                        <Check className="w-3.5 h-3.5" />
                        {t('Approve')}
                    </Button>
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(row)}
                        className="gap-1"
                    >
                        <X className="w-3.5 h-3.5" />
                        {t('Reject')}
                    </Button>
                </div>
            )
        }
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('User Management') },
                { label: t('User Requests & Invite Codes') }
            ]}
            pageTitle={t('User Onboarding & Invitation Codes')}
        >
            <Head title={t('User Requests & Invite Codes')} />

            <div className="space-y-6">
                {/* 1. Invitation Code Generator Section */}
                <Card className="shadow-sm border-indigo-100 dark:border-slate-800 bg-gradient-to-r from-indigo-50/50 via-white to-purple-50/30 dark:from-slate-900 dark:to-slate-800">
                    <CardHeader className="border-b pb-4 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-indigo-600 text-white">
                                <Key className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                                    {t('Registration Invite Code Generator')}
                                </CardTitle>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {t('Generate unique one-time invitation codes for candidates, clients, or vendors to complete onboarding.')}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Select value={selectedGenRole} onValueChange={setSelectedGenRole}>
                                <SelectTrigger className="w-[180px] h-9 text-xs bg-white dark:bg-slate-800">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="staff">{t('Staff / Employee')}</SelectItem>
                                    <SelectItem value="hr">{t('HR Manager')}</SelectItem>
                                    <SelectItem value="client">{t('Client')}</SelectItem>
                                    <SelectItem value="vendor">{t('Vendor')}</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button 
                                onClick={handleGenerateCode} 
                                disabled={isGenerating}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 h-9"
                            >
                                <Plus className="w-4 h-4" />
                                {t('Generate New Code')}
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                            {invitationCodes && invitationCodes.length > 0 ? (
                                invitationCodes.map((inv: InvitationCode) => (
                                    <div 
                                        key={inv.id}
                                        className={`p-2.5 rounded-xl border flex flex-col justify-between space-y-1.5 ${
                                            inv.is_used 
                                                ? 'bg-gray-100/60 dark:bg-slate-800/40 border-gray-200 dark:border-slate-700 opacity-60' 
                                                : 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-900 shadow-sm'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                                                {inv.role}
                                            </span>
                                            {inv.is_used ? (
                                                <span className="text-[9px] font-semibold text-gray-500">{t('Used')}</span>
                                            ) : (
                                                <button 
                                                    onClick={() => copyToClipboard(inv.code)} 
                                                    className="text-gray-400 hover:text-indigo-600 transition-colors"
                                                    title={t('Copy code')}
                                                >
                                                    <Copy className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="font-mono font-bold text-sm tracking-wider text-slate-900 dark:text-white">
                                            {inv.code}
                                        </div>

                                        {inv.is_used && inv.used_by_email && (
                                            <div className="text-[9px] text-slate-500 truncate" title={inv.used_by_email}>
                                                {inv.used_by_email}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-xs text-slate-500 py-2 text-center">
                                    {t('No invitation codes generated yet. Click "Generate New Code" above.')}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Pending Onboarding Requests Section */}
                <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                    <CardHeader className="border-b pb-4 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                                <ShieldAlert className="w-5 h-5 text-indigo-600" />
                                {t('Pending Onboarding Requests')}
                            </CardTitle>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {t('Review complete onboarding profiles submitted by applicants using invitation codes before approving account creation.')}
                            </p>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-6">
                        {requests && requests.data && requests.data.length > 0 ? (
                            <>
                                <DataTable
                                    columns={tableColumns}
                                    data={requests.data}
                                />
                                <div className="mt-4">
                                    <Pagination data={requests} routeName="user-requests.index" />
                                </div>
                            </>
                        ) : (
                            <NoRecordsFound icon={Inbox} title={t('No pending user onboarding requests found')} />
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Complete Profile Detail View Modal */}
            {detailModalRequest && (
                <Dialog open={!!detailModalRequest} onOpenChange={() => setDetailModalRequest(null)}>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                                {t('Complete Onboarding Profile')} - {detailModalRequest.name}
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                {t('Role')}: <strong className="uppercase">{detailModalRequest.role}</strong> | {t('Email')}: {detailModalRequest.email}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 pt-2 text-xs">
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-2">
                                <span className="font-bold text-indigo-600 block">{t('Personal & Work Details')}</span>
                                <div className="grid grid-cols-2 gap-2">
                                    <div><strong>{t('DOB')}:</strong> {detailModalRequest.questions?.date_of_birth || '-'}</div>
                                    <div><strong>{t('Gender')}:</strong> {detailModalRequest.questions?.gender || '-'}</div>
                                    <div><strong>{t('Phone')}:</strong> {detailModalRequest.questions?.phone || '-'}</div>
                                    <div><strong>{t('Department')}:</strong> {detailModalRequest.questions?.department || '-'}</div>
                                </div>
                            </div>

                            {detailModalRequest.questions?.business_name && (
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-2">
                                    <span className="font-bold text-indigo-600 block">{t('Business Information')}</span>
                                    <div><strong>{t('Business Name')}:</strong> {detailModalRequest.questions.business_name}</div>
                                    {detailModalRequest.questions.trade_license && (
                                        <div><strong>{t('Trade License / Tax ID')}:</strong> {detailModalRequest.questions.trade_license}</div>
                                    )}
                                    {detailModalRequest.questions.billing_address && (
                                        <div><strong>{t('Billing Address')}:</strong> {detailModalRequest.questions.billing_address}</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* Approval Confirmation Dialog */}
            <ConfirmationDialog
                open={isApproveOpen}
                onOpenChange={setIsApproveOpen}
                title={t('Approve Onboarding Request')}
                message={t('Are you sure you want to approve this candidate? This will automatically create the user account and populate their complete Employee profile in HRM.')}
                onConfirm={confirmApprove}
                confirmText={t('Approve & Create Employee')}
                cancelText={t('Cancel')}
            />

            {/* Rejection Confirmation Dialog */}
            <ConfirmationDialog
                open={isRejectOpen}
                onOpenChange={setIsRejectOpen}
                title={t('Reject User Request')}
                message={t('Are you sure you want to reject this request?')}
                onConfirm={confirmReject}
                confirmText={t('Reject')}
                cancelText={t('Cancel')}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
