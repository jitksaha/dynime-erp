<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $now = now();

        $permissions = [
            ["name" => "manage-agreement-builder", "label" => "Manage Agreement Builder"],
            ["name" => "manage-any-agreement-builder", "label" => "Manage All Agreement Builder"],
            ["name" => "manage-own-agreement-builder", "label" => "Manage Own Agreement Builder"],
            ["name" => "view-agreement-builder", "label" => "View Agreement Builder"],
            ["name" => "create-agreement-builder", "label" => "Create Agreement Builder"],
            ["name" => "edit-agreement-builder", "label" => "Edit Agreement Builder"],
            ["name" => "delete-agreement-builder", "label" => "Delete Agreement Builder"],
            ["name" => "send-agreement-builder", "label" => "Send Agreement Builder"],
            ["name" => "download-agreement-builder", "label" => "Download Agreement Builder"],
            ["name" => "duplicate-agreement-builder", "label" => "Duplicate Agreement Builder"],
        ];

        foreach ($permissions as $p) {
            DB::table("permissions")->updateOrInsert(
                ["name" => $p["name"], "guard_name" => "web"],
                [
                    "label" => $p["label"],
                    "add_on" => "Agreement Builder",
                    "module" => "Agreement Builder",
                    "created_at" => $now,
                    "updated_at" => $now,
                ]
            );
        }

        $permIds = DB::table("permissions")->where("add_on", "Agreement Builder")->pluck("id");
        $roles = DB::table("roles")->get();

        foreach ($roles as $role) {
            foreach ($permIds as $pId) {
                DB::table("role_has_permissions")->updateOrInsert([
                    "permission_id" => $pId,
                    "role_id" => $role->id
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $permIds = DB::table("permissions")->where("add_on", "Agreement Builder")->pluck("id");
        DB::table("role_has_permissions")->whereIn("permission_id", $permIds)->delete();
        DB::table("permissions")->where("add_on", "Agreement Builder")->delete();
    }
};
