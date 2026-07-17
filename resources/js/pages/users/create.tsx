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
import { CreateUserProps, CreateUserFormData } from './types';

export default function Create({ onSuccess, roles = {} }: CreateUserProps) {
    const { t } = useTranslation();
    const { auth } = usePage().props as any;
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const { data, setData, post, processing, errors, transform } = useForm<CreateUserFormData>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        mobile_no: '',
        type: '',
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
                <div className={`grid ${isSuperAdmin ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                    {!isSuperAdmin && (
                        <div>
                            <Label htmlFor="type">{t('Role')}</Label>
                            <Select value={data.type} onValueChange={(value) => setData('type', value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(roles).map(([id, label]) => (
                                        <SelectItem key={id} value={id}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {Object.keys(roles).length === 0 && auth.user?.permissions?.includes('create-roles') && (
                                <p className="text-xs text-gray-500 mb-1">
                                    {t('Create role here.')} <button onClick={() => router.get(route('roles.create'))} className="text-blue-600 hover:underline">{t('Create role')}</button>
                                </p>
                            )}
                            <InputError message={errors.type} />
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
