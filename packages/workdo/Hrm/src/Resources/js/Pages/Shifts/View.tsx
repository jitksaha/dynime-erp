import React from 'react';
import { useTranslation } from 'react-i18next';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Globe, ShieldCheck, Users, ArrowLeft, Building2, CheckCircle2, Moon, Calendar } from 'lucide-react';
import { Shift } from './types';

interface ViewProps {
    shift: Shift;
    assigned_employees: any[];
    timezones: Record<string, string>;
}

export default function View({ shift, assigned_employees, timezones }: ViewProps) {
    const { t } = useTranslation();

    const formatTime12h = (timeStr: string | null) => {
        if (!timeStr) return '--:--';
        try {
            const parts = timeStr.split(':');
            let hrs = parseInt(parts[0], 10);
            const mins = parts[1] || '00';
            const ampm = hrs >= 12 ? 'PM' : 'AM';
            hrs = hrs % 12 || 12;
            return `${hrs.toString().padStart(2, '0')}:${mins} ${ampm}`;
        } catch (e) {
            return timeStr;
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Shift Details - ${shift.shift_name}`} />

            <div className="space-y-6 pb-12">
                {/* Top Action Bar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href={route('hrm.shifts.index')}>
                            <Button variant="outline" size="sm" className="rounded-xl font-bold gap-1 text-slate-700">
                                <ArrowLeft className="w-4 h-4" />
                                {t('Back to Shifts')}
                            </Button>
                        </Link>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                {shift.shift_name}
                                <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 font-mono font-bold text-xs">
                                    {shift.shift_code}
                                </Badge>
                                <Badge className={shift.is_active ? "bg-emerald-100 text-emerald-800 font-bold" : "bg-slate-200 text-slate-700 font-bold"}>
                                    {shift.is_active ? t('ACTIVE') : t('ARCHIVED')}
                                </Badge>
                            </h2>
                            <p className="text-xs text-slate-500 font-medium">
                                {shift.country} • {shift.timezone}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3 Grid Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Shift Summary Card */}
                    <Card className="bg-white border-slate-200 shadow-sm rounded-2xl p-5">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Shift Schedule')}</h4>
                                <div className="text-lg font-black text-slate-900 font-mono">
                                    {formatTime12h(shift.start_time)} – {formatTime12h(shift.end_time)}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between py-1 border-b border-slate-50">
                                <span className="text-slate-500 font-medium">{t('Shift Type')}</span>
                                <span className="font-bold text-slate-800 uppercase">{shift.shift_type}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-50">
                                <span className="text-slate-500 font-medium">{t('Gross Hours')}</span>
                                <span className="font-bold text-slate-800 font-mono">{shift.total_shift_hours} hrs</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-50">
                                <span className="text-slate-500 font-medium">{t('Net Working Hours')}</span>
                                <span className="font-extrabold text-indigo-600 font-mono">{shift.net_working_hours} hrs</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-slate-500 font-medium">{t('Night Shift / Cross Midnight')}</span>
                                <span className="font-bold text-slate-800">
                                    {shift.is_cross_midnight ? t('Yes (Cross Midnight)') : t('No')}
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* Timezone Matrix Card */}
                    <Card className="bg-white border-slate-200 shadow-sm rounded-2xl p-5">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-3">
                            <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                                <Globe className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Timezone Engine')}</h4>
                                <div className="text-sm font-bold text-slate-900">{shift.timezone}</div>
                            </div>
                        </div>

                        <div className="space-y-2 text-xs">
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                <div className="text-[10px] text-slate-500 font-bold uppercase">{t('IANA Standard')}</div>
                                <div className="text-xs font-bold text-slate-800">{timezones[shift.timezone] || shift.timezone}</div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                <div className="text-[10px] text-slate-500 font-bold uppercase">{t('UTC Storage Rule')}</div>
                                <div className="text-xs font-medium text-slate-700">{t('All attendance timestamps are normalized to UTC in database.')}</div>
                            </div>
                        </div>
                    </Card>

                    {/* Attendance Rules Card */}
                    <Card className="bg-white border-slate-200 shadow-sm rounded-2xl p-5">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-3">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Rules & Thresholds')}</h4>
                                <div className="text-sm font-bold text-slate-900">{t('Configured')}</div>
                            </div>
                        </div>

                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between py-1 border-b border-slate-50">
                                <span className="text-slate-500 font-medium">{t('Grace Period')}</span>
                                <span className="font-bold text-slate-800">{shift.rules?.grace_period_mins ?? 10} Mins</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-50">
                                <span className="text-slate-500 font-medium">{t('Half-Day Threshold')}</span>
                                <span className="font-bold text-slate-800">{shift.rules?.half_day_threshold_hours ?? 4} Hrs</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-slate-500 font-medium">{t('Overtime Multiplier')}</span>
                                <span className="font-extrabold text-amber-600 font-mono">{shift.overtime_rule?.ot_multiplier ?? 1.5}x</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Assigned Employees Table */}
                <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 py-3.5 px-5 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-indigo-600" />
                            <CardTitle className="text-base font-bold text-slate-800">
                                {t('Assigned Employees')} ({assigned_employees.length})
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {assigned_employees.length === 0 ? (
                            <div className="p-8 text-center text-xs text-slate-400 font-medium">
                                {t('No employees currently assigned to this shift.')}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                                            <th className="py-3 px-4">{t('Employee Name')}</th>
                                            <th className="py-3 px-4">{t('EMP ID')}</th>
                                            <th className="py-3 px-4">{t('Official Email')}</th>
                                            <th className="py-3 px-4">{t('Department')}</th>
                                            <th className="py-3 px-4 text-right">{t('Status')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                        {assigned_employees.map((emp: any) => (
                                            <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="py-3 px-4 font-bold text-slate-900">{emp.name}</td>
                                                <td className="py-3 px-4 font-mono font-bold">{emp.employee_id || '-'}</td>
                                                <td className="py-3 px-4">{emp.official_email || '-'}</td>
                                                <td className="py-3 px-4">{emp.department?.department_name || emp.department?.name || 'General'}</td>
                                                <td className="py-3 px-4 text-right">
                                                    <Badge className="bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                                        {t('Active Shift')}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}