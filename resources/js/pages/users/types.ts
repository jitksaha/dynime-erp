import { PaginatedData, ModalState, AuthContext, CreateProps, EditProps } from '@/types/common';

export interface User {
    id: number;
    name: string;
    email: string;
    mobile_no: string;
    role: string;
    type: string;
    is_enable_login: boolean;
    is_disable?: number;
    avatar?: string;
    is_verified?: boolean;
    official_email?: string;
    created_at: string;
    roles?: Array<{ id: number; name: string; label?: string }>;
}

export interface CreateUserFormData {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    mobile_no: string;
    type: string;
    roles?: string[];
    is_enable_login: boolean;
    avatar?: string | null;
}

export interface EditUserFormData {
    name: string;
    email: string;
    mobile_no: string;
    type?: string;
    roles?: string[];
    is_enable_login: boolean;
    avatar?: string | null;
}

export interface ChangePasswordFormData {
    password: string;
    password_confirmation: string;
}

export interface CreateUserProps extends CreateProps {
    roles?: Record<string, string>;
    allRoles?: Array<{ id: number; name: string; label?: string }>;
}

export interface EditUserProps {
    user: User;
    onSuccess: () => void;
    roles?: Record<string, string>;
    allRoles?: Array<{ id: number; name: string; label?: string }>;
}

export interface ChangePasswordProps {
    user: User;
    onSuccess: () => void;
}

export interface UserFilters {
    name: string;
    email: string;
    role: string;
    is_enable_login: string;
}

export type PaginatedUsers = PaginatedData<User>;
export interface UserModalState {
    isOpen: boolean;
    mode: '' | 'add' | 'edit' | 'change-password';
    data: User | null;
}

export interface UsersIndexProps {
    users: PaginatedUsers;
    roles: Record<string, string>;
    auth: AuthContext;
    [key: string]: unknown;
}

export interface UserFormErrors {
    name?: string;
    email?: string;
    password?: string;
    password_confirmation?: string;
    mobile_no?: string;
    type?: string;
    is_enable_login?: string;
}