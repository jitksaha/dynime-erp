import paramiko

def run_remote_email_test():
    host = "5.183.10.149"
    port = 65002
    username = "u740731947"
    password = "Pixel#@!194JkS"
    remote_base = "domains/app.dynime.com/public_html"

    print("Connecting to Hostinger SSH...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, port=port, username=username, password=password)

    php_script = """<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\\Contracts\\Console\\Kernel::class);
$kernel->bootstrap();

use Workdo\\Hrm\\Models\\Employee;
use App\\Mail\\ShiftReminderMail;
use App\\Services\\MailConfigService;
use Illuminate\\Support\\Facades\\Mail;
use Carbon\\Carbon;
use Illuminate\\Support\\Facades\\Storage;

$employee = Employee::where('employee_id', 'EMP20260001')
    ->orWhere('employee_id', 'like', '%EMP20260001%')
    ->orWhere('id', 1)
    ->first();

if (!$employee) {
    $employee = Employee::first();
}

if ($employee) {
    $user = $employee->user ?? App\\Models\\User::find($employee->user_id) ?? App\\Models\\User::first();
    $creatorId = $employee->created_by ?? ($user->created_by ?? 1);

    if (class_exists(MailConfigService::class)) {
        MailConfigService::setDynamicConfig($creatorId);
    }
    
    $empTimezone = $employee->effective_timezone ?? 'Asia/Dhaka';
    try {
        $nowEmp = Carbon::now($empTimezone);
    } catch (\\Exception $e) {
        $nowEmp = Carbon::now('Asia/Dhaka');
    }

    $nowComp = Carbon::now('America/Denver');
    $nowUtc = Carbon::now('UTC');

    $shiftStart = $nowEmp->copy()->setTime(9, 0, 0);
    $shiftStartUtc = $shiftStart->copy()->setTimezone('UTC')->format('h:i A');
    $shiftEndUtc = $nowEmp->copy()->setTime(18, 0, 0)->setTimezone('UTC')->format('h:i A');

    $userAvatarUrl = '';
    if (!empty($user->avatar)) {
        if (str_starts_with($user->avatar, 'http://') || str_starts_with($user->avatar, 'https://')) {
            $userAvatarUrl = $user->avatar;
        } else {
            $userAvatarUrl = 'https://app.dynime.com/storage/' . ltrim($user->avatar, '/');
        }
    }

    $officialEmail = !empty($employee->official_email) ? $employee->official_email : $user->email;

    // Send Email 1: 30 Minutes Before Shift Start
    $emailData30 = [
        'headline' => 'Working Time Starting in 30 Minutes',
        'messageText' => 'Your daily working shift starts in 30 minutes (at 09:00 AM ' . $nowEmp->format('T') . '). Please log in to Dtime Trace app or your ERP portal to get ready.',
        'userName' => $user->name,
        'employeeId' => $employee->employee_id ?? ('EMP-' . $user->id),
        'designation' => $employee->designation?->name ?? 'Staff Member',
        'officialEmail' => $officialEmail,
        'userAvatar' => $userAvatarUrl,
        'compTime' => $nowComp->format('h:i:s A'),
        'utcTime' => $nowUtc->format('h:i:s A'),
        'shiftUtc' => "{$shiftStartUtc} – {$shiftEndUtc}",
        'empTime' => $nowEmp->format('h:i:s A'),
        'empTimezone' => $empTimezone,
        'country' => $employee->country ?? $employee->work_location_country ?? 'Bangladesh',
        'offDaysText' => 'Sun',
    ];

    $mail30 = Mail::to($user->email);
    if (!empty($officialEmail) && strtolower(trim($officialEmail)) !== strtolower(trim($user->email))) {
        $mail30->cc($officialEmail);
    }
    $mail30->send(new ShiftReminderMail($emailData30));
    echo "SUCCESS: 30-min reminder email sent for Employee ID {$employee->employee_id} ({$user->name}) to {$user->email} (CC: {$officialEmail})\\n";

    // Send Email 2: Instant Shift Start
    $emailDataStart = array_merge($emailData30, [
        'headline' => 'Shift Started - Time to Clock In',
        'messageText' => 'Your working time has officially started! Click the button below to clock in now on Dtime Trace client app.',
    ]);

    $mailStart = Mail::to($user->email);
    if (!empty($officialEmail) && strtolower(trim($officialEmail)) !== strtolower(trim($user->email))) {
        $mailStart->cc($officialEmail);
    }
    $mailStart->send(new ShiftReminderMail($emailDataStart));
    echo "SUCCESS: Shift Start email sent for Employee ID {$employee->employee_id} ({$user->name}) to {$user->email} (CC: {$officialEmail})\\n";
} else {
    echo "ERROR: No employee found.\\n";
}
"""

    sftp = ssh.open_sftp()
    remote_script_path = f"{remote_base}/send_test_email.php"
    with sftp.file(remote_script_path, "w") as f:
        f.write(php_script)
    sftp.chmod(remote_script_path, 0o644)
    sftp.close()

    print("Executing PHP test script on Hostinger server...")
    cmd = f"php ~/{remote_script_path}"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode()
    err = stderr.read().decode()

    print("=== TEST OUTPUT ===")
    print(out)
    if err:
        print("=== TEST ERRORS ===")
        print(err)

    ssh.close()

if __name__ == '__main__':
    run_remote_email_test()
