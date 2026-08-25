import { PaginatedData, ModalState, AuthContext } from '@/types/common';

export interface User {
    id: number;
    name: string;
}

export interface ShiftRule {
    id?: number;
    shift_id?: number;
    grace_period_mins: number;
    early_clock_in_mins: number;
    late_clock_out_mins: number;
    min_working_hours: number;
    max_working_hours: number;
    half_day_threshold_hours: number;
    absent_threshold_hours: number;
    auto_mark_late: boolean;
    auto_mark_early_leave: boolean;
}

export interface ShiftBreak {
    id?: number;
    shift_id?: number;
    break_name: string;
    break_type: 'paid' | 'unpaid';
    start_time?: string | null;
    end_time?: string | null;
    duration_mins: number;
}

export interface ShiftAssignment {
    id?: number;
    shift_id?: number;
    assignee_type: 'employee' | 'department' | 'team' | 'role' | 'country';
    assignee_id: string;
}

export interface OvertimeRule {
    id?: number;
    shift_id?: number;
    enable_ot: boolean;
    ot_starts_after_hours: number;
    max_ot_hours: number;
    approval_required: boolean;
    ot_multiplier: number;
}

export interface Shift {
    id: number;
    shift_name: string;
    shift_code: string;
    shift_type: 'fixed' | 'flexible' | 'rotational' | 'split' | 'on_call' | 'weekend' | 'night';
    description?: string | null;
    is_active: boolean;
    country: string;
    region?: string | null;
    timezone: string;
    start_time?: string | null;
    end_time?: string | null;
    is_night_shift: boolean;
    is_cross_midnight: boolean;
    total_shift_hours: number;
    net_working_hours: number;
    required_working_hours?: number | null;
    earliest_start_time?: string | null;
    latest_start_time?: string | null;
    latest_finish_time?: string | null;
    on_call_standby_allowance?: number | null;
    on_call_response_time_mins?: number | null;
    creator_id: number;
    created_by?: string;
    creator?: User;
    rules?: ShiftRule;
    breaks?: ShiftBreak[];
    assignments?: ShiftAssignment[];
    overtime_rule?: OvertimeRule;
    assigned_employees_count?: number;
    created_at: string;
}

export interface ShiftFormData {
    shift_name: string;
    shift_code: string;
    shift_type: 'fixed' | 'flexible' | 'rotational' | 'split' | 'on_call' | 'weekend' | 'night';
    description: string;
    is_active: boolean;
    country: string;
    region: string;
    timezone: string;
    start_time: string;
    end_time: string;
    required_working_hours: number;
    earliest_start_time: string;
    latest_start_time: string;
    latest_finish_time: string;
    on_call_standby_allowance: number;
    on_call_response_time_mins: number;
    rules: ShiftRule;
    breaks: ShiftBreak[];
    overtime: OvertimeRule;
    assignments: {
        assignee_type: 'employee' | 'department' | 'team' | 'role' | 'country';
        assignee_ids: string[];
    };
}

export interface ShiftFilters {
    search: string;
    shift_name: string;
    shift_type: string;
    country: string;
    is_active: string;
    created_by: string;
    creator_id: string;
}

export type PaginatedShifts = PaginatedData<Shift>;
export type ShiftModalState = ModalState<Shift>;

export interface TimezoneInfo {
    iana: string;
    label: string;
    utc_offset: string;
    abbreviation: string;
    local_time: string;
    local_date: string;
}

export interface ShiftsIndexProps {
    shifts: PaginatedShifts;
    auth: AuthContext;
    users: any[];
    timezones: Record<string, string>;
    timezone_info: Record<string, TimezoneInfo>;
    employees: any[];
    departments: any[];
    [key: string]: unknown;
}