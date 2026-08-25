<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. Upgrade `shifts` table with Enterprise Global fields
        Schema::table('shifts', function (Blueprint $table) {
            if (!Schema::hasColumn('shifts', 'shift_code')) {
                $table->string('shift_code')->nullable()->after('shift_name');
            }
            if (!Schema::hasColumn('shifts', 'shift_type')) {
                $table->string('shift_type')->default('fixed')->after('shift_code'); // fixed, flexible, rotational, split, on_call, weekend, night
            }
            if (!Schema::hasColumn('shifts', 'description')) {
                $table->text('description')->nullable()->after('shift_type');
            }
            if (!Schema::hasColumn('shifts', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('description');
            }
            if (!Schema::hasColumn('shifts', 'country')) {
                $table->string('country')->nullable()->after('is_active');
            }
            if (!Schema::hasColumn('shifts', 'region')) {
                $table->string('region')->nullable()->after('country');
            }
            if (!Schema::hasColumn('shifts', 'timezone')) {
                $table->string('timezone')->default('America/Denver')->after('region'); // IANA format (e.g. America/New_York)
            }
            if (!Schema::hasColumn('shifts', 'is_cross_midnight')) {
                $table->boolean('is_cross_midnight')->default(false)->after('is_night_shift');
            }
            if (!Schema::hasColumn('shifts', 'total_shift_hours')) {
                $table->decimal('total_shift_hours', 5, 2)->default(8.00)->after('is_cross_midnight');
            }
            if (!Schema::hasColumn('shifts', 'net_working_hours')) {
                $table->decimal('net_working_hours', 5, 2)->default(8.00)->after('total_shift_hours');
            }
            // Flexible shift params
            if (!Schema::hasColumn('shifts', 'required_working_hours')) {
                $table->decimal('required_working_hours', 5, 2)->nullable()->after('net_working_hours');
            }
            if (!Schema::hasColumn('shifts', 'earliest_start_time')) {
                $table->time('earliest_start_time')->nullable()->after('required_working_hours');
            }
            if (!Schema::hasColumn('shifts', 'latest_start_time')) {
                $table->time('latest_start_time')->nullable()->after('earliest_start_time');
            }
            if (!Schema::hasColumn('shifts', 'latest_finish_time')) {
                $table->time('latest_finish_time')->nullable()->after('latest_start_time');
            }
            // Split & On-Call params
            if (!Schema::hasColumn('shifts', 'split_segments')) {
                $table->json('split_segments')->nullable()->after('latest_finish_time');
            }
            if (!Schema::hasColumn('shifts', 'on_call_standby_allowance')) {
                $table->decimal('on_call_standby_allowance', 10, 2)->nullable()->after('split_segments');
            }
            if (!Schema::hasColumn('shifts', 'on_call_response_time_mins')) {
                $table->integer('on_call_response_time_mins')->nullable()->after('on_call_standby_allowance');
            }
        });

        // 2. Create `shift_rules` table
        if (!Schema::hasTable('shift_rules')) {
            Schema::create('shift_rules', function (Blueprint $table) {
                $table->id();
                $table->foreignId('shift_id')->constrained('shifts')->onDelete('cascade');
                $table->integer('grace_period_mins')->default(10);
                $table->integer('early_clock_in_mins')->default(30);
                $table->integer('late_clock_out_mins')->default(120);
                $table->decimal('min_working_hours', 5, 2)->default(4.00);
                $table->decimal('max_working_hours', 5, 2)->default(12.00);
                $table->decimal('half_day_threshold_hours', 5, 2)->default(4.00);
                $table->decimal('absent_threshold_hours', 5, 2)->default(2.00);
                $table->boolean('auto_mark_late')->default(true);
                $table->boolean('auto_mark_early_leave')->default(true);
                $table->timestamps();
            });
        }

        // 3. Create `shift_breaks` table
        if (!Schema::hasTable('shift_breaks')) {
            Schema::create('shift_breaks', function (Blueprint $table) {
                $table->id();
                $table->foreignId('shift_id')->constrained('shifts')->onDelete('cascade');
                $table->string('break_name')->default('Lunch Break');
                $table->string('break_type')->default('unpaid'); // paid, unpaid
                $table->time('start_time')->nullable();
                $table->time('end_time')->nullable();
                $table->integer('duration_mins')->default(60);
                $table->timestamps();
            });
        }

        // 4. Create `shift_assignments` table
        if (!Schema::hasTable('shift_assignments')) {
            Schema::create('shift_assignments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('shift_id')->constrained('shifts')->onDelete('cascade');
                $table->string('assignee_type'); // employee, department, team, country, office, role, employment_type
                $table->string('assignee_id');
                $table->date('effective_from')->nullable();
                $table->date('effective_to')->nullable();
                $table->foreignId('created_by')->nullable()->index();
                $table->timestamps();
            });
        }

        // 5. Create `overtime_rules` table
        if (!Schema::hasTable('overtime_rules')) {
            Schema::create('overtime_rules', function (Blueprint $table) {
                $table->id();
                $table->foreignId('shift_id')->constrained('shifts')->onDelete('cascade');
                $table->boolean('enable_ot')->default(true);
                $table->decimal('ot_starts_after_hours', 5, 2)->default(8.00);
                $table->decimal('max_ot_hours', 5, 2)->default(4.00);
                $table->boolean('approval_required')->default(true);
                $table->decimal('ot_multiplier', 4, 2)->default(1.50);
                $table->timestamps();
            });
        }

        // 6. Create `shift_rotations` table
        if (!Schema::hasTable('shift_rotations')) {
            Schema::create('shift_rotations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('shift_id')->constrained('shifts')->onDelete('cascade');
                $table->string('rotation_type')->default('weekly'); // weekly, monthly, custom
                $table->json('sequence_pattern')->nullable();
                $table->integer('cycle_days')->default(7);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('shift_rotations');
        Schema::dropIfExists('overtime_rules');
        Schema::dropIfExists('shift_assignments');
        Schema::dropIfExists('shift_breaks');
        Schema::dropIfExists('shift_rules');
    }
};
