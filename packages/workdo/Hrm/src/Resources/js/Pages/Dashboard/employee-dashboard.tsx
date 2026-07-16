import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import CalendarView from "@/components/calendar-view";
import {
    Clock,
    Calendar,
    CalendarDays,
    FileText,
    User,
    CheckCircle,
    XCircle,
    AlertCircle,
    TrendingUp,
    Award,
    Play,
    Square,
    Shield,
    MessageSquare,
    PenTool
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { formatDate, formatTime,formatDateTime } from '@/utils/helpers';
import { getDocumentName } from '../DocumentBuilder/Index';

interface EmployeeDashboardProps {
    message: string;
    auth: any;
    stats: {
        my_attendance: number;
        total_approved_leave_year: number;
        total_approved_leave_month: number;
        pending_requests: number;
        total_absent_days: number;
        total_awards: number;
        total_warnings: number;
        total_complaints: number;
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

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!isClockedIn || !clockInTime) {
            setElapsedTime('00:00:00');
            return;
        }

        const calculateElapsed = () => {
            try {
                const normalizedStr = clockInTime.includes(' ') ? clockInTime.replace(' ', 'T') : clockInTime;
                const start = new Date(normalizedStr);
                const now = new Date();
                const diffMs = now.getTime() - start.getTime();
                if (diffMs < 0) return '00:00:00';
                
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

    const handleClockAction = () => {
        const endpoint = isClockedIn ? route('hrm.attendances.clock-out') : route('hrm.attendances.clock-in');
        router.post(endpoint, {}, {
            onSuccess: () => {
                fetch(route('hrm.attendances.clock-status'))
                    .then(response => response.json())
                    .then(data => {
                        setIsClockedIn(data.is_clocked_in);
                        setClockTime(data.is_clocked_in ? data.clock_in_time : '--:--');
                        setClockInTime(data.clock_in_time || '');
                        setClockOutTime(data.clock_out_time || '');
                        setTotalWorkingHours(data.total_working_hours || '');
                    });
            }
        });
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[{ label: t('Employee Dashboard') }]}
            pageTitle={t('Employee Dashboard')}
        >
            <Head title={t('Employee Dashboard')} />

            <div className="space-y-6">
                {/* Documents Awaiting Digital Signature */}
                {stats.pending_signatures && stats.pending_signatures.length > 0 && (
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
                                                {t('Issued Date')}: {new Date(doc.issued_date).toLocaleDateString()}
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

                {/* Clock In/Out Section */}
                <div className="grid grid-cols-1 gap-6">
                    <Card className="overflow-hidden border-0 shadow-md bg-white rounded-2xl relative">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#635bff]" />
                        <CardContent className="p-6 md:p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                                {/* Left Side - Real-time Current Clock & Status */}
                                <div className="lg:col-span-1 flex flex-col justify-between h-full space-y-4">
                                    <div>
                                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                            <Calendar className="h-3.5 w-3.5 text-[#635bff]" />
                                            {currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                        <div className="text-3xl font-extrabold text-gray-900 tracking-tight">
                                            {currentTime.toLocaleTimeString()}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-xl ${isClockedIn ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                            <Clock className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium">{t('Status')}</p>
                                            <h4 className="text-sm font-bold text-gray-800">
                                                {isClockedIn ? t('Clocked In') : t('Not Clocked In')}
                                            </h4>
                                        </div>
                                    </div>
                                </div>

                                {/* Center Side - Timer and Actions */}
                                <div className="lg:col-span-1 flex flex-col items-center justify-center py-6 lg:py-0 border-y lg:border-y-0 lg:border-x border-gray-100 px-0 lg:px-8">
                                    {isClockedIn && !clockOutTime && (
                                        <div className="text-center mb-4">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('Active Work Duration')}</p>
                                            <div className="text-4xl font-mono font-bold text-[#635bff] tracking-widest tabular-nums drop-shadow-sm">
                                                {elapsedTime}
                                            </div>
                                        </div>
                                    )}

                                    {clockOutTime ? (
                                        <div className="w-full text-center space-y-2">
                                            <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold">
                                                {t('Completed Today')}
                                            </Badge>
                                            <div className="grid grid-cols-2 gap-4 mt-2 text-left">
                                                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                                    <p className="text-[10px] text-gray-500 font-semibold uppercase">{t('Clock In')}</p>
                                                    <p className="text-xs font-bold text-gray-700 mt-0.5">{formatTime(clockInTime)}</p>
                                                </div>
                                                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                                    <p className="text-[10px] text-gray-500 font-semibold uppercase">{t('Clock Out')}</p>
                                                    <p className="text-xs font-bold text-gray-700 mt-0.5">{formatTime(clockOutTime)}</p>
                                                </div>
                                            </div>
                                            <p className="text-xs font-bold text-gray-500 mt-2">
                                                {t('Total Hours')}: <span className="text-[#635bff]">{totalWorkingHours}</span>
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="w-full flex flex-col items-center">
                                            {!stats.attendance_data?.can_clock ? (
                                                <div className="w-full text-center">
                                                    {(() => {
                                                        if (stats.attendance_data?.is_on_leave) {
                                                            const today = new Date().toISOString().split('T')[0];
                                                            const todayLeave = stats.recent_leave_applications?.find(leave => {
                                                                const leaveStart = leave.start_date.split('T')[0];
                                                                const leaveEnd = leave.end_date.split('T')[0];
                                                                return leaveStart <= today && leaveEnd >= today && leave.status === 'approved';
                                                            });
                                                            return (
                                                                <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl">
                                                                    <p className="font-bold text-xs text-orange-600">{t('On Leave Today')}</p>
                                                                    {todayLeave && (
                                                                        <p className="text-[11px] text-orange-500 mt-1 font-medium">{todayLeave.leave_type} ({todayLeave.total_days} {todayLeave.total_days > 1 ? t('days') : t('day')})</p>
                                                                    )}
                                                                </div>
                                                            );
                                                        } else if (stats.attendance_data?.is_holiday) {
                                                            const today = new Date().toISOString().split('T')[0];
                                                            const todayHoliday = stats.calendar_events?.find(event => {
                                                                const eventStart = event.startDate.split('T')[0];
                                                                const eventEnd = event.endDate.split('T')[0];
                                                                return eventStart <= today && eventEnd >= today && event.type === 'holiday';
                                                            });
                                                            return (
                                                                <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                                                                    <p className="font-bold text-xs text-red-600">{t('Today is a Holiday')}</p>
                                                                    {todayHoliday && (
                                                                        <p className="text-[11px] text-red-500 mt-1 font-medium">{todayHoliday.title}</p>
                                                                    )}
                                                                </div>
                                                            );
                                                        } else if (stats.attendance_data?.is_non_working_day) {
                                                            return (
                                                                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                                                    <p className="font-bold text-xs text-slate-500">{t('Non-Working Day')}</p>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                </div>
                                            ) : (
                                                <div className="w-full space-y-2">
                                                    <Button
                                                        onClick={handleClockAction}
                                                        className={`w-full py-6 rounded-xl font-bold text-sm tracking-wide shadow-sm transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 ${
                                                            isClockedIn
                                                                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-100'
                                                                : 'bg-[#635bff] hover:bg-[#534bd6] text-white shadow-[#635bff]/10'
                                                        }`}
                                                    >
                                                        {isClockedIn ? (
                                                            <>
                                                                <Square className="h-4.5 w-4.5 fill-current" />
                                                                {t('Clock Out')}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Play className="h-4.5 w-4.5 fill-current" />
                                                                {t('Clock In')}
                                                            </>
                                                        )}
                                                    </Button>
                                                    {isClockedIn && clockInTime && (
                                                        <p className="text-[11px] text-center text-gray-500 font-medium">
                                                            {t('Clocked in at')} <span className="font-bold">{formatTime(clockInTime)}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Right Side - Important Notes & Schedule */}
                                <div className="lg:col-span-1 p-4 rounded-xl bg-slate-50 border border-slate-100 self-stretch flex flex-col justify-between">
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                            <Shield className="h-3.5 w-3.5 text-[#635bff]" />
                                            {t('Shift & Schedule')}
                                        </h4>
                                        <div className="space-y-2 text-xs text-gray-600">
                                            <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100">
                                                <span className="font-medium text-gray-500">{t('Shift Timing')}</span>
                                                <span className="font-bold text-gray-800">
                                                    {stats.attendance_data?.shift_start_time ? formatTime(stats.attendance_data.shift_start_time) : '--:--'} - {stats.attendance_data?.shift_end_time ? formatTime(stats.attendance_data.shift_end_time) : '--:--'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100">
                                                <span className="font-medium text-gray-500">{t('Work Mode')}</span>
                                                <span className="font-bold text-gray-800">{t('Office')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-gray-400 font-medium space-y-1">
                                        <p>• {t('You can clock in/out once per day.')}</p>
                                        <p>• {t('Missed clock-outs will auto-complete at shift end.')}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Signed Letters & Documents */}
                {stats.signed_documents && stats.signed_documents.length > 0 && (
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
                                                {t('Signed on')}: {formatDate(doc.signed_at.split(' ')[0])}
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
                                {stats.recent_attendance && stats.recent_attendance.length > 0 ? (
                                    stats.recent_attendance.map((attendance, index) => {
                                        const getStatusIcon = (status) => {
                                            switch (status) {
                                                case 'present': return <CheckCircle className="h-5 w-5 text-green-500" />;
                                                case 'absent': return <XCircle className="h-5 w-5 text-red-500" />;
                                                case 'half day': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
                                                default: return <Clock className="h-5 w-5 text-gray-500" />;
                                            }
                                        };
                                        
                                        const getStatusBadge = (status) => {
                                            const statusColors = {
                                                'present': 'bg-green-100 text-green-800',
                                                'absent': 'bg-red-100 text-red-800',
                                                'half day': 'bg-yellow-100 text-yellow-800'
                                            };
                                            return statusColors[status] || 'bg-gray-100 text-gray-800';
                                        };
                                        

                                        
                                        return (
                                            <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                                <div className="flex items-center gap-3">
                                                    {getStatusIcon(attendance.status)}
                                                    <div>
                                                        <p className="text-sm font-medium">{formatDate(attendance.date)}</p>
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
                                                    {t(attendance.status?.charAt(0).toUpperCase() + attendance.status?.slice(1) || 'Unknown')}
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
                                {stats.recent_leave_applications && stats.recent_leave_applications.length > 0 ? (
                                    stats.recent_leave_applications.map((leave, index) => {
                                        const getStatusColor = (status: string) => {
                                            const statusColors = {
                                                pending: 'bg-yellow-100 text-yellow-800',
                                                approved: 'bg-green-100 text-green-800',
                                                rejected: 'bg-red-100 text-red-800'
                                            };
                                            return statusColors[status.toLowerCase() as keyof typeof statusColors] || statusColors.pending;
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
                                                    {t(leave.status.charAt(0).toUpperCase() + leave.status.slice(1))}
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
                                {stats.recent_awards && stats.recent_awards.length > 0 ? (
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
                                                        <p className="text-xs text-gray-500">{formatDate(award.award_date)}</p>
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
                                {stats.recent_warnings && stats.recent_warnings.length > 0 ? (
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
                                                        <p className="text-xs text-gray-500">{formatDate(warning.warning_date)}</p>
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
                                events={stats.calendar_events || []}
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
                                {stats.recent_announcements && stats.recent_announcements.length > 0 ? (
                                    stats.recent_announcements.map((announcement, index) => {
                                        const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500', 'bg-indigo-500'];
                                        const timeAgo = formatDate(announcement.created_at);
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
        </AuthenticatedLayout>
    );
}