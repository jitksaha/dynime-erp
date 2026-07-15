import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { DollarSign, Save, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { router } from '@inertiajs/react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PayrollSettingsProps {
  userSettings?: Record<string, string>;
  auth?: any;
}

export default function PayrollSettings({ userSettings = {}, auth }: PayrollSettingsProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const canEdit = auth?.user?.permissions?.includes('edit-company-settings') || true;

  const paymentOptions = [
    { key: 'bank_transfer', label: t('Bank Transfer') },
    { key: 'cards_transfer', label: t('Cards Transfer') },
    { key: 'paypal', label: t('PayPal') },
    { key: 'kast', label: t('Kast') },
    { key: 'redotpay', label: t('Redotpay') },
    { key: 'remitly', label: t('Remitly') },
    { key: 'western_union', label: t('Western Union') },
    { key: 'binance_bybit', label: t('Binance / Bybit') }
  ];

  const [settings, setSettings] = useState(() => {
    const initial: Record<string, any> = {};
    paymentOptions.forEach(opt => {
      const enabledVal = userSettings[`payroll_method_enabled_${opt.key}`];
      initial[`payroll_method_enabled_${opt.key}`] = enabledVal === undefined 
        ? opt.key === 'bank_transfer' 
        : enabledVal === 'on';
      
      const feeType = userSettings[`payroll_method_fee_type_${opt.key}`] || 'percentage';
      initial[`payroll_method_fee_type_${opt.key}`] = feeType;

      const legacyFee = userSettings[`payroll_method_fee_${opt.key}`] || '0';
      initial[`payroll_method_fee_percentage_${opt.key}`] = userSettings[`payroll_method_fee_percentage_${opt.key}`] || legacyFee;
      initial[`payroll_method_fee_fixed_${opt.key}`] = userSettings[`payroll_method_fee_fixed_${opt.key}`] || '0';
    });
    return initial;
  });

  useEffect(() => {
    const updated: Record<string, any> = {};
    paymentOptions.forEach(opt => {
      const enabledVal = userSettings[`payroll_method_enabled_${opt.key}`];
      updated[`payroll_method_enabled_${opt.key}`] = enabledVal === undefined 
        ? opt.key === 'bank_transfer' 
        : enabledVal === 'on';
      
      const feeType = userSettings[`payroll_method_fee_type_${opt.key}`] || 'percentage';
      updated[`payroll_method_fee_type_${opt.key}`] = feeType;

      const legacyFee = userSettings[`payroll_method_fee_${opt.key}`] || '0';
      updated[`payroll_method_fee_percentage_${opt.key}`] = userSettings[`payroll_method_fee_percentage_${opt.key}`] || legacyFee;
      updated[`payroll_method_fee_fixed_${opt.key}`] = userSettings[`payroll_method_fee_fixed_${opt.key}`] || '0';
    });
    setSettings(updated);
  }, [userSettings]);

  const handleToggleChange = (key: string, checked: boolean) => {
    setSettings(prev => ({
      ...prev,
      [`payroll_method_enabled_${key}`]: checked
    }));
  };

  const handleFeeTypeChange = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [`payroll_method_fee_type_${key}`]: value
    }));
  };

  const handleFeePercentageChange = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [`payroll_method_fee_percentage_${key}`]: value
    }));
  };

  const handleFeeFixedChange = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [`payroll_method_fee_fixed_${key}`]: value
    }));
  };

  const saveSettings = () => {
    setIsLoading(true);
    const formData = new FormData();

    paymentOptions.forEach(opt => {
      formData.append(
        `settings[payroll_method_enabled_${opt.key}]`, 
        settings[`payroll_method_enabled_${opt.key}`] ? 'on' : 'off'
      );
      formData.append(
        `settings[payroll_method_fee_type_${opt.key}]`, 
        settings[`payroll_method_fee_type_${opt.key}`] || 'percentage'
      );
      formData.append(
        `settings[payroll_method_fee_percentage_${opt.key}]`, 
        settings[`payroll_method_fee_percentage_${opt.key}`] || '0'
      );
      formData.append(
        `settings[payroll_method_fee_fixed_${opt.key}]`, 
        settings[`payroll_method_fee_fixed_${opt.key}`] || '0'
      );
      // Legacy compatibility:
      formData.append(
        `settings[payroll_method_fee_${opt.key}]`, 
        settings[`payroll_method_fee_percentage_${opt.key}`] || '0'
      );
    });

    router.post(route('settings.company.update'), formData, {
      preserveScroll: true,
      onSuccess: (page) => {
        setIsLoading(false);
        const successMessage = (page.props.flash as any)?.success;
        const errorMessage = (page.props.flash as any)?.error;
        if (successMessage) {
          toast.success(successMessage);
        } else if (errorMessage) {
          toast.error(errorMessage);
        } else {
          toast.success(t('Payroll settings saved successfully.'));
        }
      },
      onError: (errors) => {
        setIsLoading(false);
        const errorMessage = errors.error || Object.values(errors).join(', ') || t('Failed to save payroll settings');
        toast.error(errorMessage);
      }
    });
  };

  return (
    <Card className="border border-slate-100 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-5">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <DollarSign className="h-5 w-5 text-primary" />
            {t('Payroll Payment Methods')}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t('Enable/disable company payroll payment options and set their transaction fees.')}
          </p>
        </div>
        {canEdit && (
          <Button onClick={saveSettings} disabled={isLoading} size="sm" className="gap-2">
            <Save className="h-4 w-4" />
            {isLoading ? t('Saving...') : t('Save Settings')}
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {paymentOptions.map((opt) => {
              const isEnabled = settings[`payroll_method_enabled_${opt.key}`];

              return (
                <div 
                  key={opt.key} 
                  className={`flex flex-col lg:flex-row lg:items-center justify-between p-4 border rounded-xl gap-4 transition-all duration-200 ${
                    isEnabled 
                      ? 'border-slate-200 bg-white shadow-sm' 
                      : 'border-slate-100 bg-slate-50/50 opacity-75'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="text-base font-semibold text-slate-800">{opt.label}</h4>
                      {isEnabled ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {t('Enabled')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                          {t('Disabled')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {opt.key === 'bank_transfer' 
                        ? t('Allow bank wire, ACH, SEPA, and FPS payments.')
                        : opt.key === 'cards_transfer'
                        ? t('Allow direct debit card transfers.')
                        : t('Allow payments using this platform.')}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-2 lg:mt-0">
                    {isEnabled && (
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Fee Type Dropdown */}
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`fee_type_${opt.key}`} className="text-sm font-medium text-slate-700 whitespace-nowrap">
                            {t('Fee Type')}
                          </Label>
                          <Select
                            value={settings[`payroll_method_fee_type_${opt.key}`]}
                            onValueChange={(val) => handleFeeTypeChange(opt.key, val)}
                            disabled={!canEdit}
                          >
                            <SelectTrigger id={`fee_type_${opt.key}`} className="w-40 h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">{t('Percentage')}</SelectItem>
                              <SelectItem value="fixed">{t('Fixed Fee')}</SelectItem>
                              <SelectItem value="both">{t('Percentage + Fixed')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Percentage Fee Input (Visible if percentage or both) */}
                        {(settings[`payroll_method_fee_type_${opt.key}`] === 'percentage' || 
                          settings[`payroll_method_fee_type_${opt.key}`] === 'both') && (
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`fee_pct_${opt.key}`} className="text-sm font-medium text-slate-700 whitespace-nowrap">
                              {t('Fee (%)')}
                            </Label>
                            <Input
                              id={`fee_pct_${opt.key}`}
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={settings[`payroll_method_fee_percentage_${opt.key}`]}
                              onChange={(e) => handleFeePercentageChange(opt.key, e.target.value)}
                              placeholder="0.00"
                              className="w-20 h-9 text-center font-medium"
                              disabled={!canEdit}
                            />
                          </div>
                        )}

                        {/* Fixed Fee Input (Visible if fixed or both) */}
                        {(settings[`payroll_method_fee_type_${opt.key}`] === 'fixed' || 
                          settings[`payroll_method_fee_type_${opt.key}`] === 'both') && (
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`fee_fixed_${opt.key}`} className="text-sm font-medium text-slate-700 whitespace-nowrap">
                              {t('Fixed Fee')}
                            </Label>
                            <Input
                              id={`fee_fixed_${opt.key}`}
                              type="number"
                              step="0.01;0.1;1"
                              min="0"
                              value={settings[`payroll_method_fee_fixed_${opt.key}`]}
                              onChange={(e) => handleFeeFixedChange(opt.key, e.target.value)}
                              placeholder="0.00"
                              className="w-24 h-9 text-center font-medium"
                              disabled={!canEdit}
                            />
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center self-end sm:self-auto">
                      <Switch
                        id={`enable_${opt.key}`}
                        checked={isEnabled}
                        onCheckedChange={(checked) => handleToggleChange(opt.key, checked)}
                        disabled={!canEdit}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
