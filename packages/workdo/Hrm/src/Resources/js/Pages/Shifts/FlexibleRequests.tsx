import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, Zap, UserCheck, ShieldAlert } from "lucide-react";
import NoRecordsFound from '@/components/no-records-found';

interface RequestItem {
    id: number;
    employee_id: number;
    user_id: number;
    status: 'pending' | 'approved' | 'rejected';
    reason: string | null;
    created_at: string;
    reviewed_at: string | null;
    employee?: {
        id: number;
        employee_id: string;
        user?: {
            name: string;
            email: string;
            avatar: string | null;
        };
        department?: {
            name: string;
        };
        designation?: {
            name: string;
        };
    };
    reviewer?: {
        name: string;
    };
}

interface FlexibleRequestsProps {
    requests: RequestItem[];
    [key: string]: any;
}

export default function FlexibleRequests() {
    const { t } = useTranslation();
    const { requests } = usePage<FlexibleRequestsProps>().props;

    const [processingId, setProcessingId] = useState<number | null>(null);

    const handleApprove = (id: number) => {
        setProcessingId(id);
        router.put(`/hrm/flexible-shift/requests/${id}/approve`, {}, {
            preserveScroll: true,
            onFinish: () => setProcessingId(null),
        });
    };

    const handleReject = (id: number) => {
        setProcessingId(id);
        router.put(`/hrm/flexible-shift/requests/${id}/reject`, {}, {
            preserveScroll: true,
            onFinish: () => setProcessingId(null),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold leading-tight text-slate-800 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-amber-500 fill-amber-400" />
                            {t('Flexible Shift Requests')}
                        </h2>
                        <p className="text-xs text-slate-500">
                            {t('Review and approve employee access to Flexible Working Shifts')}
                        </p>
                    </div>
                </div>
            }
        >
            <Head title={t('Flexible Shift Requests')} />

            <div className="py-6 space-y-6">
                <Card className="border-slate-200 shadow-sm rounded-2xl">
                    <CardContent className="p-6">
                        {requests && requests.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase tracking-wider">
                                            <th className="py-3 px-4">{t('Employee')}</th>
                                            <th className="py-3 px-4">{t('Department / Role')}</th>
                                            <th className="py-3 px-4">{t('Reason / Notes')}</th>
                                            <th className="py-3 px-4">{t('Requested At')}</th>
                                            <th className="py-3 px-4">{t('Status')}</th>
                                            <th className="py-3 px-4 text-right">{t('Action')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {requests.map((item) => {
                                            const empName = item.employee?.user?.name || item.employee?.employee_id || `Employee #${item.employee_id}`;
                                            const dept = item.employee?.department?.name || '--';
                                            const desig = item.employee?.designation?.name || '--';
                                            const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '--';

                                            return (
                                                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="py-3 px-4 font-bold text-slate-800">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-black text-xs border border-amber-200">
                                                                {empName.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-slate-900">{empName}</div>
                                                                <div className="text-[10px] text-slate-400 font-normal">{item.employee?.user?.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="font-semibold text-slate-700">{dept}</div>
                                                        <div className="text-[10px] text-slate-400">{desig}</div>
                                                    </td>
                                                    <td className="py-3 px-4 max-w-xs">
                                                        <span className="text-slate-600 italic">
                                                            {item.reason || t('No specific reason provided.')}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                                                        {dateStr}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {item.status === 'pending' && (
                                                            <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold text-[10px] px-2.5 py-0.5">
                                                                <Clock className="w-3 h-3 mr-1 animate-spin" />
                                                                {t('Pending Review')}
                                                            </Badge>
                                                        )}
                                                        {item.status === 'approved' && (
                                                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-[10px] px-2.5 py-0.5">
                                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                                {t('Approved')}
                                                            </Badge>
                                                        )}
                                                        {item.status === 'rejected' && (
                                                            <Badge className="bg-rose-100 text-rose-800 border-rose-300 font-bold text-[10px] px-2.5 py-0.5">
                                                                <XCircle className="w-3 h-3 mr-1" />
                                                                {t('Rejected')}
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        {item.status === 'pending' ? (
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handleApprove(item.id)}
                                                                    disabled={processingId === item.id}
                                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1 rounded-lg h-7"
                                                                >
                                                                    <UserCheck className="w-3.5 h-3.5 mr-1" />
                                                                    {t('Approve')}
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleReject(item.id)}
                                                                    disabled={processingId === item.id}
                                                                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 text-xs font-bold px-3 py-1 rounded-lg h-7"
                                                                >
                                                                    <XCircle className="w-3.5 h-3.5 mr-1" />
                                                                    {t('Reject')}
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[11px] text-slate-400 font-medium">
                                                                {t('Reviewed by')} {item.reviewer?.name || 'HR/Company'}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <NoRecordsFound
                                icon={Zap}
                                title={t('No Flexible Shift Requests')}
                                description={t('When employees request flexible shift permission, their applications will appear here.')}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
