import React from 'react';
import PublicView from './PublicView';
import { SalesInvoice } from './types';

interface PrintProps {
    invoice: SalesInvoice;
    companySettings?: any;
    paymentGateways?: any;
    [key: string]: any;
}

export default function Print(props: PrintProps) {
    const defaultCompanySettings = props.companySettings || {
        company_name: 'Dynime Inc.',
        company_address: '1209 Mountain Road Pl Ne Ste R',
        company_city: 'Albuquerque',
        company_state: 'NM',
        company_zipcode: '87110',
        company_country: 'USA',
        company_logo: 'https://cdn.dynime.com/media/KVhzkR7rCJFuzFxBU8ljBqFb2PItfQM5i3omxMNF.png',
    };

    return (
        <PublicView
            invoice={props.invoice}
            companySettings={defaultCompanySettings}
            paymentGateways={props.paymentGateways || { active_gateways: [] }}
            autoDownloadPdf={true}
        />
    );
}
