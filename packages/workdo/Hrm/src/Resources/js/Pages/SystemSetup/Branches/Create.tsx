import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "@inertiajs/react";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Label } from '@/components/ui/label';
import InputError from '@/components/ui/input-error';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { CreateBranchProps, BranchFormData } from './types';

export default function Create({ onSuccess }: CreateBranchProps) {
    const { t } = useTranslation();
    const { data, setData, post, processing, errors } = useForm<BranchFormData>({
        branch_name: '',
        branch_address: '',
        priority: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('hrm.branches.store'), {
            onSuccess: () => {
                onSuccess();
            }
        });
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{t('Create Branch')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
                <div>
                    <Label htmlFor="branch_name">{t('Branch Name')}</Label>
                    <Input
                        id="branch_name"
                        type="text"
                        value={data.branch_name}
                        onChange={(e) => setData('branch_name', e.target.value)}
                        placeholder={t('Enter Branch Name (e.g. Gulshan Branch)')}
                        required
                    />
                    <InputError message={errors.branch_name} />
                </div>

                <div>
                    <Label htmlFor="branch_address">{t('Branch Official Address')}</Label>
                    <Textarea
                        id="branch_address"
                        value={data.branch_address}
                        onChange={(e) => setData('branch_address', e.target.value)}
                        placeholder={t('Enter full physical address of this branch (e.g. House 12, Road 4, Gulshan-1, Dhaka)')}
                        rows={3}
                    />
                    <InputError message={errors.branch_address} />
                </div>

                <div>
                    <Label htmlFor="priority">{t('Priority')}</Label>
                    <Input
                        id="priority"
                        type="number"
                        min="1"
                        value={data.priority}
                        onChange={(e) => setData('priority', e.target.value)}
                        placeholder={t('Enter Priority (e.g. 1 for best priority)')}
                    />
                    <InputError message={errors.priority} />
                </div>

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => onSuccess()}>
                        {t('Cancel')}
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {processing ? t('Creating...') : t('Create')}
                    </Button>
                </div>
            </form>
        </DialogContent>
    );
}