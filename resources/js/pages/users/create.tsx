import { useState } from "react";
import MediaLibraryModal from "@/components/MediaLibraryModal";
import { getImagePath } from "@/utils/helpers";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm, usePage, router } from "@inertiajs/react";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import InputError from "@/components/ui/input-error";
import { PhoneInputComponent } from "@/components/ui/phone-input";
import { ShieldCheck, Check } from "lucide-react";
import { CreateUserProps, CreateUserFormData } from './types';

export default function Create({ onSuccess, roles = {} }: CreateUserProps) {
    const { t } = useTranslation();
    const { auth, allRoles: pageAllRoles } = usePage<any>().props;
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const { data, setData, post, processing, errors, transform } = useForm<CreateUserFormData>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        mobile_no: '',
        type: '',
        roles: [],
        is_enable_login: true,
        avatar: null,
    });

    const isSuperAdmin = auth.user?.type === 'superadmin';

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        transform((data) => {
            const transformed = { ...data };
            if (transformed.avatar === null || transformed.avatar === 'null') {
                delete transformed.avatar;
            }
            return transformed;
        });
        post(route('users.store'), {
            onSuccess: () => {
                onSuccess();
            }
        });
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{t('Create User')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
                <div className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 gap-3">
                    <div className="relative cursor-pointer group" onClick={() => setIsMediaModalOpen(true)}>
                        <img
                            src={avatarPreview || '/default-avatar.png'}
                            alt="Avatar Preview"
                            className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md group-hover:opacity-85 transition-opacity"
                            onError={(e) => { e.currentTarget.src = '/default-avatar.png'; }}
                        />
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white text-xs font-semibold">{t('Browse')}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsMediaModalOpen(true)}
                            className="font-semibold text-xs h-8"
                        >
                            {t('Select Profile Picture')}
                        </Button>
                        <p className="text-[10px] text-slate-400">{t('Select from Media Library')}</p>
                    </div>
                    <InputError message={errors.avatar} />

                    <MediaLibraryModal
                        isOpen={isMediaModalOpen}
                        onClose={() => setIsMediaModalOpen(false)}
                        onSelect={(selected) => {
                            const selectedUrl = Array.isArray(selected) ? selected[0] : selected;
                            if (selectedUrl) {
                                setData('avatar', selectedUrl);
                                setAvatarPreview(getImagePath(selectedUrl));
                            }
                            setIsMediaModalOpen(false);
                        }}
                        multiple={false}
                    />
                </div>

                <div>
                    <Label htmlFor="name">{t('Name')}</Label>
                    <Input
                        id="name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder={t('Enter full name')}
                        required
                    />
                    <InputError message={errors.name} />
                </div>
                <div>
                    <Label htmlFor="email">{t('Email')}</Label>
                    <Input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder={t('Enter email address')}
                        required
                    />
                    <InputError message={errors.email} />
                </div>
                <div>
                    <PhoneInputComponent
                        label={t('Mobile Number')}
                        value={data.mobile_no}
                        onChange={(value) => setData('mobile_no', value)}
                        placeholder="+1234567890"
                        error={errors.mobile_no}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="password">{t('Password')}</Label>
                        <Input
                            id="password"
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder={t('Enter password')}
                            required
                        />
                        <InputError message={errors.password} />
                    </div>
                    <div>
                        <Label htmlFor="password_confirmation">{t('Confirm Password')}</Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            placeholder={t('Confirm password')}
                            required
                        />
                        <InputError message={errors.password_confirmation} />
                    </div>
                </div>
                {!isSuperAdmin && (
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                        <div>
                            <Label className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                {t('Assign System Roles (Multi-Role Support)')}
                            </Label>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                {t('Permissions are dynamically combined from all selected roles.')}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {pageAllRoles && pageAllRoles.length > 0 ? (
                                pageAllRoles.map((roleItem: any) => {
                                    const isSelected = (data.roles || []).includes(roleItem.name);
                                    return (
                                        <button
                                            key={roleItem.id}
                                            type="button"
                                            onClick={() => {
                                                const currentRoles = data.roles || [];
                                                if (isSelected) {
                                                    const updated = currentRoles.filter((r: string) => r !== roleItem.name);
                                                    setData('roles', updated);
                                                    if (updated.length > 0) setData('type', updated[0]);
                                                } else {
                                                    const updated = [...currentRoles, roleItem.name];
                                                    setData('roles', updated);
                                                    setData('type', updated[0]);
                                                }
                                            }}
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                                                isSelected
                                                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                                                    : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                                            }`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-slate-300 dark:bg-slate-700'}`} />
                                            {roleItem.label || roleItem.name}
                                            {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                                        </button>
                                    );
                                })
                            ) : (
                                Object.entries(roles).map(([id, label]) => {
                                    const isSelected = data.type === id || (data.roles || []).includes(label as string);
                                    return (
                                        <button
                                            key={id}
                                            type="button"
                                            onClick={() => {
                                                setData('type', id);
                                                setData('roles', [label as string]);
                                            }}
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                                                isSelected
                                                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                                                    : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                        <InputError message={errors.roles || errors.type} />
                    </div>
                )}
                    <div>
                        <Label htmlFor="is_enable_login">{t('Login Status')}</Label>
                        <Select value={data.is_enable_login ? "1" : "0"} onValueChange={(value) => setData('is_enable_login', value === "1")}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">{t('Enabled')}</SelectItem>
                                <SelectItem value="0">{t('Disabled')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.is_enable_login} />
                    </div>
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
