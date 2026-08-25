import React, { useState, useEffect, useMemo } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import FrontendLayout from '../../Components/Frontend/FrontendLayout';
import { MapPin, Clock, DollarSign, Briefcase, Star, ArrowLeft, Bookmark, Users, Calendar, Share2, Check, Bot, FileText, Sparkles, Send } from 'lucide-react';
import { formatDate, formatCurrency } from '@/utils/helpers';
import { useFormFields } from '@/hooks/useFormFields';
import { FormattedJobText } from '../../Components/FormattedJobText';
import { toast } from 'sonner';



interface Job {
    id: number;
    encrypted_id: string;
    title: string;
    location: string;
    department?: string;
    designation?: string;
    jobType: string;
    salaryFrom: number;
    salaryTo: number;
    salaryRate?: string;
    positions: number;
    startDate: string;
    endDate: string;
    postedDate: string;
    skills: string[];
    featured: boolean;
    description: string;
    requirements: string;
    benefits: string;
    terms_condition?: string;
    job_application?: string;
    application_url?: string;
}

interface JobDetailsProps {
    job: Job;
    companyInfo: {
        ourMission: string;
        companySize: string;
        industry: string;
    };
}

export default function JobDetails({ job, companyInfo }: JobDetailsProps) {
    const { t } = useTranslation();
    const { props } = usePage();
    const userSlug = props.userSlug as string;
    const [savedJobs, setSavedJobs] = useState<number[]>([]);
    const [isCopied, setIsCopied] = useState(false);
    const jobSlug = (job as any)?.slug || (job?.title ? job.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : job?.id);

    const handleShareJob = async () => {
        const shareUrl = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${job.title} | Dynime Careers`,
                    text: `Apply for ${job.title} at Dynime!`,
                    url: shareUrl,
                });
                return;
            } catch (err) {
                // Fallback to copy clipboard if native share cancelled or unavailable
            }
        }
        
        try {
            await navigator.clipboard.writeText(shareUrl);
            setIsCopied(true);
            toast.success(t('Job URL copied to clipboard! Share it anywhere.'));
            setTimeout(() => setIsCopied(false), 2500);
        } catch (e) {
            console.error('Failed to copy', e);
        }
    };

    const integrationFields = useFormFields('getIntegrationFields', {}, () => { }, {}, 'create', t, 'Recruitment');

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

    const formatSalary = (from: number, to: number, rate?: string) => {
        const rateLabels: Record<string, string> = {
            yearly: ' / Year',
            monthly: ' / Month',
            weekly: ' / Week',
            hourly: ' / Hour',
            project: ' / Project'
        };
        const rateSuffix = rateLabels[rate || 'yearly'] || ' / Year';

        const formatClean = (val: number) => {
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
        return `Negotiable${rateSuffix}`;
    };

    const handleSaveJob = () => {
        const storageKey = `savedJobs_${userSlug}`;
        let updatedSavedJobs;

        if (savedJobs.includes(job.id)) {
            updatedSavedJobs = savedJobs.filter(id => id !== job.id);
        } else {
            updatedSavedJobs = [...savedJobs, job.id];
        }

        setSavedJobs(updatedSavedJobs);
        localStorage.setItem(storageKey, JSON.stringify(updatedSavedJobs));
    };



    // Extract clean 160-char text description for SEO Meta tag
    const seoDescription = useMemo(() => {
        if (!job?.description) return `Apply for ${job?.title || 'this position'} at Dynime. Full-time & remote career opportunities.`;
        const stripped = job.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        return stripped.length > 160 ? stripped.substring(0, 157) + '...' : stripped;
    }, [job?.description, job?.title]);

    // Google Jobs JSON-LD Schema
    const googleJobsSchema = useMemo(() => {
        return {
            "@context": "https://schema.org/",
            "@type": "JobPosting",
            "title": job?.title || "",
            "description": job?.description || seoDescription,
            "identifier": {
                "@type": "PropertyValue",
                "name": "Dynime",
                "value": String(job?.id || "")
            },
            "datePosted": job?.postedDate || new Date().toISOString(),
            "validThrough": job?.endDate || "",
            "employmentType": (job?.jobType && String(job.jobType).toUpperCase().includes('PART')) ? 'PART_TIME' : 'FULL_TIME',
            "hiringOrganization": {
                "@type": "Organization",
                "name": "Dynime LLC",
                "sameAs": "https://dynime.com",
                "logo": "https://app.dynime.com/logo.png"
            },
            "jobLocation": {
                "@type": "Place",
                "address": {
                    "@type": "PostalAddress",
                    "addressLocality": job?.location || "Remote"
                }
            },
            "baseSalary": job?.salaryFrom ? {
                "@type": "MonetaryAmount",
                "currency": "USD",
                "value": {
                    "@type": "QuantitativeValue",
                    "minValue": job.salaryFrom,
                    "maxValue": job.salaryTo || job.salaryFrom,
                    "unitText": "YEAR"
                }
            } : undefined
        };
    }, [job, seoDescription]);

    return (
        <FrontendLayout title={job.title}>
            <Head title={`${job.title} | Careers at Dynime`}>
                <meta name="description" content={seoDescription} />
                <meta name="keywords" content={`${job.title}, Dynime careers, job opening, hiring, ${job.location || 'remote'}, ${job.skills?.join(', ') || ''}`} />
                
                {/* Open Graph / Facebook Meta Tags */}
                <meta property="og:type" content="article" />
                <meta property="og:title" content={`${job.title} | Dynime Careers`} />
                <meta property="og:description" content={seoDescription} />
                <meta property="og:site_name" content="Dynime Careers" />

                {/* Twitter Meta Tags */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={`${job.title} | Dynime Careers`} />
                <meta name="twitter:description" content={seoDescription} />

                {/* Google JobPosting JSON-LD Schema */}
                <script type="application/ld+json">
                    {JSON.stringify(googleJobsSchema)}
                </script>
            </Head>



            <div className="bg-slate-50 min-h-screen py-10 sm:py-14">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                        {/* Main Content: Sleek Unified Job Card */}
                        <div className="lg:w-2/3 w-full">
                            <Card className="shadow-xs border border-slate-200 rounded-2xl bg-white overflow-hidden">
                                <CardContent className="p-6 md:p-10 space-y-8">
                                    {/* Top Row: Title, Badges, Share Job */}
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-3 flex-1">
                                            <div className="flex items-center gap-2.5 flex-wrap">
                                                <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                                                    {job.title}
                                                </h1>
                                                {job.featured && (
                                                    <Badge className="bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-100 text-xs px-2.5 py-0.5 font-semibold">
                                                        <Star className="h-3 w-3 mr-1 text-amber-600 fill-amber-600" />
                                                        {t('Featured')}
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Location & Department Badges */}
                                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                                <div className="flex items-center text-slate-600 text-sm font-medium pr-2">
                                                    <MapPin className="h-4 w-4 mr-1 text-blue-500 flex-shrink-0" />
                                                    <span>{job.location || t('Not specified')}</span>
                                                </div>
                                                {job.department && (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                                                        {job.department}
                                                    </span>
                                                )}
                                                {job.designation && (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700">
                                                        {job.designation}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Share Job Top Button */}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleShareJob}
                                            className="border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer flex-shrink-0"
                                        >
                                            {isCopied ? (
                                                <><Check className="w-3.5 h-3.5 text-emerald-600" /> {t('Link Copied!')}</>
                                            ) : (
                                                <><Share2 className="w-3.5 h-3.5 text-slate-600" /> {t('Share Job')}</>
                                            )}
                                        </Button>
                                    </div>

                                    {/* Job Metadata: Normal text with subtle icons */}
                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 py-4 border-y border-slate-100 text-xs sm:text-sm text-slate-600 font-medium">
                                        {/* Job Type */}
                                        <div className="inline-flex items-center gap-1.5">
                                            <Briefcase className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                            <span>{t('Job Type')}: <strong className="text-slate-900 font-semibold">{job.jobType || t('Full Time')}</strong></span>
                                        </div>

                                        {/* Compensation */}
                                        <div className="inline-flex items-center gap-1.5">
                                            <DollarSign className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                            <span>{t('Salary')}: <strong className="text-slate-900 font-semibold">{formatSalary(job.salaryFrom, job.salaryTo, job.salaryRate)}</strong></span>
                                        </div>

                                        {/* Positions Available */}
                                        {job.positions > 0 && (
                                            <div className="inline-flex items-center gap-1.5">
                                                <Users className="h-4 w-4 text-purple-500 flex-shrink-0" />
                                                <span>{job.positions} {job.positions === 1 ? t('Position Available') : t('Positions Available')}</span>
                                            </div>
                                        )}

                                        {/* Deadline */}
                                        {job.endDate && (
                                            <div className="inline-flex items-center gap-1.5 text-slate-700">
                                                <Clock className="h-4 w-4 text-rose-500 flex-shrink-0" />
                                                <span>{t('Deadline')}: <strong className="text-rose-700 font-bold">{formatDate(job.endDate)}</strong></span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Required Skills */}
                                    {job.skills && job.skills.length > 0 && (
                                        <div className="space-y-2.5">
                                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                {t('Required Skills')}
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {job.skills.map((skill) => (
                                                    <span 
                                                        key={skill} 
                                                        className="px-3.5 py-1.5 bg-blue-50/70 text-blue-800 rounded-full text-xs font-semibold border border-blue-100"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Job Details Content (Description, Requirements, Benefits, Terms) */}
                                    <div className="space-y-8 pt-4 divide-y divide-slate-100">
                                        {job.description && (
                                            <div className="pt-2">
                                                <FormattedJobText content={job.description} />
                                            </div>
                                        )}

                                        {job.requirements && (
                                            <div className="pt-8">
                                                <FormattedJobText content={job.requirements} />
                                            </div>
                                        )}

                                        {job.benefits && (
                                            <div className="pt-8">
                                                <FormattedJobText content={job.benefits} />
                                            </div>
                                        )}

                                        {job.terms_condition && (
                                            <div className="pt-8">
                                                <FormattedJobText content={job.terms_condition} />
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar: Apply and Details */}
                        <div className="lg:w-1/3 w-full space-y-6 lg:sticky lg:top-24">
                            {/* Apply Card */}
                            <Card className="shadow-xs border border-slate-200 rounded-2xl bg-white overflow-hidden">
                                <CardContent className="p-6 sm:p-8 space-y-6">
                                    <div className="text-center space-y-1">
                                        <h3 className="text-xl font-bold text-slate-900">{t('Ready to Apply?')}</h3>
                                        <p className="text-slate-500 text-xs">{t('Join our team and make a difference')}</p>
                                    </div>

                                    <div className="space-y-3">
                                        {/* Primary Apply Button */}
                                        <a
                                            href={job.application_url || (userSlug ? `/${userSlug}/job/${jobSlug}/apply` : `/job/${jobSlug}/apply`)}
                                            target={job.application_url ? "_blank" : "_self"}
                                            rel="noopener noreferrer"
                                            className={`w-full font-bold py-3.5 px-4 text-sm rounded-xl flex items-center justify-center gap-2 transition-all no-underline cursor-pointer shadow-md ${
                                                (job as any).is_hiring === false
                                                    ? 'bg-slate-200 text-slate-500 pointer-events-none'
                                                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white active:scale-98'
                                            }`}
                                        >
                                            <Send className="w-4 h-4 text-purple-200" />
                                            {(job as any).is_hiring === false ? t('Currently Not Hiring') : t('Apply Now')}
                                        </a>

                                        {/* Save for Later Button */}
                                        <Button
                                            variant="outline"
                                            className={`w-full border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold py-2.5 ${
                                                savedJobs.includes(job.id) ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-slate-700'
                                            }`}
                                            onClick={handleSaveJob}
                                        >
                                            <Bookmark className={`w-3.5 h-3.5 mr-1.5 ${savedJobs.includes(job.id) ? 'fill-current' : ''}`} />
                                            {savedJobs.includes(job.id) ? t('Saved') : t('Save for Later')}
                                        </Button>

                                        {/* Share Job Opening */}
                                        <Button
                                            variant="outline"
                                            onClick={handleShareJob}
                                            className="w-full border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold py-2.5 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                                        >
                                            {isCopied ? (
                                                <><Check className="w-3.5 h-3.5 text-emerald-600" /> {t('Link Copied to Clipboard')}</>
                                            ) : (
                                                <><Share2 className="w-3.5 h-3.5 text-slate-600" /> {t('Share Job Opening')}</>
                                            )}
                                        </Button>
                                    </div>

                                    <div className="border-t border-slate-100 my-4"></div>

                                    {/* Dates Info List */}
                                    <div className="space-y-3.5 text-xs">
                                        <div className="flex justify-between items-center text-slate-600">
                                            <span className="text-slate-500">{t('Posted')}:</span>
                                            <span className="font-semibold text-slate-800">{formatDate(job.postedDate)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-slate-600">
                                            <span className="text-slate-500">{t('Application Deadline')}:</span>
                                            <span className="font-semibold text-slate-800">{formatDate(job.endDate)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-slate-600">
                                            <span className="text-slate-500">{t('Start Date')}:</span>
                                            <span className="font-semibold text-slate-800">{formatDate(job.startDate)}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Company Info Card */}
                            {(companyInfo.ourMission || companyInfo.companySize || companyInfo.industry) && (
                                <Card className="shadow-xs border border-slate-200 rounded-2xl bg-white overflow-hidden">
                                    <CardContent className="p-6 space-y-4">
                                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                            {t('About the Company')}
                                        </h3>
                                        <div className="space-y-3.5 text-xs">
                                            {companyInfo.ourMission && (
                                                <div>
                                                    <h4 className="font-semibold text-slate-800 mb-1">{t('Our Mission')}</h4>
                                                    <p className="text-slate-600 leading-relaxed">{companyInfo.ourMission}</p>
                                                </div>
                                            )}
                                            {companyInfo.companySize && (
                                                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                                    <span className="text-slate-500">{t('Company Size')}:</span>
                                                    <span className="font-semibold text-slate-800">{companyInfo.companySize}</span>
                                                </div>
                                            )}
                                            {companyInfo.industry && (
                                                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                                    <span className="text-slate-500">{t('Industry')}:</span>
                                                    <span className="font-semibold text-slate-800">{companyInfo.industry}</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
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
