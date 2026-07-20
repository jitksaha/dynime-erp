import { CreditCard } from 'lucide-react';

export const getKeealSuperAdminSettings = (t: (key: string) => string) => {
  return {
    title: t('Keeal'),
    href: '#keeal-settings',
    icon: CreditCard,
    order: 1700,
    permission: 'edit-system-settings',
    component: 'keeal-settings',
  };
};
