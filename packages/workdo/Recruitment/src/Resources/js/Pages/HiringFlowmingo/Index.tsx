import { useState, useMemo } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { FormattedJobText } from '../../Components/FormattedJobText';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
    Briefcase, 
    RefreshCw, 
    Plus, 
    Search, 
    MapPin, 
    Clock, 
    Copy, 
    ExternalLink, 
    Trash2, 
    Edit, 
    Sparkles, 
    CheckCircle2,
    DollarSign,
    Building2
} from "lucide-react";
import { toast } from 'sonner';

interface FlowmingoJob {
    id: number;
    flowmingo_job_id: string;
    slug: string;
    title: string;
    department: string | null;
    employment_type: string | null;
    location: string | null;
    salary_min: number | null;
    salary_max: number | null;
    salary_currency: string | null;
    salary_range: string | null;
    description: string | null;
    responsibilities: string[] | null;
    requirements: string[] | null;
    benefits: string[] | null;
    remote: boolean;
    featured: boolean;
    status: 'open' | 'closed';
    published_at: string | null;
    created_at: string | null;
}

interface IndexProps {
    jobs: FlowmingoJob[];
    stats: {
        total: number;
        active: number;
        closed: number;
        departments: number;
    };
}

export default function Index() {
    const { t } = useTranslation();
    const { jobs = [], stats = { total: 0, active: 0, closed: 0, departments: 0 } } = usePage<IndexProps>().props;

    const [search, setSearch] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingJob, setEditingJob] = useState<FlowmingoJob | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        department: 'Engineering',
        employment_type: 'Full-time',
        location: 'Remote / On-site',
        salary_min: '',
        salary_max: '',
        salary_currency: 'USD',
        status: 'open',
        description: '',
        featured: false,
        remote: true,
    });

    const filteredJobs = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return jobs;
        return jobs.filter(j => 
            j.title.toLowerCase().includes(q) ||
            (j.department || '').toLowerCase().includes(q) ||
            (j.location || '').toLowerCase().includes(q) ||
            (j.flowmingo_job_id || '').toLowerCase().includes(q)
        );
    }, [jobs, search]);

    const handleSync = () => {
        setIsSyncing(true);
        router.post(route('recruitment.flowmingo.sync'), {}, {
            onFinish: () => {
                setIsSyncing(false);
                toast.success(t('Flowmingo ATS jobs synchronized successfully!'));
            },
            onError: () => {
                setIsSyncing(false);
                toast.error(t('Sync failed. Please try again.'));
            }
        });
    };

    const handleOpenCreateModal = () => {
        setEditingJob(null);
        setFormData({
            title: '',
            department: 'Engineering',
            employment_type: 'Full-time',
            location: 'Remote / On-site',
            salary_min: '',
            salary_max: '',
            salary_currency: 'USD',
            status: 'open',
            description: '',
            featured: false,
            remote: true,
        });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (job: FlowmingoJob) => {
        setEditingJob(job);
        setFormData({
            title: job.title || '',
            department: job.department || 'Engineering',
            employment_type: job.employment_type || 'Full-time',
            location: job.location || 'Remote / On-site',
            salary_min: job.salary_min ? String(job.salary_min) : '',
            salary_max: job.salary_max ? String(job.salary_max) : '',
            salary_currency: job.salary_currency || 'USD',
            status: job.status || 'open',
            description: job.description || '',
            featured: job.featured || false,
            remote: job.remote || false,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingJob) {
            router.put(route('recruitment.flowmingo.update', editingJob.id), formData, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    toast.success(t('Position updated successfully!'));
                }
            });
        } else {
            router.post(route('recruitment.flowmingo.store'), formData, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    toast.success(t('New Flowmingo job post published successfully!'));
                }
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm(t('Are you sure you want to delete this job position?'))) {
            router.delete(route('recruitment.flowmingo.destroy', id), {
                onSuccess: () => toast.success(t('Position deleted successfully.'))
            });
        }
    };

    const copyPublicLink = (slug: string) => {
        const url = `${window.location.origin}/api/jobs/${slug}`;
        navigator.clipboard.writeText(url);
        toast.success(t('Public API link copied to clipboard!'));
    };

    return (
        <AuthenticatedLayout>
            <Head title={t('Hiring Flowmingo - ATS Job Management')} />

            <div className="space-y-6 p-4 sm:p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card border rounded-2xl p-6 shadow-sm">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 text-indigo-600 border border-indigo-500/20">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                                    {t('Hiring Flowmingo')}
                                    <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-600 font-semibold border-indigo-500/20">
                                        ATS Sync Active
                                    </Badge>
                                </h1>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    {t('Synchronize, create, and manage active hiring positions synced directly with Flowmingo ATS.')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button 
                            variant="outline" 
                            onClick={handleSync} 
                            disabled={isSyncing}
                            className="rounded-xl border-indigo-500/20 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                            {isSyncing ? t('Syncing...') : t('Sync Flowmingo')}
                        </Button>
                        <Button 
                            onClick={handleOpenCreateModal}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            {t('Post New Position')}
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: t('Total Positions'), value: stats.total, icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-500/10' },
                        { label: t('Active / Open'), value: stats.active, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
                        { label: t('Closed Positions'), value: stats.closed, icon: Clock, color: 'text-rose-600', bg: 'bg-rose-500/10' },
                        { label: t('Departments'), value: stats.departments, icon: Building2, color: 'text-amber-600', bg: 'bg-amber-500/10' },
                    ].map((s) => (
                        <Card key={s.label} className="border shadow-sm rounded-xl overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
                                    <div className={`p-2 rounded-lg ${s.bg} ${s.color}`}>
                                        <s.icon className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-foreground">{s.value}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Main Table Card */}
                <Card className="border shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b bg-muted/20 px-6 py-4">
                        <div>
                            <CardTitle className="text-base font-semibold">{t('Synced Job Positions')}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {filteredJobs.length} {t('positions available')}
                            </p>
                        </div>
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input 
                                placeholder={t('Search by title, dept, location…')}
                                value={search} 
                                onChange={(e) => setSearch(e.target.value)} 
                                className="pl-9 h-9 text-xs rounded-xl" 
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {filteredJobs.length === 0 ? (
                            <div className="text-center py-12 px-4">
                                <Briefcase className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                                <p className="text-sm font-medium">{t('No Flowmingo positions found')}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {t('Click "Post New Position" or "Sync Flowmingo" to get started.')}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30">
                                            <TableHead className="w-[80px]">{t('ID')}</TableHead>
                                            <TableHead>{t('Job Title & Slug')}</TableHead>
                                            <TableHead>{t('Department')}</TableHead>
                                            <TableHead>{t('Location & Type')}</TableHead>
                                            <TableHead>{t('Salary Range')}</TableHead>
                                            <TableHead>{t('Status')}</TableHead>
                                            <TableHead className="text-right">{t('Actions')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredJobs.map((j) => (
                                            <TableRow key={j.id} className="hover:bg-muted/40 transition-colors">
                                                <TableCell className="text-xs font-mono font-medium text-muted-foreground">
                                                    {j.flowmingo_job_id}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                                                        {j.title}
                                                        {j.featured && (
                                                            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] h-4 px-1.5 font-semibold">
                                                                Featured
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                                                        /{j.slug}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs font-medium">
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-foreground">
                                                        <Building2 className="w-3 h-3 text-muted-foreground" />
                                                        {j.department || 'General'}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-medium text-foreground flex items-center gap-1">
                                                            <MapPin className="w-3 h-3 text-muted-foreground" />
                                                            {j.location}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground pl-4">
                                                            {j.employment_type} {j.remote ? '• Remote' : ''}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs font-medium">
                                                    {j.salary_range || (j.salary_min ? `${j.salary_currency} ${j.salary_min} - ${j.salary_max}` : 'Negotiable')}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge 
                                                        variant={j.status === 'open' ? 'default' : 'secondary'}
                                                        className={`text-[10px] uppercase font-bold h-5 px-2 ${
                                                            j.status === 'open' 
                                                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                                                            : 'bg-slate-500/10 text-slate-600'
                                                        }`}
                                                    >
                                                        {j.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 hover:bg-muted"
                                                            title={t('Copy public link')}
                                                            onClick={() => copyPublicLink(j.slug)}
                                                        >
                                                            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 hover:bg-muted"
                                                            title={t('Edit position')}
                                                            onClick={() => handleOpenEditModal(j)}
                                                        >
                                                            <Edit className="w-3.5 h-3.5 text-indigo-600" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 hover:bg-rose-50 hover:text-rose-600"
                                                            title={t('Delete position')}
                                                            onClick={() => handleDelete(j.id)}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Create / Edit Modal */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-lg rounded-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold">
                                {editingJob ? t('Edit Flowmingo Position') : t('Post New Position on Flowmingo ATS')}
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4 py-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="title">{t('Job Title')} *</Label>
                                <Input 
                                    id="title" 
                                    required 
                                    value={formData.title} 
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                                    placeholder="e.g. Senior Full Stack Developer"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label>{t('Department')}</Label>
                                    <Input 
                                        value={formData.department} 
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })} 
                                        placeholder="Engineering, Sales..."
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>{t('Employment Type')}</Label>
                                    <Select 
                                        value={formData.employment_type} 
                                        onValueChange={(val) => setFormData({ ...formData, employment_type: val })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Full-time">Full-time</SelectItem>
                                            <SelectItem value="Part-time">Part-time</SelectItem>
                                            <SelectItem value="Contract">Contract</SelectItem>
                                            <SelectItem value="Internship">Internship</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label>{t('Location')}</Label>
                                    <Input 
                                        value={formData.location} 
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
                                        placeholder="Remote / Dhaka"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>{t('Status')}</Label>
                                    <Select 
                                        value={formData.status} 
                                        onValueChange={(val: 'open' | 'closed') => setFormData({ ...formData, status: val })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="open">Open (Active)</SelectItem>
                                            <SelectItem value="closed">Closed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label>{t('Salary Min ($)')}</Label>
                                    <Input 
                                        type="number"
                                        value={formData.salary_min} 
                                        onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })} 
                                        placeholder="40000"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>{t('Salary Max ($)')}</Label>
                                    <Input 
                                        type="number"
                                        value={formData.salary_max} 
                                        onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })} 
                                        placeholder="70000"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="description">{t('Job Description')}</Label>
                                <RichTextEditor 
                                    value={formData.description} 
                                    onChange={(value) => setFormData({ ...formData, description: value })} 
                                    placeholder="Enter or paste full job description..."
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                    {t('Cancel')}
                                </Button>
                                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                    {editingJob ? t('Update Position') : t('Publish Position')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AuthenticatedLayout>
    );
}
