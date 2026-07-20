import { Globe } from 'lucide-react';

export const getSSLCommerzCompanySettings = (t: (key: string) => string) => {
  return {
    title: t('SSLCommerz'),
    href: '#sslcommerz-settings',
    icon: Globe,
    order: 1720,
    permission: 'edit-company-settings',
    component: 'sslcommerz-settings',
  };
};
