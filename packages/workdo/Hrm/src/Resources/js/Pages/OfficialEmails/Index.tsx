import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/ui/input-error';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { getImagePath } from '@/utils/helpers';
import { toast } from 'sonner';
import {
    Mail,
    Eye,
    EyeOff,
    Copy,
    LogIn,
    Edit2,
    Search,
    ShieldCheck,
    Lock,
    KeyRound
} from 'lucide-react';

export default function Index({ officialEmails, filters }: any) {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [visiblePasswords, setVisiblePasswords] = useState<Record<number, boolean>>({});

    // Edit Modal State
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const { data, setData, put, processing, errors, reset } = useForm({
        official_email: '',
        official_email_password: '',
    });

    const togglePasswordVisibility = (id: number) => {
        setVisiblePasswords((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const handleCopy = (text: string, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success(t(`${label} copied to clipboard!`));
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('hrm.official-emails.index'), { search: searchTerm }, { preserveState: true });
    };

    const openEditModal = (employee: any) => {
        setSelectedEmployee(employee);
        setData({
            official_email: employee.official_email || '',
            official_email_password: employee.official_email_password || '',
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateCredentials = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployee) return;

        put(route('hrm.official-emails.update', selectedEmployee.id), {
            onSuccess: () => {
                setIsEditModalOpen(false);
                reset();
                toast.success(t('Official email credentials updated!'));
            },
        });
    };

    const handleLoginAsUser = (userId: number, userName: string) => {
        if (confirm(t(`Are you sure you want to login as user "${userName}"?`))) {
            router.post(route('users.impersonate', userId));
        }
    };

    const columns = [
        {
            key: 'user',
            header: t('Issued To (Employee)'),
            render: (_: any, row: any) => (
                <div className="flex items-center gap-3">
                    <img
                        src={getImagePath(row.user?.avatar || 'avatar.png')}
                        alt={row.user?.name || 'Avatar'}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                        <span className="font-bold text-slate-900 dark:text-slate-100 truncate text-xs">
                            {row.user?.name || '-'}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                            ID: {row.employee_id}
                        </span>
                        {(row.department?.department_name || row.designation?.designation_name) && (
                            <span className="text-[10px] text-slate-400 truncate">
                                {row.department?.department_name} {row.designation?.designation_name ? `• ${row.designation.designation_name}` : ''}
                            </span>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'official_email',
            header: t('Official Email'),
            render: (email: string) => (
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200 dark:border-slate-800 max-w-xs">
                    <Mail className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="font-mono text-xs text-slate-800 dark:text-slate-200 truncate select-all">
                        {email || '-'}
                    </span>
                    {email && (
                        <button
                            type="button"
                            onClick={() => handleCopy(email, 'Official email')}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-auto shrink-0 p-1"
                            title={t('Copy Email')}
                        >
                            <Copy className="w-3 h-3" />
                        </button>
                    )}
                </div>
            ),
        },
        {
            key: 'official_email_password',
            header: t('Email Password'),
            render: (password: string, row: any) => {
                const isVisible = !!visiblePasswords[row.id];
                return (
                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200 dark:border-slate-800 max-w-xs">
                        <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="font-mono text-xs text-slate-800 dark:text-slate-200 truncate select-all tracking-wider">
                            {password ? (isVisible ? password : '••••••••••••') : <span className="italic text-slate-400 text-[11px]">{t('Not set')}</span>}
                        </span>
                        {password && (
                            <div className="flex items-center gap-0.5 ml-auto shrink-0">
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility(row.id)}
                                    className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1"
                                    title={isVisible ? t('Hide Password') : t('Show Password')}
                                >
                                    {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleCopy(password, 'Email password')}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                                    title={t('Copy Password')}
                                >
                                    <Copy className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'actions',
            header: t('Actions'),
            render: (_: any, row: any) => (
                <div className="flex items-center gap-2">
                    {/* Login as User button */}
                    {row.user?.id && (
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleLoginAsUser(row.user.id, row.user.name)}
                            className="h-8 text-xs font-bold gap-1.5 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                        >
                            <LogIn className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            <span>{t('Login as User')}</span>
                        </Button>
                    )}

                    {/* Edit Credentials button */}
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditModal(row)}
                        className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600"
                        title={t('Edit Credentials')}
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title={t('Official Emails Directory')} />

            <div className="p-6 space-y-6">
                {/* Header Title */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <Mail className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            {t('Official Emails Directory')}
                        </h1>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            {t('Strictly confidential. Accessible only by Company Admins and HR Management.')}
                        </p>
                    </div>

                    {/* Search Form */}
                    <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                            <Input
                                type="text"
                                placeholder={t('Search email, password or user...')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 h-9 text-xs"
                            />
                        </div>
                        <Button type="submit" size="sm" className="h-9 px-3 text-xs font-bold">
                            {t('Search')}
                        </Button>
                    </form>
                </div>

                {/* Main Data Table Card */}
                <Card className="border-slate-200 dark:border-slate-800">
                    <CardContent className="p-0">
                        <DataTable
                            columns={columns}
                            data={officialEmails?.data || []}
                            pagination={officialEmails}
                        />
                    </CardContent>
                </Card>

                {/* Edit Modal */}
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base font-bold">
                                <Lock className="w-4 h-4 text-indigo-600" />
                                {t('Update Official Email & Password')}
                            </DialogTitle>
                        </DialogHeader>

                        {selectedEmployee && (
                            <form onSubmit={handleUpdateCredentials} className="space-y-4 pt-2">
                                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                                    <span className="text-slate-500 font-medium block">{t('Target Employee:')}</span>
                                    <strong className="text-slate-900 dark:text-slate-100">{selectedEmployee.user?.name}</strong> (ID: {selectedEmployee.employee_id})
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="official_email" required>{t('Official Email')}</Label>
                                    <Input
                                        id="official_email"
                                        type="email"
                                        value={data.official_email}
                                        onChange={(e) => setData('official_email', e.target.value)}
                                        placeholder="name@company.com"
                                        className="h-9 text-xs font-mono"
                                        required
                                    />
                                    <InputError message={errors.official_email} />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="official_email_password" required>{t('Email Password')}</Label>
                                    <Input
                                        id="official_email_password"
                                        type="text"
                                        value={data.official_email_password}
                                        onChange={(e) => setData('official_email_password', e.target.value)}
                                        placeholder="Enter password..."
                                        className="h-9 text-xs font-mono"
                                        required
                                    />
                                    <InputError message={errors.official_email_password} />
                                </div>

                                <DialogFooter className="pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsEditModalOpen(false)}
                                    >
                                        {t('Cancel')}
                                    </Button>
                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={processing}
                                        className="font-bold px-4"
                                    >
                                        {t('Save Credentials')}
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AuthenticatedLayout>
    );
}
