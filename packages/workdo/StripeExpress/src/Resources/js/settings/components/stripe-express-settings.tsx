import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { CreditCard, Save, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';

export default function StripeExpressSettings() {
  const { t } = useTranslation();
  const { globalSettings = {}, auth } = usePage().props as any;
  const canEdit = auth?.user?.permissions?.includes('edit-system-settings');

  const [onsiteEnabled, setOnsiteEnabled] = useState(globalSettings?.stripe_onsite_enabled === 'on');
  const [sandbox, setSandbox] = useState(globalSettings?.stripe_sandbox === 'on');
  const [pubKey, setPubKey] = useState(globalSettings?.stripe_publishable_key || '');
  const [secretKey, setSecretKey] = useState(globalSettings?.stripe_secret_key || '');
  const [testPubKey, setTestPubKey] = useState(globalSettings?.stripe_test_publishable_key || '');
  const [testSecretKey, setTestSecretKey] = useState(globalSettings?.stripe_test_secret_key || '');
  const [showSecret, setShowSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    setIsLoading(true);
    router.post(route('settings.stripe-express.update'), {
      stripe_onsite_enabled: onsiteEnabled ? 'on' : 'off',
      stripe_sandbox: sandbox ? 'on' : 'off',
      stripe_publishable_key: pubKey,
      stripe_secret_key: secretKey,
      stripe_test_publishable_key: testPubKey,
      stripe_test_secret_key: testSecretKey,
    }, {
      preserveScroll: true,
      onFinish: () => setIsLoading(false),
    });
  };

  return (
    <Card id="stripe-express-settings">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 text-indigo-600" />
            {t('Stripe Direct Card & Express Pay Settings')}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t('Enable on-page embedded credit card & Apple Pay / Google Pay express checkout without redirection.')}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 border rounded-xl bg-slate-50 dark:bg-slate-900">
            <div>
              <Label htmlFor="stripe_onsite_enabled" className="font-semibold">{t('Enable On-Site Credit Card & Express Pay')}</Label>
              <p className="text-xs text-muted-foreground">{t('Embedded card form & Express Pay buttons')}</p>
            </div>
            <Switch
              id="stripe_onsite_enabled"
              checked={onsiteEnabled}
              onCheckedChange={setOnsiteEnabled}
              disabled={!canEdit}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-xl bg-slate-50 dark:bg-slate-900">
            <div>
              <Label htmlFor="stripe_sandbox" className="font-semibold">{t('Enable Test Mode (Sandbox)')}</Label>
              <p className="text-xs text-muted-foreground">{t('Use test keys for development/testing')}</p>
            </div>
            <Switch
              id="stripe_sandbox"
              checked={sandbox}
              onCheckedChange={setSandbox}
              disabled={!canEdit}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <Label htmlFor="stripe_test_publishable_key">{t('Test Publishable Key')}</Label>
            <Input
              id="stripe_test_publishable_key"
              value={testPubKey}
              onChange={(e) => setTestPubKey(e.target.value)}
              placeholder="pk_test_..."
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="stripe_test_secret_key">{t('Test Secret Key')}</Label>
            <Input
              id="stripe_test_secret_key"
              type="password"
              value={testSecretKey}
              onChange={(e) => setTestSecretKey(e.target.value)}
              placeholder="sk_test_..."
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="stripe_publishable_key">{t('Live Publishable Key')}</Label>
            <Input
              id="stripe_publishable_key"
              value={pubKey}
              onChange={(e) => setPubKey(e.target.value)}
              placeholder="pk_live_..."
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="stripe_secret_key">{t('Live Secret Key')}</Label>
            <div className="relative">
              <Input
                id="stripe_secret_key"
                type={showSecret ? 'text' : 'password'}
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="sk_live_..."
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
        </div>
      </CardContent>
    </Card>
  );
}
