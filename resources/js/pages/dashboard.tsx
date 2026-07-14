import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Head, Link, usePage, router } from "@inertiajs/react";
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, BarChart } from '@/components/charts';
import { 
    FolderKanban, 
    Users, 
    Calculator, 
    Briefcase, 
    Store, 
    Contact, 
    Headphones, 
    TrendingUp, 
    ArrowRight,
    CheckSquare,
    Bug,
    UserCheck,
    Receipt,
    Plus,
    UserPlus,
    Wallet,
    Calendar,
    ChevronRight,
    Sparkles,
    BarChart3
} from 'lucide-react';

export default function Dashboard() {
    const { t } = useTranslation();
    const { 
        auth, 
        stats = {}, 
        recentProjects = [], 
        recentEmployees = [], 
        recentTransactions = [],
        financialAnalytics = [],
        taskAnalytics = []
    } = usePage<any>().props as any;
    
    const userName = auth?.user?.name || 'User';

    // Format current date
    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    // Color mapper matching theme
    const getStatusBadgeClass = (status: string) => {
        switch (status.toLowerCase()) {
            case 'finished':
            case 'completed':
            case 'approved':
                return 'bg-green-50 text-green-700 border-green-150';
            case 'ongoing':
            case 'pending':
            case 'in progress':
                return 'bg-blue-50 text-blue-700 border-blue-150';
            case 'on hold':
            case 'onhold':
                return 'bg-yellow-50 text-yellow-700 border-yellow-150';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-150';
        }
    };

    // Redesigned compact StatCard for all 7 active module widgets
    const StatCard = ({ title, value, subtitle, color = "blue", icon: Icon, onClick }: any) => {
        const colorClasses = {
            blue: "bg-gradient-to-r from-blue-50 to-blue-100/70 border-blue-200",
            green: "bg-gradient-to-r from-green-50 to-green-100/70 border-green-200",
            red: "bg-gradient-to-r from-red-50 to-red-100/70 border-red-200",
            purple: "bg-gradient-to-r from-purple-50 to-purple-100/70 border-purple-200",
            orange: "bg-gradient-to-r from-orange-50 to-orange-100/70 border-orange-200",
            emerald: "bg-gradient-to-r from-emerald-50 to-emerald-100/70 border-emerald-200",
            indigo: "bg-gradient-to-r from-indigo-50 to-indigo-100/70 border-indigo-200"
        };
        const textColors = {
            blue: "text-blue-700",
            green: "text-green-700",
            red: "text-red-700",
            purple: "text-purple-700",
            orange: "text-orange-700",
            emerald: "text-emerald-700",
            indigo: "text-indigo-700"
        };

        return (
            <Card 
                onClick={onClick}
                className={`relative overflow-hidden cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md border p-3 flex flex-col justify-between min-h-[92px] ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}
            >
                <div className="flex items-start justify-between gap-1">
                    <div className={`text-[10px] font-bold tracking-tight uppercase opacity-90 leading-tight truncate max-w-[80%] ${textColors[color as keyof typeof textColors] || textColors.blue}`}>
                        {title}
                    </div>
                    {Icon && (
                        <div className="p-1 rounded-md bg-white/50 flex-shrink-0">
                            <Icon className={`h-4 w-4 ${textColors[color as keyof typeof textColors] || textColors.blue}`} />
                        </div>
                    )}
                </div>
                <div className="mt-1">
                    <div className={`text-lg font-bold leading-none ${textColors[color as keyof typeof textColors] || textColors.blue}`}>
                        {value}
                    </div>
                    {subtitle && (
                        <p className={`text-[9px] opacity-75 mt-1 font-semibold truncate ${textColors[color as keyof typeof textColors] || textColors.blue}`}>
                            {subtitle}
                        </p>
                    )}
                </div>
            </Card>
        );
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[{ label: t('Dashboard') }]}
            pageTitle={t('Dashboard')}
        >
            <Head title={t('Dashboard')} />

            <div className="space-y-6 pb-8">
                {/* Welcome Card Banner */}
                <Card className="bg-white border border-gray-150 shadow-sm rounded-xl overflow-hidden">
                    <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
                                {t('Welcome back')}, {userName}! <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">
                                {t('Here is your consolidated command center. Control and monitor all modules instantly.')}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl text-gray-600 text-xs font-semibold self-start md:self-auto">
                            <span>📅</span>
                            <span>{currentDate}</span>
                        </div>
                    </div>
                </Card>

                {/* Primary Stats Grid displaying all 7 active module widgets */}
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
                    {stats.taskly?.active && (
                        <StatCard
                            title={t('Projects')}
                            value={stats.taskly.total_projects}
                            subtitle={`${stats.taskly.task_completion_rate}% completed`}
                            color="blue"
                            icon={FolderKanban}
                            onClick={() => router.get(route('project.dashboard.index'))}
                        />
                    )}

                    {stats.hrm?.active && (
                        <StatCard
                            title={t('Employees')}
                            value={stats.hrm.total_employees}
                            subtitle={`${stats.hrm.present_today} present`}
                            color="green"
                            icon={Users}
                            onClick={() => router.get(route('hrm.index'))}
                        />
                    )}

                    {stats.account?.active && (
                        <StatCard
                            title={t('Net Profit')}
                            value={`$${stats.account.net_profit?.toLocaleString() || 0}`}
                            subtitle={`Rev: $${stats.account.total_revenue?.toLocaleString() || 0}`}
                            color="emerald"
                            icon={TrendingUp}
                            onClick={() => router.get(route('account.index'))}
                        />
                    )}

                    {stats.recruitment?.active && (
                        <StatCard
                            title={t('Active Jobs')}
                            value={stats.recruitment.total_jobs}
                            subtitle={`${stats.recruitment.total_candidates} candidates`}
                            color="purple"
                            icon={Briefcase}
                            onClick={() => router.get(route('recruitment.index'))}
                        />
                    )}

                    {stats.pos?.active && (
                        <StatCard
                            title={t('POS Sales')}
                            value={stats.pos.total_sales}
                            subtitle={`$${stats.pos.total_revenue?.toLocaleString() || 0}`}
                            color="orange"
                            icon={Store}
                            onClick={() => router.get(route('pos.index'))}
                        />
                    )}

                    {stats.lead?.active && (
                        <StatCard
                            title={t('CRM Leads')}
                            value={stats.lead.total_leads}
                            subtitle={`${stats.lead.total_deals} deals`}
                            color="indigo"
                            icon={Contact}
                            onClick={() => router.get(route('lead.index'))}
                        />
                    )}

                    {stats.support?.active && (
                        <StatCard
                            title={t('Open Tickets')}
                            value={stats.support.open_tickets}
                            subtitle={`${stats.support.total_tickets} tickets`}
                            color="red"
                            icon={Headphones}
                            onClick={() => router.get(route('dashboard.support-tickets'))}
                        />
                    )}
                </div>

                {/* Analytics Widgets Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Financial Line Chart */}
                    <Card className="lg:col-span-2 bg-white border border-gray-150 shadow-sm rounded-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-md font-bold text-gray-800 flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-emerald-500" />
                                {t('Monthly Financial Overview')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[280px]">
                                <LineChart
                                    data={financialAnalytics}
                                    xAxisKey="month"
                                    dataKey="revenue"
                                    height={260}
                                    showTooltip={true}
                                    showGrid={true}
                                    showLegend={true}
                                    lines={[
                                        { dataKey: 'revenue', color: '#10b77f', name: t('Revenue') },
                                        { dataKey: 'expense', color: '#ef4444', name: t('Expense') },
                                        { dataKey: 'profit', color: '#3b82f6', name: t('Net Profit') }
                                    ]}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Task Completion Bar Chart */}
                    <Card className="bg-white border border-gray-150 shadow-sm rounded-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-md font-bold text-gray-800 flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-blue-500" />
                                {t('Task Activity Overview')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[280px]">
                                <BarChart
                                    data={taskAnalytics}
                                    xAxisKey="month"
                                    dataKey="created"
                                    height={260}
                                    showTooltip={true}
                                    showGrid={true}
                                    showLegend={true}
                                    bars={[
                                        { dataKey: 'created', color: '#3b82f6', name: t('Created') },
                                        { dataKey: 'completed', color: '#10b77f', name: t('Completed') }
                                    ]}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Module-wise Section Cards */}
                <h2 className="text-md font-bold text-gray-800 tracking-tight mt-6">{t('Active Module Overviews')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Project Module Dashboard */}
                    {stats.taskly?.active && (
                        <Card className="bg-white border border-gray-150 shadow-sm rounded-xl overflow-hidden flex flex-col justify-between">
                            <div className="p-5">
                                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <FolderKanban className="h-5 w-5 text-blue-500" />
                                        <span className="font-semibold text-sm text-gray-800">{t('Projects & Tasks')}</span>
                                    </div>
                                    <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-0.5 rounded-full font-semibold">Taskly</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                                        <span className="text-[10px] text-gray-400 uppercase font-semibold">{t('Projects')}</span>
                                        <p className="text-sm font-bold text-gray-800 mt-1">{stats.taskly.total_projects}</p>
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                                        <span className="text-[10px] text-gray-400 uppercase font-semibold">{t('Tasks')}</span>
                                        <p className="text-sm font-bold text-gray-800 mt-1">{stats.taskly.total_tasks}</p>
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                                        <span className="text-[10px] text-gray-400 uppercase font-semibold">{t('Bugs')}</span>
                                        <p className="text-sm font-bold text-red-500 mt-1">{stats.taskly.active_bugs}</p>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <div className="flex justify-between text-xs mb-1 text-gray-500">
                                        <span>{t('Completion Progress')}</span>
                                        <span>{stats.taskly.task_completion_rate}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                        <div 
                                            className="bg-blue-500 h-full transition-all duration-300"
                                            style={{ width: `${stats.taskly.task_completion_rate}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50/60 border-t border-gray-100">
                                <Link 
                                    href={route('project.dashboard.index')}
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 group"
                                >
                                    {t('Go to Project Dashboard')}
                                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            </div>
                        </Card>
                    )}

                    {/* HRM Module Dashboard */}
                    {stats.hrm?.active && (
                        <Card className="bg-white border border-gray-150 shadow-sm rounded-xl overflow-hidden flex flex-col justify-between">
                            <div className="p-5">
                                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-5 w-5 text-green-500" />
                                        <span className="font-semibold text-sm text-gray-800">{t('HRM & Attendance')}</span>
                                    </div>
                                    <span className="text-[10px] bg-green-50 text-green-600 border border-green-100 px-2.5 py-0.5 rounded-full font-semibold">HRM</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-4">
                                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 flex justify-between items-center">
                                        <span className="text-[10px] text-gray-400 uppercase font-semibold">{t('Staff Count')}</span>
                                        <p className="text-sm font-bold text-gray-800">{stats.hrm.total_employees}</p>
                                    </div>
                                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 flex justify-between items-center">
                                        <span className="text-[10px] text-gray-400 uppercase font-semibold">{t('Present')}</span>
                                        <p className="text-sm font-bold text-green-600">{stats.hrm.present_today}</p>
                                    </div>
                                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 flex justify-between items-center">
                                        <span className="text-[10px] text-gray-400 uppercase font-semibold">{t('On Leave')}</span>
                                        <p className="text-sm font-bold text-blue-600">{stats.hrm.on_leave}</p>
                                    </div>
                                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 flex justify-between items-center">
                                        <span className="text-[10px] text-gray-400 uppercase font-semibold">{t('Pending Leaves')}</span>
                                        <p className="text-sm font-bold text-amber-600">{stats.hrm.pending_leaves}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50/60 border-t border-gray-100">
                                <Link 
                                    href={route('hrm.index')}
                                    className="text-xs font-semibold text-green-600 hover:text-green-700 transition-colors flex items-center gap-1 group"
                                >
                                    {t('Go to HRM Dashboard')}
                                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            </div>
                        </Card>
                    )}

                    {/* Account Module Dashboard */}
                    {stats.account?.active && (
                        <Card className="bg-white border border-gray-150 shadow-sm rounded-xl overflow-hidden flex flex-col justify-between">
                            <div className="p-5">
                                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <Calculator className="h-5 w-5 text-emerald-500" />
                                        <span className="font-semibold text-sm text-gray-800">{t('Accounting & Finance')}</span>
                                    </div>
                                    <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-0.5 rounded-full font-semibold">Account</span>
                                </div>
                                <div className="space-y-2 mt-4">
                                    <div className="flex justify-between items-center text-xs text-gray-500">
                                        <span>💰 {t('Total Revenues')}</span>
                                        <span className="font-semibold text-gray-800">${stats.account.total_revenue?.toLocaleString() || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-gray-500">
                                        <span>📉 {t('Total Expenses')}</span>
                                        <span className="font-semibold text-gray-800">${stats.account.total_expense?.toLocaleString() || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs border-t border-gray-100 pt-2 mt-2">
                                        <span className="font-semibold text-gray-700">💎 {t('Net Profit')}</span>
                                        <span className={`font-bold ${stats.account.net_profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                            ${stats.account.net_profit?.toLocaleString() || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50/60 border-t border-gray-100">
                                <Link 
                                    href={route('account.index')}
                                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1 group"
                                >
                                    {t('Go to Account Dashboard')}
                                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            </div>
                        </Card>
                    )}

                    {/* Recruitment Module Dashboard */}
                    {stats.recruitment?.active && (
                        <Card className="bg-white border border-gray-150 shadow-sm rounded-xl overflow-hidden flex flex-col justify-between">
                            <div className="p-5">
                                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <Briefcase className="h-5 w-5 text-purple-500" />
                                        <span className="font-semibold text-sm text-gray-800">{t('Recruitment & Hiring')}</span>
                                    </div>
                                    <span className="text-[10px] bg-purple-50 text-purple-600 border border-purple-100 px-2.5 py-0.5 rounded-full font-semibold">Recruitment</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                                        <span className="text-[10px] text-gray-400 uppercase font-semibold">{t('Active Jobs')}</span>
                                        <p className="text-sm font-bold text-gray-800 mt-1">{stats.recruitment.total_jobs}</p>
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                                        <span className="text-[10px] text-gray-400 uppercase font-semibold">{t('Candidates')}</span>
                                        <p className="text-sm font-bold text-gray-800 mt-1">{stats.recruitment.total_candidates}</p>
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                                        <span className="text-[10px] text-gray-400 uppercase font-semibold">{t('Interviews')}</span>
                                        <p className="text-sm font-bold text-purple-600 mt-1">{stats.recruitment.total_interviews}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50/60 border-t border-gray-100">
                                <Link 
                                    href={route('recruitment.index')}
                                    className="text-xs font-semibold text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1 group"
                                >
                                    {t('Go to Recruitment Dashboard')}
                                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            </div>
                        </Card>
                    )}

                    {/* POS Module Dashboard */}
                    {stats.pos?.active && (
                        <Card className="bg-white border border-gray-150 shadow-sm rounded-xl overflow-hidden flex flex-col justify-between">
                            <div className="p-5">
                                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <Store className="h-5 w-5 text-orange-500" />
                                        <span className="font-semibold text-sm text-gray-800">{t('Point of Sale (POS)')}</span>
                                    </div>
                                    <span className="text-[10px] bg-orange-50 text-orange-600 border border-orange-100 px-2.5 py-0.5 rounded-full font-semibold">POS</span>
                                </div>
                                <div className="space-y-3 mt-4">
                                    <div className="flex justify-between items-center text-xs text-gray-500">
                                        <span>🛒 {t('Total Transactions')}</span>
                                        <span className="font-semibold text-gray-800">{stats.pos.total_sales}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-gray-500">
                                        <span>💵 {t('Total Revenue')}</span>
                                        <span className="font-bold text-orange-600">${stats.pos.total_revenue?.toLocaleString() || 0}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50/60 border-t border-gray-100">
                                <Link 
                                    href={route('pos.index')}
                                    className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors flex items-center gap-1 group"
                                >
                                    {t('Go to POS Dashboard')}
                                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            </div>
                        </Card>
                    )}

                    {/* CRM (Lead) Module Dashboard */}
                    {stats.lead?.active && (
                        <Card className="bg-white border border-gray-150 shadow-sm rounded-xl overflow-hidden flex flex-col justify-between">
                            <div className="p-5">
                                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <Contact className="h-5 w-5 text-indigo-500" />
                                        <span className="font-semibold text-sm text-gray-800">{t('CRM & Leads')}</span>
                                    </div>
                                    <span className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-2.5 py-0.5 rounded-full font-semibold">CRM</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 flex justify-between items-center">
                                        <span className="text-[10px] text-gray-400 uppercase font-semibold">{t('Leads')}</span>
                                        <p className="text-sm font-bold text-gray-800">{stats.lead.total_leads}</p>
                                    </div>
                                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 flex justify-between items-center">
                                        <span className="text-[10px] text-gray-400 uppercase font-semibold">{t('Deals')}</span>
                                        <p className="text-sm font-bold text-indigo-600">{stats.lead.total_deals}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50/60 border-t border-gray-100">
                                <Link 
                                    href={route('lead.index')}
                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1 group"
                                >
                                    {t('Go to CRM Dashboard')}
                                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            </div>
                        </Card>
                    )}

                    {/* Support Module Dashboard */}
                    {stats.support?.active && (
                        <Card className="bg-white border border-gray-150 shadow-sm rounded-xl overflow-hidden flex flex-col justify-between">
                            <div className="p-5">
                                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <Headphones className="h-5 w-5 text-red-500" />
                                        <span className="font-semibold text-sm text-gray-800">{t('Support Tickets')}</span>
                                    </div>
                                    <span className="text-[10px] bg-red-50 text-red-600 border border-red-100 px-2.5 py-0.5 rounded-full font-semibold">Support</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 flex justify-between items-center">
                                        <span className="text-[10px] text-gray-400 uppercase font-semibold">{t('Open Tickets')}</span>
                                        <p className="text-sm font-bold text-red-500">{stats.support.open_tickets}</p>
                                    </div>
                                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 flex justify-between items-center">
                                        <span className="text-[10px] text-gray-400 uppercase font-semibold">{t('Total Tickets')}</span>
                                        <p className="text-sm font-bold text-gray-800">{stats.support.total_tickets}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50/60 border-t border-gray-100">
                                <Link 
                                    href={route('dashboard.support-tickets')}
                                    className="text-xs font-semibold text-red-600 hover:text-red-700 transition-colors flex items-center gap-1 group"
                                >
                                    {t('Go to Support Dashboard')}
                                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Recent Activities & Quick Actions Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                    {/* Left Column: Recent Lists (Recent Projects & Recent Transactions) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Recent Projects list */}
                        {stats.taskly?.active && (
                            <Card className="bg-white border border-gray-150 shadow-sm rounded-xl overflow-hidden">
                                <CardHeader className="pb-3 border-b border-gray-100">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-md font-bold text-gray-800 flex items-center gap-2">
                                            <FolderKanban className="h-5 w-5 text-blue-500" />
                                            {t('Recent Projects')}
                                        </CardTitle>
                                        <Link 
                                            href={route('project.index')} 
                                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                                        >
                                            {t('View All')} <ChevronRight className="h-3 w-3" />
                                        </Link>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {recentProjects.length > 0 ? (
                                        <div className="divide-y divide-gray-100">
                                            {recentProjects.map((project: any) => (
                                                <div 
                                                    key={project.id} 
                                                    className="p-4 flex items-center justify-between hover:bg-gray-50/60 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                            <FolderKanban className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-gray-800">{project.name}</h4>
                                                            <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                                                <Calendar className="h-3 w-3" /> {project.created_at}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className={`text-[10px] border px-2.5 py-0.5 rounded-full font-semibold ${getStatusBadgeClass(project.status)}`}>
                                                        {project.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-gray-400 text-sm">
                                            {t('No projects found.')}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Recent Transactions List */}
                        {stats.account?.active && (
                            <Card className="bg-white border border-gray-150 shadow-sm rounded-xl overflow-hidden">
                                <CardHeader className="pb-3 border-b border-gray-100">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-md font-bold text-gray-800 flex items-center gap-2">
                                            <Wallet className="h-5 w-5 text-emerald-500" />
                                            {t('Recent Financial Activities')}
                                        </CardTitle>
                                        <Link 
                                            href={route('account.revenues.index')} 
                                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
                                        >
                                            {t('View All')} <ChevronRight className="h-3 w-3" />
                                        </Link>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {recentTransactions.length > 0 ? (
                                        <div className="divide-y divide-gray-100">
                                            {recentTransactions.map((tx: any) => (
                                                <div 
                                                    key={tx.id} 
                                                    className="p-4 flex items-center justify-between hover:bg-gray-50/60 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                                            <TrendingUp className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-gray-800">{tx.description}</h4>
                                                            <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                                                <Calendar className="h-3 w-3" /> {tx.date}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="text-sm font-bold text-emerald-600">
                                                        +${tx.amount?.toLocaleString()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-gray-400 text-sm">
                                            {t('No financial activities recorded yet.')}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Column: Quick Actions Hub & Recent Employees */}
                    <div className="space-y-6">
                        {/* Quick Action Shortcuts */}
                        <Card className="bg-white border border-gray-150 shadow-sm rounded-xl overflow-hidden">
                            <CardHeader className="pb-3 border-b border-gray-100">
                                <CardTitle className="text-md font-bold text-gray-800">
                                    ⚡ {t('Quick Action Shortcuts')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-3">
                                {stats.taskly?.active && (
                                    <button 
                                        onClick={() => router.get(route('project.index'))}
                                        className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-blue-50/20 hover:border-blue-200 transition-all text-left group"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <Plus className="h-4 w-4 text-blue-500 bg-blue-50 rounded p-0.5 group-hover:scale-110 transition-transform" />
                                            <span className="text-xs font-semibold text-gray-700 group-hover:text-blue-700">{t('Create New Project')}</span>
                                        </div>
                                        <ChevronRight className="h-3 w-3 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                )}

                                {stats.hrm?.active && (
                                    <button 
                                        onClick={() => router.get(route('hrm.employees.index'))}
                                        className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-green-50/20 hover:border-green-200 transition-all text-left group"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <UserPlus className="h-4 w-4 text-green-500 bg-green-50 rounded p-0.5 group-hover:scale-110 transition-transform" />
                                            <span className="text-xs font-semibold text-gray-700 group-hover:text-green-700">{t('Add New Employee')}</span>
                                        </div>
                                        <ChevronRight className="h-3 w-3 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                )}

                                {stats.account?.active && (
                                    <button 
                                        onClick={() => router.get(route('account.revenues.index'))}
                                        className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-emerald-50/20 hover:border-emerald-200 transition-all text-left group"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <Wallet className="h-4 w-4 text-emerald-500 bg-emerald-50 rounded p-0.5 group-hover:scale-110 transition-transform" />
                                            <span className="text-xs font-semibold text-gray-700 group-hover:text-emerald-700">{t('Record New Revenue')}</span>
                                        </div>
                                        <ChevronRight className="h-3 w-3 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                )}

                                {stats.pos?.active && (
                                    <button 
                                        onClick={() => router.get(route('pos.index'))}
                                        className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-orange-50/20 hover:border-orange-200 transition-all text-left group"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <Store className="h-4 w-4 text-orange-500 bg-orange-50 rounded p-0.5 group-hover:scale-110 transition-transform" />
                                            <span className="text-xs font-semibold text-gray-700 group-hover:text-orange-700">{t('Open POS Terminal')}</span>
                                        </div>
                                        <ChevronRight className="h-3 w-3 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                )}

                                {stats.support?.active && (
                                    <button 
                                        onClick={() => router.get(route('support-tickets.index'))}
                                        className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-rose-50/20 hover:border-rose-200 transition-all text-left group"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <Plus className="h-4 w-4 text-rose-500 bg-rose-50 rounded p-0.5 group-hover:scale-110 transition-transform" />
                                            <span className="text-xs font-semibold text-gray-700 group-hover:text-rose-700">{t('Submit Help Ticket')}</span>
                                        </div>
                                        <ChevronRight className="h-3 w-3 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Onboarded Employees list */}
                        {stats.hrm?.active && (
                            <Card className="bg-white border border-gray-150 shadow-sm rounded-xl overflow-hidden">
                                <CardHeader className="pb-3 border-b border-gray-100 flex flex-row items-center justify-between">
                                    <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                        <Users className="h-5 w-5 text-green-500" />
                                        {t('Recent Onboardings')}
                                    </CardTitle>
                                    <Link 
                                        href={route('hrm.employees.index')} 
                                        className="text-xs font-semibold text-green-600 hover:text-green-700 flex items-center gap-0.5"
                                    >
                                        {t('View')} <ChevronRight className="h-3 w-3" />
                                    </Link>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {recentEmployees.length > 0 ? (
                                        <div className="divide-y divide-gray-50">
                                            {recentEmployees.map((emp: any) => (
                                                <div 
                                                    key={emp.id} 
                                                    className="p-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors"
                                                >
                                                    <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 font-bold text-xs">
                                                        {emp.name.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h5 className="text-xs font-bold text-gray-850 truncate">{emp.name}</h5>
                                                        <p className="text-[10px] text-gray-400 truncate">{emp.email}</p>
                                                    </div>
                                                    <span className="text-[9px] text-gray-400 self-center">
                                                        {emp.created_at}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-6 text-center text-gray-400 text-xs">
                                            {t('No recent employees.')}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}