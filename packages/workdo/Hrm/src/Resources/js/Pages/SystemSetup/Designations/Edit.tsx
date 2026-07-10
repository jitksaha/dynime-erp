import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "@inertiajs/react";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Label } from '@/components/ui/label';
import InputError from '@/components/ui/input-error';
import { Input } from '@/components/ui/input';
import { MultiSelectEnhanced } from "@/components/ui/multi-select-enhanced";

import { EditDesignationProps, DesignationFormData } from './types';

export default function Edit({ designation, onSuccess, branches, departments }: EditDesignationProps) {
    const { t } = useTranslation();
    const { data, setData, put, processing, errors } = useForm<DesignationFormData>({
        designation_name: designation.designation_name ?? '',
        branch_id: Array.isArray(designation.branch_id) ? designation.branch_id.map(String) : ([] as any),
        department_id: Array.isArray(designation.department_id) ? designation.department_id.map(String) : ([] as any),
    });

    const selectedBranchIds = Array.isArray(data.branch_id) ? data.branch_id : [];

    // Filter departments based on selected branches
    const filteredDepartments = departments.filter(dept => {
        if (!dept.branch_id) return false;
        const deptBranchIds = dept.branch_id.toString().split(',');
        return deptBranchIds.some((bid: string) => selectedBranchIds.includes(bid));
    });

    const handleBranchChange = (value: string[]) => {
        setData(prev => ({
            ...prev,
            branch_id: value,
            department_id: [] as any // Reset department when branch changes
        }));
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('hrm.designations.update', designation.id), {
            onSuccess: () => {
                onSuccess();
            }
        });
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{t('Edit Designation')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
                <div>
                    <Label htmlFor="designation_name">{t('Designation Name')}</Label>
                    <Input
                        id="designation_name"
                        type="text"
                        value={data.designation_name}
                        onChange={(e) => setData('designation_name', e.target.value)}
                        placeholder={t('Enter Designation Name')}
                        required
                    />
                    <InputError message={errors.designation_name} />
                </div>

                <div>
                    <Label htmlFor="branch_id" required>{t('Branch')}</Label>
                    <MultiSelectEnhanced
                        options={branches.map((item: any) => ({
                            value: item.id.toString(),
                            label: item.branch_name
                        }))}
                        value={Array.isArray(data.branch_id) ? data.branch_id : []}
                        onValueChange={handleBranchChange}
                        placeholder={t('Select Branch')}
                        searchable={true}
                    />
                    <InputError message={errors.branch_id} />
                </div>

                <div>
                    <Label htmlFor="department_id" required>{t('Department')}</Label>
                    <MultiSelectEnhanced
                        options={filteredDepartments.map((item: any) => ({
                            value: item.id.toString(),
                            label: item.department_name
                        }))}
                        value={Array.isArray(data.department_id) ? data.department_id : []}
                        onValueChange={(value) => setData('department_id', value as any)}
                        placeholder={selectedBranchIds.length > 0 ? t('Select Department') : t('Select Branch first')}
                        searchable={true}
                    />
                    <InputError message={errors.department_id} />
                </div>

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => onSuccess()}>
                        {t('Cancel')}
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {processing ? t('Updating...') : t('Update')}
                    </Button>
                </div>
            </form>
        </DialogContent>
    );
}