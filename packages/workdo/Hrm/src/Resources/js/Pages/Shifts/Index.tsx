import { useState } from 'react';
import { Head, usePage, router, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Edit as EditIcon, Trash2, Eye, Clock, Globe, UserCheck, Copy, Archive, Moon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Create from './Create';
import EditShift from './Edit';
import AssignModal from './AssignModal';
import ImportCountryShiftModal from '../../Components/ImportCountryShiftModal';
import NoRecordsFound from '@/components/no-records-found';
import { Shift, ShiftsIndexProps, ShiftFilters } from './types';

export default function Index() {
    const { t } = useTranslation();
    const { shifts, auth, timezones, timezone_info, employees, departments } = usePage<ShiftsIndexProps>().props;
    const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');

    const [filters, setFilters] = useState<ShiftFilters>({
        search: urlParams.get('search') || '',
        shift_name: urlParams.get('shift_name') || '',
        shift_type: urlParams.get('shift_type') || 'all',
        country: urlParams.get('country') || 'all',
        is_active: urlParams.get('is_active') || 'all',
        created_by: urlParams.get('created_by') || '',
        creator_id: urlParams.get('creator_id') || '',
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    
    const [modalState, setModalState] = useState<{ isOpen: boolean; mode: string; data: Shift | null }>({
        isOpen: false,
        mode: '',
        data: null
    });

    const [assignModalShift, setAssignModalShift] = useState<Shift | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const masterCountryShifts = (usePage().props as any).master_country_shifts || [];

    const handleUpdateVersion = (shiftId: number) => {
        router.post(route('hrm.shifts.update-version', shiftId), {}, { preserveScroll: true });
    };

    const handleIgnoreVersion = (shiftId: number) => {
        router.post(route('hrm.shifts.ignore-version', shiftId), {}, { preserveScroll: true });
    };

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'hrm.shifts.destroy',
        defaultMessage: t('Are you sure you want to delete this shift?')
    });

    const handleSearch = (query: string) => {
        if (filters.search === query) return;
        const updated = { ...filters, search: query };
        setFilters(updated);
        router.get(route('hrm.shifts.index'), { ...updated, per_page: perPage }, { preserveState: true, replace: true });
    };

    const handleFilterChange = (field: keyof ShiftFilters, value: string) => {
        if (filters[field] === value) return;
        const updated = { ...filters, [field]: value };
        setFilters(updated);
        router.get(route('hrm.shifts.index'), { ...updated, per_page: perPage }, { preserveState: true, replace: true });
    };

    const clearFilters = () => {
        const reset: ShiftFilters = {
            search: '',
            shift_name: '',
            shift_type: 'all',
            country: 'all',
            is_active: 'all',
            created_by: '',
            creator_id: '',
        };
        setFilters(reset);
        router.get(route('hrm.shifts.index'), { per_page: perPage }, { replace: true });
    };

    const openModal = (mode: 'add' | 'edit', data: Shift | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const handleDuplicate = (id: number) => {
        router.post(route('hrm.shifts.duplicate', id), {}, { preserveState: true });
    };

    const handleArchive = (id: number) => {
        router.post(route('hrm.shifts.archive', id), {}, { preserveState: true });
    };

    const formatTime12h = (timeStr: string | null) => {
        if (!timeStr) return '--:--';
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

    const getShiftTypeBadge = (type: string) => {
        switch (type) {
            case 'flexible':
                return <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200 font-medium text-xs">{t('Flexible')}</Badge>;
            case 'rotational':
                return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 font-medium text-xs">{t('Rotational')}</Badge>;
            case 'split':
                return <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 font-medium text-xs">{t('Split')}</Badge>;
            case 'on_call':
                return <Badge variant="secondary" className="bg-rose-50 text-rose-700 border-rose-200 font-medium text-xs">{t('On-Call')}</Badge>;
            case 'night':
                return <Badge variant="secondary" className="bg-slate-700 text-white font-medium text-xs">{t('Night')}</Badge>;
            default:
                return <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium text-xs">{t('Fixed')}</Badge>;
        }
    };

    const hasPermission = (permission: string) => {
        if (!auth?.user) return false;
        if (auth.user.type === 'company' || auth.user.type === 'super admin') return true;
        return auth.user.permissions?.includes(permission) ?? true;
    };

    const shiftsList = shifts?.data || [];

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('HRM'), url: route('hrm.index') },
                { label: t('Shifts') }
            ]}
            pageTitle={t('Global Shift Management')}
            pageActions={
                hasPermission('create-shifts') ? (
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsImportModalOpen(true)}
                            className="gap-1.5 font-bold text-xs border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100"
                        >
                            <Globe className="h-4 w-4 text-indigo-600" />
                            {t('Import Country Standard')}
                        </Button>
                        <Button 
                            size="sm"
                            onClick={() => openModal('add')}
                            className="gap-1.5 font-medium"
                        >
                            <Plus className="h-4 w-4" />
                            {t('Create Custom Shift')}
                        </Button>
                    </div>
                ) : undefined
            }
        >
            <Head title={t('Global Shift Management')} />
            <TooltipProvider>
                <div className="space-y-4">
                    {/* Filter & Action Bar */}
                    <Card className="shadow-sm border-gray-200 p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                            <div className="sm:col-span-5">
                                <SearchInput
                                    value={filters.search}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder={t('Search by shift name, code, country, or timezone...')}
                                    className="w-full text-xs font-normal"
                                />
                            </div>

                            <div className="sm:col-span-3">
                                <Select value={filters.shift_type} onValueChange={(val) => handleFilterChange('shift_type', val)}>
                                    <SelectTrigger className="text-xs font-normal h-9">
                                        <SelectValue placeholder={t('All Shift Types')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('All Shift Types')}</SelectItem>
                                        <SelectItem value="fixed">{t('Fixed Shift')}</SelectItem>
                                        <SelectItem value="flexible">{t('Flexible Shift')}</SelectItem>
                                        <SelectItem value="rotational">{t('Rotational Shift')}</SelectItem>
                                        <SelectItem value="split">{t('Split Shift')}</SelectItem>
                                        <SelectItem value="on_call">{t('On-Call Duty')}</SelectItem>
                                        <SelectItem value="night">{t('Night Shift')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="sm:col-span-2">
                                <Select value={filters.is_active} onValueChange={(val) => handleFilterChange('is_active', val)}>
                                    <SelectTrigger className="text-xs font-normal h-9">
                                        <SelectValue placeholder={t('All Statuses')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('All Statuses')}</SelectItem>
                                        <SelectItem value="true">{t('Active Only')}</SelectItem>
                                        <SelectItem value="false">{t('Archived Only')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="sm:col-span-2 flex justify-end">
                                <Button variant="outline" size="sm" onClick={clearFilters} className="text-xs font-medium text-gray-600 w-full h-9">
                                    {t('Reset Filters')}
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Table List Card */}
                    <Card className="shadow-sm border-gray-200 overflow-hidden">
                        <CardContent className="p-0">
                            {shiftsList.length === 0 ? (
                                <NoRecordsFound
                                    title={t('No Shifts Found')}
                                    description={t('Get started by creating your first timezone-aware shift schedule.')}
                                />
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50/80 text-gray-600 font-medium border-b border-gray-200">
                                                <th className="py-3 px-4">{t('Shift Name & Code')}</th>
                                                <th className="py-3 px-4">{t('Type')}</th>
                                                <th className="py-3 px-4">{t('Country & Timezone')}</th>
                                                <th className="py-3 px-4">{t('Working Schedule')}</th>
                                                <th className="py-3 px-4">{t('Net Hours')}</th>
                                                <th className="py-3 px-4">{t('Assigned')}</th>
                                                <th className="py-3 px-4">{t('Status')}</th>
                                                <th className="py-3 px-4 text-right">{t('Actions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 font-normal text-gray-700">
                                            {shiftsList.map((shift) => (
                                                <tr key={shift.id} className="hover:bg-gray-50/60 transition-colors">
                                                    {/* Shift Name & Code */}
                                                    <td className="py-3 px-4">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-gray-900">{shift.shift_name}</span>
                                                                <Badge variant="outline" className="font-mono text-[11px] font-normal bg-gray-50 text-gray-600 border-gray-200">
                                                                    {shift.shift_code || ('SFT-' + shift.id)}
                                                                </Badge>
                                                                {shift.source_type === 'country_standard' && (
                                                                    <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-1.5 py-0.2">
                                                                        <Globe className="w-3 h-3 mr-1 text-indigo-600" />
                                                                        {t('Country Standard')}
                                                                    </Badge>
                                                                )}
                                                                <Badge variant="secondary" className="bg-slate-100 text-slate-700 text-[10px] font-bold font-mono">
                                                                    v{shift.version || 1}
                                                                </Badge>
                                                            </div>
                                                            {shift.has_update_available && (
                                                                <div className="mt-1 p-2 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
                                                                    <span className="text-amber-900 font-bold">
                                                                        ⚠️ Version {shift.latest_master_version} Available for {shift.country} Standard
                                                                    </span>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => handleUpdateVersion(shift.id)}
                                                                            className="h-6 text-[10px] font-bold bg-amber-600 hover:bg-amber-700 text-white px-2 py-0"
                                                                        >
                                                                            {t('Update Shift')}
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() => handleIgnoreVersion(shift.id)}
                                                                            className="h-6 text-[10px] font-semibold text-slate-600 hover:bg-amber-100 px-1.5 py-0"
                                                                        >
                                                                            {t('Ignore')}
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Shift Type */}
                                                    <td className="py-3 px-4">
                                                        {getShiftTypeBadge(shift.shift_type)}
                                                    </td>

                                                    {/* Country & Timezone */}
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-1.5">
                                                            <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
                                                            <div>
                                                                <div className="font-normal text-gray-800">
                                                                    {timezone_info?.[shift.timezone]?.abbreviation || shift.timezone}
                                                                    <span className="ml-1 text-muted-foreground">({timezone_info?.[shift.timezone]?.utc_offset || shift.timezone})</span>
                                                                </div>
                                                                <div className="text-[11px] text-muted-foreground">
                                                                    {shift.country || 'Global'} · {timezone_info?.[shift.timezone]?.local_time || '--:--'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Working Schedule */}
                                                    <td className="py-3 px-4">
                                                        {shift.shift_type === 'flexible' ? (
                                                            <span className="font-normal text-purple-700">
                                                                {t('Flexi')} ({shift.required_working_hours || 8}h)
                                                            </span>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-normal font-mono text-gray-900">
                                                                    {formatTime12h(shift.start_time)} – {formatTime12h(shift.end_time)}
                                                                </span>
                                                                {shift.is_cross_midnight && (
                                                                    <Tooltip>
                                                                        <TooltipTrigger>
                                                                            <Moon className="w-3.5 h-3.5 text-gray-500" />
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>{t('Crosses Midnight')}</TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Net Hours */}
                                                    <td className="py-3 px-4">
                                                        <span className="font-medium text-primary font-mono">
                                                            {shift.net_working_hours || 8} hrs
                                                        </span>
                                                    </td>

                                                    {/* Assigned */}
                                                    <td className="py-3 px-4">
                                                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-medium text-xs">
                                                            {shift.assigned_employees_count || 0} {t('Employees')}
                                                        </Badge>
                                                    </td>

                                                    {/* Status */}
                                                    <td className="py-3 px-4">
                                                        <Badge className={shift.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-medium text-xs" : "bg-gray-100 text-gray-600 font-medium text-xs"}>
                                                            {shift.is_active ? t('Active') : t('Archived')}
                                                        </Badge>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="py-3 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Link href={route('hrm.shifts.show', shift.id)}>
                                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-md">
                                                                            <Eye className="w-4 h-4" />
                                                                        </Button>
                                                                    </Link>
                                                                </TooltipTrigger>
                                                                <TooltipContent>{t('View Shift Summary')}</TooltipContent>
                                                            </Tooltip>

                                                            {hasPermission('edit-shifts') && (
                                                                <>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button variant="ghost" size="sm" onClick={() => setAssignModalShift(shift)} className="h-8 w-8 p-0 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-md">
                                                                                <UserCheck className="w-4 h-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>{t('Assign Employees')}</TooltipContent>
                                                                    </Tooltip>

                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button variant="ghost" size="sm" onClick={() => openModal('edit', shift)} className="h-8 w-8 p-0 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-md">
                                                                                <EditIcon className="w-4 h-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>{t('Edit Shift')}</TooltipContent>
                                                                    </Tooltip>

                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button variant="ghost" size="sm" onClick={() => handleDuplicate(shift.id)} className="h-8 w-8 p-0 text-gray-600 hover:text-emerald-600 hover:bg-gray-100 rounded-md">
                                                                                <Copy className="w-4 h-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>{t('Duplicate Shift')}</TooltipContent>
                                                                    </Tooltip>

                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button variant="ghost" size="sm" onClick={() => handleArchive(shift.id)} className="h-8 w-8 p-0 text-gray-600 hover:text-amber-600 hover:bg-gray-100 rounded-md">
                                                                                <Archive className="w-4 h-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>{shift.is_active ? t('Archive Shift') : t('Activate Shift')}</TooltipContent>
                                                                    </Tooltip>
                                                                </>
                                                            )}

                                                            {hasPermission('delete-shifts') && (
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(shift.id)} className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 rounded-md">
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>{t('Delete Shift')}</TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Pagination */}
                    {shifts?.data && shifts.data.length > 0 && (
                        <div className="pt-2">
                            <Pagination
                                data={shifts}
                                routeName="hrm.shifts.index"
                                filters={{ ...filters, per_page: perPage }}
                            />
                        </div>
                    )}
                </div>

                {/* Create & Edit Modals */}
                <Dialog open={modalState.isOpen} onOpenChange={(open) => !open && closeModal()}>
                    {modalState.mode === 'add' && (
                        <Create
                            timezones={timezones || []}
                            employees={employees || []}
                            departments={departments || []}
                            onClose={closeModal}
                        />
                    )}
                    {modalState.mode === 'edit' && modalState.data && (
                        <EditShift
                            shift={modalState.data}
                            timezones={timezones || []}
                            employees={employees || []}
                            departments={departments || []}
                            onClose={closeModal}
                        />
                    )}
                </Dialog>

                {/* Assign Employees Modal */}
                <Dialog open={Boolean(assignModalShift)} onOpenChange={(open) => !open && setAssignModalShift(null)}>
                    {assignModalShift && (
                        <AssignModal
                            shift={assignModalShift}
                            employees={employees || []}
                            departments={departments || []}
                            onClose={() => setAssignModalShift(null)}
                        />
                    )}
                </Dialog>

                {/* Import Country Standard Shift Modal */}
                <ImportCountryShiftModal
                    open={isImportModalOpen}
                    onOpenChange={setIsImportModalOpen}
                    masterCountryShifts={masterCountryShifts}
                />

                {/* Delete Confirmation */}
                <ConfirmationDialog
                    open={deleteState.isOpen}
                    onOpenChange={closeDeleteDialog}
                    onConfirm={confirmDelete}
                    title={t('Delete Shift')}
                    description={deleteState.message}
                />
            </TooltipProvider>
        </AuthenticatedLayout>
    );
}