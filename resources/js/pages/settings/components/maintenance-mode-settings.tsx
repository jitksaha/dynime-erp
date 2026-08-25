import React, { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ShieldAlert, Key, Copy, RefreshCw, Check, Link as LinkIcon, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface MaintenanceSettingsProps {
    userSettings: Record<string, any>;
}

export default function MaintenanceModeSettings({ userSettings }: MaintenanceSettingsProps) {
    const { t } = useTranslation();

    const initialMode = userSettings.maintenance_mode === 'on';
    const initialTitle = userSettings.maintenance_title || 'System Under Maintenance';
    const initialMessage = userSettings.maintenance_message || 'We are currently conducting scheduled system maintenance. Public access is temporarily paused. Owner login and special bypass link holders can continue.';
    const secretToken = userSettings.maintenance_secret_token || '';

    const { data, setData, post, processing } = useForm({
        settings: {
            maintenance_mode: initialMode ? 'on' : 'off',
            maintenance_title: initialTitle,
            maintenance_message: initialMessage,
            maintenance_secret_token: secretToken,
        }
    });

    const [isCopied, setIsCopied] = useState(false);
    const [isGeneratingToken, setIsGeneratingToken] = useState(false);

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const bypassUrl = secretToken ? `${baseUrl}/bypass-maintenance/${secretToken}` : '';

    const handleToggleChange = (checked: boolean) => {
        setData('settings', {
            ...data.settings,
            maintenance_mode: checked ? 'on' : 'off'
        });
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('settings.maintenance.update'), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(t('Maintenance mode settings updated successfully.'));
            }
        });
    };

    const handleGenerateNewToken = () => {
        setIsGeneratingToken(true);
        router.post(route('settings.maintenance.token'), {}, {
            preserveScroll: true,
            onSuccess: () => {
                setIsGeneratingToken(false);
                toast.success(t('New secret bypass link generated successfully.'));
            },
            onError: () => {
                setIsGeneratingToken(false);
            }
        });
    };

    const handleCopyBypassLink = () => {
        if (!bypassUrl) return;
        navigator.clipboard.writeText(bypassUrl);
        setIsCopied(true);
        toast.success(t('Bypass link copied to clipboard!'));
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <Card className="w-full border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
                        <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                        <CardTitle className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                            {t('Maintenance Mode')}
                            {data.settings.maintenance_mode === 'on' ? (
                                <span className="text-[10px] font-bold bg-rose-500/10 text-rose-700 border border-rose-500/20 px-2 py-0.5 rounded-full">
                                    {t('Active')}
                                </span>
                            ) : (
                                <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                                    {t('Disabled')}
                                </span>
                            )}
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500 mt-0.5">
                            {t('Restrict site access during maintenance. System owners and special secret link holders retain full access.')}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-5 space-y-6">
                <form onSubmit={handleSave} className="space-y-6">
                    {/* Maintenance Mode Toggle Switch */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80">
                        <div className="space-y-0.5">
                            <Label className="text-xs font-bold text-slate-900">{t('Enable Maintenance Mode')}</Label>
                            <p className="text-[11px] text-slate-500">
                                {t('When enabled, non-owner users will see the maintenance screen instead of the dashboard.')}
                            </p>
                        </div>
                        <Switch
                            checked={data.settings.maintenance_mode === 'on'}
                            onCheckedChange={handleToggleChange}
                        />
                    </div>

                    {/* Maintenance Title */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-800">{t('Maintenance Title')}</Label>
                        <Input
                            type="text"
                            value={data.settings.maintenance_title}
                            onChange={(e) => setData('settings', { ...data.settings, maintenance_title: e.target.value })}
                            placeholder={t('E.g. System Under Maintenance')}
                            className="text-xs rounded-xl"
                        />
                    </div>

                    {/* Maintenance Message */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-800">{t('Maintenance Message')}</Label>
                        <Textarea
                            value={data.settings.maintenance_message}
                            onChange={(e) => setData('settings', { ...data.settings, maintenance_message: e.target.value })}
                            placeholder={t('Explain the maintenance duration or reason for users...')}
                            rows={3}
                            className="text-xs rounded-xl"
                        />
                    </div>

                    {/* Special Secret Bypass Link Card */}
                    <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100/90 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-indigo-900 text-xs font-bold">
                                <Key className="w-4 h-4 text-indigo-600" />
                                <span>{t('Special Owner Bypass Secret Link')}</span>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleGenerateNewToken}
                                disabled={isGeneratingToken}
                                className="h-7 text-[11px] font-semibold text-indigo-700 border-indigo-200 bg-white hover:bg-indigo-50"
                            >
                                <RefreshCw className={`w-3 h-3 mr-1 ${isGeneratingToken ? 'animate-spin' : ''}`} />
                                {t('Regenerate Link')}
                            </Button>
                        </div>

                        <p className="text-[11px] text-indigo-800/90 leading-relaxed">
                            {t('Share this secret link with selected team members or testers. Opening this link grants full access during maintenance mode without requiring owner credentials.')}
                        </p>

                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Input
                                    type="text"
                                    readOnly
                                    value={bypassUrl || t('No secret link generated yet. Click save to generate.')}
                                    className="text-xs font-mono bg-white text-indigo-950 pr-8 border-indigo-200 rounded-xl"
                                />
                                <LinkIcon className="w-3.5 h-3.5 text-indigo-400 absolute right-3 top-3" />
                            </div>
                            <Button
                                type="button"
                                onClick={handleCopyBypassLink}
                                disabled={!bypassUrl}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 rounded-xl flex items-center gap-1.5 shrink-0"
                            >
                                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                {isCopied ? t('Copied') : t('Copy Link')}
                            </Button>
                        </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-100/70 border border-slate-200/80 flex items-center gap-2 text-[11px] text-slate-700 font-medium">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{t('Platform owners (Superadmin & Company admin) can always log in and access the system.')}</span>
                    </div>

                    <CardFooter className="px-0 pt-2 flex items-center justify-end">
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs px-6 py-2 rounded-xl shadow-md shadow-indigo-600/20 transition-all"
                        >
                            {processing ? t('Saving...') : t('Save Maintenance Settings')}
                        </Button>
                    </CardFooter>
                </form>
            </CardContent>
        </Card>
    );
}
