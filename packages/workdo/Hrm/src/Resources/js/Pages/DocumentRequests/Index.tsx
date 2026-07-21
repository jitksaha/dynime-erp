import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { 
    FileText, Plus, CheckCircle2, XCircle, Clock, PenTool, 
    User, AlertCircle, Check, X 
} from "lucide-react";
import { SignaturePadModal } from '../../Components/SignaturePadModal';

interface DocumentRequestsProps {
    documentRequests: any;
    currentEmployee: any;
    documentTypes: string[];
}

export default function Index({ documentRequests, currentEmployee, documentTypes }: DocumentRequestsProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isSignatureOpen, setIsSignatureOpen] = useState(false);
    const [selectedDocType, setSelectedDocType] = useState(documentTypes[0] || 'Experience Certificate');
    const [reason, setReason] = useState('');
    const [signatureData, setSignatureData] = useState<string | null>(null);

    // Admin action state
    const [rejectingId, setRejectingId] = useState<number | null>(null);
    const [adminNotes, setAdminNotes] = useState('');

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!signatureData) {
            alert('Please sign the request using our digital signature system before submitting.');
            return;
        }

        router.post('/hrm/document-requests', {
            document_type: selectedDocType,
            reason,
            employee_signature: signatureData,
        }, {
            onSuccess: () => {
                setIsCreateOpen(false);
                setReason('');
                setSignatureData(null);
            }
        });
    };

    const handleApprove = (id: number) => {
        router.put(`/hrm/document-requests/${id}/approve`, {
            admin_notes: 'Approved by HR/Admin',
        });
    };

    const handleRejectSubmit = (id: number) => {
        if (!adminNotes.trim()) {
            alert('Please provide a rejection reason.');
            return;
        }

        router.put(`/hrm/document-requests/${id}/reject`, {
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
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approved
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
                        <Clock className="w-3.5 h-3.5" /> Pending Review
                    </span>
                );
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Employee Document Requests" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-900">Document Requests & E-Signatures</h1>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                Request official documents with digital signatures. Admin approval required.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
                    >
                        <Plus className="w-4 h-4" /> Request Official Document
                    </button>
                </div>

                {/* Document Requests Table */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="font-extrabold text-slate-900 text-sm">All Requests ({documentRequests?.total || 0})</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-100 font-extrabold uppercase text-slate-500">
                                <tr>
                                    <th className="py-3 px-4">Employee</th>
                                    <th className="py-3 px-4">Document Type</th>
                                    <th className="py-3 px-4">Reason / Notes</th>
                                    <th className="py-3 px-4">E-Signature</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {documentRequests?.data?.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                                            No document requests found.
                                        </td>
                                    </tr>
                                ) : (
                                    documentRequests?.data?.map((req: any) => (
                                        <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-slate-900 block">{req.employee?.user?.name || req.employee?.name || 'Employee'}</span>
                                                        <span className="text-[10px] text-slate-400 font-semibold">ID #{req.employee?.id}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 font-extrabold text-slate-900">
                                                {req.document_type}
                                            </td>
                                            <td className="py-3 px-4 text-slate-600 font-medium max-w-xs truncate">
                                                {req.reason || 'No specific reason provided'}
                                            </td>
                                            <td className="py-3 px-4">
                                                {req.employee_signature ? (
                                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-1 w-24 h-10 flex items-center justify-center">
                                                        <img src={req.employee_signature} alt="Employee Signature" className="max-h-full max-w-full object-contain" />
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic">No signature</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                {getStatusBadge(req.status)}
                                                {req.admin_notes && (
                                                    <p className="text-[10px] text-slate-500 mt-1 italic">Notes: {req.admin_notes}</p>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                {req.status === 'pending' && (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleApprove(req.id)}
                                                            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition-all"
                                                        >
                                                            <Check className="w-3.5 h-3.5" /> Approve
                                                        </button>
                                                        <button
                                                            onClick={() => setRejectingId(req.id)}
                                                            className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition-all"
                                                        >
                                                            <X className="w-3.5 h-3.5" /> Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Create Request Modal */}
                {isCreateOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
                            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                                <h3 className="font-extrabold text-slate-900 text-base">New Official Document Request</h3>
                                <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4 text-xs">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Document Type</label>
                                    <select
                                        value={selectedDocType}
                                        onChange={(e) => setSelectedDocType(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {documentTypes.map((type) => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Reason / Details</label>
                                    <textarea
                                        rows={3}
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Explain why you are requesting this document..."
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                {/* E-Signature Attachment Area */}
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Digital Signature</label>
                                    {signatureData ? (
                                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                                            <div className="h-10 bg-white p-1 rounded border border-slate-200">
                                                <img src={signatureData} alt="Signature" className="h-full object-contain" />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setIsSignatureOpen(true)}
                                                className="text-xs text-indigo-600 font-bold hover:underline"
                                            >
                                                Change Signature
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setIsSignatureOpen(true)}
                                            className="w-full py-3 border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/50 rounded-xl font-bold text-indigo-600 flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <PenTool className="w-4 h-4" /> Sign with E-Signature System
                                        </button>
                                    )}
                                </div>

                                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateOpen(false)}
                                        className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20"
                                    >
                                        Submit Request
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Reject Reason Modal */}
                {rejectingId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 border border-slate-100">
                            <h3 className="font-extrabold text-slate-900 text-sm mb-2">Reject Document Request</h3>
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

                {/* Interactive Signature Pad Modal */}
                <SignaturePadModal
                    isOpen={isSignatureOpen}
                    onClose={() => setIsSignatureOpen(false)}
                    onSave={(data) => setSignatureData(data)}
                />
            </div>
        </AuthenticatedLayout>
    );
}
