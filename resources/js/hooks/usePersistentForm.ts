import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';

/**
 * A custom hook that wraps Inertia's useForm hook to persist the form data in localStorage.
 * Automatically handles serialization and ignores non-serializable types like File or Blob.
 */
export function usePersistentForm<TForm extends Record<string, any>>(
    storageKey: string,
    initialValues: TForm
) {
    // 1. Retrieve and merge saved data from localStorage on initialization
    const savedValues = (() => {
        try {
            const raw = localStorage.getItem(storageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                // Merge to ensure default fields exist even if structure changes
                return { ...initialValues, ...parsed };
            }
        } catch (e) {
            console.warn('Failed to parse saved form data from localStorage:', e);
        }
        return initialValues;
    })();

    // 2. Initialize Inertia useForm hook
    const form = useForm<TForm>(savedValues);

    // 3. Keep localStorage in sync with form data changes, omitting files/non-serializable types
    useEffect(() => {
        const sanitize = (value: any): any => {
            if (value === null || value === undefined) {
                return value;
            }
            if (
                value instanceof File ||
                value instanceof FileList ||
                value instanceof Blob ||
                (typeof value === 'object' && value.constructor && value.constructor.name === 'File')
            ) {
                return null;
            }
            if (Array.isArray(value)) {
                return value.map(sanitize);
            }
            if (typeof value === 'object') {
                const result: any = {};
                for (const key in value) {
                    if (Object.prototype.hasOwnProperty.call(value, key)) {
                        result[key] = sanitize(value[key]);
                    }
                }
                return result;
            }
            return value;
        };

        try {
            const sanitized = sanitize(form.data);
            localStorage.setItem(storageKey, JSON.stringify(sanitized));
        } catch (e) {
            console.error('Failed to save form data to localStorage:', e);
        }
    }, [form.data, storageKey]);

    // 4. Utility to manually clear the storage once the action is complete
    const clearStorage = () => {
        try {
            localStorage.removeItem(storageKey);
        } catch (e) {
            console.error('Failed to clear form data from localStorage:', e);
        }
    };

    return {
        ...form,
        clearStorage,
    };
}
