import { RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import { usePage } from '@inertiajs/react';
import { getAdminSetting, getPackageFavicon } from '@/utils/helpers';

export const paymentMethodBtn = (data?: any) => {
    const { t } = useTranslation();
    const dodopayEnabled = getAdminSetting('dodopay_enabled');

    if (dodopayEnabled === 'on') {
        return [{
            id: 'dodopay-payment',
            dataUrl: route('payment.dodopay.store'),
            onFormSubmit: data?.onFormSubmit,
            component: (
                <div className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg w-full">
                    <RadioGroupItem value="dodopay" id="dodopay" />
                    <Label htmlFor="dodopay" className="cursor-pointer flex items-center space-x-2">
                        <div>
                            <div className="font-medium text-gray-900 dark:text-white">{t('DodoPay')}</div>
                        </div>
                        <img src={getPackageFavicon('DodoPay')} alt="DodoPay" className="h-10 w-10" />
                    </Label>
                </div>
            )
        }];
    } else {
        return [];
    }
};
