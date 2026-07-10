import { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Trash2, Eye, FileText, Calendar } from "lucide-react";
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Pagination } from "@/components/ui/pagination";
import NoRecordsFound from '@/components/no-records-found';

interface IssuedDocument {
    id: number;
    employee_id: number;
    document_type: string;
    payload: any;
    issued_date: string;
    employee?: {
        user?: {
            name: string;
        }
    };
}

interface HistoryProps {
    history: {
        data: IssuedDocument[];
        links: any[];
        meta: any;
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
    };
}

export default function History({ history }: HistoryProps) {
    const { t } = useTranslation();

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'hrm.document-builder.destroy',
        defaultMessage: t('Are you sure you want to delete this document from history?')
    });

    const getDocumentName = (type: string) => {
        switch (type) {
            case 'offer_letter':
                return t('Offer Letter');
            case 'employment_agreement':
                return t('Employment Agreement');
            case 'payslip':
                return t('Payslip');
            case 'experience_letter':
                return t('Experience Letter');
            case 'relieving_letter':
                return t('Relieving Letter');
            default:
                return type;
        }
    };

    const tableColumns = [
        {
            key: 'employee',
            label: t('Employee'),
            render: (row: IssuedDocument) => row.employee?.user?.name || t('N/A')
        },
        {
            key: 'document_type',
            label: t('Document Type'),
            render: (row: IssuedDocument) => getDocumentName(row.document_type)
        },
        {
            key: 'issued_date',
            label: t('Issued Date'),
            render: (row: IssuedDocument) => new Date(row.issued_date).toLocaleDateString()
        },
        {
            key: 'actions',
            label: t('Actions'),
            render: (row: IssuedDocument) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            // Prepopulate builder workspace with saved data
                            router.visit(route('hrm.document-builder.index'), {
                                data: {
                                    employee_id: row.employee_id,
                                    document_type: row.document_type,
                                    payload: row.payload,
                                    issued_date: row.issued_date
                                }
                            });
                        }}
                    >
                        <Eye className="h-4 w-4 text-gray-500 hover:text-gray-900" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(row.id)}
                    >
                        <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[{ label: t('HRM'), href: route('hrm.index') }, { label: t('Documents History') }]}
            pageTitle={t('Issued Documents History')}
        >
            <Head title={t('Documents History')} />

            <Card className="border border-gray-200 shadow-sm rounded-xl">
                <CardContent className="pt-6">
                    {history.data.length > 0 ? (
                        <div className="space-y-4">
                            <DataTable
                                data={history.data}
                                columns={tableColumns}
                            />
                            {history.total > history.data.length && (
                                <div className="mt-4 flex justify-end">
                                    <Pagination links={history.links} />
                                </div>
                            )}
                        </div>
                    ) : (
                        <NoRecordsFound
                            icon={FileText}
                            title={t('No documents found')}
                            description={t('Generate and save documents using the Document Builder to see history here.')}
                        />
                    )}
                </CardContent>
            </Card>

            <ConfirmationDialog
                isOpen={deleteState.isOpen}
                onClose={closeDeleteDialog}
                onConfirm={confirmDelete}
                title={t('Delete Document')}
                message={deleteState.message}
            />
        </AuthenticatedLayout>
    );
}
