import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from '@inertiajs/react';
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Shift } from './types';
import { Users, Building2, UserCheck, CheckCircle2 } from 'lucide-react';

interface AssignModalProps {
    shift: Shift;
    employees: any[];
    departments: any[];
    onClose: () => void;
}

export default function AssignModal({ shift, employees, departments, onClose }: AssignModalProps) {
    const { t } = useTranslation();
    const [assigneeType, setAssigneeType] = useState<'employee' | 'department'>('employee');

    const getInitialSelected = (type: 'employee' | 'department') => {
        if (!shift?.assignments) return [];
        return shift.assignments
            .filter(a => a.assignee_type === type)
            .map(a => String(a.assignee_id));
    };

    const { data, setData, post, processing } = useForm({
        assignee_type: 'employee',
        assignee_ids: getInitialSelected('employee'),
    });

    const handleSwitchType = (type: 'employee' | 'department') => {
        setAssigneeType(type);
        setData({
            assignee_type: type,
            assignee_ids: getInitialSelected(type),
        });
    };

    const itemsList = assigneeType === 'employee' ? employees : departments;

    const handleToggleSelect = (idStr: string) => {
        const current = [...data.assignee_ids];
        if (current.includes(idStr)) {
            setData('assignee_ids', current.filter(item => item !== idStr));
        } else {
            setData('assignee_ids', [...current, idStr]);
        }
    };

    const handleSelectAll = () => {
        if (data.assignee_ids.length === itemsList.length) {
            setData('assignee_ids', []);
        } else {
            setData('assignee_ids', itemsList.map(i => String(i.id)));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('hrm.shifts.assign-employees', shift.id), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                onClose();
            }
        });
    };

    return (
        <DialogContent className="sm:max-w-[540px]">
            <DialogHeader>
                <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-primary" />
                    {t('Assign Employees to Shift')}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="font-medium text-xs">
                        {shift.shift_name} ({shift.shift_code || ('SFT-' + shift.id)})
                    </Badge>
                    <span className="text-xs text-muted-foreground">{shift.timezone}</span>
                </div>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 py-2">
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-700">{t('Assignment Target Type')}</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            type="button"
                            variant={assigneeType === 'employee' ? 'default' : 'outline'}
                            className="h-9 text-xs font-medium gap-2"
                            onClick={() => handleSwitchType('employee')}
                        >
                            <Users className="w-4 h-4" />
                            {t('Specific Employees')}
                        </Button>

                        <Button
                            type="button"
                            variant={assigneeType === 'department' ? 'default' : 'outline'}
                            className="h-9 text-xs font-medium gap-2"
                            onClick={() => handleSwitchType('department')}
                        >
                            <Building2 className="w-4 h-4" />
                            {t('Entire Department')}
                        </Button>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-medium text-gray-600">
                        {data.assignee_ids.length} {t('Selected')}
                    </span>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs font-medium text-primary hover:text-primary/90 h-auto p-0"
                        onClick={handleSelectAll}
                    >
                        {data.assignee_ids.length === itemsList.length ? t('Deselect All') : t('Select All')}
                    </Button>
                </div>

                <div className="max-h-[280px] overflow-y-auto border rounded-md p-2 space-y-1.5 bg-gray-50/50">
                    {itemsList.length === 0 ? (
                        <div className="p-6 text-center text-xs text-muted-foreground">
                            {t('No target entities found.')}
                        </div>
                    ) : (
                        itemsList.map((item: any) => {
                            const idStr = String(item.id);
                            const isChecked = data.assignee_ids.includes(idStr);

                            return (
                                <div
                                    key={idStr}
                                    onClick={() => handleToggleSelect(idStr)}
                                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer select-none transition-all text-xs ${
                                        isChecked 
                                            ? 'bg-primary/10 border-primary text-gray-900 shadow-sm font-medium' 
                                            : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700 font-normal'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Checkbox 
                                            checked={isChecked} 
                                            className="pointer-events-none"
                                        />
                                        <div>
                                            <div className="font-semibold text-gray-900">{item.name}</div>
                                            {item.employee_id && (
                                                <div className="text-[11px] text-gray-500 font-mono mt-0.5">{item.employee_id}</div>
                                            )}
                                        </div>
                                    </div>
                                    {isChecked && (
                                        <Badge variant="secondary" className="bg-primary text-white text-[10px] px-2 py-0.5 font-medium flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" />
                                            {t('Selected')}
                                        </Badge>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                <DialogFooter className="pt-2">
                    <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={processing}>
                        {t('Cancel')}
                    </Button>
                    <Button type="submit" size="sm" disabled={processing}>
                        {processing ? t('Saving...') : t('Save Shift Assignments')}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}
