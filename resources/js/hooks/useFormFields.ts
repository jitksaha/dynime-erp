import { ReactNode } from 'react';
import { usePage } from '@inertiajs/react';

interface FormField {
    id: string;
    component: ReactNode;
    order?: number;
}

export const useFormFields = (hookName: string, data: any, setData: any, errors: any, mode: string = 'create', ...additionalParams: any[]): FormField[] => {
    try {
        const { auth } = usePage().props as any;
        const activatedPackages = auth?.user?.activatedPackages || [];
        const allModules = import.meta.glob('../../../packages/workdo/*/src/Resources/js/fields/fields.tsx', { eager: true });

        const fields: FormField[] = [];

        const activatedLower = (Array.isArray(activatedPackages) ? activatedPackages : []).map(p => String(p).toLowerCase());

        Object.entries(allModules).forEach(([path, module]: [string, any]) => {
            const match = path.match(/\/packages\/workdo\/([^/]+)\//i);
            if (match) {
                const pkgNameOnDisk = match[1];
                if (activatedLower.includes(pkgNameOnDisk.toLowerCase())) {
                    if (module && module[hookName]) {
                        const fieldExport = module[hookName];
                        if (typeof fieldExport === 'function') {
                            try {
                                const fieldComponents = fieldExport(data, setData, errors, mode, ...additionalParams);
                                if (Array.isArray(fieldComponents)) {
                                    fields.push(...fieldComponents);
                                } else if (fieldComponents) {
                                    fields.push(fieldComponents);
                                }
                            } catch (error) {
                                // Silent error handling
                            }
                        }
                    }
                }
            }
        });

        return fields.sort((a, b) => (a.order || 999) - (b.order || 999));
    } catch (error) {
        return [];
    }
};