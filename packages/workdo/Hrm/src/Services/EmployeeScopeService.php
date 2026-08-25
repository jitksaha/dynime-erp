<?php

namespace Workdo\Hrm\Services;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Workdo\Hrm\Models\Employee;

class EmployeeScopeService
{
    /**
     * Get accessible employee IDs based on user roles, branches, departments, and reporting hierarchy.
     * Returns NULL if user has global unrestricted access.
     */
    public static function getAccessibleEmployeeIds(User $user): ?array
    {
        // 1. Super Admin & Company Workspace Owner -> Unrestricted Global Access
        if (
            $user->type === 'superadmin' ||
            $user->type === 'company' ||
            $user->hasRole('super admin') ||
            $user->hasRole('company') ||
            $user->can('manage-all-employees') ||
            $user->can('manage-any-employees')
        ) {
            return null; // Null means no filtering (All Employees)
        }

        // 2. Fetch Employee Profile
        $employee = $user->employee;
        if (!$employee) {
            return []; // No employee record bound
        }

        $accessibleIds = [];

        // Always include self
        $accessibleIds[] = $employee->id;

        // 3. Global HR / Admin Roles
        if (
            $user->hasRole('Global HR') ||
            $user->hasRole('HR Admin') ||
            $user->hasRole('Admin')
        ) {
            return null;
        }

        // 4. Regional HR / Area Manager Scope (Branch & Additional Branches)
        if ($user->hasRole('Regional HR') || $user->hasRole('Area Manager')) {
            $branches = array_filter(array_merge(
                [$employee->branch_id],
                is_array($employee->additional_branch_ids) ? $employee->additional_branch_ids : []
            ));

            if (!empty($branches)) {
                $regionalEmpIds = Employee::whereIn('branch_id', $branches)->pluck('id')->toArray();
                $accessibleIds = array_merge($accessibleIds, $regionalEmpIds);
            }
        }

        // 5. Department Lead Scope
        if ($user->hasRole('Department Lead') || $user->hasRole('Department Manager')) {
            if ($employee->department_id) {
                $deptEmpIds = Employee::where('department_id', $employee->department_id)->pluck('id')->toArray();
                $accessibleIds = array_merge($accessibleIds, $deptEmpIds);
            }
        }

        // 6. Direct & Indirect Reporting Hierarchy Scope (Subordinates)
        if ($user->hasRole('Manager') || $user->hasRole('Team Lead') || $user->hasRole('HR') || $user->hasRole('staff') || $user->hasRole('Employee')) {
            $subordinateIds = self::getRecursiveSubordinateIds($employee->id);
            $accessibleIds = array_merge($accessibleIds, $subordinateIds);
        }

        return array_values(array_unique($accessibleIds));
    }

    /**
     * Apply contextual RBAC scope to an Eloquent query builder.
     */
    public static function applyEmployeeScope(Builder $query, User $user, string $employeeIdColumn = 'id'): Builder
    {
        $accessibleIds = self::getAccessibleEmployeeIds($user);

        if ($accessibleIds === null) {
            return $query; // Unrestricted access
        }

        return $query->whereIn($employeeIdColumn, $accessibleIds);
    }

    /**
     * Recursively fetch all subordinate employee IDs under a manager.
     */
    public static function getRecursiveSubordinateIds(int $managerEmployeeId): array
    {
        $subordinateIds = Employee::where('manager_id', $managerEmployeeId)->pluck('id')->toArray();

        foreach ($subordinateIds as $subId) {
            $indirectSubIds = self::getRecursiveSubordinateIds($subId);
            $subordinateIds = array_merge($subordinateIds, $indirectSubIds);
        }

        return array_values(array_unique($subordinateIds));
    }
}
