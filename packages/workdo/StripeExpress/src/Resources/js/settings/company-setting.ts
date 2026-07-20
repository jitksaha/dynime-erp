import { CreditCard } from 'lucide-react';

export const getStripeExpressCompanySettings = (t: (key: string) => string) => {
  return {
    title: t('Stripe Express (On-Site)'),
    href: '#stripe-express-settings',
    icon: CreditCard,
    order: 1710,
    permission: 'edit-company-settings',
    component: 'stripe-express-settings',
  };
};
