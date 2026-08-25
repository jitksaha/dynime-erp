import React from 'react';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface OnboardingInfo {
    percentage: number;
    status: 'not_started' | 'in_progress' | 'completed';
    sections: {
        personal: boolean;
        contact: boolean;
        emergency: boolean;
        address: boolean;
        employment: boolean;
        bank: boolean;
        devices: boolean;
        photo: boolean;
    };
    completed_sections: string[];
}

interface Props {
    onboardingInfo: OnboardingInfo | null;
}

export default function OnboardingBannerWidget({ onboardingInfo }: Props) {
    const { t } = useTranslation();

    if (!onboardingInfo) return null;

    const { percentage, status, sections } = onboardingInfo;

    if (status === 'completed' || percentage >= 100) {
        return (
            <Card className="bg-emerald-50/80 border-emerald-200/80 shadow-sm rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                        <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-emerald-950">
                            {t('Congratulations! Your employee profile is now 100% complete.')}
                        </h4>
                        <p className="text-xs text-emerald-700 font-normal">
                            {t('Thank you for completing your onboarding details. All reminders have been cleared.')}
                        </p>
                    </div>
                </div>
            </Card>
        );
    }

    const pendingCount = Object.values(sections).filter(v => !v).length;

    return (
        <Card className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white border-0 shadow-lg rounded-2xl overflow-hidden mb-6">
            <CardContent className="p-5">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {t('Action Required')}
                            </span>
                            <span className="text-xs text-slate-300 font-normal">
                                {t('Complete Employee Profile Setup')}
                            </span>
                        </div>

                        <h3 className="text-base font-semibold text-white">
                            {t('Welcome to Dynime OS! Complete your profile to unlock full access.')}
                        </h3>

                        <p className="text-xs text-slate-300 max-w-2xl font-normal">
                            {t('Before you begin using all features, please complete your onboarding profile. It only takes a few minutes.')}
                        </p>

                        {/* Progress Bar */}
                        <div className="space-y-1.5 pt-1 max-w-md">
                            <div className="flex justify-between text-xs font-normal">
                                <span className="text-slate-200">{t('Profile Completion Progress')}</span>
                                <span className="font-semibold text-amber-300">{percentage}%</span>
                            </div>
                            <div className="w-full bg-slate-700/80 rounded-full h-2.5 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="shrink-0 pt-2 md:pt-0">
                        <Link href={route('hrm.onboarding.index')}>
                            <Button className="bg-white hover:bg-slate-100 text-indigo-950 font-medium text-xs rounded-xl shadow-md gap-2 h-10 px-5">
                                {t('Continue Setup')} ({pendingCount} {t('Pending')})
                                <ArrowRight className="w-4 h-4 text-indigo-600" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
