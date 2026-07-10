import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "@inertiajs/react";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Label } from '@/components/ui/label';
import InputError from '@/components/ui/input-error';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PhoneInputComponent } from '@/components/ui/phone-input';
import { DatePicker } from '@/components/ui/date-picker';
import { CreateLeadProps, CreateLeadFormData } from './types';
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { formatDate } from '@/utils/helpers';
import { useFormFields } from '@/hooks/useFormFields';

export default function Create({ onSuccess }: CreateLeadProps) {
    const { users } = usePage<any>().props;

    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const [userSearch, setUserSearch] = useState('');

    const { t } = useTranslation();
    const { data, setData, post, processing, errors } = useForm<CreateLeadFormData>({
        subject: '',
        user_id: '',
        name: '',
        email: '',
        phone: '',
        date: '',
        project_value: '',
    });

    const filteredUsers = users?.filter((u: any) => u.name.toLowerCase().includes(userSearch.toLowerCase())) || [];
    const selectedUser = users?.find((u: any) => String(u.id) === String(data.user_id));


    const nameAI = useFormFields('aiField', data, setData, errors, 'create', 'name', 'Name', 'lead', 'lead');
    const subjectAI = useFormFields('aiField', data, setData, errors, 'create', 'subject', 'Subject', 'lead', 'lead');
    const customFields = useFormFields('getCustomFields', { ...data, module: 'Lead', sub_module: 'Lead' }, setData, errors, 'create', t);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('lead.leads.store'), {
            onSuccess: () => {
                onSuccess();
            }
        });
    };

    return (
        <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
                <DialogTitle>{t('Create Lead')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <Label htmlFor="name">{t('Name')}</Label>
                            <Input
                                id="name"
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder={t('Enter Name')}
                                required
                            />
                            <InputError message={errors.name} />
                        </div>
                        {nameAI.map(field => <div key={field.id}>{field.component}</div>)}
                    </div>

                    <div>
                        <Label htmlFor="email">{t('Email')}</Label>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder={t('Enter Email')}
                        />
                        <InputError message={errors.email} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <Label htmlFor="subject" required>{t('Subject')}</Label>
                            <Input
                                id="subject"
                                type="text"
                                value={data.subject}
                                onChange={(e) => setData('subject', e.target.value)}
                                placeholder={t('Enter Subject')}
                            />
                            <InputError message={errors.subject} />
                        </div>
                        {subjectAI.map(field => <div key={field.id}>{field.component}</div>)}
                    </div>

                    <div className="relative">
                        <Label htmlFor="user_id" required>{t('Lead Owner')}</Label>
                        <div 
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                        >
                            <span>{selectedUser ? selectedUser.name : t('Select Lead Owner')}</span>
                            <span className="text-muted-foreground text-xs">▼</span>
                        </div>
                        {isUserDropdownOpen && (
                            <>
                                <div 
                                    className="fixed inset-0 z-40 bg-transparent" 
                                    onClick={() => setIsUserDropdownOpen(false)}
                                />
                                <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-slate-200 bg-white p-1 text-slate-950 shadow-md">
                                    <div className="p-1">
                                        <Input
                                            type="text"
                                            placeholder={t('Search Lead Owner...')}
                                            value={userSearch}
                                            onChange={(e) => setUserSearch(e.target.value)}
                                            className="h-8 mb-1 bg-slate-50 border-slate-200"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                    <div className="space-y-0.5 max-h-48 overflow-y-auto">
                                        {filteredUsers.length > 0 ? (
                                            filteredUsers.map((item: any) => (
                                                <div
                                                    key={item.id}
                                                    className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-slate-100 hover:text-slate-900 ${String(item.id) === String(data.user_id) ? 'bg-slate-100 font-medium' : ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setData('user_id', item.id.toString());
                                                        setIsUserDropdownOpen(false);
                                                        setUserSearch('');
                                                    }}
                                                >
                                                    {item.name}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-2 text-xs text-muted-foreground text-center">
                                                {t('No options found')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                        <InputError message={errors.user_id} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <PhoneInputComponent
                            label={t('Phone No')}
                            value={data.phone}
                            onChange={(value) => setData('phone', value || '')}
                            error={errors.phone}
                        />
                    </div>

                    <div>
                        <Label>{t('Follow Up Date')}</Label>
                        <DatePicker
                            value={data.date}
                            onChange={(date) => setData('date', formatDate(date))}
                            placeholder={t('Select Follow Up Date')}
                        />
                        <InputError message={errors.date} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="project_value">{t('Project Value')}</Label>
                        <Input
                            id="project_value"
                            type="number"
                            step="0.01"
                            min="0"
                            value={data.project_value}
                            onChange={(e) => setData('project_value', e.target.value)}
                            placeholder={t('Enter Project Value')}
                        />
                        <InputError message={errors.project_value} />
                    </div>
                </div>

                {customFields.length > 0 && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {customFields.map((field) => (
                                <div key={field.id}>
                                    {field.component}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onSuccess}>
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
