import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Cookie, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';

interface CookieConsentProps {
  settings: {
    enableCookiePopup?: boolean | string | number;
    strictlyNecessaryCookies?: boolean;
    cookieTitle?: string;
    cookieDescription?: string;
    strictlyCookieTitle?: string;
    strictlyCookieDescription?: string;
    contactUsDescription?: string;
    contactUsUrl?: string;
  };
}

export default function CookieConsent({ settings }: CookieConsentProps) {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isEnabled = settings.enableCookiePopup === true || settings.enableCookiePopup === '1' || settings.enableCookiePopup === 1;

    if (!isEnabled) {
      setIsVisible(false);
      return;
    }
    
    try {
      const consent = localStorage.getItem('cookie-consent');
      if (!consent && settings.enableCookiePopup) {
        setIsVisible(true);
      }
    } catch (error) {
      console.error('Failed to read cookie consent:', error);
      if (settings.enableCookiePopup) {
        setIsVisible(true);
      }
    }
  }, [settings.enableCookiePopup]);

  const logCookieConsent = (consent: any) => {
    router.post(route('cookie.consent.log'), {
      consent: consent,
      ip: window.location.hostname,
      userAgent: navigator.userAgent
    }, {
      preserveState: true,
      preserveScroll: true,
      onSuccess: () => {},
      onError: () => {}
    });
  };

  const createConsent = (preferences: { necessary: boolean; analytics: boolean; marketing: boolean }) => ({
    ...preferences,
    timestamp: Date.now(),
  });

  const saveConsent = (consent: any) => {
    try {
      localStorage.setItem('cookie-consent', JSON.stringify(consent));
      logCookieConsent(consent);
      setIsVisible(false);
    } catch (error) {
      console.error('Failed to save cookie consent:', error);
    }
  };

  const handleAcceptAll = () => {
    const consent = createConsent({ necessary: true, analytics: true, marketing: true });
    saveConsent(consent);
  };

  const handleReject = () => {
    const consent = createConsent({ necessary: true, analytics: false, marketing: false });
    saveConsent(consent);
  };

  const { is_demo, auth } = usePage().props as any;
  const isDemo = is_demo === true || is_demo === 1 || is_demo === '1';

  const dashboardRoutes = [
    'dashboard',
    'account.index',
    'hrm.index',
    'pos.index',
    'recruitment.index',
    'recruitment.dashboard',
    'lead.index',
    'project.dashboard.index',
    'dashboard.support-tickets',
    'dashboard.support-tickets.staff'
  ];

  const isDashboard = dashboardRoutes.some(r => route().current(r));

  if (!isVisible || !settings.enableCookiePopup) {
    return null;
  }

  if (isDemo && (!auth?.user || !isDashboard)) {
    return null;
  }

  const rawContactUrl = settings.contactUsUrl;
  const contactUrl = (!rawContactUrl || rawContactUrl.includes('example.com'))
    ? 'https://dynime.com/contact'
    : rawContactUrl;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-4xl px-4">
      <div className="bg-background/95 backdrop-blur-md border border-border/80 rounded-xl shadow-xl p-3 sm:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-muted-foreground">
        
        {/* Left Section: Info & Link */}
        <div className="flex items-start gap-2.5 flex-1">
          <div className="p-1.5 bg-primary/10 rounded-md shrink-0 mt-0.5">
            <Cookie className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground text-sm">
                {settings.cookieTitle || t('Cookie Consent')}
              </span>
              {settings.strictlyNecessaryCookies && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  {settings.strictlyCookieTitle || t('Strictly Necessary')}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-snug">
              {settings.cookieDescription || t('We use cookies to enhance your browsing experience and provide personalized content.')}{' '}
              {contactUrl && (
                <a 
                  href={contactUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-primary underline hover:text-primary/80 font-medium ml-1 inline-block"
                >
                  {t('Contact us')}
                </a>
              )}
            </p>
          </div>
        </div>

        {/* Right Section: Compact Actions */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          <Button 
            size="sm" 
            onClick={handleAcceptAll} 
            className="h-8 text-xs px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          >
            {t('Accept All')}
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleReject} 
            className="h-8 text-xs px-3 text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-950/50 font-medium"
          >
            {t('Reject')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => setIsVisible(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

      </div>
    </div>
  );
}
