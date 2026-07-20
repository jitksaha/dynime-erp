import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { Star, CheckCircle2, Send, Building2, User, Briefcase, MessageSquare, ShieldCheck } from 'lucide-react';
import ApplicationLogo from '@/components/application-logo';
import axios from 'axios';

interface PublicSubmitProps {
    appName?: string;
}

export default function PublicSubmit({ appName = 'Dynime' }: PublicSubmitProps) {
    const [rating, setRating] = useState<number>(5);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [name, setName] = useState('');
    const [position, setPosition] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [review, setReview] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const ratingLabels: Record<number, string> = {
        1: 'Poor',
        2: 'Fair',
        3: 'Good',
        4: 'Very Good',
        5: 'Excellent!'
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!name.trim() || !review.trim()) {
            setErrorMessage('Please enter your name and review text.');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await axios.post('/review/submit', {
                name,
                position,
                business_name: businessName,
                rating,
                review
            });

            if (response.data?.success) {
                setIsSubmitted(true);
            }
        } catch (error: any) {
            setErrorMessage(error?.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-purple-500 selection:text-white font-sans">
            <Head title={`Submit Review - ${appName}`} />

            {/* Top Navigation Bar */}
            <header className="w-full max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ApplicationLogo className="w-9 h-9 text-purple-600 fill-current" />
                    <div>
                        <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                            Dynime
                        </span>
                        <span className="text-xs block text-slate-500 dark:text-slate-400 font-medium">Client Reviews</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 px-3 py-1.5 rounded-full">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Verified Feedback
                </div>
            </header>

            {/* Main Content Card */}
            <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-lg">
                    {isSubmitted ? (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center shadow-xl animate-in fade-in duration-300">
                            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-full flex items-center justify-center mx-auto mb-5">
                                <CheckCircle2 className="w-9 h-9 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Thank You!</h2>
                            <p className="text-slate-600 dark:text-slate-300 text-sm max-w-sm mx-auto mb-8 leading-relaxed">
                                Your review has been submitted successfully. We appreciate your valuable partnership and feedback!
                            </p>
                            <button
                                onClick={() => {
                                    setIsSubmitted(false);
                                    setName('');
                                    setPosition('');
                                    setBusinessName('');
                                    setReview('');
                                    setRating(5);
                                }}
                                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs transition-colors shadow-md"
                            >
                                Submit Another Review
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl">
                            {/* Card Header */}
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/50 mb-3">
                                    <ApplicationLogo className="w-10 h-10 text-purple-600 fill-current" />
                                </div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-1">
                                    Share Your Experience
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 text-xs">
                                    How was working with Dynime? We value your honest feedback.
                                </p>
                            </div>

                            {errorMessage && (
                                <div className="mb-6 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs text-center font-medium">
                                    {errorMessage}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Star Rating Box */}
                                <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80">
                                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                        Rating
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                className="p-1 transition-transform transform hover:scale-110 focus:outline-none"
                                            >
                                                <Star
                                                    className={`w-8 h-8 transition-colors ${
                                                        star <= (hoverRating || rating)
                                                            ? 'fill-amber-400 text-amber-400'
                                                            : 'text-slate-300 dark:text-slate-700 fill-slate-100 dark:fill-slate-800'
                                                    }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <span className="mt-2 text-xs font-semibold text-amber-600 dark:text-amber-400 h-4">
                                        {(hoverRating || rating)} / 5 - {ratingLabels[hoverRating || rating]}
                                    </span>
                                </div>

                                {/* Form Inputs */}
                                <div className="space-y-4">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                            Your Name <span className="text-purple-600 dark:text-purple-400">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <input
                                                type="text"
                                                required
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="e.g. Sarah Chen"
                                                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Position & Business Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        {/* Position */}
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                                Position / Title
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                    <Briefcase className="w-4 h-4" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={position}
                                                    onChange={(e) => setPosition(e.target.value)}
                                                    placeholder="e.g. CEO"
                                                    className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 transition-all"
                                                />
                                            </div>
                                        </div>

                                        {/* Business */}
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                                Business / Company
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                    <Building2 className="w-4 h-4" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={businessName}
                                                    onChange={(e) => setBusinessName(e.target.value)}
                                                    placeholder="e.g. TechFlow"
                                                    className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Review Text */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                            Your Review <span className="text-purple-600 dark:text-purple-400">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute top-3 left-3 text-slate-400 pointer-events-none">
                                                <MessageSquare className="w-4 h-4" />
                                            </div>
                                            <textarea
                                                required
                                                rows={4}
                                                value={review}
                                                onChange={(e) => setReview(e.target.value)}
                                                placeholder="Write your review here..."
                                                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 transition-all resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-3 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Submitting...
                                        </span>
                                    ) : (
                                        <>
                                            Submit Review
                                            <Send className="w-3.5 h-3.5" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full max-w-4xl mx-auto px-6 py-6 text-center text-xs text-slate-400 dark:text-slate-600">
                © {new Date().getFullYear()} Dynime. All rights reserved.
            </footer>
        </div>
    );
}
