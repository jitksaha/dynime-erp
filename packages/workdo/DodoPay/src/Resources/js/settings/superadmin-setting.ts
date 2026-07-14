import { CreditCard } from 'lucide-react';

export interface SettingMenuItem {
  order: number;
  title: string;
  href: string;
  icon: any;
  permission: string;
  component: string;
}

export const getDodoPaySuperAdminSettings = (t: (key: string) => string): SettingMenuItem[] => [
  {
    order: 1020,
    title: t('DodoPay Settings'),
    href: '#dodopay-settings',
    icon: CreditCard,
    permission: 'manage-dodopay-settings',
    component: 'dodopay-settings'
  }
];
