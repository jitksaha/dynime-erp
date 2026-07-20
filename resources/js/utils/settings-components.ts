import { lazy } from 'react';
import { usePage } from '@inertiajs/react';

// Core settings components
const coreComponents = {
  'brand-settings': lazy(() => import('@/pages/settings/components/brand-settings')),
  'company-settings': lazy(() => import('@/pages/settings/components/company-settings')),
  'system-settings': lazy(() => import('@/pages/settings/components/system-settings')),
  'currency-settings': lazy(() => import('@/pages/settings/components/currency-settings')),
  'seo-settings': lazy(() => import('@/pages/settings/components/seo-settings')),
  'storage-settings': lazy(() => import('@/pages/settings/components/storage-settings')),
  'email-settings': lazy(() => import('@/pages/settings/components/email-settings')),
  'cpanel-email-settings': lazy(() => import('@/pages/settings/components/cpanel-email-settings')),
  'pusher-settings': lazy(() => import('@/pages/settings/components/pusher-settings')),
  'email-notification-settings': lazy(() => import('@/pages/settings/components/email-notification-settings')),
  'cookie-settings': lazy(() => import('@/pages/settings/components/cookie-settings')),
  'bank-transfer-settings': lazy(() => import('@/pages/settings/components/bank-transfer-settings')),
  'cache-settings': lazy(() => import('@/pages/settings/components/cache-settings')),
  'add-on-manager': lazy(() => import('@/pages/settings/components/addon-settings')),
};

// Auto-load package components
const getPackageComponents = (activatedPackages: string[]) => {
  try {
    const modules = import.meta.glob('../../../packages/workdo/*/src/Resources/js/settings/components/*.tsx');
    const packageComponents: Record<string, any> = {};
    const activatedLower = (Array.isArray(activatedPackages) ? activatedPackages : []).map(p => String(p).toLowerCase());

    Object.entries(modules).forEach(([path, moduleLoader]) => {
      const matchPkg = path.match(/\/packages\/workdo\/([^/]+)\//i);
      if (matchPkg) {
        const pkgNameOnDisk = matchPkg[1];
        if (activatedLower.includes(pkgNameOnDisk.toLowerCase())) {
          const matchComp = path.match(/\/([^/]+)\.tsx$/);
          if (matchComp) {
            const componentName = matchComp[1];
            packageComponents[componentName] = lazy(() => moduleLoader() as any);
          }
        }
      }
    });

    return packageComponents;
  } catch (error) {
    return {};
  }
};

// Combined components registry
export const getSettingsComponent = (componentName: string) => {
  const { auth } = usePage().props as any;
  const activatedPackages = auth?.user?.activatedPackages || [];
  const allComponents = { ...coreComponents, ...getPackageComponents(activatedPackages) };
  return allComponents[componentName as keyof typeof allComponents] || null;
};
