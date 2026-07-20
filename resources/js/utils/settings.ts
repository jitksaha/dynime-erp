import { SettingMenuItem } from './menus/superadmin-setting';
import { getSuperAdminSettings } from './menus/superadmin-setting';
import { getCompanySettings } from './menus/company-setting';
import { usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

// Get role-based core settings items
const getCoreSettingsItems = (userRoles: string[], t: (key: string) => string): SettingMenuItem[] => {
    if (userRoles.includes('superadmin')) {
        return getSuperAdminSettings(t);
    }
    return getCompanySettings(t);
};

// Auto-load package settings based on activated packages
const getPackageSettingsItems = (userRoles: string[], activatedPackages: string[], t: (key: string) => string): SettingMenuItem[] => {
    const menuItems: SettingMenuItem[] = [];
    const settingType = userRoles.includes('superadmin') ? 'superadmin-setting' : 'company-setting';

    const allModules = userRoles.includes('superadmin')
        ? import.meta.glob('../../../packages/workdo/*/src/Resources/js/settings/superadmin-setting.ts', { eager: true })
        : import.meta.glob('../../../packages/workdo/*/src/Resources/js/settings/company-setting.ts', { eager: true });

    const activatedLower = (Array.isArray(activatedPackages) ? activatedPackages : []).map(p => String(p).toLowerCase());

    Object.entries(allModules).forEach(([path, module]: [string, any]) => {
        const match = path.match(/\/packages\/workdo\/([^/]+)\//i);
        if (match) {
            const pkgNameOnDisk = match[1];
            if (activatedLower.includes(pkgNameOnDisk.toLowerCase())) {
                if (module) {
                    Object.values(module).forEach((item: any) => {
                        const result = typeof item === 'function' ? item(t) : item;
                        const items = Array.isArray(result) ? result : [result];
                        menuItems.push(...items);
                    });
                }
            }
        }
    });

    return menuItems;
};

// Filter settings items based on permissions
const filterByPermission = (items: SettingMenuItem[], userPermissions: string[], userRoles: string[]): SettingMenuItem[] => {
    return items.filter(item => {
        if (!item.permission) return true;
        if (userRoles.includes('superadmin') || userRoles.includes('company')) return true;
        return userPermissions.includes(item.permission);
    });
};

// Main function to get filtered settings items
export const allSettingsItems = (): SettingMenuItem[] => {
    const { auth } = usePage().props as any;
    const { t } = useTranslation();
    const userPermissions = auth?.user?.permissions || [];
    const userRoles = auth?.user?.roles || [];
    const activatedPackages = auth?.user?.activatedPackages || [];

    const coreSettingsItems = getCoreSettingsItems(userRoles, t);
    const packageSettingsItems = getPackageSettingsItems(userRoles, activatedPackages, t);

    const allItems = [...coreSettingsItems, ...packageSettingsItems];

    // Sort by order
    const sortedItems = allItems.sort((a, b) => (a.order || 999) - (b.order || 999));

    return filterByPermission(sortedItems, userPermissions, userRoles);
};