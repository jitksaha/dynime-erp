import React, { useState } from 'react';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Head } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
import { 
    Download, 
    ExternalLink, 
    Play, 
    CheckCircle2, 
    ShieldCheck, 
    Clock, 
    Sparkles, 
    KeyRound, 
    Video, 
    AlertCircle, 
    ArrowRight,
    Monitor,
    Laptop,
    Check,
    Smartphone,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function Downloads({ auth }: any) {
    const { t } = useTranslation();

    const [videoModalOpen, setVideoModalOpen] = useState(false);
    const [selectedOsVideo, setSelectedOsVideo] = useState<'windows' | 'mac'>('windows');

    const partnerIllustration = "https://cdn.prod.website-files.com/65efe5c22fe5c01bbd337a5f/65f2982505195163e50f0f8d_60cd7821c2d010f6e180122a_clockinout.svg";
    const workfolioDownloadUrl = "https://www.getworkfolio.com/downloads";

    const videoIds = {
        mac: 'tn8xNmrDf0k',
        windows: 'w4rqYIphI_s'
    };

    const openVideoModal = (os: 'windows' | 'mac' = 'windows') => {
        setSelectedOsVideo(os);
        setVideoModalOpen(true);
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                {t('Time Tracker & Partner Integration')}
                            </h2>
                            <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[10px] font-bold">
                                {t('Workfolio Active')}
                            </Badge>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {t('Official desktop time tracking, performance calculation, and setup guide.')}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <a
                            href={workfolioDownloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>{t('Download Workfolio')}</span>
                            <ExternalLink className="w-3 h-3 opacity-70 ml-0.5" />
                        </a>
                    </div>
                </div>
            }
        >
            <Head title={t('Time Tracker - Workfolio Partner')} />

            <div className="max-w-6xl mx-auto space-y-6">

                {/* Notice Banner: Dtime Trace Postponed */}
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-amber-900 dark:text-amber-300">
                    <div className="flex items-center gap-2.5">
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="text-xs font-semibold">
                            <strong>{t('System Update:')}</strong> {t('Dtime Trace application is currently postponed. We are using our official partner time tracker Workfolio for automated performance & time tracking.')}
                        </span>
                    </div>
                    <Badge variant="outline" className="bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700 text-[10px] font-bold whitespace-nowrap shrink-0">
                        {t('Partner Integration')}
                    </Badge>
                </div>

                {/* Main Hero Card */}
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                    <CardContent className="p-6 md:p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                            
                            {/* Left Col (7): Description, Rules, Action Buttons */}
                            <div className="lg:col-span-7 space-y-5">
                                <div className="space-y-2">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold">
                                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                                        {t('Official Partner: Workfolio Time Tracer')}
                                    </div>
                                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                        {t('Workfolio Performance & Time Tracker')}
                                    </h1>
                                    <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                        {t('Workfolio tracks activity, shift duration, and work output seamlessly. Download and install Workfolio on your desktop computer to ensure your shift hours and daily performance metrics are properly calculated.')}
                                    </p>
                                </div>

                                {/* CRITICAL PERFORMANCE RULE BOX */}
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-purple-50/40 to-slate-50 border-2 border-indigo-200/90 dark:from-slate-800 dark:to-slate-900 dark:border-indigo-800/80 space-y-2 relative overflow-hidden shadow-xs">
                                    <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-extrabold text-xs uppercase tracking-wider">
                                        <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                        <span>{t('Required Performance Rule')}</span>
                                    </div>
                                    <p className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">
                                        "{t('Please turn on your dashboard clock in and please clock in as well on Workfolio to calculate your performance.')}"
                                    </p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        {t('Clocking in on both Dynime ERP Dashboard and Workfolio guarantees accurate payroll, attendance score, and productivity logs.')}
                                    </p>
                                </div>

                                {/* ACTION BUTTONS */}
                                <div className="flex flex-wrap items-center gap-3 pt-1">
                                    <a
                                        href={workfolioDownloadUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-200 dark:shadow-none transition-all hover:scale-[1.02]"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span>{t('Download Workfolio App')}</span>
                                        <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                                    </a>

                                    <button
                                        type="button"
                                        onClick={() => openVideoModal('windows')}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-extrabold text-xs transition-all hover:scale-[1.02] cursor-pointer"
                                    >
                                        <Video className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                                        <span>{t('Watch Installation Guides')}</span>
                                    </button>
                                </div>

                            </div>

                            {/* Right Col (5): Partner Illustration SVG */}
                            <div className="lg:col-span-5 flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <img
                                    src={partnerIllustration}
                                    alt="Workfolio Clock In Out Partner Time Tracer"
                                    className="w-full max-w-[340px] h-auto object-contain hover:scale-105 transition-transform duration-500"
                                />
                            </div>

                        </div>
                    </CardContent>
                </Card>

                {/* 3 Step Setup & HR Access Instructions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Step 1: HR Access Notice */}
                    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs hover:shadow-md transition-shadow">
                        <CardContent className="p-5 space-y-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                <KeyRound className="w-5 h-5" />
                            </div>
                            <div>
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 text-[10px] font-bold mb-1.5">
                                    {t('Step 1: Credentials')}
                                </Badge>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                    {t('Ask HR for Workfolio Access')}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                    {t('Ask your HR Manager or Company Administrator to invite your email and grant access credentials for Workfolio.')}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Step 2: Download Workfolio */}
                    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs hover:shadow-md transition-shadow">
                        <CardContent className="p-5 space-y-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <Monitor className="w-5 h-5" />
                            </div>
                            <div>
                                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 text-[10px] font-bold mb-1.5">
                                    {t('Step 2: Desktop App')}
                                </Badge>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                    {t('Download & Install Software')}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                    {t('Download the Workfolio desktop tracker for Windows, Mac, or Linux and log in with your credentials.')}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Step 3: Dual Clock In */}
                    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs hover:shadow-md transition-shadow">
                        <CardContent className="p-5 space-y-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 text-[10px] font-bold mb-1.5">
                                    {t('Step 3: Dual Clock In')}
                                </Badge>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                    {t('Clock In on Dashboard & App')}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                    {t('Turn on your Dynime ERP dashboard clock-in and start shift in Workfolio at the beginning of each workday.')}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* Resource Links Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Download Hub Card */}
                    <Card className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl shadow-md overflow-hidden relative border border-indigo-800">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
                                    <Laptop className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 px-2.5 py-1 rounded-full border border-indigo-400/20">
                                    {t('Cross Platform')}
                                </span>
                            </div>

                            <div>
                                <h3 className="text-lg font-extrabold text-white">
                                    {t('Workfolio Official Downloads')}
                                </h3>
                                <p className="text-xs text-indigo-200 mt-1 leading-relaxed">
                                    {t('Available for Windows, macOS, and Linux desktop operating systems.')}
                                </p>
                            </div>

                            <div className="pt-2">
                                <a
                                    href={workfolioDownloadUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-indigo-950 font-extrabold text-xs shadow-md transition-colors"
                                >
                                    <Download className="w-4 h-4 text-indigo-600" />
                                    <span>{t('Go to Workfolio Downloads Page')}</span>
                                    <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
                                </a>
                            </div>
                        </CardContent>
                    </Card>

                    {/* YouTube Video Tutorials Card with Interactive Video Popups */}
                    <Card className="bg-gradient-to-br from-rose-900 via-slate-900 to-slate-950 text-white rounded-2xl shadow-md overflow-hidden relative border border-rose-800/80">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-300">
                                    <Video className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/30 text-rose-200 px-2.5 py-1 rounded-full border border-rose-400/20">
                                    {t('Video Tutorials')}
                                </span>
                            </div>

                            <div>
                                <h3 className="text-lg font-extrabold text-white">
                                    {t('Workfolio Installation Video Guides')}
                                </h3>
                                <p className="text-xs text-rose-200 mt-1 leading-relaxed">
                                    {t('Watch step-by-step video setup instructions for Windows and macOS.')}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                                <button
                                    type="button"
                                    onClick={() => openVideoModal('windows')}
                                    className="inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all hover:scale-[1.02] cursor-pointer"
                                >
                                    <Play className="w-3.5 h-3.5 fill-current" />
                                    <span>{t('Watch Windows Guide')}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => openVideoModal('mac')}
                                    className="inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md transition-all hover:scale-[1.02] cursor-pointer"
                                >
                                    <Play className="w-3.5 h-3.5 fill-current" />
                                    <span>{t('Watch macOS Guide')}</span>
                                </button>
                            </div>
                        </CardContent>
                    </Card>

                </div>

            </div>

            {/* Clean White Basement Video Popup Modal */}
            <Dialog open={videoModalOpen} onOpenChange={setVideoModalOpen}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl">
                    <div className="flex flex-col">
                        
                        {/* Header Bar */}
                        <div className="p-4 sm:p-5 bg-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
                                    <Video className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <DialogTitle className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                                            {t('Workfolio Setup & Installation Guide')}
                                        </DialogTitle>
                                        <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-extrabold py-0.5">
                                            {t('Official Tutorial')}
                                        </Badge>
                                    </div>
                                    <DialogDescription className="text-xs text-slate-500 mt-0.5">
                                        {t('Step-by-step visual guide for desktop application setup.')}
                                    </DialogDescription>
                                </div>
                            </div>

                            {/* OS Segmented Control Switcher */}
                            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/90 gap-1 shrink-0 self-start sm:self-auto">
                                <button
                                    type="button"
                                    onClick={() => setSelectedOsVideo('windows')}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                        selectedOsVideo === 'windows'
                                            ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                                    }`}
                                >
                                    <span>🪟 Windows Guide</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setSelectedOsVideo('mac')}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                        selectedOsVideo === 'mac'
                                            ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                                    }`}
                                >
                                    <span>🍎 macOS Guide</span>
                                </button>
                            </div>
                        </div>

                        {/* Full Aspect Video Player Box with YouTube Branding, Title & Channel Logo Hidden */}
                        <div className="p-3 bg-slate-50/70">
                            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-slate-200 shadow-inner flex items-center justify-center">
                                {videoModalOpen && (
                                    <iframe
                                        src={`https://www.youtube-nocookie.com/embed/${videoIds[selectedOsVideo]}?autoplay=1&controls=1&rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&disablekb=0`}
                                        title={`Workfolio Installation Guide - ${selectedOsVideo}`}
                                        className="absolute inset-0 w-full h-[124%] -top-[12%] border-0 scale-[1.02]"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                )}
                            </div>
                        </div>

                        {/* Modal Footer Bar */}
                        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="font-semibold text-slate-700">Guide Mode:</span>
                                <Badge variant="outline" className="bg-white text-slate-800 border-slate-200 font-mono text-[11px] px-2.5 py-0.5 shadow-2xs">
                                    {selectedOsVideo === 'windows' ? '🪟 Windows 10 / 11 Installation' : '🍎 macOS Apple Silicon & Intel Setup'}
                                </Badge>
                            </div>

                            <div className="flex items-center gap-2">
                                <a
                                    href={workfolioDownloadUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>{t('Download Installer App')}</span>
                                    <ExternalLink className="w-3 h-3 opacity-80" />
                                </a>
                            </div>
                        </div>

                    </div>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
