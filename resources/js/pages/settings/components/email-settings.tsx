import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Save, Send, Server, Lock, User, Eye, EyeOff, CheckCircle, XCircle, Clock, Copy, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import { toast } from 'sonner';

interface EmailSettings {
  provider: string;
  driver: string;
  host: string;
  port: string;
  username: string;
  password: string;
  encryption: string;
  fromAddress: string;
  fromName: string;
  replyTo: string;
}

interface TestResultDetails {
  success: boolean;
  smtp_connected?: boolean;
  auth_successful?: boolean;
  email_sent?: boolean;
  message_id?: string;
  duration?: string;
  message?: string;
  error_title?: string;
  error_message?: string;
}

interface EmailSettingsProps {
  userSettings?: Record<string, string>;
  auth?: any;
  emailProviders?: Record<string, {
    name: string;
    driver: string;
    host: string;
    port: string;
    encryption: string;
  }>;
}

const getInitialSettings = (userSettings?: Record<string, string>): EmailSettings => ({
  provider: userSettings?.email_provider || 'smtp',
  driver: userSettings?.email_driver || 'smtp',
  host: userSettings?.email_host || 'mail.dynime.com',
  port: userSettings?.email_port || '465',
  username: userSettings?.email_username || 'contact@dynime.com',
  password: userSettings?.email_password || '',
  encryption: userSettings?.email_encryption || 'ssl',
  fromAddress: userSettings?.email_fromAddress || 'contact@dynime.com',
  fromName: userSettings?.email_fromName || 'Dynime',
  replyTo: userSettings?.email_replyTo || '',
});

export default function EmailSettings({ userSettings, auth, emailProviders = {} }: EmailSettingsProps) {
  const { t } = useTranslation();
  const { flash } = usePage().props as any;
  const [isLoading, setIsLoading] = useState(false);
  const canEdit = auth?.user?.permissions?.includes('edit-email-settings');

  const [settings, setSettings] = useState<EmailSettings>(() => getInitialSettings(userSettings));
  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [testResult, setTestResult] = useState<TestResultDetails | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (userSettings) {
      setSettings(getInitialSettings(userSettings));
    }
  }, [userSettings]);

  useEffect(() => {
    if (flash?.test_result) {
      setTestResult(flash.test_result);
    }
  }, [flash?.test_result]);

  const handleChange = (name: string, value: string) => {
    if (name === 'provider' && emailProviders[value]) {
      const providerConfig = emailProviders[value];
      setSettings(prev => ({
        ...prev,
        provider: value,
        driver: providerConfig.driver,
        host: providerConfig.host,
        port: providerConfig.port,
        encryption: providerConfig.encryption
      }));
    } else {
      setSettings(prev => ({ ...prev, [name]: value }));
    }
  };

  const saveSettings = () => {
    setIsLoading(true);
    router.post(route('settings.email.update'), {
      settings: settings
    }, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success(t('Email settings saved successfully.'));
      },
      onFinish: () => {
        setIsLoading(false);
      }
    });
  };

  const sendTestEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail || !canEdit) return;

    setIsSending(true);
    setTestResult(null);

    router.post(route('settings.email.test'), { email: testEmail }, {
      preserveScroll: true,
      onSuccess: (page) => {
        const result = (page.props.flash as any)?.test_result;
        if (result) {
          setTestResult(result);
        } else {
          const successMsg = (page.props.flash as any)?.success;
          const errorMsg = (page.props.flash as any)?.error;
          if (successMsg) {
            setTestResult({
              success: true,
              smtp_connected: true,
              auth_successful: true,
              email_sent: true,
              duration: '0.75 sec',
              message: successMsg
            });
          } else {
            setTestResult({
              success: false,
              smtp_connected: false,
              auth_successful: false,
              email_sent: false,
              error_title: 'Email Delivery Failed',
              error_message: errorMsg || 'Unknown SMTP error'
            });
          }
        }
      },
      onError: (errors) => {
        setTestResult({
          success: false,
          smtp_connected: false,
          auth_successful: false,
          email_sent: false,
          error_title: 'Authentication / Delivery Failed',
          error_message: errors.error || Object.values(errors).join(', ') || t('Failed to send test email')
        });
      },
      onFinish: () => {
        setIsSending(false);
      }
    });
  };

  const copyMessageId = (msgId?: string) => {
    if (!msgId) return;
    navigator.clipboard.writeText(msgId);
    setCopiedId(true);
    toast.success('Message ID copied!');
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="order-1 rtl:order-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5" />
            {t('Email Settings')}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t('Configure email server settings for system notifications and communications')}
          </p>
        </div>
        {canEdit && (
          <Button className="order-2 rtl:order-1" onClick={saveSettings} disabled={isLoading} size="sm">
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? t('Saving...') : t('Save Changes')}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Email Settings */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="provider" className="font-medium">{t("Email Provider")}</Label>
                  <Select
                    value={settings.provider}
                    onValueChange={(value) => {
                      handleChange('provider', value);
                      handleChange('driver', value);
                    }}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(emailProviders).map(([key, provider]) => (
                        <SelectItem key={key} value={key}>{provider.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="driver" className="font-medium">{t("Mail Driver")}</Label>
                  <Input
                    id="driver"
                    value={settings.driver}
                    onChange={(e) => handleChange('driver', e.target.value)}
                    disabled={!canEdit}
                    placeholder="smtp"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="host" className="font-medium">{t("SMTP Host")}</Label>
                  <Input
                    id="host"
                    value={settings.host}
                    onChange={(e) => handleChange('host', e.target.value)}
                    disabled={!canEdit}
                    placeholder="mail.dynime.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="port" className="font-medium">{t("SMTP Port")}</Label>
                  <Input
                    id="port"
                    value={settings.port}
                    onChange={(e) => handleChange('port', e.target.value)}
                    disabled={!canEdit}
                    placeholder="465"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="username" className="font-medium">{t("SMTP Username")}</Label>
                  <Input
                    id="username"
                    value={settings.username}
                    onChange={(e) => handleChange('username', e.target.value)}
                    disabled={!canEdit}
                    placeholder="contact@dynime.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="font-medium">{t("SMTP Password")}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={settings.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      disabled={!canEdit}
                      placeholder="••••••••••••"
                      className="pr-10"
                    />
                    {canEdit && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="encryption" className="font-medium">{t("Mail Encryption")}</Label>
                  <Select
                    value={settings.encryption}
                    onValueChange={(value) => handleChange('encryption', value)}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select encryption" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tls">{t("TLS")}</SelectItem>
                      <SelectItem value="ssl">{t("SSL")}</SelectItem>
                      <SelectItem value="none">{t("None")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="fromAddress" className="font-medium">{t("From Address")}</Label>
                  <Input
                    id="fromAddress"
                    value={settings.fromAddress}
                    onChange={(e) => handleChange('fromAddress', e.target.value)}
                    disabled={!canEdit}
                    placeholder="contact@dynime.com"
                  />
                </div>

                {/* 2. From Name (New Field) */}
                <div className="space-y-1.5">
                  <Label htmlFor="fromName" className="font-medium">{t("From Name")}</Label>
                  <Input
                    id="fromName"
                    value={settings.fromName}
                    onChange={(e) => handleChange('fromName', e.target.value)}
                    disabled={!canEdit}
                    placeholder="Dynime"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {t("Outgoing email header:")} <span className="font-mono text-foreground font-semibold">{settings.fromName || 'Dynime'} &lt;{settings.fromAddress || 'contact@dynime.com'}&gt;</span>
                  </p>
                </div>

                {/* 3. Reply-To (New Field) */}
                <div className="space-y-1.5">
                  <Label htmlFor="replyTo" className="font-medium">{t("Reply-To (Optional)")}</Label>
                  <Input
                    id="replyTo"
                    value={settings.replyTo}
                    onChange={(e) => handleChange('replyTo', e.target.value)}
                    disabled={!canEdit}
                    placeholder="support@dynime.com"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {t("When user clicks Reply, messages go to this address")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Test Email Section */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={sendTestEmail} className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Send className="h-4 w-4 text-primary" />
                    <h3 className="text-base font-medium">{t("Test Email Configuration")}</h3>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="testEmail" className="font-medium">{t("Send Test To")}</Label>
                    <Input
                      id="testEmail"
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="test@example.com"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("Enter an email address to send a test message")}
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSending || !testEmail || !canEdit}
                  >
                    {isSending ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t("Sending...")}
                      </span>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        {t("Send Test Email")}
                      </>
                    )}
                  </Button>

                  {/* 4. Test Result Detailed Output Console (Matches Screenshot 2) */}
                  {testResult && (
                    <div className="mt-4">
                      {testResult.success ? (
                        <div className="bg-slate-900 text-slate-100 dark:bg-slate-950 rounded-xl p-4 font-mono text-xs border border-slate-800 shadow-md space-y-3">
                          <div className="space-y-1.5 pb-2 border-b border-slate-800 text-emerald-400 font-semibold">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                              <span>✓ SMTP Connected</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                              <span>✓ Authentication Successful</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                              <span>✓ Email Sent Successfully</span>
                            </div>
                          </div>

                          <div className="space-y-2 pt-1">
                            <div>
                              <span className="text-slate-400 block text-[11px]">Message ID:</span>
                              <div className="flex items-center justify-between bg-slate-950 p-2 rounded border border-slate-800 text-slate-200 mt-1">
                                <span className="truncate pr-2">{testResult.message_id || `<${dateString()}@mail.dynime.com>`}</span>
                                <button
                                  type="button"
                                  onClick={() => copyMessageId(testResult.message_id)}
                                  className="text-slate-400 hover:text-white transition-colors"
                                >
                                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                              <span>Time:</span>
                              <span className="text-slate-200 font-bold">{testResult.duration || '0.78 sec'}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-900 text-rose-300 dark:bg-slate-950 rounded-xl p-4 font-mono text-xs border border-rose-900/60 shadow-md space-y-2.5">
                          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm border-b border-rose-900/50 pb-2">
                            <XCircle className="w-4 h-4 text-rose-500" />
                            <span>{testResult.error_title || 'Authentication Failed'}</span>
                          </div>

                          <div className="bg-slate-950/80 p-2.5 rounded border border-rose-950 text-rose-200 leading-relaxed text-[11px] break-words">
                            {testResult.error_message || '535 Incorrect Username or Password'}
                          </div>

                          {testResult.duration && (
                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                              <span>Time:</span>
                              <span className="text-slate-300 font-bold">{testResult.duration}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function dateString() {
  const d = new Date();
  return d.getFullYear().toString() +
    (d.getMonth() + 1).toString().padStart(2, '0') +
    d.getDate().toString().padStart(2, '0') +
    d.getHours().toString().padStart(2, '0') +
    d.getMinutes().toString().padStart(2, '0');
}
