export const PAYMENT_STATUSES = [
    'Unpaid',
    'Authorized',
    'Partially Paid',
    'Paid',
    'Refunded',
    'Failed'
];

export const OPERATIONAL_STATUSES = [
    'Pending',
    'Processing',
    'In Review',
    'Action Required',
    'Delivered',
    'Completed',
    'Cancelled'
];

export const PROJECT_CATEGORIES = [
    'Consulting',
    'Business Formation',
    'Web Development',
    'Marketing'
];

export const PROJECT_STATUS_MAP: Record<string, { label: string; desc: string }[]> = {
    'Consulting': [
        { label: 'ConsultingRequested', desc: 'Slot selected; awaiting consultant review.' },
        { label: 'Scheduled', desc: 'Confirmed; meeting links and calendar invites dispatched.' },
        { label: 'Reviewing', desc: 'Consultant analyzing client intake documents.' },
        { label: 'In Session', desc: 'Live consultation currently taking place.' },
        { label: 'Wrap-up', desc: 'Meeting completed; final strategy report being drafted.' },
        { label: 'Completed', desc: 'Action plan and resources delivered.' }
    ],
    'Business Formation': [
        { label: 'Intake', desc: 'Awaiting client ID and company detail uploads.' },
        { label: 'Auditing', desc: 'Compliance team verifying documents for state errors.' },
        { label: 'Submitted', desc: 'Filed with government offices; awaiting state processing.' },
        { label: 'Action Needed', desc: 'State rejected details; urgent client correction required.' },
        { label: 'Registered', desc: 'State approved; corporate entity is legally active.' },
        { label: 'Finalized', desc: 'EIN and official articles transferred to client.' }
    ],
    'Web Development': [
        { label: 'Scoping', desc: 'Gathering technical requirements and drafting wireframes.' },
        { label: 'Designing', desc: 'Visual layouts created; awaiting client sign-off.' },
        { label: 'Coding', desc: 'Active backend and frontend build on staging server.' },
        { label: 'Testing', desc: 'Client and QA testing functional site features.' },
        { label: 'Launching', desc: 'Migrating to live production server and configuring DNS.' },
        { label: 'Handover', desc: 'Live site launched; training assets and credentials sent.' }
    ],
    'Marketing': [
        { label: 'Strategizing', desc: 'Defining campaign briefs, audiences, and KPI targets.' },
        { label: 'Producing', desc: 'Designing ad creatives, writing copy, and building landers.' },
        { label: 'Reviewing', desc: 'Assets uploaded; awaiting client compliance approval.' },
        { label: 'Live', desc: 'Ads actively running and spending campaign budget.' },
        { label: 'Optimizing', desc: 'Iterating creatives and tweaking bids for maximum ROI.' },
        { label: 'Reporting', desc: 'Performance window closed; final data report compiling.' }
    ]
};

export const getStatusBadgeClasses = (status: string) => {
    const colors = {
        draft: 'bg-gray-100 text-gray-800 border border-gray-200',
        posted: 'bg-blue-100 text-blue-800 border border-blue-200',
        partial: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
        paid: 'bg-green-100 text-green-800 border border-green-200',
        overdue: 'bg-red-100 text-red-800 border border-red-200',
        cancelled: 'bg-red-100 text-red-800 border border-red-200'
    };
    return `px-2 py-1 rounded-full text-sm font-semibold capitalize ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`;
};

export const getPaymentStatusBadgeClasses = (status: string) => {
    const colors = {
        'Unpaid': 'bg-slate-50 text-slate-700 border border-slate-200',
        'Authorized': 'bg-blue-50 text-blue-700 border border-blue-200',
        'Partially Paid': 'bg-amber-50 text-amber-700 border border-amber-200',
        'Paid': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        'Refunded': 'bg-purple-50 text-purple-700 border border-purple-200',
        'Failed': 'bg-rose-50 text-rose-700 border border-rose-200'
    };
    return `px-2.5 py-1 rounded-full text-xs font-semibold ${colors[status as keyof typeof colors] || 'bg-slate-50 text-slate-700 border border-slate-200'}`;
};

export const getOperationalStatusBadgeClasses = (status: string) => {
    const colors = {
        'Pending': 'bg-amber-50 text-amber-700 border border-amber-200',
        'Processing': 'bg-indigo-50 text-indigo-700 border border-indigo-200',
        'In Review': 'bg-sky-50 text-sky-700 border border-sky-200',
        'Action Required': 'bg-orange-50 text-orange-700 border border-orange-200',
        'Delivered': 'bg-teal-50 text-teal-700 border border-teal-200',
        'Completed': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        'Cancelled': 'bg-slate-100 text-slate-700 border border-slate-200'
    };
    return `px-2.5 py-1 rounded-full text-xs font-semibold ${colors[status as keyof typeof colors] || 'bg-slate-50 text-slate-700 border border-slate-200'}`;
};

export const getProjectStatusBadgeClasses = (status: string) => {
    return 'px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200';
};
