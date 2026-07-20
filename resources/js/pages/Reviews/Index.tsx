import React, { useState } from 'react';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { Head, router } from '@inertiajs/react';
import { 
    Star, 
    Copy, 
    Check, 
    Plus, 
    Search, 
    Filter, 
    Trash2, 
    Edit, 
    CheckCircle, 
    Clock, 
    XCircle, 
    ExternalLink,
    Building2,
    User,
    Briefcase,
    MessageSquare,
    Sparkles,
    ThumbsUp
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

interface ReviewItem {
    id: number;
    name: string;
    position: string | null;
    business_name: string | null;
    rating: number;
    review: string;
    status: 'approved' | 'pending' | 'rejected';
    is_featured: boolean;
    created_at: string;
}

interface IndexProps {
    reviews: {
        data: ReviewItem[];
        links: any[];
        total: number;
        current_page: number;
        last_page: number;
    };
    stats: {
        total: number;
        avg_rating: number;
        approved: number;
        pending: number;
        five_star: number;
    };
    filters: {
        search?: string;
        status?: string;
        rating?: string;
    };
    publicUrl: string;
}

export default function Index({ reviews, stats, filters, publicUrl }: IndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');
    const [selectedRating, setSelectedRating] = useState(filters.rating || 'all');

    const [isCopied, setIsCopied] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingReview, setEditingReview] = useState<ReviewItem | null>(null);

    // Form state
    const [formName, setFormName] = useState('');
    const [formPosition, setFormPosition] = useState('');
    const [formBusiness, setFormBusiness] = useState('');
    const [formRating, setFormRating] = useState<number>(5);
    const [formReview, setFormReview] = useState('');
    const [formStatus, setFormStatus] = useState<'approved' | 'pending' | 'rejected'>('approved');
    const [isSaving, setIsSaving] = useState(false);

    const handleCopyPublicLink = () => {
        navigator.clipboard.writeText(publicUrl);
        setIsCopied(true);
        toast.success('Public review collection link copied to clipboard!');
        setTimeout(() => setIsCopied(false), 2500);
    };

    const handleFilterChange = (newStatus: string, newRating: string, newSearch: string) => {
        router.get(
            route('reviews.index'),
            {
                status: newStatus !== 'all' ? newStatus : undefined,
                rating: newRating !== 'all' ? newRating : undefined,
                search: newSearch.trim() !== '' ? newSearch : undefined,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleOpenCreateModal = () => {
        setEditingReview(null);
        setFormName('');
        setFormPosition('');
        setFormBusiness('');
        setFormRating(5);
        setFormReview('');
        setFormStatus('approved');
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (review: ReviewItem) => {
        setEditingReview(review);
        setFormName(review.name);
        setFormPosition(review.position || '');
        setFormBusiness(review.business_name || '');
        setFormRating(review.rating);
        setFormReview(review.review);
        setFormStatus(review.status);
        setIsModalOpen(true);
    };

    const handleSaveReview = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const payload = {
            name: formName,
            position: formPosition,
            business_name: formBusiness,
            rating: formRating,
            review: formReview,
            status: formStatus,
        };

        try {
            if (editingReview) {
                await axios.put(route('reviews.update', editingReview.id), payload);
                toast.success('Review updated successfully!');
            } else {
                await axios.post(route('reviews.store'), payload);
                toast.success('Review created successfully!');
            }
            setIsModalOpen(false);
            router.reload({ only: ['reviews', 'stats'] });
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to save review.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateStatus = async (id: number, newStatus: 'approved' | 'pending' | 'rejected') => {
        try {
            await axios.post(route('reviews.update-status', id), { status: newStatus });
            toast.success(`Review status changed to ${newStatus}`);
            router.reload({ only: ['reviews', 'stats'] });
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this review?')) return;
        try {
            await axios.delete(route('reviews.destroy', id));
            toast.success('Review deleted successfully!');
            router.reload({ only: ['reviews', 'stats'] });
        } catch (error) {
            toast.error('Failed to delete review');
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-amber-500" />
                            Client Reviews & Testimonials
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Manage client feedback and collect reviews via public share link
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleCopyPublicLink}
                            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
                            {isCopied ? 'Link Copied!' : 'Copy Public Review Link'}
                        </button>
                        <a
                            href={publicUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Preview Public Page"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                            onClick={handleOpenCreateModal}
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Review
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Client Reviews" />

            <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {/* Total Reviews */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Reviews</span>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.total}</div>
                    </div>

                    {/* Avg Rating */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Average Rating</span>
                        <div className="text-2xl font-bold text-amber-500 mt-1 flex items-center gap-1.5">
                            {stats.avg_rating}
                            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                        </div>
                    </div>

                    {/* Approved */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Approved</span>
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.approved}</div>
                    </div>

                    {/* Pending */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending</span>
                        <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.pending}</div>
                    </div>

                    {/* 5-Star Reviews */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm col-span-2 md:col-span-1">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">5-Star Reviews</span>
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.five_star}</div>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search name, position, business or text..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                handleFilterChange(selectedStatus, selectedRating, e.target.value);
                            }}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                        />
                    </div>

                    {/* Status Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                        {['all', 'approved', 'pending', 'rejected'].map((statusKey) => (
                            <button
                                key={statusKey}
                                onClick={() => {
                                    setSelectedStatus(statusKey);
                                    handleFilterChange(statusKey, selectedRating, search);
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                                    selectedStatus === statusKey
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                {statusKey}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Reviews Card Grid */}
                {reviews.data.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
                        <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No reviews found</h3>
                        <p className="text-xs text-slate-500 mt-1">Try adjusting your filter or create a new review.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {reviews.data.map((item) => (
                            <div
                                key={item.id}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                            >
                                <div>
                                    {/* Rating & Status Badge */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-1">
                                            {[...Array(5)].map((_, idx) => (
                                                <Star
                                                    key={idx}
                                                    className={`w-4 h-4 ${
                                                        idx < item.rating
                                                            ? 'fill-amber-400 text-amber-400'
                                                            : 'text-slate-300 dark:text-slate-700 fill-slate-200 dark:fill-slate-800'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <span
                                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                                                item.status === 'approved'
                                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                                    : item.status === 'pending'
                                                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                                                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                                            }`}
                                        >
                                            {item.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                                            {item.status === 'pending' && <Clock className="w-3 h-3" />}
                                            {item.status === 'rejected' && <XCircle className="w-3 h-3" />}
                                            {item.status}
                                        </span>
                                    </div>

                                    {/* Review Content */}
                                    <p className="text-xs text-slate-600 dark:text-slate-300 italic mb-4 line-clamp-4 leading-relaxed">
                                        "{item.review}"
                                    </p>
                                </div>

                                {/* Author Profile & Actions Footer */}
                                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                                            {getInitials(item.name)}
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                                {item.name}
                                            </h4>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                {[item.position, item.business_name].filter(Boolean).join(', ') || 'Client'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        {item.status !== 'approved' && (
                                            <button
                                                onClick={() => handleUpdateStatus(item.id, 'approved')}
                                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors"
                                                title="Approve Review"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleOpenEditModal(item)}
                                            className="p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                {editingReview ? 'Edit Review' : 'Add New Review'}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg leading-none"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSaveReview} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder="e.g. Sarah Chen"
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Position / Title
                                    </label>
                                    <input
                                        type="text"
                                        value={formPosition}
                                        onChange={(e) => setFormPosition(e.target.value)}
                                        placeholder="e.g. CEO"
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Business Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formBusiness}
                                        onChange={(e) => setFormBusiness(e.target.value)}
                                        placeholder="e.g. TechFlow"
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Star Rating
                                    </label>
                                    <select
                                        value={formRating}
                                        onChange={(e) => setFormRating(Number(e.target.value))}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                                    >
                                        <option value={5}>5 Stars (Excellent)</option>
                                        <option value={4}>4 Stars (Very Good)</option>
                                        <option value={3}>3 Stars (Good)</option>
                                        <option value={2}>2 Stars (Fair)</option>
                                        <option value={1}>1 Star (Poor)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Status
                                    </label>
                                    <select
                                        value={formStatus}
                                        onChange={(e) => setFormStatus(e.target.value as any)}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                                    >
                                        <option value="approved">Approved</option>
                                        <option value="pending">Pending</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Review Content <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    value={formReview}
                                    onChange={(e) => setFormReview(e.target.value)}
                                    placeholder="Enter review text..."
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-purple-500 resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-sm disabled:opacity-50"
                                >
                                    {isSaving ? 'Saving...' : 'Save Review'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
