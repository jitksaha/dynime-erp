import { LayoutGrid, Users, Warehouse, ArrowRightLeft, Package, Tag, Tags, Shield, Settings, Image, CreditCard, Headphones, ShoppingCart, Kanban, Calendar, MessageCircle, Replace, Receipt, Star, FileText } from 'lucide-react';
import { NavItem } from '@/types';

export const getCompanyMenu = (t: (key: string) => string): NavItem[] => [
    {
        title: t('Dashboard'),
        icon: LayoutGrid,
        permission: 'manage-dashboard',
        name: 'dashboard',
        href: route('dashboard'),
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
                href: route('roles.index'),
                permission: 'manage-roles',
            },
            {
                title: t('Users'),
                href: route('users.index'),
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
                href: route('agreement-builder.index') + '?type=proposal',
                permission: 'manage-sales-proposals|manage-agreement-builder|view-agreement-builder',
            },
            {
                title: t('Quotation'),
                href: route('quotations.index'),
                permission: 'manage-quotations|manage-agreement-builder|view-agreement-builder',
            },
            {
                title: t('Agreement'),
                href: route('agreement-builder.index'),
                permission: 'manage-agreement-builder|view-agreement-builder|create-agreement-builder|edit-agreement-builder',
            },
            {
                title: t('Notice'),
                href: route('agreement-builder.index') + '?type=notice',
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
                href: route('sales-invoices.index'),
                permission: 'manage-sales-invoices',
            },
            {
                title: t('Sales Invoice Returns'),
                href: route('sales-returns.index'),
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
                href: route('purchase-invoices.index'),
                permission: 'manage-purchase-invoices',
            },
            {
                title: t('Purchase Returns'),
                href: route('purchase-returns.index'),
                permission: 'manage-purchase-return-invoices',
            },
            {
                title: t('Warehouses'),
                href: route('warehouses.index'),
                permission: 'manage-warehouses',
            },
            {
                title: t('Transfers'),
                href: route('transfers.index'),
                permission: 'manage-transfers',
            },
        ],
    },
    {
        title: t('Media Library'),
        href: route('media-library'),
        icon: Image,
        permission: 'manage-media',
        order: 2900,
    },
    {
        title: t('Messenger'),
        href: route('messenger.index'),
        icon: MessageCircle,
        permission: 'manage-messenger',
        order: 2940,
    },
    {
        title: t('Helpdesk'),
        href: route('helpdesk-tickets.index'),
        icon: Headphones,
        permission: 'manage-helpdesk-tickets',
        order: 2950,
    },
    {
        title: t('Reviews'),
        href: route('reviews.index'),
        icon: Star,
        order: 2960,
    },
    {
        title: t('Coupons'),
        href: route('coupons.index'),
        icon: Tag,
        permission: 'manage-coupons',
        order: 2970,
    },
    {
        title: t('Settings'),
        href: route('settings.index'),
        icon: Settings,
        permission: 'manage-settings',
        order: 3000,
    },
];
