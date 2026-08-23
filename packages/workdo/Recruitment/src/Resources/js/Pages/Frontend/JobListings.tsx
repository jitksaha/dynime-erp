import React, { useState, useEffect, useMemo } from 'react';
import { usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Clock, DollarSign, Briefcase, Star, Filter, ArrowUpRight, CheckCircle2, Bookmark, Sparkles, Layers } from 'lucide-react';
import FrontendLayout from '../../Components/Frontend/FrontendLayout';
import { formatDate, formatCurrency } from '@/utils/helpers';
import { useFormFields } from '@/hooks/useFormFields';

interface Job {
    id: number;
    slug?: string;
    encrypted_id: string;
    title: string;
    location?: string;
    department?: string;
    designation?: string;
    jobType?: string;
    salaryFrom?: number;
    salaryTo?: number;
    salaryRate?: string;
    postedDate: string;
    deadlineDate?: string;
    skills: string[];
    featured: boolean;
    description?: string;
    job_application?: string;
    application_url?: string;
}

interface JobListingsProps {
    jobs: Job[];
    jobCategories: string[];
    jobLocations: { id: number; name: string; }[];
    jobTypes: { id: number; name: string; }[];
}

export default function JobListings({ jobs, jobCategories, jobLocations, jobTypes }: JobListingsProps) {
    const { t } = useTranslation();
    const { props } = usePage();
    const userSlug = props.userSlug as string;
    const [searchTerm, setSearchTerm] = useState('');

    const integrationFields = useFormFields('getIntegrationFields', {}, () => { }, {}, 'create', t, 'Recruitment');
    const [selectedLocation, setSelectedLocation] = useState('all');
    const [selectedJobType, setSelectedJobType] = useState('all');
    const [selectedDepartment, setSelectedDepartment] = useState('All');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [sortBy, setSortBy] = useState('newest');
    const [activeSearchTerm, setActiveSearchTerm] = useState('');
    const [savedJobs, setSavedJobs] = useState<number[]>([]);

    useEffect(() => {
        const storageKey = `savedJobs_${userSlug}`;
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                setSavedJobs(JSON.parse(saved));
            } catch (e) {
                setSavedJobs([]);
            }
        }
    }, [userSlug]);

    const departmentsList = useMemo(() => {
        const set = new Set<string>();
        jobs.forEach(j => {
            if (j.department) set.add(j.department);
        });
        return Array.from(set);
    }, [jobs]);

    const formatSalary = (from?: number, to?: number, rate?: string) => {
        const rateLabels: Record<string, string> = {
            yearly: ' / Year',
            monthly: ' / Month',
            weekly: ' / Week',
            hourly: ' / Hour',
            project: ' / Project'
        };
        const rateSuffix = rateLabels[rate || 'yearly'] || ' / Year';

        const formatClean = (val?: number) => {
            if (!val && val !== 0) return '';
            let str = formatCurrency(val);
            if (/\$\d{1,3}(,\d{3})*,\d{2}$/.test(str)) {
                str = str.replace(/,(\d{2})$/, '.$1');
            }
            return str;
        };

        if (from && to) {
            return `${formatClean(from)} - ${formatClean(to)}${rateSuffix}`;
        } else if (from) {
            return `${formatClean(from)}${rateSuffix}`;
        } else if (to) {
            return `${formatClean(to)}${rateSuffix}`;
        }
        return `Competitive Salary${rateSuffix}`;
    };

    const handleSearch = () => {
        setActiveSearchTerm(searchTerm);
    };

    const handleSaveJob = (jobId: number) => {
        const storageKey = `savedJobs_${userSlug}`;
        let updatedSavedJobs;

        if (savedJobs.includes(jobId)) {
            updatedSavedJobs = savedJobs.filter(id => id !== jobId);
        } else {
            updatedSavedJobs = [...savedJobs, jobId];
        }

        setSavedJobs(updatedSavedJobs);
        localStorage.setItem(storageKey, JSON.stringify(updatedSavedJobs));
    };

    const filteredAndSortedJobs = useMemo(() => {
        const filtered = jobs.filter(job => {
            const searchLower = activeSearchTerm.toLowerCase();
            const matchesSearch = activeSearchTerm === '' ||
                job.title.toLowerCase().includes(searchLower) ||
                (job.location && job.location.toLowerCase().includes(searchLower)) ||
                (job.department && job.department.toLowerCase().includes(searchLower)) ||
                (job.description && job.description.toLowerCase().includes(searchLower)) ||
                (job.skills && job.skills.some(skill => skill.toLowerCase().includes(searchLower)));

            const matchesLocation = selectedLocation === 'all' ||
                jobLocations?.find(loc => loc.id.toString() === selectedLocation)?.name.toLowerCase() === job.location?.toLowerCase();

            const matchesJobType = selectedJobType === 'all' ||
                jobTypes?.find(type => type.id.toString() === selectedJobType)?.name.toLowerCase() === job.jobType?.toLowerCase();

            const matchesDepartment = selectedDepartment === 'All' || job.department === selectedDepartment;

            const matchesCategory = selectedCategory === 'All' ||
                (selectedCategory === 'Featured Job' && job.featured) ||
                (selectedCategory === 'Saved Job' && savedJobs.includes(job.id));

            return matchesSearch && matchesLocation && matchesJobType && matchesDepartment && matchesCategory;
        });

        return filtered.sort((a, b) => {
            switch (sortBy) {
                case 'salary-high':
                    return (b.salaryTo || 0) - (a.salaryTo || 0);
                case 'salary-low':
                    return (a.salaryFrom || 0) - (b.salaryFrom || 0);
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'newest':
                default:
                    return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
            }
        });
    }, [jobs, activeSearchTerm, selectedLocation, selectedJobType, selectedDepartment, selectedCategory, savedJobs, sortBy, jobLocations, jobTypes]);

    return (
        <FrontendLayout title="Dynime Careers — Explore Open Roles">
            {/* Hero Banner */}
            <div className="bg-slate-900 text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-blue-400 text-xs font-medium uppercase tracking-wider mb-5">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        Dynime LLC Careers &bull; {jobs.length} Open Positions
                    </div>

                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4 leading-tight">
                        Build Next-Gen Technology with <span className="text-blue-400">Dynime LLC</span>
                    </h1>

                    <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
                        Join our remote-first multidisciplinary team of engineers, marketers, creators, and business specialists. Apply in minutes.
                    </p>

                    {/* Search Input Bar */}
                    <div className="max-w-2xl mx-auto bg-white p-2 rounded-xl shadow-lg border border-slate-200">
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                            <div className="flex-1 relative w-full">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <Input
                                    placeholder={t('Search roles, skills, or departments...')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="pl-10 h-11 border-0 focus-visible:ring-0 text-gray-900 placeholder:text-gray-400 font-medium text-sm w-full bg-transparent"
                                />
                            </div>
                            <Button
                                className="w-full sm:w-auto h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 rounded-lg transition-all shadow-md flex items-center justify-center gap-2"
                                onClick={handleSearch}
                                type="button"
                            >
                                <Search className="h-4 w-4" />
                                {t('Search Roles')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                
                {/* Department Filter Pills Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                            <Filter className="h-4 w-4 text-blue-600" />
                            {t('Filter by Department')}
                        </h3>
                        <span className="text-xs font-semibold text-slate-500">{filteredAndSortedJobs.length} {t('roles matching')}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pb-2">
                        <button
                            type="button"
                            onClick={() => setSelectedDepartment('All')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
                                selectedDepartment === 'All'
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                            }`}
                        >
                            All Positions ({jobs.length})
                        </button>
                        {departmentsList.map(dept => {
                            const count = jobs.filter(j => j.department === dept).length;
                            return (
                                <button
                                    key={dept}
                                    type="button"
                                    onClick={() => setSelectedDepartment(dept)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
                                        selectedDepartment === dept
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                    }`}
                                >
                                    {dept} ({count})
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Filters Sidebar */}
                    <div className="lg:w-1/4">
                        <Card className="sticky top-20 border-slate-200/80 shadow-sm rounded-xl overflow-hidden bg-white">
                            <CardContent className="p-5 space-y-6">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <Filter className="h-4 w-4 text-blue-600" />
                                        {t('Filters & Options')}
                                    </h3>
                                    {(selectedCategory !== 'All' || selectedLocation !== 'all' || selectedJobType !== 'all' || activeSearchTerm !== '') && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedCategory('All');
                                                setSelectedLocation('all');
                                                setSelectedJobType('all');
                                                setSelectedDepartment('All');
                                                setSearchTerm('');
                                                setActiveSearchTerm('');
                                            }}
                                            className="text-[11px] font-semibold text-blue-600 hover:underline"
                                        >
                                            Reset All
                                        </button>
                                    )}
                                </div>

                                {/* Category Switcher */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                                        <Layers className="h-3.5 w-3.5 text-blue-600" />
                                        {t('Job Category')}
                                    </label>
                                    <div className="space-y-2">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedCategory('All')}
                                            className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-between border ${
                                                selectedCategory === 'All'
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                            }`}
                                        >
                                            <span className="flex items-center gap-2.5">
                                                <Briefcase className={`h-4 w-4 ${selectedCategory === 'All' ? 'text-white' : 'text-slate-500'}`} />
                                                <span>All Openings</span>
                                            </span>
                                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                                selectedCategory === 'All' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700'
                                            }`}>
                                                {jobs.length}
                                            </span>
                                        </button>
                                        
                                        <button
                                            type="button"
                                            onClick={() => setSelectedCategory('Featured Job')}
                                            className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-between border ${
                                                selectedCategory === 'Featured Job'
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                            }`}
                                        >
                                            <span className="flex items-center gap-2.5">
                                                <Sparkles className={`h-4 w-4 ${selectedCategory === 'Featured Job' ? 'text-white' : 'text-amber-500'}`} />
                                                <span>Featured Roles</span>
                                            </span>
                                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                                selectedCategory === 'Featured Job' ? 'bg-blue-700 text-white' : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                                            }`}>
                                                {jobs.filter(j => j.featured).length}
                                            </span>
                                        </button>
                                        
                                        <button
                                            type="button"
                                            onClick={() => setSelectedCategory('Saved Job')}
                                            className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-between border ${
                                                selectedCategory === 'Saved Job'
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                            }`}
                                        >
                                            <span className="flex items-center gap-2.5">
                                                <Bookmark className={`h-4 w-4 ${selectedCategory === 'Saved Job' ? 'text-white' : 'text-blue-600'}`} />
                                                <span>Saved Roles</span>
                                            </span>
                                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                                selectedCategory === 'Saved Job' ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-700 border border-blue-200/60'
                                            }`}>
                                                {savedJobs.length}
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                {/* Location Filter */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">{t('Location')}</label>
                                    <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                                        <SelectTrigger className="h-9 text-xs rounded-lg border-slate-200">
                                            <SelectValue placeholder="All Locations" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{t('All Locations')}</SelectItem>
                                            {jobLocations?.map((location) => (
                                                <SelectItem key={location.id} value={location.id.toString()}>
                                                    {location.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Job Type Filter */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">{t('Job Type')}</label>
                                    <Select value={selectedJobType} onValueChange={setSelectedJobType}>
                                        <SelectTrigger className="h-9 text-xs rounded-lg border-slate-200">
                                            <SelectValue placeholder="All Types" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{t('All Types')}</SelectItem>
                                            {jobTypes?.map((type) => (
                                                <SelectItem key={type.id} value={type.id.toString()}>
                                                    {type.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Sort By */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">{t('Sort By')}</label>
                                    <Select value={sortBy} onValueChange={setSortBy}>
                                        <SelectTrigger className="h-9 text-xs rounded-lg border-slate-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="newest">{t('Newest First')}</SelectItem>
                                            <SelectItem value="salary-high">{t('Salary: High to Low')}</SelectItem>
                                            <SelectItem value="salary-low">{t('Salary: Low to High')}</SelectItem>
                                            <SelectItem value="title">{t('Job Title A-Z')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Job Cards Main List */}
                    <div className="lg:w-3/4">
                        <div className="space-y-4">
                            {filteredAndSortedJobs.map((job) => (
                                <Card
                                    key={job.id}
                                    className="group border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all duration-200 rounded-xl bg-white overflow-hidden"
                                >
                                    <CardContent className="p-6">
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                            <div className="space-y-2 flex-1">
                                                {/* Header Badges */}
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {job.department && (
                                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 font-semibold px-2.5 py-0.5 rounded-md text-xs">
                                                            {job.department}
                                                        </Badge>
                                                    )}
                                                    {job.designation && job.designation !== job.title && (
                                                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 font-semibold px-2.5 py-0.5 rounded-md text-xs">
                                                            {job.designation}
                                                        </Badge>
                                                    )}
                                                    {job.featured && (
                                                        <Badge className="bg-amber-100 text-amber-800 border-amber-200 font-semibold text-xs">
                                                            <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-600" />
                                                            {t('Featured')}
                                                        </Badge>
                                                    )}
                                                </div>

                                                {/* Title */}
                                                <h4 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                                                    {job.title}
                                                </h4>
                                            </div>

                                            {/* Action Buttons (Desktop Top Right or Bottom) */}
                                        </div>

                                        {/* Grid Info Stats */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold">
                                                    <DollarSign className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('Salary')}</p>
                                                    <p className="text-xs font-bold text-slate-800 truncate">{formatSalary(job.salaryFrom, job.salaryTo, job.salaryRate)}</p>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold">
                                                    <Briefcase className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('Type')}</p>
                                                    <p className="text-xs font-bold text-slate-800 truncate">{job.jobType || 'Full-time'}</p>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 font-bold">
                                                    <MapPin className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('Location')}</p>
                                                    <p className="text-xs font-bold text-slate-800 truncate">{job.location || 'Remote'}</p>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-200/80 text-slate-700 flex items-center justify-center shrink-0 font-bold">
                                                    <Clock className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('Posted')}</p>
                                                    <p className="text-xs font-bold text-slate-800 truncate">{formatDate(job.postedDate)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Required Skills Badges */}
                                        {job.skills && job.skills.length > 0 && (
                                            <div className="mb-4 flex flex-wrap items-center gap-1.5">
                                                <span className="text-[11px] font-bold text-slate-400 mr-1 uppercase tracking-wider">{t('Skills:')}</span>
                                                {job.skills.map((skill) => (
                                                    <Badge key={skill} variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-[11px] font-semibold">
                                                        {skill}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}

                                        {/* Card Footer Actions */}
                                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleSaveJob(job.id)}
                                                className={`text-xs rounded-lg ${savedJobs.includes(job.id) ? 'bg-blue-50 text-blue-700 border-blue-200 font-bold' : 'text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                            >
                                                <Bookmark className="h-3.5 w-3.5 mr-1.5" />
                                                {savedJobs.includes(job.id) ? t('Saved') : t('Save Job')}
                                            </Button>

                                            <div className="flex items-center gap-2.5">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold"
                                                    onClick={() => {
                                                        const targetSlug = job.slug || job.id;
                                                        router.visit(userSlug ? `/${userSlug}/job/${targetSlug}` : `/job/${targetSlug}`);
                                                    }}
                                                >
                                                    {t('View Details')}
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs px-4 shadow-sm transition-all flex items-center gap-1.5"
                                                    onClick={() => {
                                                        if (job.job_application === 'custom' && job.application_url) {
                                                            window.open(job.application_url, '_blank');
                                                        } else {
                                                            const targetSlug = job.slug || job.id;
                                                            router.visit(userSlug ? `/${userSlug}/job/${targetSlug}/apply` : `/job/${targetSlug}/apply`);
                                                        }
                                                    }}
                                                >
                                                    <span>{t('Apply Now')}</span>
                                                    {job.job_application === 'custom' && <ArrowUpRight className="h-3.5 w-3.5" />}
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {/* No Results */}
                            {filteredAndSortedJobs.length === 0 && (
                                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
                                    <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                                    <h3 className="text-base font-bold text-slate-900 mb-1">{t('No matching positions found')}</h3>
                                    <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">{t('Try resetting your search query or department filters to view all available positions.')}</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedCategory('All');
                                            setSelectedLocation('all');
                                            setSelectedJobType('all');
                                            setSelectedDepartment('All');
                                            setSearchTerm('');
                                            setActiveSearchTerm('');
                                        }}
                                        className="text-xs font-semibold"
                                    >
                                        View All {jobs.length} Positions
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Integration Widgets (Tawk.to, etc.) */}
            {integrationFields.map((field) => (
                <div key={field.id}>
                    {field.component}
                </div>
            ))}
        </FrontendLayout>
    );
}