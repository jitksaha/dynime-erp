import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import { usePageButtons } from '@/hooks/usePageButtons';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Edit, Trash2, Key, Users as UsersIcon, User as UserIcon, UserCheck, History, Lock, ShieldCheck } from "lucide-react";
import { getImagePath } from '@/utils/helpers';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { ListGridToggle } from '@/components/ui/list-grid-toggle';
import Create from './create';
import EditUser from './edit';
import ChangePassword from './change-password';
import NoRecordsFound from '@/components/no-records-found';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { User, UsersIndexProps, UserFilters, UserModalState } from './types';

export default function Index() {
    const { t } = useTranslation();
    const { users, roles, auth } = usePage<UsersIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<UserFilters>({
        name: urlParams.get('name') || '',
        email: urlParams.get('email') || '',
        role: urlParams.get('role') || '',
        is_enable_login: urlParams.get('is_enable_login') || ''
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');

    const [viewMode, setViewMode] = useState<'list' | 'grid'>(urlParams.get('view') as 'list' | 'grid' || 'list');
    const [modalState, setModalState] = useState<UserModalState>({
        isOpen: false,
        mode: '',
        data: null
    });
    const [showFilters, setShowFilters] = useState(true);

    // Add hook here
    const pageButtons = usePageButtons('userBtn','Test data');

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'users.destroy',
        defaultMessage: t('Are you sure you want to delete this user?')
    });

    const handleFilter = () => {
        router.get(route('users.index'), {...filters, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode}, {
            preserveState: true,
            replace: true
        });
    };

    const handleRoleSelect = (selectedRole: string) => {
        const roleValue = selectedRole === 'all' ? '' : selectedRole;
        const updatedFilters = { ...filters, role: roleValue };
        setFilters(updatedFilters);
        router.get(route('users.index'), {
            ...updatedFilters,
            per_page: perPage,
            sort: sortField,
            direction: sortDirection,
            view: viewMode
        }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('users.index'), {...filters, per_page: perPage, sort: field, direction, view: viewMode}, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ name: '', email: '', role: '', is_enable_login: '' });
        router.get(route('users.index'), {per_page: perPage, view: viewMode});
    };

    const openModal = (mode: 'add' | 'edit' | 'change-password', data: User | null = null) => {
        setModalState({
            isOpen: true,
            mode,
            data
        });
    };

    const closeModal = () => {
        setModalState({
            isOpen: false,
            mode: '',
            data: null
        });
    };

    const formatRole = (role: string) => {
        if (!role) return '';
        const lower = role.toLowerCase();
        if (lower === 'staff') return 'Employee';
        return role;
    };

    const tableColumns = [
        {
            key: 'avatar',
            header: t('Avatar'),
            render: (value: string) => (
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border flex items-center justify-center">
                    {value && value !== 'null' ? (
                        <img
                             src={getImagePath(value)}
                             alt="Avatar"
                             className="w-full h-full object-cover"
                        />
                    ) : (
                        <UserIcon className="w-5 h-5 text-gray-400" />
                    )}
                </div>
            )
        },
        {
            key: 'name',
            header: t('Name'),
            sortable: true,
            render: (value: string, user: User) => (
                <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100">
                    <span>{value}</span>
                    {Boolean(user.is_verified) && <VerifiedBadge size="xs" />}
                </div>
            )
        },
        {
            key: 'email',
            header: t('Email'),
            sortable: true,
            render: (value: string, user: User) => (
                <div className="flex flex-col min-w-0">
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{value || '-'}</span>
                    {user.official_email && (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold truncate mt-0.5" title={user.official_email}>
                            {user.official_email}
                        </span>
                    )}
                </div>
            )
        },
        {
            key: 'mobile_no',
            header: t('Mobile No')
        },
        {
            key: 'type',
            header: t('Role'),
            sortable: true,
            render: (value: string, user: User) => {
                const userRoles = user.roles && user.roles.length > 0
                    ? user.roles.map((r: any) => r.label || r.name)
                    : [formatRole(value)];
                return (
                    <div className="flex flex-wrap gap-1">
                        {userRoles.map((rName: string, idx: number) => (
                            <span key={idx} className="capitalize px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-md text-xs font-bold shadow-2xs">
                                {formatRole(rName)}
                            </span>
                        ))}
                    </div>
                );
            }
        },
        {
            key: 'is_enable_login',
            header: t('Login Status'),
            sortable: true,
            render: (value: boolean) => (
                <span className={`px-2 py-1 rounded-full text-sm ${
                    value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                    {value ? t('Enabled') : t('Disabled')}
                </span>
            )
        },
        ...(auth.user?.permissions?.some((p: string) => ['change-password-users', 'edit-users', 'delete-users'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, user: User) => (
                <div className="flex gap-1">
                    {user.is_disable === 1 ? (
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <div className="h-8 w-8 p-0 flex items-center justify-center text-gray-400">
                                    <Lock className="h-4 w-4" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{t('User is disabled')}</p>
                            </TooltipContent>
                        </Tooltip>
                    ) : (
                        <TooltipProvider>
                        {auth.user?.permissions?.includes('impersonate-users') && user.id !== auth.user?.id && (
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => router.post(route('users.impersonate', user.id))}
                                            className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700"
                                        >
                                            <UserCheck className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{t('Login As User')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                            {auth.user?.permissions?.includes('change-password-users') && (
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="sm" onClick={() => openModal('change-password', user)} className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700">
                                            <Key className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{t('Change Password')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                            {(auth.user?.type === 'company' || auth.user?.type === 'hr' || auth.user?.type === 'superadmin' || auth.user?.permissions?.includes('edit-users')) && (
                                Boolean(user.is_verified) ? (
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.post(route('users.toggle-verification', user.id))}
                                                className="h-8 w-8 p-0 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                                            >
                                                <VerifiedBadge size="xs" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{t('Official Verified (Click to unverify)')}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                ) : (
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.post(route('users.toggle-verification', user.id))}
                                                className="h-8 px-2 text-[11px] font-semibold text-slate-500 hover:text-indigo-700 bg-slate-100/80 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-300 rounded-lg flex items-center gap-1 transition-all"
                                            >
                                                <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                                                <span>{t('Verify')}</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{t('Mark as Verified User')}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )
                            )}
                            {auth.user?.permissions?.includes('edit-users') && (
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="sm" onClick={() => openModal('edit', user)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{t('Edit')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                            {auth.user?.permissions?.includes('delete-users') && (
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openDeleteDialog(user.id)}
                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{t('Delete')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </TooltipProvider>
                    )}
                </div>
            )
        }] : [])
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[{label: t('Users')}]}
            pageTitle={t('Manage Users')}
            pageActions={
                <div className="flex gap-2">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('view-login-history') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => router.get(route('users.login-history'))}>
                                        <History className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('User Login History')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('create-users') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button size="sm" onClick={() => openModal('add')}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Create')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {pageButtons.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                    </TooltipProvider>
                </div>
            }
        >
            <Head title={t('Users')} />

            {/* Main Content Card */}
            <Card className="shadow-sm">
                {/* Search & Controls Header */}
                <CardContent className="p-6 border-b bg-gray-50/50 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 max-w-md">
                            <SearchInput
                                value={filters.name}
                                onChange={(value) => setFilters({...filters, name: value})}
                                onSearch={handleFilter}
                                placeholder={t('Search users...')}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <ListGridToggle
                                currentView={viewMode}
                                routeName="users.index"
                                filters={{...filters, per_page: perPage}}
                            />
                            <PerPageSelector
                                routeName="users.index"
                                filters={{...filters, view: viewMode}}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.email, filters.role, filters.is_enable_login].filter(Boolean).length;
                                    return activeFilters > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                                            {activeFilters}
                                        </span>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* Dynamic Role-Wise Filter Pills / Tabs */}
                    {roles && Object.keys(roles).length > 0 && (
                        <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 scrollbar-thin">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1.5">
                                <UsersIcon className="w-3.5 h-3.5 text-indigo-600" />
                                {t('Role Filter')}:
                            </span>
                            <button
                                type="button"
                                onClick={() => handleRoleSelect('all')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 border ${
                                    !filters.role || filters.role === 'all'
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-extrabold'
                                        : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                                }`}
                            >
                                <span>{t('All Roles')}</span>
                            </button>
                            {Object.entries(roles).map(([roleId, roleLabel]) => {
                                const isSelected = filters.role === roleId || filters.role === roleLabel;
                                return (
                                    <button
                                        key={roleId}
                                        type="button"
                                        onClick={() => handleRoleSelect(roleId)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 border ${
                                            isSelected
                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-extrabold'
                                                : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                                        }`}
                                    >
                                        <span>{formatRole(roleLabel)}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </CardContent>

                {/* Advanced Filters (Open by default) */}
                {showFilters && (
                    <CardContent className="p-6 bg-blue-50/30 border-b">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Email')}</label>
                                <Input
                                    placeholder={t('Filter by email')}
                                    value={filters.email}
                                    onChange={(e) => setFilters({...filters, email: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Role')}</label>
                                <Select value={filters.role || 'all'} onValueChange={(value) => handleRoleSelect(value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by role')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('All Roles')}</SelectItem>
                                        {Object.entries(roles || {}).map(([id, label]) => (
                                            <SelectItem key={id} value={id}>
                                                {formatRole(label)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Login Status')}</label>
                                <Select value={filters.is_enable_login || 'all'} onValueChange={(value) => setFilters({...filters, is_enable_login: value === 'all' ? '' : value})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by login status')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('All Statuses')}</SelectItem>
                                        <SelectItem value="1">{t('Enabled')}</SelectItem>
                                        <SelectItem value="0">{t('Disabled')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end gap-2">
                                <Button onClick={handleFilter} size="sm">{t('Apply')}</Button>
                                <Button variant="outline" onClick={clearFilters} size="sm">{t('Clear')}</Button>
                            </div>
                        </div>
                    </CardContent>
                )}

                {/* Table Content */}
                <CardContent className="p-0">
                    {viewMode === 'list' ? (
                        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                            <div className="min-w-[800px]">
                            <DataTable
                                data={users.data}
                                columns={tableColumns}
                                onSort={handleSort}
                                sortKey={sortField}
                                sortDirection={sortDirection as 'asc' | 'desc'}
                                className="rounded-none"
                                emptyState={
                                    <NoRecordsFound
                                        icon={UsersIcon}
                                        title={t('No users found')}
                                        description={t('Get started by creating your first user.')}
                                        hasFilters={!!(filters.name || filters.email || filters.role || filters.is_enable_login)}
                                        onClearFilters={clearFilters}
                                        createPermission="create-users"
                                        onCreateClick={() => openModal('add')}
                                        createButtonText={t('Create User')}
                                        className="h-auto"
                                    />
                                }
                            />
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-auto max-h-[70vh] p-4">
                            {users.data.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                    {users.data.map((user) => (
                                        <Card key={user.id} className="border border-gray-200">
                                            <div className="p-4">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border flex-shrink-0">
                                                        {user.avatar && user.avatar !== 'null' ? (
                                                            <img
                                                                src={getImagePath(user.avatar)}
                                                                alt={user.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <UserIcon className="w-5 h-5 text-primary" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-base text-gray-900">{user.name}</h3>
                                                    </div>
                                                </div>

                                                <div className="space-y-3 mb-3">

                                                    <div>
                                                        <p className="text-xs font-medium text-gray-600 mb-1">{t('Email')}</p>
                                                        <p className="text-xs text-gray-900 truncate" title={user.email}>{user.email}</p>
                                                        {user.official_email && (
                                                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold truncate mt-0.5" title={user.official_email}>
                                                                {user.official_email}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <p className="text-xs font-medium text-gray-600 mb-1">{t('Role')}</p>
                                                            <p className="text-xs text-gray-900 capitalize truncate">{formatRole(user.type)}</p>
                                                        </div>
                                                        {user.mobile_no && (
                                                            <div>
                                                                <p className="text-xs font-medium text-gray-600 mb-1">{t('Mobile')}</p>
                                                                <p className="text-xs text-gray-900">{user.mobile_no}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-3 border-t">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                                                        user.is_enable_login ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {user.is_enable_login ? t('Enabled') : t('Disabled')}
                                                    </span>
                                                    <div className="flex gap-1">

                                                        {user.is_disable === 1 ? (
                                                            <Tooltip delayDuration={300}>
                                                                <TooltipTrigger asChild>
                                                                    <div className="h-8 w-8 p-0 flex items-center justify-center text-gray-400">
                                                                        <Lock className="h-4 w-4" />
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{t('User is disabled')}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        ) : (
                                                            <TooltipProvider>
                                                            {auth.user?.permissions?.includes('impersonate-users') && user.id !== auth.user?.id && (
                                                                    <Tooltip delayDuration={300}>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => router.post(route('users.impersonate', user.id))}
                                                                                className="h-8 w-8 p-0 text-purple-600"
                                                                            >
                                                                                <UserCheck className="h-4 w-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>{t('Login As User')}</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                                {auth.user?.permissions?.includes('change-password-users') && (
                                                                    <Tooltip delayDuration={300}>
                                                                        <TooltipTrigger asChild>
                                                                            <Button variant="ghost" size="sm" onClick={() => openModal('change-password', user)} className="h-8 w-8 p-0 text-orange-600">
                                                                                <Key className="h-4 w-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>{t('Change Password')}</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                                {auth.user?.permissions?.includes('edit-users') && (
                                                                    <Tooltip delayDuration={300}>
                                                                        <TooltipTrigger asChild>
                                                                            <Button variant="ghost" size="sm" onClick={() => openModal('edit', user)} className="h-8 w-8 p-0 text-blue-600">
                                                                                <Edit className="h-4 w-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>{t('Edit')}</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                                {auth.user?.permissions?.includes('delete-users') && (
                                                                    <Tooltip delayDuration={300}>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => openDeleteDialog(user.id)}
                                                                                className="h-8 w-8 p-0 text-red-600"
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>{t('Delete')}</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                            </TooltipProvider>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <NoRecordsFound
                                    icon={UsersIcon}
                                    title={t('No users found')}
                                    description={t('Get started by creating your first user.')}
                                    hasFilters={!!(filters.name || filters.email || filters.role || filters.is_enable_login)}
                                    onClearFilters={clearFilters}
                                    createPermission="create-users"
                                    onCreateClick={() => openModal('add')}
                                    createButtonText={t('Create User')}
                                />
                            )}
                        </div>
                    )}
                </CardContent>

                {/* Pagination Footer */}
                <CardContent className="px-4 py-2 border-t bg-gray-50/30">
                    <Pagination
                        data={users}
                        routeName="users.index"
                        filters={{...filters, per_page: perPage, view: viewMode}}
                    />
                </CardContent>
            </Card>

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create onSuccess={closeModal} roles={roles} />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <EditUser
                        user={modalState.data}
                        onSuccess={closeModal}
                        roles={roles}
                    />
                )}
                {modalState.mode === 'change-password' && modalState.data && (
                    <ChangePassword
                        user={modalState.data}
                        onSuccess={closeModal}
                    />
                )}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete User')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}