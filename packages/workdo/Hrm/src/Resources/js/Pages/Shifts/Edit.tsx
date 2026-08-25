import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from '@inertiajs/react';
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Clock, Globe, Plus, Trash2 } from 'lucide-react';
import { SearchableCountrySelect } from '@/components/ui/searchable-country-select';
import { Shift, ShiftFormData } from './types';

interface EditProps {
    shift: Shift | null;
    timezones: Record<string, string>;
    employees: any[];
    departments: any[];
    onClose: () => void;
}

export default function EditShift({ shift, timezones, employees, departments, onClose }: EditProps) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('basic');

    if (!shift) return null;

    const { data, setData, put, processing, errors } = useForm<ShiftFormData>({
        shift_name: shift.shift_name || '',
        shift_code: shift.shift_code || '',
        shift_type: shift.shift_type || 'fixed',
        description: shift.description || '',
        is_active: shift.is_active ?? true,
        country: shift.country || 'United States',
        region: shift.region || 'North America',
        timezone: shift.timezone || 'America/Denver',
        start_time: shift.start_time || '09:00',
        end_time: shift.end_time || '18:00',
        required_working_hours: shift.required_working_hours || 8,
        earliest_start_time: shift.earliest_start_time || '07:00',
        latest_start_time: shift.latest_start_time || '11:00',
        latest_finish_time: shift.latest_finish_time || '20:00',
        on_call_standby_allowance: shift.on_call_standby_allowance || 0,
        on_call_response_time_mins: shift.on_call_response_time_mins || 30,
        rules: {
            grace_period_mins: shift.rules?.grace_period_mins ?? 10,
            early_clock_in_mins: shift.rules?.early_clock_in_mins ?? 30,
            late_clock_out_mins: shift.rules?.late_clock_out_mins ?? 120,
            min_working_hours: shift.rules?.min_working_hours ?? 4,
            max_working_hours: shift.rules?.max_working_hours ?? 12,
            half_day_threshold_hours: shift.rules?.half_day_threshold_hours ?? 4,
            absent_threshold_hours: shift.rules?.absent_threshold_hours ?? 2,
            auto_mark_late: shift.rules?.auto_mark_late ?? true,
            auto_mark_early_leave: shift.rules?.auto_mark_early_leave ?? true,
        },
        breaks: shift.breaks && shift.breaks.length > 0 ? shift.breaks : [
            {
                break_name: 'Lunch Break',
                break_type: 'unpaid',
                duration_mins: 60,
                start_time: '13:00',
                end_time: '14:00',
            }
        ],
        overtime: {
            enable_ot: shift.overtime_rule?.enable_ot ?? true,
            ot_starts_after_hours: shift.overtime_rule?.ot_starts_after_hours ?? 8,
            max_ot_hours: shift.overtime_rule?.max_ot_hours ?? 4,
            approval_required: shift.overtime_rule?.approval_required ?? true,
            ot_multiplier: shift.overtime_rule?.ot_multiplier ?? 1.5,
        },
        assignments: {
            assignee_type: 'employee',
            assignee_ids: shift.assignments ? shift.assignments.map(a => a.assignee_id) : []
        }
    });

    const handleAddBreak = () => {
        setData('breaks', [
            ...data.breaks,
            {
                break_name: 'Tea Break',
                break_type: 'paid',
                duration_mins: 15,
                start_time: '',
                end_time: ''
            }
        ]);
    };

    const handleRemoveBreak = (idx: number) => {
        const updated = data.breaks.filter((_, i) => i !== idx);
        setData('breaks', updated);
    };

    const handleBreakChange = (idx: number, field: string, value: any) => {
        const updated = [...data.breaks];
        updated[idx] = { ...updated[idx], [field]: value };
        setData('breaks', updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('hrm.shifts.update', shift.id), {
            onSuccess: () => onClose(),
        });
    };

    return (
        <DialogContent className="sm:max-w-[700px] bg-white rounded-2xl shadow-xl border-slate-200 p-0 overflow-hidden">
            <DialogHeader className="bg-slate-50 border-b border-slate-100 p-5 pb-4">
                <DialogTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    {t('Edit Enterprise Shift')} - {shift.shift_name}
                </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="bg-slate-50/80 border-b border-slate-200 px-5 pt-2">
                        <TabsList className="bg-slate-200/70 p-1 rounded-xl grid grid-cols-4 gap-1">
                            <TabsTrigger value="basic" className="text-xs font-medium rounded-lg py-1.5">{t('1. Basic & Timezone')}</TabsTrigger>
                            <TabsTrigger value="schedule" className="text-xs font-medium rounded-lg py-1.5">{t('2. Schedule & Breaks')}</TabsTrigger>
                            <TabsTrigger value="rules" className="text-xs font-medium rounded-lg py-1.5">{t('3. Rules & Overtime')}</TabsTrigger>
                            <TabsTrigger value="assignments" className="text-xs font-medium rounded-lg py-1.5">{t('4. Assignments')}</TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="p-5 max-h-[440px] overflow-y-auto space-y-4">
                        {/* TAB 1: BASIC & TIMEZONE */}
                        <TabsContent value="basic" className="space-y-4 m-0">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-700">{t('Shift Name')} *</Label>
                                    <Input
                                        value={data.shift_name}
                                        onChange={(e) => setData('shift_name', e.target.value)}
                                        className="rounded-xl text-xs font-medium"
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-700">{t('Shift Code')} *</Label>
                                    <Input
                                        value={data.shift_code}
                                        onChange={(e) => setData('shift_code', e.target.value.toUpperCase())}
                                        className="rounded-xl text-xs font-mono font-medium"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-700">{t('Shift Type')} *</Label>
                                    <Select value={data.shift_type} onValueChange={(val: any) => setData('shift_type', val)}>
                                        <SelectTrigger className="rounded-xl text-xs font-medium">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="fixed">{t('Fixed Shift (Standard Regular)')}</SelectItem>
                                            <SelectItem value="flexible">{t('Flexible Shift (Flexi Hours)')}</SelectItem>
                                            <SelectItem value="rotational">{t('Rotational Shift (Cyclic Shift A/B)')}</SelectItem>
                                            <SelectItem value="split">{t('Split Shift (Multiple Daily Segments)')}</SelectItem>
                                            <SelectItem value="on_call">{t('On-Call Shift (Standby Duty)')}</SelectItem>
                                            <SelectItem value="weekend">{t('Weekend Shift (Special Days)')}</SelectItem>
                                            <SelectItem value="night">{t('Night Shift (Cross Midnight)')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-700">{t('Primary Country')}</Label>
                                    <SearchableCountrySelect
                                        value={data.country}
                                        onChange={(val) => setData('country', val)}
                                        placeholder={t('Select Primary Country')}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-slate-700 flex items-center gap-1">
                                    <Globe className="w-3.5 h-3.5 text-indigo-600" />
                                    {t('IANA Timezone Database')} *
                                </Label>
                                <Select value={data.timezone} onValueChange={(val) => setData('timezone', val)}>
                                    <SelectTrigger className="rounded-xl text-xs font-medium">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(timezones).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>
                                                {label} ({key})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-slate-700">{t('Description')}</Label>
                                <Textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className="rounded-xl text-xs font-medium h-20"
                                />
                            </div>
                        </TabsContent>

                        {/* TAB 2: SCHEDULE & BREAKS */}
                        <TabsContent value="schedule" className="space-y-4 m-0">
                            {data.shift_type !== 'flexible' ? (
                                <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-700">{t('Start Time')}</Label>
                                        <Input
                                            type="time"
                                            value={data.start_time}
                                            onChange={(e) => setData('start_time', e.target.value)}
                                            className="rounded-xl text-xs font-mono font-medium"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-700">{t('End Time')}</Label>
                                        <Input
                                            type="time"
                                            value={data.end_time}
                                            onChange={(e) => setData('end_time', e.target.value)}
                                            className="rounded-xl text-xs font-mono font-medium"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3 bg-indigo-50/70 border border-indigo-200 p-3.5 rounded-xl">
                                    <h5 className="text-xs font-medium text-indigo-900">{t('Flexible Shift Parameters')}</h5>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-[11px] font-medium text-slate-700">{t('Required Working Hours')}</Label>
                                            <Input
                                                type="number"
                                                step="0.5"
                                                value={data.required_working_hours}
                                                onChange={(e) => setData('required_working_hours', parseFloat(e.target.value) || 0)}
                                                className="rounded-xl text-xs font-mono font-medium"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[11px] font-medium text-slate-700">{t('Earliest Start Time')}</Label>
                                            <Input
                                                type="time"
                                                value={data.earliest_start_time}
                                                onChange={(e) => setData('earliest_start_time', e.target.value)}
                                                className="rounded-xl text-xs font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Breaks Section */}
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-medium text-slate-800">{t('Configured Shift Breaks')}</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={handleAddBreak} className="h-7 text-[11px] font-medium rounded-lg gap-1 text-indigo-600 border-indigo-200">
                                        <Plus className="w-3 h-3" />
                                        {t('Add Break')}
                                    </Button>
                                </div>

                                {data.breaks.map((b, idx) => (
                                    <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs">
                                        <Input
                                            value={b.break_name}
                                            onChange={(e) => handleBreakChange(idx, 'break_name', e.target.value)}
                                            className="w-1/3 rounded-lg text-xs font-medium"
                                        />
                                        <Select value={b.break_type} onValueChange={(val) => handleBreakChange(idx, 'break_type', val)}>
                                            <SelectTrigger className="w-1/4 rounded-lg text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="unpaid">{t('Unpaid')}</SelectItem>
                                                <SelectItem value="paid">{t('Paid')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Input
                                            type="number"
                                            value={b.duration_mins}
                                            onChange={(e) => handleBreakChange(idx, 'duration_mins', parseInt(e.target.value) || 0)}
                                            className="w-1/5 rounded-lg text-xs font-mono"
                                        />
                                        {data.breaks.length > 1 && (
                                            <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveBreak(idx)} className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        {/* TAB 3: RULES & OVERTIME */}
                        <TabsContent value="rules" className="space-y-4 m-0">
                            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-3">
                                <h5 className="text-xs font-medium text-slate-800">{t('Attendance Grace & Threshold Rules')}</h5>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-medium text-slate-700">{t('Grace Period (Mins)')}</Label>
                                        <Input
                                            type="number"
                                            value={data.rules.grace_period_mins}
                                            onChange={(e) => setData('rules', { ...data.rules, grace_period_mins: parseInt(e.target.value) || 0 })}
                                            className="rounded-xl text-xs font-mono"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-medium text-slate-700">{t('Early Clock-In (Mins)')}</Label>
                                        <Input
                                            type="number"
                                            value={data.rules.early_clock_in_mins}
                                            onChange={(e) => setData('rules', { ...data.rules, early_clock_in_mins: parseInt(e.target.value) || 0 })}
                                            className="rounded-xl text-xs font-mono"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-medium text-slate-700">{t('Late Clock-Out (Mins)')}</Label>
                                        <Input
                                            type="number"
                                            value={data.rules.late_clock_out_mins}
                                            onChange={(e) => setData('rules', { ...data.rules, late_clock_out_mins: parseInt(e.target.value) || 0 })}
                                            className="rounded-xl text-xs font-mono"
                                        />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* TAB 4: ASSIGNMENTS */}
                        <TabsContent value="assignments" className="space-y-4 m-0">
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-slate-700">{t('Assign Target Employees')}</Label>
                                <div className="max-h-[220px] overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-slate-50/50">
                                    {employees.map((emp) => {
                                        const empIdStr = String(emp.id);
                                        const isChecked = data.assignments.assignee_ids.includes(empIdStr);

                                        return (
                                            <div
                                                key={emp.id}
                                                onClick={() => {
                                                    const current = [...data.assignments.assignee_ids];
                                                    if (isChecked) {
                                                        setData('assignments', { ...data.assignments, assignee_ids: current.filter(id => id !== empIdStr) });
                                                    } else {
                                                        setData('assignments', { ...data.assignments, assignee_ids: [...current, empIdStr] });
                                                    }
                                                }}
                                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs ${
                                                    isChecked ? 'bg-indigo-50 border border-indigo-200 font-medium text-indigo-900' : 'bg-white border border-slate-100 text-slate-700'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Checkbox checked={isChecked} />
                                                    <span>{emp.name} ({emp.employee_id})</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </TabsContent>
                    </div>

                    <DialogFooter className="bg-slate-50 border-t border-slate-100 p-4">
                        <Button type="button" variant="outline" onClick={onClose} className="rounded-xl font-medium text-xs">
                            {t('Cancel')}
                        </Button>
                        <Button type="submit" disabled={processing} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-xs">
                            {processing ? t('Updating...') : t('Update Shift Details')}
                        </Button>
                    </DialogFooter>
                </Tabs>
            </form>
        </DialogContent>
    );
}