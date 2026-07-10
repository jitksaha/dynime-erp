import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Building2, User, Landmark, ShieldCheck, ArrowRight, XCircle } from 'lucide-react';

interface VerifiedEmployee {
    employee_id: string;
    name: string;
    designation: string;
    department: string;
    branch: string;
    date_of_joining: string;
    status: string;
}

interface VerifyProps {
    employee?: VerifiedEmployee | null;
    status?: string | null;
    error?: string | null;
}

export default function Verify({ employee, status, error }: VerifyProps) {
    const { t } = useTranslation();
    const { data, setData, post, processing } = useForm({
        employee_id: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('hrm.employee.verify.search'));
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
            {/* Soft decorative background gradients for light mode */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-60" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-60" />

            <Head title={t('Employee Verification Portal')} />

            <div className="w-full max-w-lg z-10 space-y-6">
                {/* Branding / Header with Dynime Logo (no text name) */}
                <div className="text-center space-y-4">
                    <img 
                        src="/logo_dynime.png" 
                        alt="Dynime Logo" 
                        className="h-12 object-contain mx-auto" 
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-600 text-xs font-semibold uppercase tracking-wider">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {t('Official Verification')}
                    </div>
                </div>

                {/* Verification Card */}
                <Card className="bg-white border-slate-200 shadow-xl rounded-2xl">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-xl text-slate-900 font-bold">{t('Verify Employee')}</CardTitle>
                        <CardDescription className="text-slate-500 text-sm">
                            {t('Enter the unique Employee ID to perform a verification check.')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="employee_id" className="text-slate-700 text-xs font-semibold">{t('Employee ID')}</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="employee_id"
                                        type="text"
                                        value={data.employee_id}
                                        onChange={(e) => setData('employee_id', e.target.value)}
                                        placeholder={t('e.g. EMP20260001')}
                                        className="bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500 h-10"
                                        required
                                    />
                                    <Button type="submit" disabled={processing} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 h-10 flex items-center gap-1.5 transition-colors">
                                        {processing ? t('Checking...') : (
                                            <>
                                                {t('Verify')}
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </form>

                        {/* Error / Not Found Result */}
                        {error && (
                            <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800">
                                    <XCircle className="w-6 h-6 shrink-0 text-red-600" />
                                    <div>
                                        <h4 className="font-bold text-sm text-red-900">{t('Verification Failed')}</h4>
                                        <p className="text-xs text-red-700 mt-0.5">{error}</p>
                                    </div>
                                </div>

                                <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 text-center space-y-2">
                                    <AlertCircle className="w-10 h-10 text-red-500/80 mx-auto" />
                                    <h3 className="text-slate-900 font-bold text-base">{t('Employee Not Found')}</h3>
                                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                        {t('We could not find any active employee matching this ID in our records. Please verify the ID is correct.')}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Success / Found Result */}
                        {employee && status === 'success' && (
                            <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                                    <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-600" />
                                    <div>
                                        <h4 className="font-bold text-sm text-emerald-900">{t('Verified Active Employee')}</h4>
                                        <p className="text-xs text-emerald-700 mt-0.5">{t('The employee ID is valid and active in our database.')}</p>
                                    </div>
                                </div>

                                <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-200/60">
                                    <div className="p-3.5 flex justify-between items-center text-sm">
                                        <span className="text-slate-500 flex items-center gap-2">
                                            <User className="w-4 h-4 text-slate-400" />
                                            {t('Full Name')}
                                        </span>
                                        <span className="font-bold text-slate-900 text-right">{employee.name}</span>
                                    </div>
                                    <div className="p-3.5 flex justify-between items-center text-sm">
                                        <span className="text-slate-500 flex items-center gap-2">
                                            <ShieldCheck className="w-4 h-4 text-slate-400" />
                                            {t('Employee ID')}
                                        </span>
                                        <span className="font-mono text-blue-600 font-bold tracking-wide text-right">{employee.employee_id}</span>
                                    </div>
                                    <div className="p-3.5 flex justify-between items-center text-sm">
                                        <span className="text-slate-500 flex items-center gap-2">
                                            <Landmark className="w-4 h-4 text-slate-400" />
                                            {t('Department')}
                                        </span>
                                        <span className="text-slate-800 font-semibold text-right">{employee.department}</span>
                                    </div>
                                    <div className="p-3.5 flex justify-between items-center text-sm">
                                        <span className="text-slate-500 flex items-center gap-2">
                                            <User className="w-4 h-4 text-slate-400" />
                                            {t('Designation')}
                                        </span>
                                        <span className="text-slate-800 font-semibold text-right">{employee.designation}</span>
                                    </div>
                                    <div className="p-3.5 flex justify-between items-center text-sm">
                                        <span className="text-slate-500 flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-slate-400" />
                                            {t('Branch')}
                                        </span>
                                        <span className="text-slate-800 font-semibold text-right">{employee.branch}</span>
                                    </div>
                                    <div className="p-3.5 flex justify-between items-center text-sm">
                                        <span className="text-slate-500 flex items-center gap-2">
                                            <ShieldCheck className="w-4 h-4 text-slate-400" />
                                            {t('Date of Joining')}
                                        </span>
                                        <span className="text-slate-800 font-semibold text-right">{employee.date_of_joining}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Footer with Dynime LLC */}
                <div className="text-center text-xs text-slate-400">
                    &copy; {new Date().getFullYear()} Dynime LLC. All rights reserved.
                </div>
            </div>
        </div>
    );
}
