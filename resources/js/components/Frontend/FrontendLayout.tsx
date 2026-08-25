import React, { useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import FrontendHeader from './FrontendHeader';
import FrontendFooter from './FrontendFooter';
import { getImagePath } from '@/utils/helpers';

interface FrontendLayoutProps {
    children: React.ReactNode;
    title: string;
    description?: string;
    currentPage?: string;
}

export default function FrontendLayout({ children, title, description = 'Find your dream job with us', currentPage }: FrontendLayoutProps) {
    const { props } = usePage();
    const userSlug = props.userSlug as string;
    const settings = props.settings as any;
    const companyAllSetting = props.companyAllSetting as any;

    useEffect(() => {
        const themeColors = {
            blue: '#3b82f6',
            green: '#10b77f',
            purple: '#8b5cf6',
            orange: '#f97316',
            red: '#ef4444'
        };
        
        const themeColor = companyAllSetting?.themeColor || 'green';
        const customColor = companyAllSetting?.customColor || '#10b77f';
        const primaryColor = themeColor === 'custom'
            ? customColor
            : themeColors[themeColor as keyof typeof themeColors] || '#10b77f';

        const root = document.documentElement;

        const hexToHsl = (hex: string) => {
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;

            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            let h = 0, s = 0, l = (max + min) / 2;

            if (max !== min) {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }

            return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
        };

        root.style.setProperty('--primary', hexToHsl(primaryColor));
        root.style.setProperty('--primary-foreground', '0 0% 98%');
    }, [companyAllSetting]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <Head title={`${settings?.site_title || 'Careers'} - ${title}`}>
                <meta name="description" content={description} />
                {settings?.favicon && <link rel="icon" href={getImagePath(settings.favicon)} />}
            </Head>

            <FrontendHeader currentPage={currentPage} />

            <main className="flex-1">
                {children}
            </main>

            <FrontendFooter />
        </div>
    );
}