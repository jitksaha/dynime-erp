import { DollarSign } from 'lucide-react';

export interface SettingMenuItem {
  order: number;
  title: string;
  href: string;
  icon: any;
  permission: string;
  component: string;
}

export const getPayrollCompanySettings = (t: (key: string) => string): SettingMenuItem[] => [
  {
    order: 1010,
    title: t('Payroll Settings'),
    href: '#payroll-settings',
    icon: DollarSign,
    permission: 'manage-company-settings',
    component: 'payroll-settings'
  }
];
