import { Smartphone } from 'lucide-react';

export const getBkashSuperAdminSettings = (t: (key: string) => string) => {
  return {
    title: t('bKash'),
    href: '#bkash-settings',
    icon: Smartphone,
    order: 1730,
    permission: 'edit-system-settings',
    component: 'bkash-settings',
  };
};
