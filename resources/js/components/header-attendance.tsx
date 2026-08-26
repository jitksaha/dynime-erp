import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePage } from '@inertiajs/react';
import { Clock, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScreenTrackerManager } from '@/components/ScreenTrackerManager';

export function HeaderAttendance() {
    const { t } = useTranslation();
    const { auth } = usePage<any>().props;

    // Show for all users (company, hr, employee)
    const userType = auth?.user?.type;
    const isEmployee = userType !== 'superadmin';

    if (!isEmployee) return null;

    const [isClockedIn, setIsClockedIn] = useState(false);
    const [clockInTime, setClockInTime] = useState('');
    const [attendanceId, setAttendanceId] = useState<number | null>(null);
    const [elapsedTime, setElapsedTime] = useState('00:00:00');
    const [loading, setLoading] = useState(false);

    // Fetch initial clock status
    useEffect(() => {
        fetch(route('hrm.attendances.clock-status'))
            .then(res => res.json())
            .then(data => {
                setIsClockedIn(data.is_clocked_in);
                setClockInTime(data.clock_in_time || '');
                setAttendanceId(data.attendance_id || null);
            })
            .catch(err => console.error(err));
    }, []);

    // Listen for custom events from dashboard
    useEffect(() => {
        const handleClockChange = (e: Event) => {
            const data = (e as CustomEvent).detail;
            setIsClockedIn(data.is_clocked_in);
            setClockInTime(data.clock_in_time || '');
            setAttendanceId(data.attendance_id || null);
        };

        window.addEventListener('attendance-clock-changed', handleClockChange);
        return () => window.removeEventListener('attendance-clock-changed', handleClockChange);
    }, []);

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

    // Ticking elapsed time timer
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

    const handleClockAction = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);

        try {
            const endpoint = isClockedIn ? route('hrm.attendances.clock-out') : route('hrm.attendances.clock-in');
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token || '',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                }
            });

            // Fetch status again
            const res = await fetch(route('hrm.attendances.clock-status'));
            const data = await res.json();

            setIsClockedIn(data.is_clocked_in);
            setClockInTime(data.clock_in_time || '');
            setAttendanceId(data.attendance_id || null);

            // Dispatch global event to update dashboard
            window.dispatchEvent(new CustomEvent('attendance-clock-changed', { detail: data }));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            {isClockedIn && (
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 text-xs font-mono font-bold">
                    <Clock className="h-3.5 w-3.5 animate-pulse" />
                    {elapsedTime}
                </div>
            )}

            {/* Screen Tracker Manager (Disabled as requested) */}
            {/* <ScreenTrackerManager isClockedIn={isClockedIn} attendanceId={attendanceId} /> */}

            <Button
                size="sm"
                onClick={handleClockAction}
                disabled={loading}
                className={`h-8 font-bold text-xs tracking-wide shadow-none transition-all flex items-center gap-1.5 px-3 rounded-lg ${
                    isClockedIn
                        ? 'bg-rose-600 hover:bg-rose-700 text-white border-0'
                        : 'border border-[#635bff] text-[#635bff] bg-transparent hover:bg-[#635bff]/5'
                }`}
            >
                {isClockedIn ? (
                    <>
                        <Square className="h-3.5 w-3.5 fill-current" />
                        <span className="hidden sm:inline">{t('Clock Out')}</span>
                    </>
                ) : (
                    <>
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span className="hidden sm:inline">{t('Clock In')}</span>
                    </>
                )}
            </Button>
        </div>
    );
}
