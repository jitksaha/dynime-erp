import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import CalendarView from "@/components/calendar-view";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    Clock,
    Calendar,
    CalendarDays,
    FileText,
    User,
    CheckCircle,
    CheckCircle2,
    XCircle,
    AlertCircle,
    TrendingUp,
    Award,
    Play,
    Square,
    Shield,
    MessageSquare,
    PenTool,
    Globe,
    Building2,
    Utensils,
    Coffee,
    Briefcase,
    Sparkles,
    MapPin,
    Sun,
    Moon
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { getDocumentName } from '../DocumentBuilder/documentUtils';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import TimezoneDutyWidget from '../../Components/TimezoneDutyWidget';
import OnboardingBannerWidget from '../../Components/OnboardingBannerWidget';
import { formatDate, formatDateTime } from '@/utils/helpers';

interface EmployeeDashboardProps {
    message: string;
    auth: any;
    stats: {
        company_timezone_info?: {
            timezone: string;
            label: string;
            current_time: string;
            current_date: string;
            utc_offset: string;
            abbreviation: string;
        };
        emp_timezone_info?: {
            timezone: string;
            country: string;
            current_time: string;
            current_date: string;
            utc_offset: string;
            abbreviation: string;
        };
        utc_timezone_info?: {
            timezone: string;
            label: string;
            current_time: string;
            current_date: string;
            utc_offset: string;
            abbreviation: string;
        };
        duty_schedule_info?: {
            shift_start: string;
            shift_end: string;
            shift_utc?: string;
            break_start: string;
            break_end: string;
            total_shift_hours: number;
            paid_duty_hours: number;
            break_hours: number;
            weekly_days: number;
            weekly_paid_hours: number;
            duty_status: string;
            shift_progress: number;
            is_weekend: boolean;
            weekend_days: number[];
        };
        my_attendance: number;
        total_approved_leave_year: number;
        total_approved_leave_month: number;
        pending_requests: number;
        total_absent_days: number;
        total_awards: number;
        total_warnings: number;
        total_complaints: number;
        attendance_data?: any;
        calendar_events?: Array<{
            id: number;
            title: string;
            startDate: string;
            endDate: string;
            time: string;
            description: string;
            type: string;
            color: string;
        }>;
        recent_announcements?: Array<{
            id: number;
            title: string;
            description: string;
            created_at: string;
        }>;
        recent_leave_applications?: Array<{
            id: number;
            leave_type: string;
            start_date: string;
            end_date: string;
            total_days: number;
            status: string;
            created_at: string;
        }>;
        recent_awards?: Array<{
            id: number;
            award_type: string;
            award_date: string;
            created_at: string;
        }>;
        recent_warnings?: Array<{
            id: number;
            warning_type: string;
            warning_date: string;
            created_at: string;
        }>;
        pending_signatures?: Array<{
            id: number;
            document_type: string;
            issued_date: string;
            is_signed: boolean;
            signed_at?: string;
        }>;
        signed_documents?: Array<{
            id: number;
            document_type: string;
            issued_date: string;
            is_signed: boolean;
            signed_at?: string;
        }>;
    };
}

export default function EmployeeDashboard({ message, stats }: EmployeeDashboardProps) {
    const { t } = useTranslation();
    const { auth } = usePage<any>().props;

    const [isClockedIn, setIsClockedIn] = useState(stats.attendance_data?.is_clocked_in || false);
    const [clockTime, setClockTime] = useState(stats.attendance_data?.is_clocked_in ? stats.attendance_data?.clock_in_time : '--:--');
    const [clockInTime, setClockInTime] = useState(stats.attendance_data?.clock_in_time || '');
    const [clockOutTime, setClockOutTime] = useState(stats.attendance_data?.clock_out_time || '');
    const [totalWorkingHours, setTotalWorkingHours] = useState(stats.attendance_data?.total_working_hours || '');

    const [currentTime, setCurrentTime] = useState(new Date());
    const [elapsedTime, setElapsedTime] = useState('00:00:00');
    const [showEndShiftConfirm, setShowEndShiftConfirm] = useState(false);
    const [isShiftEndedToday, setIsShiftEndedToday] = useState(false);

    // Live Tickers for Company Standard Time, Employee Local Time & UTC
    const [companyTimeStr, setCompanyTimeStr] = useState('');
    const [companyDateStr, setCompanyDateStr] = useState('');
    const [empTimeStr, setEmpTimeStr] = useState('');
    const [empDateStr, setEmpDateStr] = useState('');
    const [utcTimeStr, setUtcTimeStr] = useState('');
    const [utcDateStr, setUtcDateStr] = useState('');

    const compTimezone = stats.company_timezone_info?.timezone || 'America/Denver';
    const browserTimezone = typeof Intl !== 'undefined' ? (Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Dhaka') : 'Asia/Dhaka';
    const empTimezone = stats.emp_timezone_info?.timezone && stats.emp_timezone_info.timezone !== 'UTC' ? stats.emp_timezone_info.timezone : browserTimezone;

    const startTime = stats.duty_schedule_info?.start_time || '09:00:00';
    const endTime = stats.duty_schedule_info?.end_time || '18:00:00';

    const formatShiftHours = (startT: string, endT: string, fromTz: string, toTz: string) => {
        try {
            const testDate = new Date();
            const fromD = new Date(testDate.toLocaleString('en-US', { timeZone: fromTz }));
            const toD = new Date(testDate.toLocaleString('en-US', { timeZone: toTz }));
            const diffMs = toD.getTime() - fromD.getTime();

            const parseHMs = (tStr: string) => {
                const parts = tStr.split(':');
                let h = parseInt(parts[0], 10) || 9;
                let m = parseInt(parts[1], 10) || 0;
                if (tStr.toLowerCase().includes('pm') && h < 12) h += 12;
                if (tStr.toLowerCase().includes('am') && h === 12) h = 0;
                return { h, m };
            };

            const startParsed = parseHMs(startT);
            const endParsed = parseHMs(endT);

            const sDate = new Date();
            sDate.setHours(startParsed.h, startParsed.m, 0, 0);
            const targetStart = new Date(sDate.getTime() + diffMs);

            const eDate = new Date();
            eDate.setHours(endParsed.h, endParsed.m, 0, 0);
            const targetEnd = new Date(eDate.getTime() + diffMs);

            const fmtStart = targetStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            const fmtEnd = targetEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

            return `${fmtStart} – ${fmtEnd}`;
        } catch (e) {
            return '09:00 AM – 06:00 PM';
        }
    };

    const compShiftHours = formatShiftHours(startTime, endTime, compTimezone, compTimezone);
    const utcShiftHours = formatShiftHours(startTime, endTime, compTimezone, 'UTC');
    const empShiftHours = formatShiftHours(startTime, endTime, compTimezone, empTimezone);

    useEffect(() => {
        const updateClocks = () => {
            const now = new Date();
            try {
                setCompanyTimeStr(now.toLocaleTimeString('en-US', { timeZone: compTimezone, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
                setCompanyDateStr(now.toLocaleDateString('en-US', { timeZone: compTimezone, weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
            } catch (e) {}

            try {
                setEmpTimeStr(now.toLocaleTimeString('en-US', { timeZone: empTimezone, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
                setEmpDateStr(now.toLocaleDateString('en-US', { timeZone: empTimezone, weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
            } catch (e) {}

            try {
                setUtcTimeStr(now.toLocaleTimeString('en-US', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
                setUtcDateStr(now.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
            } catch (e) {}
        };

        updateClocks();
        const interval = setInterval(updateClocks, 1000);
        return () => clearInterval(interval);
    }, [compTimezone, empTimezone]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!isClockedIn || !clockInTime) {
            setElapsedTime('00:00:00');
            localStorage.removeItem('dynime_clock_in_epoch');
            return;
        }

        // Establish persistent clock-in epoch timestamp in localStorage
        let startMs: number;
        const storedEpoch = localStorage.getItem('dynime_clock_in_epoch');
        if (storedEpoch) {
            startMs = parseInt(storedEpoch, 10);
        } else {
            const normalizedStr = clockInTime.includes(' ') ? clockInTime.replace(' ', 'T') : clockInTime;
            const parsedDate = new Date(normalizedStr);
            startMs = isNaN(parsedDate.getTime()) ? Date.now() : parsedDate.getTime();
            localStorage.setItem('dynime_clock_in_epoch', startMs.toString());
        }

        const calculateElapsed = () => {
            try {
                const nowMs = Date.now();
                const diffMs = nowMs - startMs;
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

    useEffect(() => {
        const attendanceData = stats.attendance_data;
        if (attendanceData) {
            setIsClockedIn(attendanceData.is_clocked_in);
            setClockTime(attendanceData.is_clocked_in ? attendanceData.clock_in_time : '--:--');
            setClockInTime(attendanceData.clock_in_time || '');
            setClockOutTime(attendanceData.clock_out_time || '');
            setTotalWorkingHours(attendanceData.total_working_hours || '');
        }
    }, [stats.attendance_data]);

    useEffect(() => {
        const handleClockChange = (e: Event) => {
            const data = (e as CustomEvent).detail;
            setIsClockedIn(data.is_clocked_in);
            setClockTime(data.is_clocked_in ? data.clock_in_time : '--:--');
            setClockInTime(data.clock_in_time || '');
            setClockOutTime(data.clock_out_time || '');
            setTotalWorkingHours(data.total_working_hours || '');
        };

        window.addEventListener('attendance-clock-changed', handleClockChange);
        return () => window.removeEventListener('attendance-clock-changed', handleClockChange);
    }, []);

    const handleClockAction = async () => {
        const endpoint = isClockedIn ? route('hrm.attendances.clock-out') : route('hrm.attendances.clock-in');
        try {
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

            const response = await fetch(route('hrm.attendances.clock-status'));
            const data = await response.json();
            
            setIsClockedIn(data.is_clocked_in);
            setClockTime(data.is_clocked_in ? data.clock_in_time : '--:--');
            setClockInTime(data.clock_in_time || '');
            setClockOutTime(data.clock_out_time || '');
            setTotalWorkingHours(data.total_working_hours || '');

            // Dispatch custom event to update header widget
            window.dispatchEvent(new CustomEvent('attendance-clock-changed', { detail: data }));
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[{ label: t('Employee Dashboard') }]}
            pageTitle={t('Employee Dashboard')}
        >
            <Head title={t('Employee Dashboard')} />

            <div className="space-y-6">
                {/* Timezone Calculation & Employee Duty Control Card for HR & Employees */}
                <TimezoneDutyWidget stats={stats} />
                {Array.isArray(stats?.pending_signatures) && stats.pending_signatures.length > 0 && (
                    <Card className="border-amber-200 bg-amber-50/20 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-bold text-amber-900 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-amber-600 animate-pulse" />
                                {t('Documents Awaiting Your Signature')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {stats.pending_signatures.map((doc: any) => (
                                    <div key={doc.id} className="flex justify-between items-center p-4 bg-white rounded-xl border border-amber-200 hover:border-amber-400 transition-colors shadow-sm">
                                        <div className="space-y-1">
                                            <p className="font-semibold text-slate-800 text-sm">{getDocumentName(doc.document_type)}</p>
                                            <p className="text-xs text-slate-400 font-medium">
                                                {t('Issued Date')}: {doc.issued_date ? formatDate(doc.issued_date) : '-'}
                                            </p>
                                        </div>
                                        <Button
                                            onClick={() => router.visit(route('hrm.document-builder.sign', doc.id))}
                                            size="sm"
                                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                                        >
                                            <PenTool className="h-3.5 w-3.5 mr-1.5" />
                                            {t('Sign Document')}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Employee Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div onClick={() => window.location.href = route('hrm.attendances.index')} className="cursor-pointer">
                        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold text-blue-700">{t('My Attendance')}</CardTitle>
                                <Clock className="h-5 w-5 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-blue-900">{stats.my_attendance}</div>
                                <p className="text-xs text-blue-600 mt-1">{t('Days this month')}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div onClick={() => window.location.href = route('hrm.leave-applications.index')} className="cursor-pointer">
                        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold text-green-700">{t('Total Approved Leave')}</CardTitle>
                                <Calendar className="h-5 w-5 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-green-900">{stats.total_approved_leave_month}</div>
                                <p className="text-xs text-green-600 mt-1">{t('Current Month Leave')}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div onClick={() => window.location.href = route('hrm.leave-applications.index')} className="cursor-pointer">
                        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold text-purple-700">{t('Pending Requests')}</CardTitle>
                                <AlertCircle className="h-5 w-5 text-purple-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-purple-900">{stats.pending_requests}</div>
                                <p className="text-xs text-purple-600 mt-1">{t('Awaiting approval')}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div onClick={() => window.location.href = route('hrm.attendances.index')} className="cursor-pointer">
                        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold text-orange-700">{t('Total Absent Days')}</CardTitle>
                                <XCircle className="h-5 w-5 text-orange-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-orange-900">{stats.total_absent_days}</div>
                                <p className="text-xs text-orange-600 mt-1">{t('This Month')}</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Employee Records */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div onClick={() => window.location.href = route('hrm.awards.index')} className="cursor-pointer">
                        <Card className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold text-emerald-700">{t('Total Awards')}</CardTitle>
                                <Award className="h-5 w-5 text-emerald-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-emerald-900">{stats.total_awards}</div>
                                <p className="text-xs text-emerald-600 mt-1">{t('This Month')}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div onClick={() => window.location.href = route('hrm.warnings.index')} className="cursor-pointer">
                        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold text-yellow-700">{t('Total Warnings')}</CardTitle>
                                <Shield className="h-5 w-5 text-yellow-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-yellow-900">{stats.total_warnings}</div>
                                <p className="text-xs text-yellow-600 mt-1">{t('This Year')}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div onClick={() => window.location.href = route('hrm.complaints.index')} className="cursor-pointer">
                        <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold text-red-700">{t('Total Complaints')}</CardTitle>
                                <MessageSquare className="h-5 w-5 text-red-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-red-900">{stats.total_complaints}</div>
                                <p className="text-xs text-red-600 mt-1">{t('This Year')}</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>



                {/* Signed Letters & Documents */}
                {Array.isArray(stats?.signed_documents) && stats.signed_documents.length > 0 && (
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-3 border-b border-slate-100">
                            <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
                                <FileText className="h-5 w-5 text-indigo-650" />
                                {t('My Signed Letters & Documents')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {stats.signed_documents.map((doc: any) => (
                                    <div key={doc.id} className="flex justify-between items-center p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-350 transition-colors shadow-sm">
                                        <div className="space-y-1">
                                            <p className="font-semibold text-slate-800 text-sm">{getDocumentName(doc.document_type)}</p>
                                            <p className="text-[11px] text-slate-400 font-medium">
                                                {t('Signed on')}: {doc.signed_at ? formatDate(doc.signed_at.split(' ')[0]) : '-'}
                                            </p>
                                        </div>
                                        <Button
                                            onClick={() => router.visit(route('hrm.document-builder.sign', doc.id))}
                                            size="sm"
                                            variant="outline"
                                            className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                        >
                                            <FileText className="h-3.5 w-3.5 mr-1.5" />
                                            {t('View / PDF')}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Employee Actions & Info */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Attendance */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                                <Clock className="h-5 w-5" />
                                {t('Recent Attendance')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 space-y-3 pr-2">
                                {Array.isArray(stats?.recent_attendance) && stats.recent_attendance.length > 0 ? (
                                    stats.recent_attendance.map((attendance, index) => {
                                        const getStatusIcon = (status?: string) => {
                                            switch (status?.toLowerCase()) {
                                                case 'present': return <CheckCircle className="h-5 w-5 text-green-500" />;
                                                case 'absent': return <XCircle className="h-5 w-5 text-red-500" />;
                                                case 'half day': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
                                                default: return <Clock className="h-5 w-5 text-gray-500" />;
                                            }
                                        };
                                        
                                        const getStatusBadge = (status?: string) => {
                                            const statusColors: Record<string, string> = {
                                                'present': 'bg-green-100 text-green-800',
                                                'absent': 'bg-red-100 text-red-800',
                                                'half day': 'bg-yellow-100 text-yellow-800'
                                            };
                                            return statusColors[status?.toLowerCase() || ''] || 'bg-gray-100 text-gray-800';
                                        };
                                        

                                        
                                        return (
                                            <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                                <div className="flex items-center gap-3">
                                                    {getStatusIcon(attendance.status)}
                                                    <div>
                                                        <p className="text-sm font-medium">{attendance.date ? formatDate(attendance.date) : '-'}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {attendance.clock_in && attendance.clock_out 
                                                                ? `${formatDateTime(attendance.clock_in)} - ${formatDateTime(attendance.clock_out)}`
                                                                : attendance.clock_in 
                                                                ? `${formatDateTime(attendance.clock_in)} - --:--`
                                                                : 'No attendance'
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-sm ${getStatusBadge(attendance.status)}`}>
                                                    {t(attendance.status ? (attendance.status.charAt(0).toUpperCase() + attendance.status.slice(1)) : 'Unknown')}
                                                </span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="flex items-center justify-center h-40 text-gray-500">
                                        <div className="text-center">
                                            <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                            <p className="text-sm">{t('No attendance records found')}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Leave Requests */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                                <Calendar className="h-5 w-5" />
                                {t('My Leave Requests')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 space-y-3 pr-2">
                                {Array.isArray(stats?.recent_leave_applications) && stats.recent_leave_applications.length > 0 ? (
                                    stats.recent_leave_applications.map((leave, index) => {
                                        const getStatusColor = (status: string) => {
                                            const statusColors = {
                                                pending: 'bg-yellow-100 text-yellow-800',
                                                approved: 'bg-green-100 text-green-800',
                                                rejected: 'bg-red-100 text-red-800'
                                            };
                                            return statusColors[status?.toLowerCase() as keyof typeof statusColors] || statusColors.pending;
                                        };
                                        return (
                                            <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                                <div>
                                                    <p className="text-sm font-medium">{leave.leave_type}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {leave.start_date === leave.end_date
                                                            ? `${formatDate(leave.start_date)} (${leave.total_days} day${leave.total_days > 1 ? 's' : ''})`
                                                            : `${formatDate(leave.start_date)} - ${formatDate(leave.end_date)} (${leave.total_days} day${leave.total_days > 1 ? 's' : ''})`
                                                        }
                                                    </p>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(leave.status)}`}>
                                                    {t(leave.status ? (leave.status.charAt(0).toUpperCase() + leave.status.slice(1)) : 'Pending')}
                                                </span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="flex items-center justify-center h-40 text-gray-500">
                                        <div className="text-center">
                                            <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                            <p className="text-sm">{t('No leave applications found')}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Additional Employee Info */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* My Awards */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                                <Award className="h-5 w-5" />
                                {t('My Awards')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 space-y-3 pr-2">
                                {Array.isArray(stats?.recent_awards) && stats.recent_awards.length > 0 ? (
                                    stats.recent_awards.map((award, index) => {
                                        const colors = ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500', 'bg-indigo-500'];
                                        return (
                                            <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                                <div className="flex items-center gap-3">
                                                    <div className={`${colors[index % 6]} rounded-full p-1.5`}>
                                                        <Award className="h-3 w-3 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">{award.award_type}</p>
                                                        <p className="text-xs text-gray-500">{award.award_date ? formatDate(award.award_date) : '-'}</p>
                                                    </div>
                                                </div>
                                                <span className="px-2 py-1 rounded-full text-sm bg-green-100 text-green-800">
                                                    {t('Received')}
                                                </span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="flex items-center justify-center h-40 text-gray-500">
                                        <div className="text-center">
                                            <Award className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                            <p className="text-sm">{t('No awards found')}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* My Warnings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                                <Shield className="h-5 w-5" />
                                {t('My Warnings')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 space-y-3 pr-2">
                                {Array.isArray(stats?.recent_warnings) && stats.recent_warnings.length > 0 ? (
                                    stats.recent_warnings.map((warning, index) => {
                                        const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-pink-500', 'bg-rose-500'];
                                        return (
                                            <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                                <div className="flex items-center gap-3">
                                                    <div className={`${colors[index % 5]} rounded-full p-1.5`}>
                                                        <Shield className="h-3 w-3 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">{warning.warning_type}</p>
                                                        <p className="text-xs text-gray-500">{warning.warning_date ? formatDate(warning.warning_date) : '-'}</p>
                                                    </div>
                                                </div>
                                                <span className="px-2 py-1 rounded-full text-sm bg-red-100 text-red-800">
                                                    {t('Warning')}
                                                </span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="flex items-center justify-center h-40 text-gray-500">
                                        <div className="text-center">
                                            <Shield className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                            <p className="text-sm">{t('No warnings found')}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Calendar and Announcements */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Calendar */}
                    <Card className="lg:col-span-8">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                                <CalendarDays className="h-5 w-5" />
                                {t('Company Calendar')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CalendarView
                                events={Array.isArray(stats?.calendar_events) ? stats.calendar_events : []}
                                height={350}
                            />
                        </CardContent>
                    </Card>

                    {/* Announcements */}
                    <Card className="lg:col-span-4">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                                <FileText className="h-5 w-5" />
                                {t('Announcements')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 max-h-[700px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                                {Array.isArray(stats?.recent_announcements) && stats.recent_announcements.length > 0 ? (
                                    stats.recent_announcements.map((announcement, index) => {
                                        const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500', 'bg-indigo-500'];
                                        const timeAgo = announcement.created_at ? formatDate(announcement.created_at) : '';
                                        return (
                                            <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                                                <div className={`${colors[index % 6]} rounded-full p-1.5`}>
                                                    <FileText className="h-3 w-3 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">{announcement.title}</p>
                                                    <p className="text-xs text-gray-600">{announcement.description}</p>
                                                    <p className="text-xs text-gray-500">{timeAgo}</p>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="flex items-center justify-center h-40 text-gray-500">
                                        <div className="text-center">
                                            <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                            <p className="text-sm">{t('No active announcements')}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ConfirmationDialog
                open={showEndShiftConfirm}
                onOpenChange={setShowEndShiftConfirm}
                title={t("End Today's Work Shift?")}
                message={t("Are you sure you want to finish your work shift for today? If you are currently clocked in, you will be clocked out and your total tracked time will be saved for today's payroll.")}
                confirmText={t('Yes, End Shift Today')}
                cancelText={t('Keep Working')}
                onConfirm={async () => {
                    if (isClockedIn) {
                        await handleClockAction();
                    }
                    setIsShiftEndedToday(true);
                    setShowEndShiftConfirm(false);
                }}
            />
        </AuthenticatedLayout>
    );
}