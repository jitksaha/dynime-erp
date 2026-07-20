import { Smartphone } from 'lucide-react';

export const getBkashCompanySettings = (t: (key: string) => string) => {
  return {
    title: t('bKash'),
    href: '#bkash-settings',
    icon: Smartphone,
    order: 1730,
    permission: 'edit-company-settings',
    component: 'bkash-settings',
  };
};
