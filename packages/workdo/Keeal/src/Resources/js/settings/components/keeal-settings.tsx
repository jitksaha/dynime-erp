import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CreditCard, Save, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';

export default function KeealSettings() {
  const { t } = useTranslation();
  const { globalSettings = {}, auth } = usePage().props as any;
  const canEdit = auth?.user?.permissions?.includes('edit-system-settings');

  const [enabled, setEnabled] = useState(globalSettings?.keeal_enabled === 'on');
  const [mode, setMode] = useState(globalSettings?.keeal_mode || 'sandbox');
  const [secretKey, setSecretKey] = useState(globalSettings?.keeal_secret_key || '');
  const [testSecretKey, setTestSecretKey] = useState(globalSettings?.keeal_test_secret_key || '');
  const [webhookSecret, setWebhookSecret] = useState(globalSettings?.keeal_webhook_secret || '');
  const [currency, setCurrency] = useState(globalSettings?.keeal_currency || 'USD');
  const [showSecret, setShowSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    setIsLoading(true);
    router.post(route('settings.keeal.update'), {
      keeal_enabled: enabled ? 'on' : 'off',
      keeal_mode: mode,
      keeal_secret_key: secretKey,
      keeal_test_secret_key: testSecretKey,
      keeal_webhook_secret: webhookSecret,
      keeal_currency: currency,
    }, {
      preserveScroll: true,
      onFinish: () => setIsLoading(false),
    });
  };

  return (
    <Card id="keeal-settings">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 text-purple-600" />
            {t('Keeal Payment Settings')}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t('Configure Keeal hosted checkout for PayPal and International Card payments (keeal.com)')}
          </p>
        </div>
        {canEdit && (
          <Button onClick={handleSubmit} disabled={isLoading} size="sm">
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? t('Saving...') : t('Save Changes')}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 border rounded-xl bg-slate-50 dark:bg-slate-900">
          <div>
            <Label htmlFor="keeal_enabled" className="font-semibold">{t('Enable Keeal Gateway')}</Label>
            <p className="text-xs text-muted-foreground">{t('Enable or disable Keeal checkout at payment steps')}</p>
          </div>
          <Switch
            id="keeal_enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
            disabled={!canEdit}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <Label htmlFor="keeal_mode">{t('Environment Mode')}</Label>
            <Select value={mode} onValueChange={setMode} disabled={!canEdit}>
              <SelectTrigger>
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">{t('Sandbox (Test)')}</SelectItem>
                <SelectItem value="live">{t('Live (Production)')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="keeal_currency">{t('Default Currency')}</Label>
            <Input
              id="keeal_currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="USD"
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="keeal_test_secret_key">{t('Test Secret Key')}</Label>
            <Input
              id="keeal_test_secret_key"
              type="password"
              value={testSecretKey}
              onChange={(e) => setTestSecretKey(e.target.value)}
              placeholder="keeal_sec_test_..."
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="keeal_secret_key">{t('Live Secret Key')}</Label>
            <div className="relative">
              <Input
                id="keeal_secret_key"
                type={showSecret ? 'text' : 'password'}
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="keeal_sec_live_..."
                disabled={!canEdit}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="keeal_webhook_secret">{t('Webhook Secret (Optional)')}</Label>
            <Input
              id="keeal_webhook_secret"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              placeholder="keeal_whsec_..."
              disabled={!canEdit}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
