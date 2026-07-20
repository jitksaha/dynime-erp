import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { Star, CheckCircle2, Send, Building2, User, Briefcase, MessageSquare, Sparkles } from 'lucide-react';
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
            setErrorMessage('Please fill in your name and review.');
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
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-purple-500 selection:text-white relative overflow-hidden font-sans">
            <Head title={`Submit Review - ${appName}`} />

            {/* Background Glow Orbs */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />

            {/* Header */}
            <header className="w-full max-w-4xl mx-auto px-6 py-8 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                            Dynime
                        </span>
                        <span className="text-xs block text-purple-400 font-medium">Client Reviews</span>
                    </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-full backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Verified Feedback Portal
                </div>
            </header>

            {/* Main Container */}
            <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
                <div className="w-full max-w-xl">
                    {isSubmitted ? (
                        <div className="bg-slate-900/80 border border-purple-500/30 rounded-3xl p-8 sm:p-12 text-center backdrop-blur-xl shadow-2xl shadow-purple-950/50 animate-in fade-in zoom-in-95 duration-300">
                            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-bounce" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-3">Thank You!</h2>
                            <p className="text-slate-300 text-base max-w-md mx-auto mb-8 leading-relaxed">
                                Your review has been submitted successfully. We appreciate your valuable feedback!
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
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-purple-600/30"
                            >
                                Submit Another Review
                            </button>
                        </div>
                    ) : (
                        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-10 backdrop-blur-xl shadow-2xl shadow-purple-950/40">
                            <div className="text-center mb-8">
                                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
                                    Share Your Experience
                                </h1>
                                <p className="text-slate-400 text-sm max-w-md mx-auto">
                                    How was working with Dynime? We value your honest review and partnership.
                                </p>
                            </div>

                            {errorMessage && (
                                <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm text-center">
                                    {errorMessage}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Star Rating */}
                                <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                                        Overall Rating
                                    </label>
                                    <div className="flex items-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                className="p-1 transition-transform transform hover:scale-125 focus:outline-none"
                                            >
                                                <Star
                                                    className={`w-9 h-9 transition-colors ${
                                                        star <= (hoverRating || rating)
                                                            ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                                                            : 'text-slate-700 fill-slate-800/40'
                                                    }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <span className="mt-3 text-xs font-medium text-amber-400 h-4">
                                        {ratingLabels[hoverRating || rating]}
                                    </span>
                                </div>

                                {/* Form Fields */}
                                <div className="space-y-4">
                                    {/* Full Name */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                            Your Name <span className="text-purple-400">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <input
                                                type="text"
                                                required
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="e.g. Sarah Chen"
                                                className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    {/* Position & Business Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Position */}
                                        <div>
                                            <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                                Position / Title
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                                    <Briefcase className="w-4 h-4" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={position}
                                                    onChange={(e) => setPosition(e.target.value)}
                                                    placeholder="e.g. CEO, Founder"
                                                    className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                                                />
                                            </div>
                                        </div>

                                        {/* Business Name */}
                                        <div>
                                            <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                                Business / Company Name
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                                    <Building2 className="w-4 h-4" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={businessName}
                                                    onChange={(e) => setBusinessName(e.target.value)}
                                                    placeholder="e.g. TechFlow"
                                                    className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Review Text */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                            Your Review / Testimonial <span className="text-purple-400">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute top-3.5 left-3.5 text-slate-500 pointer-events-none">
                                                <MessageSquare className="w-4 h-4" />
                                            </div>
                                            <textarea
                                                required
                                                rows={4}
                                                value={review}
                                                onChange={(e) => setReview(e.target.value)}
                                                placeholder="Describe your experience working with Dynime..."
                                                className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Submitting...
                                        </span>
                                    ) : (
                                        <>
                                            Submit Review
                                            <Send className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full max-w-4xl mx-auto px-6 py-6 text-center text-xs text-slate-600 z-10">
                © {new Date().getFullYear()} Dynime. All rights reserved.
            </footer>
        </div>
    );
}
