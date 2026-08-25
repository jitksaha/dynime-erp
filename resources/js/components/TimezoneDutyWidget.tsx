import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { router } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Clock, Globe, Building2, MapPin, Play, Square, History, RefreshCw, CheckCircle2, Zap, AlertCircle, Send, HelpCircle, SlidersHorizontal, Sparkles, ShieldCheck, FileText, ExternalLink } from 'lucide-react';

interface TimezoneDutyWidgetProps {
    stats: any;
}

function AnalogClock({ date }: { date: Date }) {
    const seconds = date.getSeconds();
    const minutes = date.getMinutes();
    const hours = date.getHours();

    const secDeg = (seconds / 60) * 360;
    const minDeg = ((minutes + seconds / 60) / 60) * 360;
    const hourDeg = (((hours % 12) + minutes / 60) / 12) * 360;

    return (
        <div className="relative w-14 h-14 rounded-full border-2 border-indigo-600/90 bg-white shadow-xs flex items-center justify-center shrink-0">
            {[...Array(12)].map((_, i) => (
                <div
                    key={i}
                    className="absolute w-0.5 h-1 bg-slate-300 rounded-full"
                    style={{
                        transform: `rotate(${i * 30}deg) translateY(-22px)`
                    }}
                />
            ))}
            <div
                className="absolute w-1 bg-slate-900 rounded-full origin-bottom"
                style={{
                    height: '14px',
                    bottom: '50%',
                    transform: `rotate(${hourDeg}deg)`
                }}
            />
            <div
                className="absolute w-0.75 bg-indigo-600 rounded-full origin-bottom"
                style={{
                    height: '18px',
                    bottom: '50%',
                    transform: `rotate(${minDeg}deg)`
                }}
            />
            <div
                className="absolute w-0.5 bg-rose-500 rounded-full origin-bottom"
                style={{
                    height: '20px',
                    bottom: '50%',
                    transform: `rotate(${secDeg}deg)`
                }}
            />
            <div className="absolute w-1.5 h-1.5 bg-indigo-700 rounded-full border border-white z-10" />
        </div>
    );
}

export default function TimezoneDutyWidget({ stats }: TimezoneDutyWidgetProps) {
    const { t } = useTranslation();

    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [compTimeStr, setCompTimeStr] = useState('');
    const [empTimeStr, setEmpTimeStr] = useState('');
    const [utcTimeStr, setUtcTimeStr] = useState('');

    const [isClockedIn, setIsClockedIn] = useState(stats?.attendance_data?.is_clocked_in || false);
    const [clockInTime, setClockInTime] = useState(stats?.attendance_data?.clock_in_time || '');
    const [todaySessions, setTodaySessions] = useState<any[]>(stats?.attendance_data?.today_sessions || []);
    const [elapsedTime, setElapsedTime] = useState('00:00:00');
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // Flexible shift states
    const [currentShiftType, setCurrentShiftType] = useState<string>(stats?.duty_schedule_info?.current_shift_type || 'fixed');
    const [isFlexibleAllowed, setIsFlexibleAllowed] = useState<boolean>(Boolean(stats?.duty_schedule_info?.is_flexible_shift_allowed));
    const [flexibleStatus, setFlexibleStatus] = useState<string>(stats?.duty_schedule_info?.flexible_shift_status || 'none');

    const compTimezone = stats?.company_timezone_info?.timezone || 'America/Denver';
    const browserTimezone = typeof window !== 'undefined' ? (Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Dhaka') : 'Asia/Dhaka';
    const empTimezone = stats?.emp_timezone_info?.timezone && stats.emp_timezone_info.timezone !== 'UTC' ? stats.emp_timezone_info.timezone : browserTimezone;

    // Flexible shift request form states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [reasonCategory, setReasonCategory] = useState('Remote & Field Duty');
    const [requestDescription, setRequestDescription] = useState('');
    const [requestCountry, setRequestCountry] = useState(stats?.emp_timezone_info?.country || 'Bangladesh');
    const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

    useEffect(() => {
        if (stats?.duty_schedule_info) {
            if (stats.duty_schedule_info.current_shift_type) {
                setCurrentShiftType(stats.duty_schedule_info.current_shift_type);
            }
            setIsFlexibleAllowed(Boolean(stats.duty_schedule_info.is_flexible_shift_allowed));
            if (stats.duty_schedule_info.flexible_shift_status) {
                setFlexibleStatus(stats.duty_schedule_info.flexible_shift_status);
            }
        }
        if (stats?.emp_timezone_info?.country) {
            setRequestCountry(stats.emp_timezone_info.country);
        }
    }, [stats]);

    // Live automatic background sync with Dtime Trace App & Database API (5 seconds poll)
    const fetchLiveStatus = useCallback(async () => {
        try {
            setIsSyncing(true);
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch('/api/time-tracker/status', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': token || ''
                }
            });
            if (res.ok) {
                const json = await res.json();
                if (json.success && json.data) {
                    const timer = json.data.timer;
                    setIsClockedIn(timer.is_clocked_in);
                    if (timer.clock_in_time) {
                        setClockInTime(timer.clock_in_time);
                    }
                    if (timer.today_sessions && Array.isArray(timer.today_sessions)) {
                        setTodaySessions(timer.today_sessions);
                    }
                }
            }
        } catch (e) {
            // silent sync error handling
        } finally {
            setIsSyncing(false);
        }
    }, []);

    useEffect(() => {
        fetchLiveStatus();
        const syncInterval = setInterval(fetchLiveStatus, 5000);
        return () => clearInterval(syncInterval);
    }, [fetchLiveStatus]);

    // Live clock ticks
    useEffect(() => {
        const updateClocks = () => {
            const now = new Date();
            setCurrentDate(now);
            try {
                setCompTimeStr(now.toLocaleTimeString('en-US', { timeZone: compTimezone, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            } catch (e) {}

            try {
                setEmpTimeStr(now.toLocaleTimeString('en-US', { timeZone: empTimezone, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            } catch (e) {}

            try {
                setUtcTimeStr(now.toLocaleTimeString('en-US', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            } catch (e) {}
        };

        updateClocks();
        const interval = setInterval(updateClocks, 1000);
        return () => clearInterval(interval);
    }, [compTimezone, empTimezone]);

    // Parse time to epoch ms
    const parseClockInEpoch = (timeStr: string | null | undefined): number | null => {
        if (!timeStr) return null;
        
        if (timeStr.includes('T') || (timeStr.includes('-') && timeStr.includes(':'))) {
            const normalized = timeStr.includes(' ') ? timeStr.replace(' ', 'T') : timeStr;
            const d = new Date(normalized);
            if (!isNaN(d.getTime())) return d.getTime();
        }

        const nativeDate = new Date(timeStr);
        if (!isNaN(nativeDate.getTime())) return nativeDate.getTime();

        if (timeStr.includes(':')) {
            const now = new Date();
            let timePart = timeStr.trim();
            let isPM = false;
            let isAM = false;

            if (/pm/i.test(timePart)) {
                isPM = true;
                timePart = timePart.replace(/pm/i, '').trim();
            } else if (/am/i.test(timePart)) {
                isAM = true;
                timePart = timePart.replace(/am/i, '').trim();
            }

            const parts = timePart.split(':');
            let hours = parseInt(parts[0], 10);
            const minutes = parseInt(parts[1], 10);
            const seconds = parseInt(parts[2] || '0', 10);

            if (isNaN(hours) || isNaN(minutes)) return null;

            if (isPM && hours < 12) hours += 12;
            if (isAM && hours === 12) hours = 0;

            let candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, seconds);

            if (candidate.getTime() > now.getTime() + 120000) {
                candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, hours, minutes, seconds);
            }

            return candidate.getTime();
        }

        return null;
    };

    // Elapsed timer calculation
    useEffect(() => {
        if (!isClockedIn || !clockInTime) {
            setElapsedTime('00:00:00');
            return;
        }

        const calculateElapsed = () => {
            try {
                const epoch = parseClockInEpoch(clockInTime);
                if (!epoch) return '00:00:00';

                const diffMs = Date.now() - epoch;
                if (diffMs <= 0) return '00:00:00';

                const totalSecs = Math.floor(diffMs / 1000);
                const hrs = Math.floor(totalSecs / 3600);
                const mins = Math.floor((totalSecs % 3600) / 60);
                const secs = totalSecs % 60;

                return [
                    hrs.toString().padStart(2, '0'),
                    mins.toString().padStart(2, '0'),
                    secs.toString().padStart(2, '0')
                ].join(':');
            } catch (e) {
                return '00:00:00';
            }
        };

        setElapsedTime(calculateElapsed());
        const timer = setInterval(() => {
            setElapsedTime(calculateElapsed());
        }, 1000);

        return () => clearInterval(timer);
    }, [isClockedIn, clockInTime]);

    const handleClockAction = async () => {
        if (isLoading) return;
        setIsLoading(true);

        const targetState = !isClockedIn;
        // Immediate optimistic UI update for instant feedback
        setIsClockedIn(targetState);
        if (targetState && !clockInTime) {
            setClockInTime(new Date().toISOString());
        }

        const primaryEndpoint = targetState ? '/hrm/attendances/clock-in' : '/hrm/attendances/clock-out';
        const fallbackEndpoint = targetState ? '/api/time-tracker/clock-in' : '/api/time-tracker/clock-out';

        try {
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            let res = await fetch(primaryEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token || '',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ platform: 'Web Dashboard' })
            });

            if (!res.ok) {
                res = await fetch(fallbackEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': token || '',
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ platform: 'Web Dashboard' })
                });
            }

            const data = await res.json();
            if (data.success || data.status || res.ok) {
                if (data.data?.today_sessions) {
                    setTodaySessions(data.data.today_sessions);
                }
                if (targetState && data.data?.clock_in_time) {
                    setClockInTime(data.data.clock_in_time);
                }
            } else {
                setIsClockedIn(!targetState);
            }
        } catch (e) {
            console.error('Clock action error', e);
        } finally {
            setIsLoading(false);
            fetchLiveStatus();
        }
    };

    const handleShiftModeChange = (mode: 'fixed' | 'flexible') => {
        if (mode === currentShiftType) return;

        if (mode === 'flexible') {
            if (!isFlexibleAllowed) {
                setIsModalOpen(true);
                return;
            }
        }

        router.post('/hrm/flexible-shift/toggle', { target_shift: mode }, {
            preserveScroll: true,
            onSuccess: () => {
                setCurrentShiftType(mode);
            }
        });
    };

    const handleRequestFlexibleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingRequest(true);

        const fullReasonPayload = `Category: ${reasonCategory}` +
            (requestCountry ? ` | Country: ${requestCountry}` : '') +
            (requestDescription ? ` | Notes: ${requestDescription}` : '');

        router.post('/hrm/flexible-shift/request', {
            reason: fullReasonPayload,
            reason_type: reasonCategory,
            description: requestDescription,
            country: requestCountry
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSubmittingRequest(false);
                setFlexibleStatus('pending');
                setIsModalOpen(false);
                setRequestDescription('');
            },
            onError: () => {
                setIsSubmittingRequest(false);
            }
        });
    };

    const formatTime12h = (timeStr: string | null) => {
        if (!timeStr) return 'Active';
        try {
            const parts = timeStr.split(':');
            let hrs = parseInt(parts[0], 10);
            const mins = parts[1] || '00';
            const ampm = hrs >= 12 ? 'PM' : 'AM';
            hrs = hrs % 12 || 12;
            return `${hrs.toString().padStart(2, '0')}:${mins} ${ampm}`;
        } catch (e) {
            return timeStr;
        }
    };

    const getDurationStr = (inTime: string, outTime: string | null) => {
        try {
            const inEpoch = parseClockInEpoch(inTime);
            if (!inEpoch) return '';

            const outEpoch = outTime ? parseClockInEpoch(outTime) : Date.now();
            if (!outEpoch) return '';

            const diffMs = Math.max(0, outEpoch - inEpoch);
            const totalMins = Math.floor(diffMs / 60000);
            const h = Math.floor(totalMins / 60);
            const m = totalMins % 60;
            return h > 0 ? `${h}h ${m}m` : `${m}m`;
        } catch (e) {
            return '';
        }
    };

    // Filter sessions strictly for TODAY (last 24-hour day window)
    const getFilteredTodaySessions = () => {
        if (!Array.isArray(todaySessions)) return [];
        const now = Date.now();
        const todayDateStr = new Date().toISOString().split('T')[0];

        return todaySessions.filter(session => {
            if (!session.in) return false;
            const inEpoch = parseClockInEpoch(session.in);
            if (!inEpoch) return false;

            const sessionDateStr = new Date(inEpoch).toISOString().split('T')[0];
            return sessionDateStr === todayDateStr || (now - inEpoch) <= 24 * 3600 * 1000;
        });
    };

    const calculateGrandTotalTime = () => {
        let totalMs = 0;
        const now = Date.now();
        const filteredSessions = getFilteredTodaySessions();

        filteredSessions.forEach(session => {
            const inEpoch = parseClockInEpoch(session.in);
            if (inEpoch) {
                const outEpoch = session.out ? parseClockInEpoch(session.out) : now;
                if (outEpoch && outEpoch >= inEpoch) {
                    const diffMs = outEpoch - inEpoch;
                    // Cap each session to 24 hours max
                    totalMs += Math.min(diffMs, 24 * 3600 * 1000);
                }
            }
        });

        // Cap grand total for a single day at 24 hours maximum
        const maxMs = 24 * 3600 * 1000;
        const cappedMs = Math.min(totalMs, maxMs);

        const totalMins = Math.floor(cappedMs / 60000);
        const hrs = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        return `${hrs}h ${mins}m`;
    };

    const filteredSessions = getFilteredTodaySessions();

    return (
        <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden mb-6 w-full">
            {/* Top Header: STRICT SINGLE HORIZONTAL LINE via Inline Flex */}
            <div 
                style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
                className="bg-slate-50/90 border-b border-slate-100 py-2.5 px-4"
            >
                {/* Left Column (Far Left Edge): Clock + Title + Live Sync + "Off Day: Sun" Badge */}
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                    <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-indigo-600 shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-extrabold text-slate-900 tracking-tight whitespace-nowrap">
                        {t('Duty & Attendance')}
                    </span>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200/90 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        {t('Live Sync')}
                    </Badge>
                    <span className="text-slate-300 text-xs font-light">|</span>
                    
                    {/* Updated Badge with "Off Day: [Day]" label */}
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 border border-slate-200/80 text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap flex items-center gap-1">
                        <span className="text-slate-400 font-normal">{t('Off Day:')}</span>
                        <span className="font-extrabold text-slate-900">{stats?.duty_schedule_info?.off_days_text || 'Sun'}</span>
                    </Badge>
                </div>

                {/* Right Column (Far Right Edge): Icon-ONLY Shift Switcher (Building2 & SlidersHorizontal) + Sync + Help */}
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                    <TooltipProvider delayDuration={100}>
                        {/* Icon-ONLY Segmented Switcher Pill */}
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }} className="bg-slate-200/80 p-0.5 rounded-xl gap-0.5 border border-slate-300/60 shadow-inner">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        onClick={() => handleShiftModeChange('fixed')}
                                        className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
                                            currentShiftType === 'fixed'
                                                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        <Building2 className="w-4 h-4 text-indigo-600" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs font-bold p-1.5">
                                    {t('Fixed Shift')}
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        onClick={() => handleShiftModeChange('flexible')}
                                        className={`p-1.5 rounded-lg transition-all flex items-center justify-center relative ${
                                            currentShiftType === 'flexible'
                                                ? 'bg-amber-500 text-white shadow-sm shadow-amber-200'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        <SlidersHorizontal className="w-4 h-4 text-amber-100" />
                                        {!isFlexibleAllowed && flexibleStatus === 'pending' && (
                                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                                        )}
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs font-bold p-1.5">
                                    {t('Flexible Shift')}
                                </TooltipContent>
                            </Tooltip>
                        </div>

                        {/* Force Sync Timer Button */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => fetchLiveStatus()} 
                                    className="h-7 w-7 p-0 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-center border border-slate-200/80 bg-white"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">{t('Force Sync Status')}</TooltipContent>
                        </Tooltip>

                        {/* Premium Creative "?" Help Button with Brand Dark Tooltip Popover */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    className="w-7 h-7 rounded-full bg-slate-200/80 hover:bg-indigo-100 text-slate-600 hover:text-indigo-600 flex items-center justify-center text-xs font-extrabold transition-all border border-slate-300/70 shadow-xs"
                                >
                                    <HelpCircle className="w-3.5 h-3.5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent 
                                side="bottom" 
                                align="end"
                                className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-700/80 text-xs w-80 space-y-3 relative overflow-hidden"
                            >
                                <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 absolute top-0 left-0"></div>
                                <div className="font-extrabold text-sm text-slate-100 flex items-center justify-between pt-1">
                                    <span className="flex items-center gap-1.5">
                                        <Sparkles className="w-4 h-4 text-amber-400 fill-amber-300/30" />
                                        {t('Shift Rules & Scoring')}
                                    </span>
                                    <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full font-mono font-bold">Dynime ERP</span>
                                </div>
                                <div className="space-y-2 text-[11px] text-slate-300">
                                    <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-start gap-2">
                                        <Building2 className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                                        <div>
                                            <strong className="text-white block text-xs">{t('Fixed Shift Mode')}</strong>
                                            <span className="text-slate-400 text-[10.5px]">{t('Follow assigned office hours. Late arrivals and early outs affect attendance metrics.')}</span>
                                        </div>
                                    </div>
                                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
                                        <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                                        <div>
                                            <strong className="text-amber-300 block text-xs">{t('Flexible Shift Mode')}</strong>
                                            <span className="text-slate-300 text-[10.5px]">{t('Work required total hours anytime. Late/early penalties bypassed.')}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-1 flex items-center justify-end">
                                    <span className="text-[10px] font-extrabold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20 cursor-pointer hover:bg-amber-400/20 transition-all">
                                        {t('Got It!')}
                                    </span>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            {/* Content: 2-Column Layout */}
            <CardContent className="p-3">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
                    
                    {/* Column 1: Duty Tracker (6 Cols in 2-Col layout) */}
                    <div className="md:col-span-6 flex flex-col justify-between h-full">

                        {/* Clock In / Out Duty Tracker Card */}
                        <div className="bg-gradient-to-br from-indigo-50/90 to-slate-50 border border-indigo-100 rounded-xl p-3.5 flex flex-col justify-between h-full min-h-[200px]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{t('Duty Tracker')}</span>
                                </div>
                                <Badge className={isClockedIn ? "bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5" : "bg-slate-200 text-slate-700 font-bold text-[10px] px-2 py-0.5"}>
                                    {isClockedIn ? t('Clocked In') : t('Clocked Out')}
                                </Badge>
                            </div>

                            <div className="my-2 flex items-center justify-center gap-4 py-1">
                                <AnalogClock date={currentDate} />
                                <div className="text-left">
                                    <div className="text-2.5xl font-black text-slate-900 font-mono tracking-tight">{elapsedTime}</div>
                                    <p className="text-[10.5px] font-medium text-slate-500">
                                        {isClockedIn ? t('Active Duty & Counting...') : t('Ready to start shift')}
                                    </p>
                                </div>
                            </div>

                            <Button 
                                onClick={handleClockAction}
                                disabled={isLoading}
                                className={`w-full py-2.5 font-extrabold text-xs rounded-lg transition-all shadow-sm cursor-pointer ${
                                    isClockedIn 
                                    ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200" 
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
                                }`}
                            >
                                {isLoading ? (
                                    <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> {t('Processing...')}</>
                                ) : isClockedIn ? (
                                    <><Square className="w-3.5 h-3.5 mr-1.5 fill-current" /> {t('Clock Out Shift')}</>
                                ) : (
                                    <><Zap className="w-3.5 h-3.5 mr-1.5 fill-current" /> {t('Clock In Now')}</>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Column 2: Today's Duty & Clock-In Sessions History (6 Cols in 2-Col layout) */}
                    <div className="md:col-span-6 bg-slate-50/90 border border-slate-200/90 rounded-xl p-3.5 flex flex-col justify-between h-full min-h-[200px]">
                        <div>
                            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 mb-2">
                                <div className="flex items-center gap-1.5">
                                    <History className="w-3.5 h-3.5 text-slate-600" />
                                    <h5 className="text-xs font-bold text-slate-800">{t("Today's Session Log")}</h5>
                                </div>
                                <Badge variant="secondary" className="bg-slate-200/80 text-slate-700 text-[10px] font-semibold px-2 py-0.5">
                                    {filteredSessions.length} {filteredSessions.length === 1 ? 'Session' : 'Sessions'}
                                </Badge>
                            </div>

                            <div className="space-y-1.5 max-h-[135px] overflow-y-auto pr-1">
                                {filteredSessions.length === 0 ? (
                                    <div className="py-6 text-center">
                                        <p className="text-[11px] text-slate-400 font-medium">{t('No duty sessions logged today yet.')}</p>
                                    </div>
                                ) : (
                                    filteredSessions.map((session: any, idx: number) => {
                                        const inFmt = formatTime12h(session.in);
                                        const outFmt = session.out ? formatTime12h(session.out) : 'Active';
                                        const duration = getDurationStr(session.in, session.out);
                                        const isActive = !session.out;

                                        return (
                                            <div 
                                                key={idx} 
                                                className={`flex items-center justify-between p-2 rounded-lg text-[11px] transition-colors ${
                                                    isActive 
                                                    ? 'bg-emerald-100/70 border border-emerald-300/80 text-emerald-950 font-medium' 
                                                    : 'bg-white border border-slate-200/80 text-slate-700'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                                    <span className="font-semibold text-slate-800 text-[11px]">
                                                        #{idx + 1}: {inFmt} – {outFmt}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    {duration && (
                                                        <Badge variant="outline" className={`text-[10px] font-bold px-1.5 py-0 ${isActive ? 'bg-emerald-200/80 text-emerald-900 border-emerald-300' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                            {duration}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Today Total Duty Time Footer (Strictly 24-hour day capped) */}
                        <div className="pt-2 border-t border-slate-200/80 mt-2 flex items-center justify-between text-[11px]">
                            <span className="text-slate-700 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                {t('Today Duty Time:')}
                            </span>
                            <span className="font-black text-indigo-900 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-md text-xs">
                                {calculateGrandTotalTime()}
                            </span>
                        </div>
                    </div>

                </div>

                {/* Important Workfolio Dual Clock-In Notice Banner */}
                <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border border-amber-500/25 text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                        <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-700 shrink-0 mt-0.5">
                            <Clock className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{t('Important Dual Clock-In Requirement')}</span>
                                <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[9px] font-bold py-0">
                                    {t('Required')}
                                </Badge>
                            </p>
                            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                                {t('After clocking in here, please activate your Workfolio desktop time tracker as well. Clocking in on both Dynime ERP and Workfolio is required to calculate your performance metrics.')}
                            </p>
                        </div>
                    </div>
                    <a
                        href="/hrm/time-tracker/downloads"
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shrink-0 shadow-xs transition-all"
                    >
                        <span>{t('Time Tracker Guide')}</span>
                        <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
            </CardContent>

            {/* Compact Sleek Flexible Shift Access Request Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-[400px] p-0 overflow-hidden rounded-2xl border border-indigo-100/80 shadow-xl bg-white">
                    {/* Header Banner: Compact Padding & Soft Tint */}
                    <div className="bg-gradient-to-r from-indigo-50/90 via-purple-50/60 to-amber-50/40 p-3.5 border-b border-indigo-100/60">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-indigo-600/10 border border-indigo-200/50 flex items-center justify-center text-indigo-600 shrink-0">
                                <SlidersHorizontal className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <DialogTitle className="text-xs font-black text-slate-900 tracking-tight">
                                        {t('Request Flexible Shift Access')}
                                    </DialogTitle>
                                    <span className="text-[9px] font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20 px-1.5 py-0.2 rounded-full">
                                        {t('HR Approval')}
                                    </span>
                                </div>
                                <DialogDescription className="text-[10.5px] text-slate-500 mt-0.5 leading-tight truncate">
                                    {t('Select your reason and country to request approval.')}
                                </DialogDescription>
                            </div>
                        </div>
                    </div>

                    <div className="p-3.5 space-y-3 bg-white">
                        {flexibleStatus === 'pending' ? (
                            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-2.5 text-amber-900">
                                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                                <div>
                                    <h6 className="font-bold text-xs text-amber-950">{t('Request Under Review')}</h6>
                                    <p className="text-[10.5px] text-amber-800 mt-0.5 leading-tight">
                                        {t('Your request for Flexible Shift access is already submitted and awaiting HR approval.')}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleRequestFlexibleSubmit} className="space-y-3">
                                {flexibleStatus === 'rejected' && (
                                    <div className="p-2.5 rounded-xl bg-rose-50/80 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-2">
                                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                        <span>{t('Previous request rejected. You may submit an updated request.')}</span>
                                    </div>
                                )}

                                {/* Field 1: Reason Select Dropdown */}
                                <div className="space-y-1">
                                    <label className="block text-[11px] font-bold text-slate-800 flex items-center justify-between">
                                        <span>{t('Select Reason')}</span>
                                        <span className="text-[9.5px] text-indigo-600 font-semibold">{t('Required')}</span>
                                    </label>
                                    <select
                                        value={reasonCategory}
                                        onChange={(e) => setReasonCategory(e.target.value)}
                                        className="w-full px-2.5 py-1.5 text-xs font-medium text-slate-800 bg-slate-50/90 border border-slate-200/90 rounded-lg focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                                    >
                                        <option value="Remote & Field Duty">{t('Remote & Field Duty')}</option>
                                        <option value="Cross-Timezone Client Support">{t('Cross-Timezone Client Support')}</option>
                                        <option value="Personal & Family Schedule">{t('Personal & Family Schedule')}</option>
                                        <option value="Higher Education & Exam Schedule">{t('Higher Education & Exam Schedule')}</option>
                                        <option value="Other Custom Reason">{t('Other Custom Reason')}</option>
                                    </select>
                                </div>

                                {/* Field 2: Selectable Country Dropdown */}
                                <div className="space-y-1">
                                    <label className="block text-[11px] font-bold text-slate-800 flex items-center gap-1">
                                        <Globe className="w-3 h-3 text-indigo-500" />
                                        <span>{t('Select Country')}</span>
                                    </label>
                                    <select
                                        value={requestCountry}
                                        onChange={(e) => setRequestCountry(e.target.value)}
                                        className="w-full px-2.5 py-1.5 text-xs font-medium text-slate-800 bg-slate-50/90 border border-slate-200/90 rounded-lg focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                                    >
                                        <option value="United States">{t('United States')}</option>
                                        <option value="Bangladesh">{t('Bangladesh')}</option>
                                        <option value="United Kingdom">{t('United Kingdom')}</option>
                                        <option value="Canada">{t('Canada')}</option>
                                        <option value="Australia">{t('Australia')}</option>
                                        <option value="India">{t('India')}</option>
                                        <option value="United Arab Emirates">{t('United Arab Emirates')}</option>
                                        <option value="Saudi Arabia">{t('Saudi Arabia')}</option>
                                        <option value="Singapore">{t('Singapore')}</option>
                                        <option value="Germany">{t('Germany')}</option>
                                        <option value="Malaysia">{t('Malaysia')}</option>
                                        <option value="Other">{t('Other Country')}</option>
                                    </select>
                                </div>

                                {/* Field 3: Descriptions / Justification (Compact height) */}
                                <div className="space-y-1">
                                    <label className="block text-[11px] font-bold text-slate-800 flex items-center justify-between">
                                        <span className="flex items-center gap-1">
                                            <FileText className="w-3 h-3 text-slate-500" />
                                            {t('Descriptions / Justification')}
                                        </span>
                                        <span className="text-[9.5px] text-slate-400 font-normal">{t('Optional')}</span>
                                    </label>
                                    <textarea
                                        value={requestDescription}
                                        onChange={(e) => setRequestDescription(e.target.value)}
                                        placeholder={t('Add brief context for HR approval...')}
                                        rows={2}
                                        className="w-full px-2.5 py-1.5 text-xs font-medium text-slate-800 bg-slate-50/90 border border-slate-200/90 rounded-lg focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all placeholder:text-slate-400 resize-none"
                                    />
                                </div>

                                <div className="p-2 rounded-xl bg-indigo-50/50 border border-indigo-100/70 flex items-center gap-2 text-[10.5px] text-indigo-900 font-medium">
                                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                    <span>{t('Company & HR can review or revoke permissions anytime.')}</span>
                                </div>

                                <DialogFooter className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsModalOpen(false)}
                                        className="text-xs font-bold px-3 py-1.5 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-100 h-8"
                                    >
                                        {t('Cancel')}
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmittingRequest}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 transition-all h-8"
                                    >
                                        <Send className="w-3 h-3" />
                                        {isSubmittingRequest ? t('Submitting...') : t('Submit Request')}
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
