import { Globe } from 'lucide-react';

export const getSSLCommerzSuperAdminSettings = (t: (key: string) => string) => {
  return {
    title: t('SSLCommerz'),
    href: '#sslcommerz-settings',
    icon: Globe,
    order: 1720,
    permission: 'edit-system-settings',
    component: 'sslcommerz-settings',
  };
};
