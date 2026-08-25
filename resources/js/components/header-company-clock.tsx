import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function HeaderCompanyClock() {
    const { t } = useTranslation();
    const { companyAllSetting, auth } = usePage<any>().props;

    const companyTimezone = companyAllSetting?.timezone || auth?.user?.timezone || 'America/Denver';
    const [timeStr, setTimeStr] = useState('');

    useEffect(() => {
        const updateTime = () => {
            try {
                const now = new Date();
                const formatted = now.toLocaleTimeString('en-US', {
                    timeZone: companyTimezone,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                });
                setTimeStr(formatted);
            } catch (e) {
                setTimeStr(new Date().toLocaleTimeString());
            }
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, [companyTimezone]);

    if (!timeStr) return null;

    return (
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-700 dark:text-slate-200 text-xs font-mono font-bold shadow-2xs">
            <Building2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="text-[10px] text-slate-500 font-sans uppercase font-bold mr-0.5">{t('Company')}:</span>
            <span>{timeStr}</span>
        </div>
    );
}
