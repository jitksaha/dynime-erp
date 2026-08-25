import { FileCheck } from 'lucide-react';

declare global {
    function route(name: string): string;
}

export const quotationCompanyMenu = (t: (key: string) => string) => [];