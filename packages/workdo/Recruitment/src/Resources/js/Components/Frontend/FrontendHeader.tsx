import React from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Briefcase, Search } from 'lucide-react';
import { getImagePath } from '@/utils/helpers';
import { t } from 'i18next';

interface FrontendHeaderProps {
    currentPage?: string;
}

export default function FrontendHeader({ currentPage }: FrontendHeaderProps) {
    const { props } = usePage();
    const userSlug = props.userSlug as string;
    const settings = props.settings as any;
    const companyAllSetting = props.companyAllSetting as any;
    
    const logoUrl = 'https://careers.dynime.com/storage/media/KVhzkR7rCJFuzFxBU8ljBqFb2PItfQM5i3omxMNF.png';
    const logoSrc = logoUrl || (settings?.header?.logo && !settings.header.logo.includes('packages/workdo')
        ? settings.header.logo
        : (companyAllSetting?.logo_dark || companyAllSetting?.logo_light || ''));
    
    return (
        <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50 transition-all">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href={userSlug ? route('recruitment.frontend.careers.jobs.index', { userSlug }) : '/'} className="flex items-center space-x-3 group">
                        <img src={logoUrl} alt="Dynime Logo" className="h-8 md:h-9 w-auto object-contain transition-transform group-hover:scale-105" />
                        <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                            CAREERS
                        </span>
                    </Link>

                    {/* Actions */}
                    <div className="flex items-center space-x-4">
                        {currentPage === 'track-form' ? (
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex border-gray-300 text-gray-600 hover:bg-gray-50"
                                onClick={() => router.visit(userSlug ? route('recruitment.frontend.careers.jobs.index', { userSlug }) : '/')}
                                title={t('Browse Jobs')}
                            >
                                <Briefcase className="h-4 w-4 md:mr-2" />
                                <span className="hidden md:inline">{t('Browse Jobs')}</span>
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex border-gray-300 text-gray-600 hover:bg-gray-50"
                                onClick={() => router.visit(userSlug ? route('recruitment.frontend.careers.track.form', { userSlug }) : '/track')}
                                title={t('Track Application')}
                            >
                                <Search className="h-4 w-4 md:mr-2" />
                                <span className="hidden md:inline">{t('Track Application')}</span>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}