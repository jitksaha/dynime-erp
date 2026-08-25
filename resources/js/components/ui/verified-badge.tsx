import React from 'react';

interface VerifiedBadgeProps {
    className?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    title?: string;
}

export function VerifiedBadge({ className = "", size = 'sm', title = "Verified Account" }: VerifiedBadgeProps) {
    const sizeClasses = size === 'lg' ? 'w-5.5 h-5.5' : size === 'md' ? 'w-4.5 h-4.5' : size === 'xs' ? 'w-3.5 h-3.5' : 'w-4 h-4';

    return (
        <span className={`inline-flex items-center shrink-0 ${className}`} title={title}>
            <svg
                className={`${sizeClasses} text-indigo-600 dark:text-indigo-400 fill-current drop-shadow-2xs`}
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.79-4-4-4-.495 0-.965.084-1.4.238C14.55 2.475 13.18 1.6 11.6 1.6c-1.58 0-2.95.875-3.6 2.148-.435-.154-.905-.238-1.4-.238-2.21 0-4 1.79-4 4 0 .495.084.965.238 1.4C1.575 9.55.7 10.92.7 12.5c0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.79 4 4 4 .495 0 .965-.084 1.4-.238 1.25 1.273 2.62 2.148 4.2 2.148 1.58 0 2.95-.875 3.6-2.148.435.154.905.238 1.4.238 2.21 0 4-1.79 4-4 0-.495-.084-.965-.238-1.4 1.273-1.25 2.148-2.62 2.148-4.2zM9.7 16.6L5.4 12.3l1.4-1.4 2.9 2.9 7.3-7.3 1.4 1.4-8.7 8.7z" />
            </svg>
        </span>
    );
}

export default VerifiedBadge;
