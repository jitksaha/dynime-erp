import { useState, Suspense, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { allSettingsItems } from '@/utils/settings';
import { getSettingsComponent } from '@/utils/settings-components';
import { ChevronDown, ChevronRight, CreditCard } from 'lucide-react';

const PAYMENT_GATEWAY_COMPONENTS = [
  'stripe', 'paypal', 'mollie', 'razorpay', 'payfast', 'yookassa', 'paytabs', 
  'toyyibpay', 'iyzipay', 'paytr', 'aamarpay', 'benefit', 'cashfree', 'coingate', 
  'mercado', 'midtrans', 'xendit', 'tap', 'dodopay', 'authorizenet', 'cinetpay', 
  'easebuzz', 'fedapay', 'khalti', 'ozow', 'paiementpro', 'payhere', 'paystack', 
  'paytab', 'bank-transfer'
];

const isPaymentGateway = (componentName: string) => {
  const name = componentName.toLowerCase();
  return PAYMENT_GATEWAY_COMPONENTS.some(gw => name.includes(gw)) || name.includes('payment');
};

export default function Settings() {
  const { t } = useTranslation();
  const { auth, globalSettings = {}, emailProviders = {}, cacheSize = '0.00' } = usePage().props as any;
  const [activeSection, setActiveSection] = useState('brand-settings');
  const [isGatewaysExpanded, setIsGatewaysExpanded] = useState(false);

  const sidebarNavItems = allSettingsItems();

  const gatewayItems = sidebarNavItems.filter(item => isPaymentGateway(item.component));
  const coreItems = sidebarNavItems.filter(item => !isPaymentGateway(item.component));

  const handleNavClick = (href: string) => {
    const id = href.replace('#', '');
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  useEffect(() => {
    const isActiveGateway = gatewayItems.some(item => activeSection === item.href.replace('#', ''));
    if (isActiveGateway) {
      setIsGatewaysExpanded(true);
    }
  }, [activeSection, gatewayItems]);

  useEffect(() => {
    const handleScroll = () => {
      const sections = sidebarNavItems.map(item => item.href.replace('#', ''));

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sidebarNavItems]);

  return (
    <AuthenticatedLayout
      breadcrumbs={[{ label: t('Settings') }]}
      pageTitle={t('Settings')}
    >
      <Head title={t('Settings')} />

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="md:w-64 flex-shrink-0">
          <div className="sticky top-4">
            <ScrollArea className="h-[calc(100vh-8rem)]">
              <div className="pr-4 space-y-1">
                {/* Core Items */}
                {coreItems.map((item) => (
                  <Button
                    key={item.href}
                    variant="ghost"
                    className={cn('w-full justify-start', {
                      'bg-muted font-medium': activeSection === item.href.replace('#', ''),
                    })}
                    onClick={() => handleNavClick(item.href)}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.title}
                  </Button>
                ))}

                {/* Collapsible Gateways Items */}
                {gatewayItems.length > 0 && (
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-between hover:bg-muted/50 text-left font-normal"
                      onClick={() => setIsGatewaysExpanded(!isGatewaysExpanded)}
                    >
                      <span className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-2" />
                        {t('Payment Gateways')}
                      </span>
                      {isGatewaysExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                    
                    {isGatewaysExpanded && (
                      <div className="pl-4 space-y-1 border-l ml-4 mt-1">
                        {gatewayItems.map((item) => (
                          <Button
                            key={item.href}
                            variant="ghost"
                            size="sm"
                            className={cn('w-full justify-start text-xs h-8 font-normal', {
                              'bg-muted font-semibold text-primary': activeSection === item.href.replace('#', ''),
                            })}
                            onClick={() => handleNavClick(item.href)}
                          >
                            {item.title}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="pr-4">
              {sidebarNavItems.map((item) => {
            const sectionId = item.href.replace('#', '');
            const canManage = auth.user?.permissions?.includes(item.permission);

            if (!canManage) return null;

            const Component = getSettingsComponent(item.component);
            if (!Component) return null;

            return (
              <section key={sectionId} id={sectionId} className="mb-8">
                <Suspense fallback={<div className="p-4">Loading...</div>}>
                  <Component
                    userSettings={globalSettings}
                    auth={auth}
                    emailProviders={emailProviders}
                    cacheSize={cacheSize}
                  />
                </Suspense>
              </section>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
