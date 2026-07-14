import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { CreditCard, Save, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface DodoPaySettings {
  dodopay_api_key: string;
  dodopay_product_id: string;
  dodopay_mode: string;
  dodopay_enabled: string;
  [key: string]: any;
}

interface DodoPaySettingsProps {
  userSettings?: Record<string, string>;
  auth?: any;
}

export default function DodoPaySettings({ userSettings, auth }: DodoPaySettingsProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const canEdit = auth?.user?.permissions?.includes('edit-dodopay-settings');
  
  const [settings, setSettings] = useState<DodoPaySettings>({
    dodopay_api_key: userSettings?.dodopay_api_key || '',
    dodopay_product_id: userSettings?.dodopay_product_id || '',
    dodopay_mode: userSettings?.dodopay_mode || 'test',
    dodopay_enabled: userSettings?.dodopay_enabled || 'off',
  });

  useEffect(() => {
    if (userSettings) {
      setSettings({
        dodopay_api_key: userSettings?.dodopay_api_key || '',
        dodopay_product_id: userSettings?.dodopay_product_id || '',
        dodopay_mode: userSettings?.dodopay_mode || 'test',
        dodopay_enabled: userSettings?.dodopay_enabled || 'off',
      });
    }
  }, [userSettings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setSettings(prev => ({ ...prev, [name]: checked ? 'on' : 'off' }));
  };

  const saveSettings = () => {
    setIsLoading(true);

    const payload = {
      ...settings,
      dodopay_enabled: settings.dodopay_enabled === 'on' ? 'on' : 'off'
    };

    router.post(route('dodopay.settings.update'), {
      settings: payload
    }, {
      preserveScroll: true,
      onSuccess: (page) => {
        setIsLoading(false);
        const successMessage = (page.props.flash as any)?.success;
        const errorMessage = (page.props.flash as any)?.error;

        if (successMessage) {
          toast.success(successMessage);
          router.reload({ only: ['globalSettings'] });
        } else if (errorMessage) {
          toast.error(errorMessage);
        }
      },
      onError: (errors) => {
        setIsLoading(false);
        const errorMessage = errors.error || Object.values(errors).join(', ') || t('Failed to save DodoPay settings');
        toast.error(errorMessage);
      }
    });
  };

  return (
    <Card id="dodopay-settings">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="order-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5" />
            {t('DodoPay Settings')}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t('Configure Dodo Payments settings')}
          </p>
        </div>
        {canEdit && (
          <Button className="order-2" onClick={saveSettings} disabled={isLoading} size="sm">
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? t('Saving...') : t('Save Changes')}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <Label htmlFor="dodopay_enabled" className="text-base font-semibold">{t('Enable DodoPay')}</Label>
            <p className="text-sm text-muted-foreground">
              {t('Enable or disable DodoPay payment gateway')}
            </p>
          </div>
          <Switch
            id="dodopay_enabled"
            checked={settings.dodopay_enabled === 'on'}
            onCheckedChange={(checked) => handleSwitchChange('dodopay_enabled', checked)}
            disabled={!canEdit}
          />
        </div>

        {settings.dodopay_enabled === 'on' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Side - Form Fields */}
            <div className="lg:col-span-2 space-y-6">
              {/* DodoPay API Key */}
              <div className="space-y-3">
                <Label htmlFor="dodopay_api_key">{t('DodoPay API Key')}</Label>
                <div className="relative">
                  <Input
                    id="dodopay_api_key"
                    name="dodopay_api_key"
                    type={showSecret ? 'text' : 'password'}
                    value={settings.dodopay_api_key}
                    onChange={handleInputChange}
                    placeholder={t('Enter DodoPay secret API Key')}
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
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* DodoPay Product ID */}
              <div className="space-y-3">
                <Label htmlFor="dodopay_product_id">{t('DodoPay Product ID')}</Label>
                <Input
                  id="dodopay_product_id"
                  name="dodopay_product_id"
                  value={settings.dodopay_product_id}
                  onChange={handleInputChange}
                  placeholder={t('Enter DodoPay product ID')}
                  disabled={!canEdit}
                />
              </div>

              {/* DodoPay Mode */}
              <div className="space-y-3">
                <Label>{t('DodoPay Mode')}</Label>
                <div className="flex rounded-md bg-muted p-1 w-fit border">
                  <button
                    type="button"
                    className={cn("px-4 py-1.5 text-sm font-medium rounded-sm transition-all duration-200", 
                      settings.dodopay_mode === 'test' 
                        ? "bg-background text-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => handleSelectChange('dodopay_mode', 'test')}
                    disabled={!canEdit}
                  >
                    {t('Test Mode')}
                  </button>
                  <button
                    type="button"
                    className={cn("px-4 py-1.5 text-sm font-medium rounded-sm transition-all duration-200", 
                      settings.dodopay_mode === 'live' 
                        ? "bg-background text-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => handleSelectChange('dodopay_mode', 'live')}
                    disabled={!canEdit}
                  >
                    {t('Live Mode')}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {settings.dodopay_mode === 'test'
                    ? t('Use sandbox credentials for development and testing')
                    : t('Use live credentials for production transactions')
                  }
                </p>
              </div>
            </div>

            {/* Right Side - Guide */}
            <div className="lg:col-span-1 border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20 self-start">
              <h4 className="font-medium mb-3 text-blue-900 dark:text-blue-100">
                {t('How to get Dodo Payments credentials')}
              </h4>
              <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <div className="flex items-start gap-2">
                  <span className="font-medium min-w-[20px]">{t('1.')} </span>
                  <span>{t('Go to')} <a href="https://test.dodopayments.com/" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">Dodo Payments Dashboard</a></span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium min-w-[20px]">{t('2.')} </span>
                  <span>{t('Sign in to your account or sign up if new')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium min-w-[20px]">{t('3.')} </span>
                  <span>{t('Navigate to Developer > API Keys')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium min-w-[20px]">{t('4.')} </span>
                  <span>{t('Copy the API Key and paste in DodoPay API Key field')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium min-w-[20px]">{t('5.')} </span>
                  <span>{t('Go to Products and create a "Pay What You Want" product')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium min-w-[20px]">{t('6.')} </span>
                  <span>{t('Copy the Product ID and paste in DodoPay Product ID field')}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
