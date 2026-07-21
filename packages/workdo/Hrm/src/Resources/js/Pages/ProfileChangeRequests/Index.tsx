import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { 
    UserCheck, CheckCircle2, XCircle, Clock, ChevronRight, 
    User, Check, X, Info 
} from "lucide-react";

interface ProfileChangeRequestsProps {
    changeRequests: any;
}

export default function Index({ changeRequests }: ProfileChangeRequestsProps) {
    const [rejectingId, setRejectingId] = useState<number | null>(null);
    const [adminNotes, setAdminNotes] = useState('');

    const handleApprove = (id: number) => {
        router.put(`/hrm/profile-change-requests/${id}/approve`, {
            admin_notes: 'Approved and applied to database.',
        });
    };

    const handleRejectSubmit = (id: number) => {
        if (!adminNotes.trim()) {
            alert('Please provide a rejection reason.');
            return;
        }

        router.put(`/hrm/profile-change-requests/${id}/reject`, {
            admin_notes: adminNotes,
        }, {
            onSuccess: () => {
                setRejectingId(null);
                setAdminNotes('');
            }
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approved & Updated
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5" /> Rejected
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3.5 h-3.5" /> Pending Approval
                    </span>
                );
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Employee Profile Change Approval Queue" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                            <UserCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-900">Profile Change Approval Queue</h1>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                Review employee profile verification edits. Changes will update database only when approved.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Change Requests Queue List */}
                <div className="space-y-4">
                    {changeRequests?.data?.length === 0 ? (
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-slate-400 font-medium text-xs">
                            No profile change requests in queue.
                        </div>
                    ) : (
                        changeRequests?.data?.map((req: any) => {
                            const diffs = req.requested_changes || {};
                            return (
                                <div key={req.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                                    {/* Request Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-extrabold text-sm">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-extrabold text-slate-900 text-sm">
                                                    {req.employee?.user?.name || req.employee?.name || 'Employee'}
                                                </h3>
                                                <p className="text-xs text-slate-400 font-medium">
                                                    Employee ID: #{req.employee?.id} · Submitted {new Date(req.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {getStatusBadge(req.status)}
                                            {req.status === 'pending' && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleApprove(req.id)}
                                                        className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-md shadow-emerald-500/20 transition-all"
                                                    >
                                                        <Check className="w-3.5 h-3.5" /> Approve & Update DB
                                                    </button>
                                                    <button
                                                        onClick={() => setRejectingId(req.id)}
                                                        className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all"
                                                    >
                                                        <X className="w-3.5 h-3.5" /> Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Diff View */}
                                    <div>
                                        <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <Info className="w-3.5 h-3.5 text-indigo-500" /> Requested Field Changes (Diff View)
                                        </h4>
                                        <div className="divide-y divide-slate-100 bg-slate-50/70 border border-slate-200/80 rounded-xl overflow-hidden">
                                            {Object.entries(diffs).map(([field, diff]: [string, any]) => (
                                                <div key={field} className="p-3 text-xs flex justify-between items-center">
                                                    <span className="font-bold text-slate-900 uppercase">{field.replace('_', ' ')}</span>
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-right">
                                                            <span className="text-[10px] font-semibold text-slate-400 block uppercase">Original</span>
                                                            <span className="line-through text-slate-500 font-medium">{diff.old || '(empty)'}</span>
                                                        </div>
                                                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                                                        <div className="text-left">
                                                            <span className="text-[10px] font-semibold text-indigo-500 block uppercase">Requested New</span>
                                                            <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">{diff.new}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {req.admin_notes && (
                                        <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium">
                                            <span className="font-bold text-slate-700">Admin Notes:</span> {req.admin_notes}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Reject Reason Modal */}
                {rejectingId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 border border-slate-100">
                            <h3 className="font-extrabold text-slate-900 text-sm mb-2">Reject Profile Changes</h3>
                            <textarea
                                rows={3}
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="Enter reason for rejection..."
                                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium mb-3"
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setRejectingId(null)}
                                    className="px-3 py-1.5 font-bold text-slate-600 text-xs hover:bg-slate-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleRejectSubmit(rejectingId)}
                                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg"
                                >
                                    Confirm Reject
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
