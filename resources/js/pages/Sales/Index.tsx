import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import { usePageButtons } from '@/hooks/usePageButtons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Edit as EditIcon, Trash2, Eye, FileText, Receipt, Download, Share2, CreditCard, Printer } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { ListGridToggle } from '@/components/ui/list-grid-toggle';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { getStatusBadgeClasses, getPaymentStatusBadgeClasses, getOperationalStatusBadgeClasses, getProjectStatusBadgeClasses } from './utils';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import NoRecordsFound from '@/components/no-records-found';
import { SalesInvoice, SalesFilters } from './types';
import PaymentModal from './components/PaymentModal';

interface SalesIndexProps {
    invoices: {
        data: SalesInvoice[];
        links: any[];
        meta: any;
    };
    customers: Array<{id: number; name: string; email: string}>;
    warehouses: Array<{id: number; name: string; address: string}>;
    auth: any;
    [key: string]: any;
}

export default function Index() {
    const { t } = useTranslation();
    const { invoices, customers, warehouses, auth } = usePage<SalesIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);
    const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<SalesInvoice | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    const [filters, setFilters] = useState<SalesFilters>({
        search: urlParams.get('search') || '',
        customer_id: urlParams.get('customer_id') || '',
        warehouse_id: urlParams.get('warehouse_id') || '',
        status: urlParams.get('status') || '',
        date_range: urlParams.get('date_range') || ''
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(urlParams.get('view') as 'list' | 'grid' || 'list');
    const [showFilters, setShowFilters] = useState(false);

    // Component for invoice action buttons
    const InvoiceActionButtons = ({ invoice }: { invoice: SalesInvoice }) => {
        const eInvoiceButtons = usePageButtons('invoiceActionButtons', { invoice_id: invoice.id, auth });
        return (
            <>
                {eInvoiceButtons.map((button) => (
                    <div key={button.id}>{button.component}</div>
                ))}
            </>
        );
    };

    // Component for signature buttons
    const SignatureButtons = ({ invoice }: { invoice: SalesInvoice }) => {
        const signatureButtons = usePageButtons('signatureBtn', { invoice });

        return (
            <>
                {signatureButtons.map((button) => (
                    <div key={button.id}>{button.component}</div>
                ))}
            </>
        );
    };

    const pageButtons = usePageButtons('salesBtn', 'Sales data');
    const spreadsheetButtons = usePageButtons('spreadsheetBtn', { module: 'Sales', sub_module: 'Salesaccount' });
    const googleDriveButtons = usePageButtons('googleDriveBtn', { module: 'Sales Invoice', settingKey: 'GoogleDrive Sales Invoice' });
    const oneDriveButtons = usePageButtons('oneDriveBtn', { module: 'Sales Invoice', settingKey: 'OneDrive Sales Invoice' });

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'sales-invoices.destroy',
        defaultMessage: t('Are you sure you want to delete this sales invoice?')
    });

    const handleFilter = () => {
        router.get(route('sales-invoices.index'), {...filters, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode}, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('sales-invoices.index'), {...filters, per_page: perPage, sort: field, direction, view: viewMode}, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ search: '', customer_id: '', warehouse_id: '', status: '', payment_status: '', operational_status: '', project_category: '', project_status: '', date_range: '' });
        router.get(route('sales-invoices.index'), {per_page: perPage, view: viewMode});
    };

    const tableColumns = [
        {
            key: 'invoice_number',
            header: t('Invoice Number'),
            sortable: true,
            render: (value: string, invoice: SalesInvoice) =>
                auth.user?.permissions?.includes('view-sales-invoices') ? (
                    <span className="text-blue-600 hover:text-blue-700 cursor-pointer" onClick={() => router.get(route('sales-invoices.show', invoice.id))}>{value}</span>
                ) : (
                    value
                )
        },
        {
            key: 'customer',
            header: t('Customer'),
            render: (value: any) => value?.name || '-'
        },
        {
            key: 'invoice_date',
            header: t('Invoice Date'),
            sortable: true,
            render: (value: string) => formatDate(value)
        },
        {
            key: 'due_date',
            header: t('Due Date'),
            sortable: true,
            render: (value: string, invoice: SalesInvoice) => {
                const isOverdue = invoice.display_status === 'overdue';
                return (
                    <div>
                        <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                            {formatDate(value)}
                        </span>
                        {isOverdue && (
                            <div className="text-xs text-red-600 font-medium mt-1">
                                {t('Overdue')}
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            key: 'subtotal',
            header: t('Subtotal'),
            sortable: true,
            render: (value: number) => formatCurrency(value)
        },
        {
            key: 'tax_amount',
            header: t('Tax'),
            sortable: true,
            render: (value: number) => formatCurrency(value)
        },
        {
            key: 'total_amount',
            header: t('Total Amount'),
            sortable: true,
            render: (value: number) => formatCurrency(value)
        },
        {
            key: 'balance_amount',
            header: t('Balance'),
            sortable: true,
            render: (value: number) => formatCurrency(value)
        },
        {
            key: 'payment_status',
            header: t('Payment Status'),
            sortable: true,
            render: (_: any, invoice: SalesInvoice) => (
                <button
                    type="button"
                    onClick={() => {
                        if (auth.user?.permissions?.includes('edit-sales-invoices')) {
                            setSelectedInvoiceForPayment(invoice);
                            setIsPaymentModalOpen(true);
                        }
                    }}
                    className={`text-left transition-transform hover:scale-105 ${auth.user?.permissions?.includes('edit-sales-invoices') ? 'cursor-pointer' : 'cursor-default'}`}
                    title={auth.user?.permissions?.includes('edit-sales-invoices') ? t('Click to edit/record payment') : ''}
                >
                    <span className={getPaymentStatusBadgeClasses(invoice.payment_status || 'Unpaid')}>
                        {t(invoice.payment_status || 'Unpaid')}
                    </span>
                </button>
            )
        },
        {
            key: 'operational_status',
            header: t('Operational Status'),
            sortable: true,
            render: (_: any, invoice: SalesInvoice) => (
                <span className={getOperationalStatusBadgeClasses(invoice.operational_status || 'Pending')}>
                    {t(invoice.operational_status || 'Pending')}
                </span>
            )
        },
        {
            key: 'project_status',
            header: t('Project Stage'),
            render: (_: any, invoice: SalesInvoice) => (
                invoice.project_category && invoice.project_category !== 'N/A' ? (
                    <div className="flex flex-col gap-1 items-start">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">{t(invoice.project_category)}</span>
                        <span className={getProjectStatusBadgeClasses(invoice.project_status || '')}>
                            {t(invoice.project_status || 'N/A')}
                        </span>
                    </div>
                ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                )
            )
        },
        ...(auth.user?.permissions?.some((p: string) => ['view-sales-invoices', 'edit-sales-invoices', 'delete-sales-invoices', 'post-sales-invoices', 'print-sales-invoices'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, invoice: SalesInvoice) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('edit-sales-invoices') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedInvoiceForPayment(invoice);
                                            setIsPaymentModalOpen(true);
                                        }}
                                        className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                    >
                                        <CreditCard className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Record / Edit Payment')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        <SignatureButtons invoice={invoice} />
                        {auth.user?.permissions?.includes('print-sales-invoices') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => window.open(route('sales-invoices.print', invoice.id) + '?print=1', '_blank')}
                                        className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700"
                                    >
                                        <Printer className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Print PDF')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        <InvoiceActionButtons invoice={invoice} />
                        {auth.user?.permissions?.includes('view-sales-invoices') && (
                            <>
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => router.get(route('sales-invoices.show', invoice.id))}
                                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{t('View')}</p>
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                const shareUrl = 'https://billing.dynime.com/' + invoice.invoice_number;
                                                navigator.clipboard.writeText(shareUrl);
                                                alert(t('Shareable link copied to clipboard!'));
                                            }}
                                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                        >
                                            <Share2 className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{t('Copy Public Share Link')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </>
                        )}
                        {invoice.status === 'draft' && (
                            <>
                                {auth.user?.permissions?.includes('post-sales-invoices') && (
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.post(route('sales-invoices.post', invoice.id))}
                                                className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700"
                                            >
                                                <FileText className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{t('Post invoice to finalize and create journal entries')}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                                {auth.user?.permissions?.includes('edit-sales-invoices') && (
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.visit(route('sales-invoices.edit', invoice.id))}
                                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                            >
                                                <EditIcon className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{t('Edit')}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                                {auth.user?.permissions?.includes('delete-sales-invoices') && (
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openDeleteDialog(invoice.id)}
                                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{t('Delete')}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                            </>
                        )}
                    </TooltipProvider>
                </div>
            )
        }] : [])
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[{label: t('Sales Invoices')}]}
            pageTitle={t('Manage Sales Invoices')}
            pageActions={
                <div className="flex gap-2">
                    <TooltipProvider>
                        {pageButtons.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {spreadsheetButtons.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {googleDriveButtons.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {oneDriveButtons.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {auth.user?.permissions?.includes('create-sales-invoices') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button size="sm" onClick={() => router.visit(route('sales-invoices.create'))}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Create')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}

                    </TooltipProvider>
                </div>
            }
        >
            <Head title={t('Sales Invoices')} />

            <Card className="shadow-sm">
                <CardContent className="p-6 border-b bg-gray-50/50">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 max-w-md">
                            <SearchInput
                                value={filters.search || ''}
                                onChange={(value) => setFilters({...filters, search: value})}
                                onSearch={handleFilter}
                                placeholder={t('Search by invoice number...')}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <ListGridToggle
                                currentView={viewMode}
                                routeName="sales-invoices.index"
                                filters={{...filters, per_page: perPage}}
                            />
                            <PerPageSelector
                                routeName="sales-invoices.index"
                                filters={{...filters, view: viewMode}}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.customer_id, filters.warehouse_id, filters.status, filters.date_range].filter(Boolean).length;
                                    return activeFilters > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                                            {activeFilters}
                                        </span>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </CardContent>

                {showFilters && (
                    <CardContent className="p-6 bg-blue-50/30 border-b">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                {auth.user?.permissions?.includes('manage-users') && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('Customer')}</label>
                                        <Select value={filters.customer_id} onValueChange={(value) => setFilters({...filters, customer_id: value})}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('Filter by customer')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {customers.map((customer) => (
                                                    <SelectItem key={customer.id} value={customer.id.toString()}>
                                                        {customer.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                 {auth.user?.permissions?.includes('manage-warehouses') && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('Warehouse')}</label>
                                        <Select value={filters.warehouse_id} onValueChange={(value) => setFilters({...filters, warehouse_id: value})}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('Filter by warehouse')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {warehouses.map((warehouse) => (
                                                    <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                                        {warehouse.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Status')}</label>
                                <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by status')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">{t('Draft')}</SelectItem>
                                        <SelectItem value="posted">{t('Posted')}</SelectItem>
                                        <SelectItem value="paid">{t('Paid')}</SelectItem>
                                        <SelectItem value="overdue">{t('Overdue')}</SelectItem>
                                        <SelectItem value="cancelled">{t('Cancelled')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Date Range')}</label>
                                <DateRangePicker
                                    value={filters.date_range}
                                    onChange={(value) => setFilters({...filters, date_range: value})}
                                    placeholder={t('Select date range')}
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <Button onClick={handleFilter} size="sm">{t('Apply')}</Button>
                                <Button variant="outline" onClick={clearFilters} size="sm">{t('Clear')}</Button>
                            </div>
                        </div>
                    </CardContent>
                )}

                <CardContent className="p-0">
                    {viewMode === 'list' ? (
                        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                            <div className="min-w-[800px]">
                                <DataTable
                                    data={invoices.data}
                                    columns={tableColumns}
                                    onSort={handleSort}
                                    sortKey={sortField}
                                    sortDirection={sortDirection as 'asc' | 'desc'}
                                    className="rounded-none"
                                    emptyState={
                                        <NoRecordsFound
                                            icon={Receipt}
                                            title={t('No sales invoices found')}
                                            description={t('Get started by creating your first sales invoice.')}
                                            hasFilters={!!(filters.search || filters.customer_id || filters.status)}
                                            onClearFilters={clearFilters}
                                            createPermission="create-sales-invoices"
                                            onCreateClick={() => router.visit(route('sales-invoices.create'))}
                                            createButtonText={t('Create Sales Invoice')}
                                            className="h-auto"
                                        />
                                    }
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-auto max-h-[70vh] p-4">
                            {invoices.data.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                    {invoices.data.map((invoice) => (
                                        <Card key={invoice.id} className="border border-gray-200 flex flex-col">
                                            <div className="p-4 flex-1">
                                                <div className="flex items-center justify-between mb-3">
                                                    {auth.user?.permissions?.includes('view-sales-invoices') ? (
                                                        <h3 className="font-semibold text-base text-blue-600 hover:text-blue-700 cursor-pointer" onClick={() => router.get(route('sales-invoices.show', invoice.id))}>{invoice.invoice_number}</h3>
                                                    ) : (
                                                        <h3 className="font-semibold text-base text-gray-900">{invoice.invoice_number}</h3>
                                                    )}
                                                    <span className={getStatusBadgeClasses(invoice.status)}>
                                                        {t(invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1))}
                                                    </span>
                                                </div>

                                                <div className="space-y-3 mb-4">
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-600 mb-1">{t('Customer')}</p>
                                                        <p className="text-sm text-gray-900 truncate font-medium">{invoice.customer?.name}</p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <p className="text-xs font-medium text-gray-600 mb-1">{t('Invoice Date')}</p>
                                                            <p className="text-xs text-gray-900">{formatDate(invoice.invoice_date)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-medium text-gray-600 mb-1">{t('Due Date')}</p>
                                                            <p className={`text-xs ${invoice.display_status === 'overdue' ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                                                                {formatDate(invoice.due_date)}
                                                                {invoice.display_status === 'overdue' && (
                                                                    <span className="block text-red-600 font-medium">{t('Overdue')}</span>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="bg-gray-50 rounded-lg p-3">
                                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">{t('Subtotal')}:</span>
                                                                <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">{t('Tax')}:</span>
                                                                <span className="font-medium">{formatCurrency(invoice.tax_amount)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="border-t mt-2 pt-2">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm font-semibold text-gray-900">{t('Total Amount')}</span>
                                                                <span className="text-lg font-bold text-gray-900">{formatCurrency(invoice.total_amount)}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center mt-1">
                                                                <span className="text-xs text-gray-600">{t('Balance Due')}</span>
                                                                <span className="text-sm font-semibold text-blue-600">{formatCurrency(invoice.balance_amount)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                        </div>
                                            <div className="flex items-center justify-between p-3 border-t bg-gray-50/50">
                                             <div className="flex gap-1">
                                                    <TooltipProvider>
                                                        <SignatureButtons invoice={invoice} />
                                                        {auth.user?.permissions?.includes('print-sales-invoices') && (
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="sm" onClick={() => window.open(route('sales-invoices.print', invoice.id) + '?download=pdf', '_blank')} className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700">
                                                                        <Download className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent><p>{t('Download PDF')}</p></TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                        {auth.user?.permissions?.includes('view-sales-invoices') && (
                                                            <>
                                                                <Tooltip delayDuration={0}>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="sm" onClick={() => router.get(route('sales-invoices.show', invoice.id))} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                                                            <Eye className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent><p>{t('View')}</p></TooltipContent>
                                                                </Tooltip>
                                                                <Tooltip delayDuration={0}>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="sm" onClick={() => {
                                                                            const shareUrl = 'https://billing.dynime.com/' + invoice.invoice_number;
                                                                            navigator.clipboard.writeText(shareUrl);
                                                                            alert(t('Shareable link copied to clipboard!'));
                                                                        }} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                                                            <Share2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent><p>{t('Copy Public Share Link')}</p></TooltipContent>
                                                                </Tooltip>
                                                            </>
                                                        )}
                                                    </TooltipProvider>
                                                </div>
                                                <div className="flex gap-1">
                                                    <TooltipProvider>
                                                        <InvoiceActionButtons invoice={invoice} />
                                                        {invoice.status === 'draft' && (
                                                            <>
                                                                {auth.user?.permissions?.includes('post-sales-invoices') && (
                                                                    <Tooltip delayDuration={0}>
                                                                        <TooltipTrigger asChild>
                                                                            <Button variant="ghost" size="sm" onClick={() => router.post(route('sales-invoices.post', invoice.id))} className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700">
                                                                                <FileText className="h-4 w-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent><p>{t('Post invoice to finalize and create journal entries')}</p></TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                                {auth.user?.permissions?.includes('edit-sales-invoices') && (
                                                                    <Tooltip delayDuration={0}>
                                                                        <TooltipTrigger asChild>
                                                                            <Button variant="ghost" size="sm" onClick={() => router.visit(route('sales-invoices.edit', invoice.id))} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                                                                <EditIcon className="h-4 w-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent><p>{t('Edit')}</p></TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                                {auth.user?.permissions?.includes('delete-sales-invoices') && (
                                                                    <Tooltip delayDuration={0}>
                                                                        <TooltipTrigger asChild>
                                                                            <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(invoice.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent><p>{t('Delete')}</p></TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                            </>
                                                        )}
                                                    </TooltipProvider>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <NoRecordsFound
                                    icon={Receipt}
                                    title={t('No sales invoices found')}
                                    description={t('Get started by creating your first sales invoice.')}
                                    hasFilters={!!(filters.search || filters.customer_id || filters.status)}
                                    onClearFilters={clearFilters}
                                    createPermission="create-sales-invoices"
                                    onCreateClick={() => router.visit(route('sales-invoices.create'))}
                                    createButtonText={t('Create Sales Invoice')}
                                />
                            )}
                        </div>
                    )}
                </CardContent>

                <CardContent className="px-4 py-2 border-t bg-gray-50/30">
                    <Pagination
                        data={{...invoices, ...invoices.meta}}
                        routeName="sales-invoices.index"
                        filters={{...filters, per_page: perPage, view: viewMode}}
                    />
                </CardContent>
            </Card>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Sales Invoice')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                invoice={selectedInvoiceForPayment}
                onSuccess={() => {
                    router.reload();
                }}
            />
        </AuthenticatedLayout>
    );
}
