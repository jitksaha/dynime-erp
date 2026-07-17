import { useState } from "react";
import MediaLibraryModal from "@/components/MediaLibraryModal";
import { getImagePath } from "@/utils/helpers";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "@inertiajs/react";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import InputError from "@/components/ui/input-error";
import { PhoneInputComponent } from "@/components/ui/phone-input";
import { EditUserProps, EditUserFormData } from './types';

export default function Edit({ user, onSuccess, roles = {} }: EditUserProps) {
    const { t } = useTranslation();
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar && user.avatar !== 'null' ? getImagePath(user.avatar) : null);

    const { data, setData, put, processing, errors, transform } = useForm<EditUserFormData>({
        name: user.name,
        email: user.email,
        mobile_no: user.mobile_no,
        is_enable_login: user.is_enable_login,
        avatar: user.avatar && user.avatar !== 'null' ? user.avatar : null,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        transform((data) => {
            const transformed = { ...data };
            if (transformed.avatar === null || transformed.avatar === 'null') {
                transformed.avatar = null;
            }
            return transformed;
        });
        put(route('users.update', user.id), {
            onSuccess: () => {
                onSuccess();
            }
        });
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{t('Edit User')}</DialogTitle>
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
                    <Label htmlFor="edit_name">{t('Name')}</Label>
                    <Input
                        id="edit_name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder={t('Enter full name')}
                        required
                    />
                    <InputError message={errors.name} />
                </div>
                <div>
                    <Label htmlFor="edit_email">{t('Email')}</Label>
                    <Input
                        id="edit_email"
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

                <div>
                    <Label htmlFor="edit_is_enable_login">{t('Login Status')}</Label>
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
                        {processing ? t('Updating...') : t('Update')}
                    </Button>
                </div>
            </form>
        </DialogContent>
    );
}