import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { 
    X, CheckCircle2, ChevronRight, ChevronLeft, User, Phone, 
    CreditCard, ShieldAlert, FileText, Sparkles, Send, Info 
} from 'lucide-react';

interface EmployeeProfileInspectionWizardProps {
    employee: any;
    isOpen: boolean;
    onClose: () => void;
}

export const EmployeeProfileInspectionWizard: React.FC<EmployeeProfileInspectionWizardProps> = ({
    employee,
    isOpen,
    onClose,
}) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: employee?.name || employee?.user?.name || '',
        email: employee?.email || employee?.user?.email || '',
        phone: employee?.phone || '',
        dob: employee?.dob || '',
        gender: employee?.gender || 'Male',
        nid_number: employee?.nid_number || '',
        passport_number: employee?.passport_number || '',
        emergency_contact: employee?.emergency_contact || '',
        emergency_phone: employee?.emergency_phone || '',
        bank_name: employee?.bank_name || '',
        account_holder: employee?.account_holder || '',
        account_number: employee?.account_number || '',
        bank_country: employee?.bank_country || '',
    });

    const [submitting, setSubmitting] = useState(false);

    if (!isOpen || !employee) return null;

    const originalData = {
        name: employee?.name || employee?.user?.name || '',
        email: employee?.email || employee?.user?.email || '',
        phone: employee?.phone || '',
        dob: employee?.dob || '',
        gender: employee?.gender || 'Male',
        nid_number: employee?.nid_number || '',
        passport_number: employee?.passport_number || '',
        emergency_contact: employee?.emergency_contact || '',
        emergency_phone: employee?.emergency_phone || '',
        bank_name: employee?.bank_name || '',
        account_holder: employee?.account_holder || '',
        account_number: employee?.account_number || '',
        bank_country: employee?.bank_country || '',
    };

    // Calculate diffs between originalData and formData
    const getDiffs = () => {
        const diffs: Record<string, { old: string; new: string }> = {};
        Object.keys(formData).forEach((key) => {
            const k = key as keyof typeof formData;
            if (String(formData[k]).trim() !== String(originalData[k]).trim()) {
                diffs[key] = {
                    old: String(originalData[k]),
                    new: String(formData[k]),
                };
            }
        });
        return diffs;
    };

    const diffs = getDiffs();
    const hasEdits = Object.keys(diffs).length > 0;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = () => {
        if (!hasEdits) {
            onClose();
            return;
        }

        setSubmitting(true);

        router.post(
            '/hrm/profile-change-requests',
            {
                employee_id: employee.id,
                requested_changes: diffs,
            },
            {
                onFinish: () => {
                    setSubmitting(false);
                    onClose();
                },
            }
        );
    };

    const steps = [
        { title: 'Personal Info', icon: User },
        { title: 'Identification', icon: FileText },
        { title: 'Emergency Contact', icon: ShieldAlert },
        { title: 'Bank Account', icon: CreditCard },
        { title: 'Review & Submit', icon: CheckCircle2 },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-100 relative">
                {/* Header */}
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 text-lg">Employee Profile Verification Wizard</h3>
                            <p className="text-xs text-slate-500 font-medium">Verify your profile details step-by-step. Edits require Admin approval.</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Step Navigation Bar */}
                <div className="flex items-center justify-between my-5 px-2">
                    {steps.map((s, idx) => {
                        const Icon = s.icon;
                        const isCurrent = step === idx + 1;
                        const isCompleted = step > idx + 1;
                        return (
                            <div key={idx} className="flex items-center gap-2">
                                <div
                                    onClick={() => setStep(idx + 1)}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                                        isCurrent
                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 ring-4 ring-indigo-50'
                                            : isCompleted
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-slate-100 text-slate-400'
                                    }`}
                                >
                                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                                </div>
                                <span className={`text-xs font-semibold hidden md:inline ${isCurrent ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
                                    {s.title}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Step Content */}
                <div className="my-4 min-h-[240px] bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                    {step === 1 && (
                        <div className="space-y-4">
                            <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                                <User className="w-4 h-4 text-indigo-600" /> Personal Information
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Date of Birth</label>
                                    <input
                                        type="date"
                                        name="dob"
                                        value={formData.dob}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Gender</label>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium"
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-600" /> Identification Documents
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">NID / National ID Number</label>
                                    <input
                                        type="text"
                                        name="nid_number"
                                        value={formData.nid_number}
                                        onChange={handleChange}
                                        placeholder="e.g. 19928374928"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Passport Number</label>
                                    <input
                                        type="text"
                                        name="passport_number"
                                        value={formData.passport_number}
                                        onChange={handleChange}
                                        placeholder="e.g. A9283749"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4 text-indigo-600" /> Emergency Contact Info
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Emergency Contact Person</label>
                                    <input
                                        type="text"
                                        name="emergency_contact"
                                        value={formData.emergency_contact}
                                        onChange={handleChange}
                                        placeholder="Full Name (e.g. Spouse / Parent)"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Emergency Contact Phone</label>
                                    <input
                                        type="text"
                                        name="emergency_phone"
                                        value={formData.emergency_phone}
                                        onChange={handleChange}
                                        placeholder="+1 234 567 890"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-4">
                            <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-indigo-600" /> Bank & Payroll Account
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Bank Name</label>
                                    <input
                                        type="text"
                                        name="bank_name"
                                        value={formData.bank_name}
                                        onChange={handleChange}
                                        placeholder="e.g. Chase / HSBC"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Account Holder Name</label>
                                    <input
                                        type="text"
                                        name="account_holder"
                                        value={formData.account_holder}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Account Number / IBAN</label>
                                    <input
                                        type="text"
                                        name="account_number"
                                        value={formData.account_number}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Bank Country</label>
                                    <input
                                        type="text"
                                        name="bank_country"
                                        value={formData.bank_country}
                                        onChange={handleChange}
                                        placeholder="e.g. United States"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="space-y-4">
                            <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Review Profile Edits
                            </h4>

                            {!hasEdits ? (
                                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                                    All your profile details match perfectly! No changes were made.
                                </div>
                            ) : (
                                <div>
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-medium mb-3 flex items-start gap-2">
                                        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                        <span>The following edits will be submitted to Company Admin for approval. The database will only be updated after approval.</span>
                                    </div>
                                    <div className="divide-y divide-slate-200 bg-white border border-slate-200 rounded-xl overflow-hidden">
                                        {Object.entries(diffs).map(([field, diff]) => (
                                            <div key={field} className="p-3 text-xs flex justify-between items-center">
                                                <span className="font-bold text-slate-900 uppercase">{field.replace('_', ' ')}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="line-through text-slate-400 font-medium">{diff.old || '(empty)'}</span>
                                                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{diff.new}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-2">
                    <button
                        type="button"
                        disabled={step === 1}
                        onClick={() => setStep(step - 1)}
                        className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                            step === 1 ? 'opacity-0 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <ChevronLeft className="w-4 h-4" /> Previous
                    </button>

                    <div className="flex items-center gap-2">
                        {step < 5 ? (
                            <button
                                type="button"
                                onClick={() => setStep(step + 1)}
                                className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all"
                            >
                                Next Step <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all"
                            >
                                <Send className="w-4 h-4" />
                                {hasEdits ? 'Submit Edits for Company Approval' : 'Complete Verification'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
