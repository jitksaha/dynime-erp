import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Server, Lock, User, Globe, HardDrive, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { router } from '@inertiajs/react';

interface CPanelSettings extends Record<string, any> {
  cpanel_host: string;
  cpanel_username: string;
  cpanel_api_token: string;
  cpanel_domain: string;
  cpanel_quota: string;
}

interface CPanelSettingsProps {
  userSettings?: Record<string, string>;
  auth?: any;
}

const getInitialSettings = (userSettings?: Record<string, string>): CPanelSettings => ({
  cpanel_host: userSettings?.cpanel_host || '',
  cpanel_username: userSettings?.cpanel_username || '',
  cpanel_api_token: userSettings?.cpanel_api_token || '',
  cpanel_domain: userSettings?.cpanel_domain || '',
  cpanel_quota: userSettings?.cpanel_quota || '0'
});

export default function CPanelEmailSettings({ userSettings, auth }: CPanelSettingsProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const canEdit = auth?.user?.permissions?.includes('manage-company-settings');

  const [settings, setSettings] = useState<CPanelSettings>(() => getInitialSettings(userSettings));
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    if (userSettings) {
      setSettings(getInitialSettings(userSettings));
    }
  }, [userSettings]);

  const handleChange = (key: keyof CPanelSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setIsLoading(true);
    router.post(route('settings.cpanel-email.update'), { settings }, {
      preserveScroll: true,
      onFinish: () => setIsLoading(false)
    });
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Server className="h-5 w-5" />
            {t('cPanel Email Settings')}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t('Configure cPanel UAPI credentials to issue official email accounts for employees directly from the dashboard.')}
          </p>
        </div>
        {canEdit && (
          <Button
            onClick={handleSave}
            disabled={isLoading}
            size="sm"
          >
            <Save className="h-4 w-4 mr-2" />
            {t(isLoading ? 'Saving...' : 'Save Changes')}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <Label htmlFor="cpanel_host" className="font-medium">{t('cPanel Host URL')}</Label>
            <div className="relative">
              <Input
                id="cpanel_host"
                value={settings.cpanel_host}
                onChange={e => handleChange('cpanel_host', e.target.value)}
                disabled={!canEdit}
                placeholder="E.g., mail.yourdomain.com or https://yourdomain.com:2083"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t('The full hostname or URL of your cPanel server.')}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cpanel_username" className="font-medium">{t('cPanel Username')}</Label>
            <Input
              id="cpanel_username"
              value={settings.cpanel_username}
              onChange={e => handleChange('cpanel_username', e.target.value)}
              disabled={!canEdit}
              placeholder="E.g., mycpuser"
            />
            <p className="text-xs text-muted-foreground">
              {t('Your main account login username for cPanel.')}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cpanel_api_token" className="font-medium">{t('cPanel API Token')}</Label>
            <div className="relative">
              <Input
                id="cpanel_api_token"
                type={showToken ? 'text' : 'password'}
                value={settings.cpanel_api_token}
                onChange={e => handleChange('cpanel_api_token', e.target.value)}
                disabled={!canEdit}
                placeholder={t('Enter your API token')}
                className="pr-10"
              />
              {canEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('Generate this under cPanel > Security > Manage API Tokens.')}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cpanel_domain" className="font-medium">{t('Default Email Domain')}</Label>
            <Input
              id="cpanel_domain"
              value={settings.cpanel_domain}
              onChange={e => handleChange('cpanel_domain', e.target.value)}
              disabled={!canEdit}
              placeholder="E.g., yourdomain.com"
            />
            <p className="text-xs text-muted-foreground">
              {t('The domain name that will be appended to employee emails.')}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cpanel_quota" className="font-medium">{t('Default Mailbox Quota (MB)')}</Label>
            <Input
              id="cpanel_quota"
              type="number"
              value={settings.cpanel_quota}
              onChange={e => handleChange('cpanel_quota', e.target.value)}
              disabled={!canEdit}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              {t('Storage limit per email inbox in Megabytes (0 for unlimited).')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
