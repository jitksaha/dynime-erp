import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Check, X, ShieldAlert, User, Calendar, Phone, Building2, Inbox } from "lucide-react";
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

export default function Index() {
    const { t } = useTranslation();
    const { requests } = usePage<any>().props;

    const [isApproveOpen, setIsApproveOpen] = useState(false);
    const [isRejectOpen, setIsRejectOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<UserRequest | null>(null);

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
                toast.success(t('User request approved successfully.'));
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

    const formatQuestions = (request: UserRequest) => {
        const q = request.questions || {};
        if (request.role === 'staff') {
            return (
                <div className="text-xs space-y-1 text-slate-600">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span><strong>{t('DOB')}:</strong> {q.date_of_birth || '-'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span><strong>{t('Gender')}:</strong> {q.gender || '-'}</span>
                    </div>
                </div>
            );
        } else if (request.role === 'client') {
            return (
                <div className="text-xs space-y-1 text-slate-600">
                    <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span><strong>{t('Business')}:</strong> {q.business_name || '-'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span><strong>{t('Phone')}:</strong> {q.phone || '-'}</span>
                    </div>
                </div>
            );
        }
        return '-';
    };

    const tableColumns = [
        {
            key: 'name',
            header: t('Name'),
            render: (value: string, row: UserRequest) => (
                <div>
                    <div className="font-semibold text-slate-800">{row.name}</div>
                    <div className="text-xs text-slate-500">{row.email}</div>
                </div>
            )
        },
        {
            key: 'role',
            header: t('Role Applied'),
            render: (value: string) => (
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    value === 'staff' 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                }`}>
                    {value === 'staff' ? t('Employee / Staff') : t('Client / Customer')}
                </span>
            )
        },
        {
            key: 'questions',
            header: t('Answers / Details'),
            render: (value: any, row: UserRequest) => formatQuestions(row)
        },
        {
            key: 'created_at',
            header: t('Applied Date'),
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
                        className="bg-green-600 hover:bg-green-700 text-white gap-1"
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
                { label: t('User Requests') }
            ]}
            pageTitle={t('User Registration Requests')}
        >
            <Head title={t('User Requests')} />

            <Card className="shadow-sm border-slate-100">
                <CardHeader className="border-b pb-5 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-slate-800">
                            <ShieldAlert className="w-5 h-5 text-primary" />
                            {t('Pending User Requests')}
                        </CardTitle>
                        <p className="text-sm text-slate-500 mt-1">
                            {t('Review and approve or reject prospective employees and clients applying to join your company.')}
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
                        <NoRecordsFound icon={Inbox} title={t('No pending user requests found')} />
                    )}
                </CardContent>
            </Card>

            {/* Approval Confirmation Dialog */}
            <ConfirmationDialog
                open={isApproveOpen}
                onOpenChange={setIsApproveOpen}
                title={t('Approve User Request')}
                message={t('Are you sure you want to approve this request? This will create a user account and assign them the respective role in your workspace.')}
                onConfirm={confirmApprove}
                confirmText={t('Approve')}
                cancelText={t('Cancel')}
            />

            {/* Rejection Confirmation Dialog */}
            <ConfirmationDialog
                open={isRejectOpen}
                onOpenChange={setIsRejectOpen}
                title={t('Reject User Request')}
                message={t('Are you sure you want to reject this user request? This will deny them access to your workspace.')}
                onConfirm={confirmReject}
                confirmText={t('Reject')}
                cancelText={t('Cancel')}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
