import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Smartphone, Save, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';

export default function BkashSettings() {
  const { t } = useTranslation();
  const { globalSettings = {}, auth } = usePage().props as any;
  const canEdit = auth?.user?.permissions?.includes('edit-system-settings');

  const [enabled, setEnabled] = useState(globalSettings?.bkash_enabled === 'on');
  const [sandbox, setSandbox] = useState(globalSettings?.bkash_sandbox === 'on');

  const [appKey, setAppKey] = useState(globalSettings?.bkash_app_key || '');
  const [appSecret, setAppSecret] = useState(globalSettings?.bkash_app_secret || '');
  const [username, setUsername] = useState(globalSettings?.bkash_username || '');
  const [password, setPassword] = useState(globalSettings?.bkash_password || '');

  const [testAppKey, setTestAppKey] = useState(globalSettings?.bkash_test_app_key || '');
  const [testAppSecret, setTestAppSecret] = useState(globalSettings?.bkash_test_app_secret || '');
  const [testUsername, setTestUsername] = useState(globalSettings?.bkash_test_username || '');
  const [testPassword, setTestPassword] = useState(globalSettings?.bkash_test_password || '');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    setIsLoading(true);
    router.post(route('settings.bkash.update'), {
      bkash_enabled: enabled ? 'on' : 'off',
      bkash_sandbox: sandbox ? 'on' : 'off',
      bkash_app_key: appKey,
      bkash_app_secret: appSecret,
      bkash_username: username,
      bkash_password: password,
      bkash_test_app_key: testAppKey,
      bkash_test_app_secret: testAppSecret,
      bkash_test_username: testUsername,
      bkash_test_password: testPassword,
    }, {
      preserveScroll: true,
      onFinish: () => setIsLoading(false),
    });
  };

  return (
    <Card id="bkash-settings">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Smartphone className="h-5 w-5 text-pink-600" />
            {t('bKash Tokenized Checkout Settings')}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t('Accept direct tokenized bKash payments in BDT with instant OTP & PIN verification.')}
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
              <Label htmlFor="bkash_enabled" className="font-semibold">{t('Enable bKash Gateway')}</Label>
              <p className="text-xs text-muted-foreground">{t('Enable or disable bKash at payment checkout')}</p>
            </div>
            <Switch
              id="bkash_enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
              disabled={!canEdit}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-xl bg-slate-50 dark:bg-slate-900">
            <div>
              <Label htmlFor="bkash_sandbox" className="font-semibold">{t('Enable Sandbox Mode')}</Label>
              <p className="text-xs text-muted-foreground">{t('Use bKash sandbox credentials for testing')}</p>
            </div>
            <Switch
              id="bkash_sandbox"
              checked={sandbox}
              onCheckedChange={setSandbox}
              disabled={!canEdit}
            />
          </div>
        </div>

        {/* Sandbox / Test Credentials */}
        <div className="space-y-4 pt-2 border-t">
          <h4 className="font-semibold text-sm text-muted-foreground">{t('Test Credentials (Sandbox)')}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="bkash_test_app_key">{t('Test App Key')}</Label>
              <Input id="bkash_test_app_key" value={testAppKey} onChange={(e) => setTestAppKey(e.target.value)} disabled={!canEdit} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bkash_test_app_secret">{t('Test App Secret')}</Label>
              <Input id="bkash_test_app_secret" type="password" value={testAppSecret} onChange={(e) => setTestAppSecret(e.target.value)} disabled={!canEdit} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bkash_test_username">{t('Test Username')}</Label>
              <Input id="bkash_test_username" value={testUsername} onChange={(e) => setTestUsername(e.target.value)} disabled={!canEdit} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bkash_test_password">{t('Test Password')}</Label>
              <Input id="bkash_test_password" type="password" value={testPassword} onChange={(e) => setTestPassword(e.target.value)} disabled={!canEdit} />
            </div>
          </div>
        </div>

        {/* Live / Production Credentials */}
        <div className="space-y-4 pt-2 border-t">
          <h4 className="font-semibold text-sm text-muted-foreground">{t('Live Credentials (Production)')}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="bkash_app_key">{t('Live App Key')}</Label>
              <Input id="bkash_app_key" value={appKey} onChange={(e) => setAppKey(e.target.value)} disabled={!canEdit} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bkash_app_secret">{t('Live App Secret')}</Label>
              <Input id="bkash_app_secret" type="password" value={appSecret} onChange={(e) => setAppSecret(e.target.value)} disabled={!canEdit} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bkash_username">{t('Live Username')}</Label>
              <Input id="bkash_username" value={username} onChange={(e) => setUsername(e.target.value)} disabled={!canEdit} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bkash_password">{t('Live Password')}</Label>
              <div className="relative">
                <Input
                  id="bkash_password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!canEdit}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
