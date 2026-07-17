import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Eye } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import NoRecordsFound from '@/components/no-records-found';

interface RequestItem {
    id: number;
    employee_id: number;
    employee_name: string;
    requested_payment_method: string;
    requested_payment_details: any;
    status: string;
    created_at: string;
}

export default function Index() {
    const { t } = useTranslation();
    const { requests = [] } = usePage<any>().props;
    const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);

    const handleApprove = (id: number) => {
        if (confirm(t('Are you sure you want to approve this payroll change request?'))) {
            router.patch(route('hrm.payroll-requests.approve', id));
        }
    };

    const handleReject = (id: number) => {
        if (confirm(t('Are you sure you want to reject this payroll change request?'))) {
            router.patch(route('hrm.payroll-requests.reject', id));
        }
    };

    const getMethodLabel = (method: string) => {
        const methods: Record<string, string> = {
            bank_transfer: t('Bank Transfer'),
            cards_transfer: t('Cards Transfer'),
            paypal: t('PayPal'),
            kast: t('Kast'),
            redotpay: t('Redotpay'),
            remitly: t('Remitly'),
            western_union: t('Western Union'),
            binance_bybit: t('Binance / Bybit'),
        };
        return methods[method] || method;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-0">{t('Approved')}</Badge>;
            case 'rejected':
                return <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-0">{t('Rejected')}</Badge>;
            default:
                return <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0">{t('Pending')}</Badge>;
        }
    };

    const tableColumns = [
        {
            key: 'employee_name',
            header: t('Employee'),
            render: (row: RequestItem) => <span className="font-semibold text-slate-800">{row.employee_name}</span>,
        },
        {
            key: 'requested_payment_method',
            header: t('Requested Method'),
            render: (row: RequestItem) => <span>{getMethodLabel(row.requested_payment_method)}</span>,
        },
        {
            key: 'created_at',
            header: t('Requested At'),
            render: (row: RequestItem) => <span className="text-slate-500 text-sm">{row.created_at}</span>,
        },
        {
            key: 'status',
            header: t('Status'),
            render: (row: RequestItem) => getStatusBadge(row.status),
        },
        {
            key: 'actions',
            header: t('Actions'),
            render: (row: RequestItem) => (
                <div className="flex gap-2">
                    <TooltipProvider>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedRequest(row)}
                                    className="h-8 w-8 p-0"
                                >
                                    <Eye className="h-4 w-4 text-blue-600" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{t('View Details')}</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {row.status === 'pending' && (
                        <>
                            <TooltipProvider>
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleApprove(row.id)}
                                            className="h-8 w-8 p-0 border-emerald-200 hover:bg-emerald-50"
                                        >
                                            <Check className="h-4 w-4 text-emerald-600" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{t('Approve')}</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleReject(row.id)}
                                            className="h-8 w-8 p-0 border-rose-200 hover:bg-rose-50"
                                        >
                                            <X className="h-4 w-4 text-rose-600" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{t('Reject')}</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </>
                    )}
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('HRM'), url: route('hrm.index') },
                { label: t('Payroll Requests') }
            ]}
            pageTitle={t('Payroll Change Requests')}
        >
            <Head title={t('Payroll Change Requests')} />

            <Card className="shadow-sm">
                <CardContent className="pt-6">
                    {requests.length > 0 ? (
                        <DataTable
                            data={requests}
                            columns={tableColumns}
                            searchKey="employee_name"
                            searchPlaceholder={t('Search by employee...')}
                        />
                    ) : (
                        <NoRecordsFound
                            title={t('No Payroll Requests Found')}
                            description={t('All payroll change requests submitted by employees will appear here.')}
                        />
                    )}
                </CardContent>
            </Card>

            <Dialog open={selectedRequest !== null} onOpenChange={(open) => !open && setSelectedRequest(null)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">{t('Payroll Change Details')}</DialogTitle>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="space-y-4 pt-3">
                            <div className="flex justify-between items-center pb-2 border-b">
                                <span className="text-sm font-semibold text-slate-500">{t('Employee')}</span>
                                <span className="font-bold text-slate-800">{selectedRequest.employee_name}</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b">
                                <span className="text-sm font-semibold text-slate-500">{t('Requested Method')}</span>
                                <span className="font-bold text-primary">{getMethodLabel(selectedRequest.requested_payment_method)}</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b">
                                <span className="text-sm font-semibold text-slate-500">{t('Status')}</span>
                                {getStatusBadge(selectedRequest.status)}
                            </div>

                            <div className="pt-2">
                                <h4 className="font-semibold text-slate-800 mb-2">{t('Payment Details')}</h4>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-sm">
                                    {selectedRequest.requested_payment_details ? (
                                        Object.entries(selectedRequest.requested_payment_details).map(([key, val]: any) => (
                                            <div key={key} className="flex justify-between">
                                                <span className="text-slate-500 capitalize">{key.replace(/_/g, ' ')}:</span>
                                                <span className="font-medium text-slate-800">{val || '-'}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-slate-400 italic">{t('No payment details provided.')}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                                    {t('Close')}
                                </Button>
                                {selectedRequest.status === 'pending' && (
                                    <>
                                        <Button
                                            variant="outline"
                                            className="border-rose-200 text-rose-600 hover:bg-rose-50"
                                            onClick={() => {
                                                handleReject(selectedRequest.id);
                                                setSelectedRequest(null);
                                            }}
                                        >
                                            {t('Reject')}
                                        </Button>
                                        <Button
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                            onClick={() => {
                                                handleApprove(selectedRequest.id);
                                                setSelectedRequest(null);
                                            }}
                                        >
                                            {t('Approve')}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
