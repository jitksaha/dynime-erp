<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Workdo\Hrm\Models\AttendanceScreenshot;
use Carbon\Carbon;

class CleanupOldScreenshots extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'attendance:cleanup-screenshots';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically delete attendance screenshots older than 60 days from storage and database.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $cutoffDate = Carbon::now()->subDays(60);

        $oldScreenshots = AttendanceScreenshot::where('captured_at', '<', $cutoffDate)->get();
        $count = 0;

        foreach ($oldScreenshots as $screenshot) {
            if ($screenshot->screenshot_path && Storage::disk('public')->exists($screenshot->screenshot_path)) {
                Storage::disk('public')->delete($screenshot->screenshot_path);
            }
            $screenshot->delete();
            $count++;
        }

        $this->info("Successfully cleaned up {$count} attendance screenshots older than 60 days.");
        return 0;
    }
}
