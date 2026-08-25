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
  const [mode, setMode] = useState(globalSettings?.keeal_mode || 'live');
  const [apiKey, setApiKey] = useState(globalSettings?.keeal_api_key || globalSettings?.keeal_secret_key || '');
  const [currency, setCurrency] = useState(globalSettings?.keeal_currency || 'USD');
  const [showSecret, setShowSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [displayName, setDisplayName] = useState(globalSettings?.keeal_display_name || 'PayPal & Cards (Keeal)');
  const [description, setDescription] = useState(globalSettings?.keeal_description || 'Hosted PayPal & Global Card Checkout');
  const [badge, setBadge] = useState(globalSettings?.keeal_badge || 'Keeal');
  const [iconUrl, setIconUrl] = useState(globalSettings?.keeal_icon_url || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    setIsLoading(true);
    router.post(route('settings.keeal.update'), {
      keeal_enabled: enabled ? 'on' : 'off',
      keeal_mode: mode,
      keeal_api_key: apiKey,
      keeal_secret_key: apiKey,
      keeal_currency: currency,
      keeal_display_name: displayName,
      keeal_description: description,
      keeal_badge: badge,
      keeal_icon_url: iconUrl,
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
            {t('Connect Keeal hosted checkout for PayPal & Card payments using your Keeal API Key')}
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
                <SelectItem value="live">{t('Live (Production)')}</SelectItem>
                <SelectItem value="sandbox">{t('Sandbox (Test)')}</SelectItem>
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

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="keeal_api_key">{t('Keeal API Key (Secret Key)')}</Label>
            <div className="relative">
              <Input
                id="keeal_api_key"
                type={showSecret ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="keeal_sec_live_..."
                disabled={!canEdit}
                className="pr-10 font-mono text-sm"
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
            <p className="text-[11px] text-muted-foreground mt-1">
              {t('Enter the API key provided in your Keeal merchant dashboard for instant connection.')}
            </p>
          </div>
        </div>

        {/* Custom Branding Options */}
        <div className="space-y-4 pt-2 border-t">
          <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">{t('Checkout Display Branding & Custom Icon')}</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="keeal_display_name">{t('Checkout Display Name')}</Label>
              <Input id="keeal_display_name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="PayPal & Cards (Keeal)" disabled={!canEdit} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="keeal_description">{t('Short Description')}</Label>
              <Input id="keeal_description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Hosted PayPal & Global Card Checkout" disabled={!canEdit} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="keeal_badge">{t('Category Badge')}</Label>
              <Input id="keeal_badge" value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="Keeal" disabled={!canEdit} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="keeal_icon_url">{t('Custom Icon / Logo URL')}</Label>
              <Input id="keeal_icon_url" value={iconUrl} onChange={(e) => setIconUrl(e.target.value)} placeholder="https://cdn.dynime.com/media/paypal.png" disabled={!canEdit} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
