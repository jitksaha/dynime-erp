import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Globe, Save, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';

export default function SSLCommerzSettings() {
  const { t } = useTranslation();
  const { globalSettings = {}, auth } = usePage().props as any;
  const canEdit = auth?.user?.permissions?.includes('edit-system-settings');

  const [enabled, setEnabled] = useState(globalSettings?.sslcommerz_enabled === 'on');
  const [sandbox, setSandbox] = useState(globalSettings?.sslcommerz_sandbox === 'on');
  const [storeId, setStoreId] = useState(globalSettings?.sslcommerz_store_id || '');
  const [storePassword, setStorePassword] = useState(globalSettings?.sslcommerz_store_password || '');
  const [testStoreId, setTestStoreId] = useState(globalSettings?.sslcommerz_test_store_id || '');
  const [testStorePassword, setTestStorePassword] = useState(globalSettings?.sslcommerz_test_store_password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [displayName, setDisplayName] = useState(globalSettings?.sslcommerz_display_name || 'SSLCommerz (Bangladesh)');
  const [description, setDescription] = useState(globalSettings?.sslcommerz_description || 'Cards, Mobile Banking & Net Banking');
  const [badge, setBadge] = useState(globalSettings?.sslcommerz_badge || 'Cards / MFS');
  const [iconUrl, setIconUrl] = useState(globalSettings?.sslcommerz_icon_url || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    setIsLoading(true);
    router.post(route('settings.sslcommerz.update'), {
      sslcommerz_enabled: enabled ? 'on' : 'off',
      sslcommerz_sandbox: sandbox ? 'on' : 'off',
      sslcommerz_display_name: displayName,
      sslcommerz_description: description,
      sslcommerz_badge: badge,
      sslcommerz_icon_url: iconUrl,
      sslcommerz_store_id: storeId,
      sslcommerz_store_password: storePassword,
      sslcommerz_test_store_id: testStoreId,
      sslcommerz_test_store_password: testStorePassword,
    }, {
      preserveScroll: true,
      onFinish: () => setIsLoading(false),
    });
  };

  return (
    <Card id="sslcommerz-settings">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5 text-emerald-600" />
            {t('SSLCommerz Payment Settings')}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t('Accept Bangladesh Cards, Net Banking, and Mobile Banking via SSLCommerz.')}
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
              <Label htmlFor="sslcommerz_enabled" className="font-semibold">{t('Enable SSLCommerz Gateway')}</Label>
              <p className="text-xs text-muted-foreground">{t('Enable or disable SSLCommerz at checkout steps')}</p>
            </div>
            <Switch
              id="sslcommerz_enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
              disabled={!canEdit}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-xl bg-slate-50 dark:bg-slate-900">
            <div>
              <Label htmlFor="sslcommerz_sandbox" className="font-semibold">{t('Environment Mode')}</Label>
              <p className="text-xs text-muted-foreground">{sandbox ? t('Sandbox Mode Active (Testing)') : t('Live Mode Active (Production)')}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${!sandbox ? 'text-emerald-600' : 'text-slate-400'}`}>Live</span>
              <Switch
                id="sslcommerz_sandbox"
                checked={sandbox}
                onCheckedChange={setSandbox}
                disabled={!canEdit}
              />
              <span className={`text-xs font-bold ${sandbox ? 'text-amber-600' : 'text-slate-400'}`}>Sandbox</span>
            </div>
          </div>
        </div>

        {/* Custom Branding Options */}
        <div className="space-y-4 pt-2 border-t">
          <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">{t('Checkout Display Branding & Icon')}</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="sslcommerz_display_name">{t('Checkout Display Name')}</Label>
              <Input id="sslcommerz_display_name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="SSLCommerz (Bangladesh)" disabled={!canEdit} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sslcommerz_description">{t('Short Description')}</Label>
              <Input id="sslcommerz_description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Cards, Mobile Banking & Net Banking" disabled={!canEdit} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sslcommerz_badge">{t('Category Badge')}</Label>
              <Input id="sslcommerz_badge" value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="Cards / MFS" disabled={!canEdit} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sslcommerz_icon_url">{t('Custom Icon / Logo URL')}</Label>
              <Input id="sslcommerz_icon_url" value={iconUrl} onChange={(e) => setIconUrl(e.target.value)} placeholder="https://cdn.dynime.com/media/sslcommerz.png" disabled={!canEdit} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <Label htmlFor="sslcommerz_test_store_id">{t('Test Store ID')}</Label>
            <Input
              id="sslcommerz_test_store_id"
              value={testStoreId}
              onChange={(e) => setTestStoreId(e.target.value)}
              placeholder="test_store_id"
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sslcommerz_test_store_password">{t('Test Store Password')}</Label>
            <Input
              id="sslcommerz_test_store_password"
              type="password"
              value={testStorePassword}
              onChange={(e) => setTestStorePassword(e.target.value)}
              placeholder="••••••••••••"
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sslcommerz_store_id">{t('Live Store ID')}</Label>
            <Input
              id="sslcommerz_store_id"
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              placeholder="your_live_store_id"
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sslcommerz_store_password">{t('Live Store Password')}</Label>
            <div className="relative">
              <Input
                id="sslcommerz_store_password"
                type={showPassword ? 'text' : 'password'}
                value={storePassword}
                onChange={(e) => setStorePassword(e.target.value)}
                placeholder="••••••••••••"
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
      </CardContent>
    </Card>
  );
}
