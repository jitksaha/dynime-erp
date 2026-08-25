import { LayoutGrid, Users, Warehouse, ArrowRightLeft, Package, Tag, Tags, Shield, Settings, Image, CreditCard, Headphones, ShoppingCart, Kanban, Calendar, MessageCircle, Replace, Receipt, Star, FileText } from 'lucide-react';
import { NavItem } from '@/types';

const safeRoute = (name: string, fallback: string = '#') => {
    try {
        if (typeof route === 'function') {
            return route(name);
        }
    } catch (e) {
        console.warn(`Route "${name}" not found in Ziggy:`, e);
    }
    return fallback;
};

export const getCompanyMenu = (t: (key: string) => string): NavItem[] => [
    {
        title: t('Dashboard'),
        icon: LayoutGrid,
        permission: 'manage-dashboard',
        name: 'dashboard',
        href: safeRoute('dashboard', '/dashboard'),
        order: 1,
    },
    {
        title: t('User Management'),
        icon: Users,
        permission: 'manage-users',
        order: 10,
        children: [
            {
                title: t('Roles'),
                href: safeRoute('roles.index', '/roles'),
                permission: 'manage-roles',
            },
            {
                title: t('Users'),
                href: safeRoute('users.index', '/users'),
                permission: 'manage-users',
            },
        ],
    },
    {
        title: t('Document Builder'),
        icon: FileText,
        permission: 'manage-agreement-builder|view-agreement-builder|create-agreement-builder|edit-agreement-builder|manage-sales-proposals|manage-quotations',
        order: 21,
        children: [
            {
                title: t('Proposal'),
                href: safeRoute('agreement-builder.index', '/agreement-builder') + '?type=proposal',
                permission: 'manage-sales-proposals|manage-agreement-builder|view-agreement-builder',
            },
            {
                title: t('Quotation'),
                href: safeRoute('quotations.index', '/quotations'),
                permission: 'manage-quotations|manage-agreement-builder|view-agreement-builder',
            },
            {
                title: t('Agreement'),
                href: safeRoute('agreement-builder.index', '/agreement-builder'),
                permission: 'manage-agreement-builder|view-agreement-builder|create-agreement-builder|edit-agreement-builder',
            },
            {
                title: t('Notice'),
                href: safeRoute('agreement-builder.index', '/agreement-builder') + '?type=notice',
                permission: 'manage-agreement-builder|view-agreement-builder|create-agreement-builder|edit-agreement-builder',
            },
        ],
    },
    {
        title: t('Sales Invoice'),
        icon: Receipt,
        permission: 'manage-sales-invoices',
        order: 35,
        children: [
            {
                title: t('Sales Invoice'),
                href: safeRoute('sales-invoices.index', '/sales-invoices'),
                permission: 'manage-sales-invoices',
            },
            {
                title: t('Sales Invoice Returns'),
                href: safeRoute('sales-returns.index', '/sales-returns'),
                permission: 'manage-sales-return-invoices',
            },
        ],
    },
    {
        title: t('Purchase'),
        icon: ShoppingCart,
        permission: 'manage-purchase-invoices',
        order: 40,
        children: [
            {
                title: t('Purchase Invoice'),
                href: safeRoute('purchase-invoices.index', '/purchase-invoices'),
                permission: 'manage-purchase-invoices',
            },
            {
                title: t('Purchase Returns'),
                href: safeRoute('purchase-returns.index', '/purchase-returns'),
                permission: 'manage-purchase-return-invoices',
            },
            {
                title: t('Warehouses'),
                href: safeRoute('warehouses.index', '/warehouses'),
                permission: 'manage-warehouses',
            },
            {
                title: t('Transfers'),
                href: safeRoute('transfers.index', '/transfers'),
                permission: 'manage-transfers',
            },
        ],
    },
    {
        title: t('Media Library'),
        href: safeRoute('media-library', '/media-library'),
        icon: Image,
        permission: 'manage-media',
        order: 2900,
    },
    {
        title: t('Messenger'),
        href: safeRoute('messenger.index', '/messenger'),
        icon: MessageCircle,
        permission: 'manage-messenger',
        order: 2940,
    },
    {
        title: t('Helpdesk'),
        href: safeRoute('helpdesk-tickets.index', '/helpdesk-tickets'),
        icon: Headphones,
        permission: 'manage-helpdesk-tickets',
        order: 2950,
    },
    {
        title: t('Reviews'),
        href: safeRoute('reviews.index', '/reviews'),
        icon: Star,
        order: 2960,
    },
    {
        title: t('Coupons'),
        href: safeRoute('coupons.index', '/coupons'),
        icon: Tag,
        permission: 'manage-coupons',
        order: 2970,
    },
    {
        title: t('Settings'),
        href: safeRoute('settings.index', '/settings'),
        icon: Settings,
        permission: 'manage-settings',
        order: 3000,
    },
];
