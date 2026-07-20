import { CreditCard } from 'lucide-react';

export const getKeealCompanySettings = (t: (key: string) => string) => {
  return {
    title: t('Keeal'),
    href: '#keeal-settings',
    icon: CreditCard,
    order: 1700,
    permission: 'edit-company-settings',
    component: 'keeal-settings',
  };
};
