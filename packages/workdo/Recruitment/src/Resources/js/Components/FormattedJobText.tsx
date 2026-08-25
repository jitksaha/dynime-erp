import React from 'react';

interface FormattedJobTextProps {
    content?: string | null;
    className?: string;
}

export function FormattedJobText({ content, className = '' }: FormattedJobTextProps) {
    if (!content) return null;

    // Check if content already contains HTML tags
    const isHtml = /<[a-z][\s\S]*>/i.test(content);

    if (isHtml) {
        return (
            <div 
                className={`prose prose-slate max-w-none text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap
                [&_h1]:text-xl [&_h1]:font-black [&_h1]:text-slate-900 [&_h1]:dark:text-white [&_h1]:mt-6 [&_h1]:mb-3
                [&_h2]:text-lg [&_h2]:font-extrabold [&_h2]:text-slate-900 [&_h2]:dark:text-white [&_h2]:mt-5 [&_h2]:mb-2.5
                [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-slate-900 [&_h3]:dark:text-white [&_h3]:mt-4 [&_h3]:mb-2
                [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:my-3 [&_ul]:text-slate-700 [&_ul]:dark:text-slate-300
                [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ol]:my-3
                [&_li]:text-sm [&_li]:leading-relaxed
                [&_p]:mb-3 [&_p]:leading-relaxed [&_p:empty]:h-3
                [&_strong]:font-bold [&_strong]:text-slate-900 [&_strong]:dark:text-white
                ${className}`}
                dangerouslySetInnerHTML={{ __html: content }}
            />
        );
    }

    // Auto-parse plain text (e.g. pasted from Flowmingo with line breaks and bullet points)
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let currentList: string[] = [];

    const flushList = (keyPrefix: number) => {
        if (currentList.length > 0) {
            elements.push(
                <ul key={`ul-${keyPrefix}`} className="list-disc pl-5 space-y-1.5 my-3 text-slate-700 dark:text-slate-300 text-sm">
                    {currentList.map((item, idx) => (
                        <li key={idx} className="leading-relaxed">{item}</li>
                    ))}
                </ul>
            );
            currentList = [];
        }
    };

    lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
            flushList(idx);
            elements.push(<div key={`empty-${idx}`} className="h-3 min-h-[0.75rem]" />);
            return;
        }

        // Check for bullet point indicators (•, -, *, 1., 2.)
        const isBullet = /^[•\-*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed);

        if (isBullet) {
            const cleanText = trimmed.replace(/^[•\-*]\s+/, '').replace(/^\d+\.\s+/, '');
            currentList.push(cleanText);
        } else {
            flushList(idx);
            // Check if line looks like a Section Heading (short line, no period at end, or title case)
            const isHeading = (trimmed.length < 55 && !trimmed.endsWith('.')) || 
                              /^(Qualifications|Key Responsibilities|Responsibilities|Requirements|Why Dynime\??|About the Role|Benefits|What We Offer|Job Summary|Responsibilities:)/i.test(trimmed);

            if (isHeading) {
                elements.push(
                    <h3 key={`h-${idx}`} className="text-base md:text-lg font-extrabold text-slate-900 dark:text-white mt-5 mb-2.5 tracking-tight">
                        {trimmed}
                    </h3>
                );
            } else {
                elements.push(
                    <p key={`p-${idx}`} className="mb-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                        {trimmed}
                    </p>
                );
            }
        }
    });

    flushList(lines.length);

    return <div className={`space-y-0.5 ${className}`}>{elements}</div>;
}
