import React, { useState, useEffect, useMemo } from "react";
import { Head, usePage, router } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
    Search, MapPin, Clock, Briefcase, Sparkles, Building2, Bookmark, ArrowRight 
} from "lucide-react";
import FrontendLayout from "../../Components/Frontend/FrontendLayout";
import { formatCurrency } from "@/utils/helpers";

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
    is_hiring?: boolean;
    posting_source?: string;
}

interface JobListingsProps {
    jobs: Job[];
    jobCategories: string[];
    jobLocations: { id: number; name: string; }[];
    jobTypes: { id: number; name: string; }[];
}

export default function JobListings({ jobs = [], jobCategories = [], jobLocations = [], jobTypes = [] }: JobListingsProps) {
    const { t } = useTranslation();
    const { props } = usePage();
    const userSlug = props.userSlug as string;

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [savedJobs, setSavedJobs] = useState<number[]>([]);

    useEffect(() => {
        const storageKey = `savedJobs_${userSlug || 'global'}`;
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                setSavedJobs(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse saved jobs", e);
            }
        }
    }, [userSlug]);

    const toggleSaveJob = (jobId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        const storageKey = `savedJobs_${userSlug || 'global'}`;
        let updated: number[];
        if (savedJobs.includes(jobId)) {
            updated = savedJobs.filter(id => id !== jobId);
        } else {
            updated = [...savedJobs, jobId];
        }
        setSavedJobs(updated);
        localStorage.setItem(storageKey, JSON.stringify(updated));
    };

    // Calculate active department categories with counts
    const activeCategoriesWithCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        jobs.forEach(job => {
            const dept = job.department || "General";
            counts[dept] = (counts[dept] || 0) + 1;
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({ name, count }));
    }, [jobs]);

    // Filter jobs by search term and selected category
    const filteredJobs = useMemo(() => {
        return jobs.filter(job => {
            const deptName = job.department || "General";
            const matchesSearch = !searchTerm || 
                job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (job.department && job.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (job.designation && job.designation.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (job.location && job.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (job.skills && job.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())));

            const matchesCategory = selectedCategory === "All" ||
                (selectedCategory === "Featured" && job.featured) ||
                (selectedCategory === "Saved" && savedJobs.includes(job.id)) ||
                (deptName.toLowerCase() === selectedCategory.toLowerCase());

            return matchesSearch && matchesCategory;
        });
    }, [jobs, searchTerm, selectedCategory, savedJobs]);

    // Group filtered jobs by department
    const groupedJobs = useMemo(() => {
        const groups: Record<string, Job[]> = {};
        filteredJobs.forEach(job => {
            const dept = job.department || "General";
            if (!groups[dept]) {
                groups[dept] = [];
            }
            groups[dept].push(job);
        });
        return groups;
    }, [filteredJobs]);

    const getJobDetailsUrl = (job: Job) => {
        const jobSlug = job.slug || (job.title ? job.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : job.id);
        return userSlug ? `/${userSlug}/job/${jobSlug}` : `/job/${jobSlug}`;
    };

    const handleJobClick = (job: Job) => {
        router.visit(getJobDetailsUrl(job));
    };

    const formatSalaryDisplay = (job: Job) => {
        const rateLabels: Record<string, string> = {
            yearly: 'year',
            monthly: 'month',
            weekly: 'week',
            hourly: 'hour',
            project: 'project'
        };
        const rateSuffix = rateLabels[job.salaryRate || 'yearly'] || job.salaryRate || 'month';

        const formatClean = (val: number) => {
            let str = formatCurrency(val);
            if (/\$\d{1,3}(,\d{3})*,\d{2}$/.test(str)) {
                str = str.replace(/,(\d{2})$/, '.$1');
            }
            return str;
        };

        if (job.salaryFrom && job.salaryTo) {
            return `USD ${formatClean(job.salaryFrom)} – ${formatClean(job.salaryTo)} / ${rateSuffix}`;
        } else if (job.salaryFrom) {
            return `From USD ${formatClean(job.salaryFrom)} / ${rateSuffix}`;
        } else if (job.salaryTo) {
            return `Up to USD ${formatClean(job.salaryTo)} / ${rateSuffix}`;
        }
        return null;
    };

    return (
        <FrontendLayout title={t("Careers - Open Positions")}>
            <Head title="Careers | Open Positions">
                <meta name="description" content="Explore open roles and build the future with us. Browse open job positions." />
            </Head>

            <div className="bg-white min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto space-y-8">

                    {/* Search Bar on Top */}
                    <div className="relative max-w-xl mx-auto">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                        <Input
                            type="text"
                            placeholder={t("Search roles...")}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-11 pr-4 py-6 rounded-full bg-slate-50/80 border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white shadow-2xs hover:border-slate-300 transition-all"
                        />
                    </div>

                    {/* Category Filter Pills on Top */}
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1 pb-2">
                        {/* 'All' Category Button */}
                        <button
                            type="button"
                            onClick={() => setSelectedCategory("All")}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                                selectedCategory === "All"
                                    ? "bg-slate-900 text-white shadow-xs"
                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
                            }`}
                        >
                            <span>{t('All')}</span>
                            <span className={selectedCategory === "All" ? "text-slate-300 font-mono text-[11px]" : "text-slate-500 font-mono text-[11px]"}>
                                {jobs.length}
                            </span>
                        </button>

                        {/* Featured Button if any */}
                        {jobs.some(j => j.featured) && (
                            <button
                                type="button"
                                onClick={() => setSelectedCategory("Featured")}
                                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                                    selectedCategory === "Featured"
                                        ? "bg-amber-600 text-white shadow-xs"
                                        : "bg-amber-50 text-amber-900 border border-amber-200/60 hover:bg-amber-100/70"
                                }`}
                            >
                                <Sparkles className="h-3 w-3" />
                                <span>{t('Featured')}</span>
                                <span className="font-mono text-[11px]">
                                    {jobs.filter(j => j.featured).length}
                                </span>
                            </button>
                        )}

                        {/* Saved Button if any */}
                        {savedJobs.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setSelectedCategory("Saved")}
                                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                                    selectedCategory === "Saved"
                                        ? "bg-blue-600 text-white shadow-xs"
                                        : "bg-blue-50 text-blue-900 border border-blue-200/60 hover:bg-blue-100/70"
                                }`}
                            >
                                <Bookmark className="h-3 w-3 fill-current" />
                                <span>{t('Saved')}</span>
                                <span className="font-mono text-[11px]">
                                    {savedJobs.length}
                                </span>
                            </button>
                        )}

                        {/* Department Category Pills */}
                        {activeCategoriesWithCounts.map(({ name, count }) => (
                            <button
                                key={name}
                                type="button"
                                onClick={() => setSelectedCategory(name)}
                                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                                    selectedCategory === name
                                        ? "bg-slate-900 text-white shadow-xs"
                                        : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
                                }`}
                            >
                                <span>{name}</span>
                                <span className={selectedCategory === name ? "text-slate-300 font-mono text-[11px]" : "text-slate-500 font-mono text-[11px]"}>
                                    {count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Department-Wise Grouped Jobs List */}
                    <div className="space-y-10 pt-4">
                        {filteredJobs.length === 0 ? (
                            <div className="text-center py-16 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <Briefcase className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                <h3 className="text-base font-semibold text-slate-800">{t('No positions found')}</h3>
                                <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1">
                                    {t("We couldn't find any open roles matching your search or filters.")}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchTerm("");
                                        setSelectedCategory("All");
                                    }}
                                    className="mt-4 inline-flex items-center px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    {t('Reset Filters')}
                                </button>
                            </div>
                        ) : (
                            Object.entries(groupedJobs).map(([departmentName, departmentJobs]) => (
                                <div key={departmentName} className="space-y-3">
                                    {/* Department Header with Uppercase Title and Count */}
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                                                {departmentName}
                                            </h2>
                                            <span className="text-xs font-semibold text-slate-400 font-mono">
                                                {departmentJobs.length}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Job Items in this Department */}
                                    <div className="divide-y divide-slate-100">
                                        {departmentJobs.map(job => {
                                            const salaryText = formatSalaryDisplay(job);
                                            const detailsUrl = getJobDetailsUrl(job);

                                            return (
                                                <div
                                                    key={job.id}
                                                    onClick={() => handleJobClick(job)}
                                                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-3 sm:px-4 rounded-xl hover:bg-slate-50/80 transition-all cursor-pointer"
                                                >
                                                    {/* Job Info Left Column */}
                                                    <div className="space-y-1.5 min-w-0 flex-1">
                                                        <div className="flex items-center gap-2.5 flex-wrap">
                                                            <a 
                                                                href={detailsUrl}
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    handleJobClick(job);
                                                                }}
                                                                className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors no-underline"
                                                            >
                                                                {job.title}
                                                            </a>
                                                            {job.featured && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                                                    <Sparkles className="h-2.5 w-2.5 text-amber-500 fill-amber-500" />
                                                                    {t('Featured')}
                                                                </span>
                                                            )}
                                                            {!job.is_hiring && (
                                                                <Badge className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5">
                                                                    {t('Closed')}
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        {/* Metadata Row */}
                                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                                                            {/* Location */}
                                                            <span className="inline-flex items-center gap-1.5">
                                                                <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                                                <span>{job.location || t('Remote')}</span>
                                                            </span>

                                                            {/* Job Type */}
                                                            <span className="inline-flex items-center gap-1.5">
                                                                <Clock className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                                                <span>{job.jobType || t('Full-time')}</span>
                                                            </span>

                                                            {/* Remote / Hybrid info if available */}
                                                            <span className="inline-flex items-center gap-1.5">
                                                                <Building2 className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                                                <span>{job.location?.toLowerCase().includes('remote') ? t('Remote') : t('Remote, Hybrid')}</span>
                                                            </span>

                                                            {/* Salary Badge */}
                                                            {salaryText && (
                                                                <span className="font-semibold text-slate-800 pl-1">
                                                                    {salaryText}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Right Side Actions: View Details / Arrow */}
                                                    <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => toggleSaveJob(job.id, e)}
                                                            title={savedJobs.includes(job.id) ? t('Unsave Job') : t('Save Job')}
                                                            className={`p-1.5 rounded-full transition-colors ${
                                                                savedJobs.includes(job.id)
                                                                    ? "text-blue-600 bg-blue-50"
                                                                    : "text-slate-300 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100"
                                                            }`}
                                                        >
                                                            <Bookmark className={`h-4 w-4 ${savedJobs.includes(job.id) ? "fill-current" : ""}`} />
                                                        </button>

                                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 group-hover:text-blue-600 transition-colors">
                                                            <span className="hidden group-hover:inline transition-opacity">{t('View Details')}</span>
                                                            <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                </div>
            </div>
        </FrontendLayout>
    );
}
