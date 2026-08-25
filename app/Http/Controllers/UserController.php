<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\LoginHistory;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Requests\ChangePasswordRequest;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Events\CreateUser;
use App\Models\EmailTemplate;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Session;

class UserController extends Controller
{
    public function index()
    {
        if(Auth::user()->can('manage-users')){
            $users = User::query()
                ->with('roles')
                ->leftJoin('employees', 'users.id', '=', 'employees.user_id')
                ->where(function($q) {
                    if(Auth::user()->can('manage-any-users')) {
                        $q->where('users.created_by', creatorId());
                    } elseif(Auth::user()->can('manage-own-users')) {
                        $q->where('users.creator_id', Auth::id());
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                })
                ->when(request('name'), fn($q) => $q->where('users.name', 'like', '%' . request('name') . '%'))
                ->when(request('email'), fn($q) => $q->where(function($sub) {
                    $sub->where('users.email', 'like', '%' . request('email') . '%')
                        ->orWhere('employees.official_email', 'like', '%' . request('email') . '%');
                }))
                ->when(request('role'), function($q) {
                    $roleVal = request('role');
                    return $q->where(function($sub) use ($roleVal) {
                        $sub->whereHas('roles', function($rQ) use ($roleVal) {
                            if (is_numeric($roleVal)) {
                                $rQ->where('roles.id', $roleVal);
                            } else {
                                $rQ->where('roles.name', $roleVal)->orWhere('roles.label', $roleVal);
                            }
                        });
                        if (is_numeric($roleVal)) {
                            $roleObj = \Spatie\Permission\Models\Role::find($roleVal);
                            if ($roleObj) {
                                $sub->orWhere('users.type', $roleObj->name);
                                if ($roleObj->name === 'staff') {
                                    $sub->orWhere('users.type', 'employee');
                                }
                            }
                        } else {
                            $sub->orWhere('users.type', $roleVal);
                            if (in_array(strtolower($roleVal), ['employee', 'staff'])) {
                                $sub->orWhereIn('users.type', ['staff', 'employee']);
                            }
                        }
                    });
                })
                ->when(request('is_enable_login') !== null, fn($q) => $q->where('users.is_enable_login', request('is_enable_login')))
                ->when(request('sort'), function($q) {
                    $allowedSorts = ['id', 'name', 'email', 'created_at', 'is_enable_login'];
                    $sort = in_array(request('sort'), $allowedSorts, true) ? request('sort') : 'id';
                    $direction = in_array(strtolower(request('direction', 'asc')), ['asc', 'desc'], true) ? strtolower(request('direction', 'asc')) : 'asc';
                    return $q->orderBy('users.' . $sort, $direction);
                }, function($q) {
                    if (config('app.is_demo', false) && Auth::user()->type === 'superadmin') {
                        return $q->orderBy('users.id', 'asc');
                    }
                    return $q->orderBy('users.id', 'desc');
                })
                ->select('users.*', 'employees.official_email')
                ->paginate(request('per_page', 10))
                ->withQueryString();

            $roles = Role::where('created_by', creatorId())->pluck('label', 'id');
            $allRoles = Role::where('created_by', creatorId())
                ->get()
                ->map(fn($r) => [
                    'id' => $r->id,
                    'name' => $r->name,
                    'label' => $r->label ?? $r->name,
                ]);

            return Inertia::render('users/index', [
                'users' => $users,
                'roles' => $roles,
                'allRoles' => $allRoles,
            ]);
        }
        else{
            return back()->with('error', __('Permission denied'));
        }
    }

    public function store(StoreUserRequest $request)
    {
        if(Auth::user()->can('create-users')){
            $checkUser = canCreateUser();
            if (!$checkUser['can_create']) {
                return redirect()->route('users.index')->with('error', $checkUser['message']);
            }

            $validated = $request->validated();
            $validated['is_enable_login'] = $request->boolean('is_enable_login', true);

            $role = Role::find($validated['type']);
            $enableEmailVerification = admin_setting('enableEmailVerification');

            $user = new User();
            $user->name = $validated['name'];
            $user->email = $validated['email'];
            $user->mobile_no = $validated['mobile_no'];
            $user->password = Hash::make($validated['password']);
            $user->type = Auth::user()->type == 'superadmin' ? 'company' : ($role->name ?? 'staff');
            $user->is_enable_login = $validated['is_enable_login'];
            $user->lang = company_setting('defaultLanguage') ?? 'en';
            $user->email_verified_at = $enableEmailVerification === 'on' ? null : now();
            $user->creator_id = Auth::id();
            $user->created_by = creatorId();
            $user->save();

            // Handle avatar
            if ($request->hasFile('avatar')) {
                $file = $request->file('avatar');
                $filename = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
                $extension = $file->getClientOriginalExtension();
                $fileNameToStore = 'avatar_' . time() . '.' . $extension;
                
                $upload = upload_file($request, 'avatar', $fileNameToStore, 'avatars');
                if (isset($upload['flag']) && $upload['flag'] == 1 && isset($upload['url'])) {
                    $user->avatar = $upload['url'];
                    $user->save();
                }
            } elseif ($request->has('avatar')) {
                $avatarVal = $request->input('avatar');
                if (is_string($avatarVal) && !empty($avatarVal) && $avatarVal !== 'null' && $avatarVal !== 'avatar.png') {
                    $avatarPath = parse_url($avatarVal, PHP_URL_PATH);
                    if (strpos($avatarPath, 'avatars/') !== false) {
                        $fileName = 'avatars/' . basename($avatarPath);
                    } else {
                        $fileName = basename($avatarPath);
                    }
                    $user->avatar = $fileName;
                    $user->save();
                }
            }

            if(Auth::user()->type == 'superadmin')
            {
                User::CompanySetting($user->id);
                User::MakeRole($user->id);
                $role = Role::findByName('company');
            }

            if ($request->has('roles') && is_array($request->input('roles')) && count($request->input('roles')) > 0) {
                $roleNames = $request->input('roles');
                $rolesToSync = Role::whereIn('name', $roleNames)->orWhereIn('id', $roleNames)->get();
                $user->syncRoles($rolesToSync);
                if ($rolesToSync->isNotEmpty() && Auth::user()->type != 'superadmin') {
                    $user->type = $rolesToSync->first()->name;
                    $user->save();
                }
            } elseif (isset($role) && $role) {
                $user->assignRole($role);
            }

            // Dispatch event for packages to handle their fields
            CreateUser::dispatch($request, $user);

             // Send welcome email
            if(company_setting('New User') == 'on') {
                $emailData = [
                    'name' => $user->name,
                    'email' => $user->email,
                    'password' => $validated['password'],
                ];

                EmailTemplate::sendEmailTemplate('New User', [$user->email], $emailData);
            }

            if ($enableEmailVerification === 'on') {
                // Apply dynamic mail configuration
                SetConfigEmail(creatorId());
                $user->sendEmailVerificationNotification();
            }

            return redirect()->route('users.index')->with('success', __('The user has been created successfully.'));
        }
        else{
            return redirect()->route('users.index')->with('error', __('Permission denied'));
        }
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        if (Auth::user()->can('edit-users')) {
            if ($user->created_by != creatorId() && Auth::user()->type !== 'superadmin' && $user->id !== Auth::id()) {
                return redirect()->route('users.index')->with('error', __('Permission denied'));
            }

            $validated = $request->validated();
            $validated['is_enable_login'] = $request->boolean('is_enable_login', true);

            $user->name = $validated['name'];
            $user->email = $validated['email'];
            $user->mobile_no = $validated['mobile_no'];
            $user->is_enable_login = $validated['is_enable_login'];
            $user->save();

            // Handle avatar updates
            if ($request->hasFile('avatar')) {
                $file = $request->file('avatar');
                $filename = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
                $extension = $file->getClientOriginalExtension();
                $fileNameToStore = 'avatar_' . time() . '.' . $extension;
                
                $upload = upload_file($request, 'avatar', $fileNameToStore, 'avatars');
                if (isset($upload['flag']) && $upload['flag'] == 1 && isset($upload['url'])) {
                    // Delete old avatar if exists and is not default
                    if ($user->avatar && $user->avatar != 'avatar.png') {
                        delete_file($user->avatar);
                    }
                    $user->avatar = $upload['url'];
                    $user->save();
                }
            } elseif ($request->has('avatar')) {
                $avatarVal = $request->input('avatar');
                if (is_string($avatarVal) && !empty($avatarVal) && $avatarVal !== 'null' && $avatarVal !== 'avatar.png') {
                    $avatarPath = parse_url($avatarVal, PHP_URL_PATH);
                    if (strpos($avatarPath, 'avatars/') !== false) {
                        $fileName = 'avatars/' . basename($avatarPath);
                    } else {
                        $fileName = basename($avatarPath);
                    }
                    if ($user->avatar !== $fileName) {
                        $user->avatar = $fileName;
                        $user->save();
                    }
                } elseif (empty($avatarVal) || $avatarVal === 'null' || $avatarVal === 'avatar.png') {
                    // Reset to default avatar
                    if ($user->avatar && $user->avatar !== 'avatar.png') {
                        delete_file($user->avatar);
                    }
                    $user->avatar = 'avatar.png';
                    $user->save();
                }
            }

            if ($request->has('roles') && is_array($request->input('roles'))) {
                $roleNames = $request->input('roles');
                $rolesToSync = Role::whereIn('name', $roleNames)->orWhereIn('id', $roleNames)->get();
                $user->syncRoles($rolesToSync);
                if ($rolesToSync->isNotEmpty() && $user->type !== 'superadmin' && $user->type !== 'company') {
                    $user->type = $rolesToSync->first()->name;
                    $user->save();
                }
            } elseif ($request->has('type') && !empty($request->input('type'))) {
                $role = Role::find($request->input('type'));
                if ($role) {
                    $user->syncRoles([$role]);
                    if ($user->type !== 'superadmin' && $user->type !== 'company') {
                        $user->type = $role->name;
                        $user->save();
                    }
                }
            }

            return back()->with('success', __('The user details are updated successfully.'));
        }
        else{
            return redirect()->route('users.index')->with('error', __('Permission denied'));
        }
    }

    public function changePassword(ChangePasswordRequest $request, User $user)
    {
        if(Auth::user()->can('change-password-users') && $user->created_by == creatorId() ){
            $validated = $request->validated();
            $user->password = Hash::make($validated['password']);
            $user->save();

            return redirect()->route('users.index')->with('success', __('The password changed successfully.'));
        }
        else{
            return redirect()->route('users.index')->with('error', __('Permission denied'));
        }
    }

    public function destroy(User $user)
    {
        if (Auth::user()->can('delete-users')) {
            if ($user->created_by != creatorId() && Auth::user()->type !== 'superadmin') {
                return redirect()->route('users.index')->with('error', __('Permission denied'));
            }
            if ($user->id === Auth::id()) {
                return redirect()->route('users.index')->with('error', __('You cannot delete yourself.'));
            }

            $user->delete();

            return back()->with('success', __('The user has been deleted.'));
        }
        else{
            return redirect()->route('users.index')->with('error', __('Permission denied'));
        }
    }

    public function impersonate(User $user)
    {
        if (Auth::user()->can('impersonate-users'))
        {
            if ($user->id === Auth::id()) {
                return redirect()->route('users.index')->with('error', __('You cannot login as user yourself'));
            }

            if ($user->created_by !== creatorId()) {
                return redirect()->route('users.index')->with('error', __('Permission denied'));
            }

            // Store the original user ID in session
            Session::put('impersonator_id', Auth::id());

            // Login as the target user
            Auth::login($user);
        }
        else
        {
            return redirect()->route('users.index')->with('error', __('Permission denied'));
        }

        return redirect()->route('dashboard')->with('success', __('You are now login as user :name', ['name' => $user->name]));
    }

    public function leaveImpersonation()
    {
        if (!Session::has('impersonator_id')) {
            return redirect()->route('dashboard')->with('error', __('You are not login as user anyone'));
        }

        $originalUserId = Session::get('impersonator_id');
        $originalUser = User::find($originalUserId);

        if (!$originalUser) {
            Session::forget('impersonator_id');
            return redirect()->route('login')->with('error', __('Original user not found'));
        }

        Session::forget('impersonator_id');
        Auth::login($originalUser);

        return redirect()->route('users.index')->with('success', __('You have stopped login as user'));
    }

    public function loginHistory()
    {
        if(Auth::user()->can('view-login-history')){
            $loginHistories = LoginHistory::with('user')
                ->when(Auth::user()->type !== 'superadmin', fn($q) => $q->where('created_by', creatorId()))
                ->when(request('user_name'), fn($q) => $q->whereHas('user', fn($q) => $q->where('name', 'like', '%' . request('user_name') . '%')))
                ->when(request('ip'), fn($q) => $q->where('ip', 'like', '%' . request('ip') . '%'))
                ->when(request('role'), fn($q) => $q->whereHas('user', fn($q) => $q->where('type', request('role'))))
                ->when(request('sort'), fn($q) => $q->orderBy(request('sort'), request('direction', 'asc')), fn($q) => $q->latest())
                ->paginate(request('per_page', 10))
                ->withQueryString();

            $roles = Role::where('created_by', creatorId())->pluck('label', 'name');

            return Inertia::render('users/login-history', [
                'loginHistories' => $loginHistories,
                'roles' => $roles,
            ]);
        }
        else{
            return back()->with('error', __('Permission denied'));
        }
    }

    public function toggleVerification(\Illuminate\Http\Request $request, User $user)
    {
        if (Auth::user()->can('edit-users') || Auth::user()->type === 'company' || Auth::user()->type === 'hr' || Auth::user()->type === 'superadmin') {
            $user->is_verified = !$user->is_verified;
            $user->save();

            $employee = \Workdo\Hrm\Models\Employee::where('user_id', $user->id)->first();
            if ($employee) {
                $employee->is_verified = $user->is_verified;
                $employee->save();
            }

            return redirect()->back()->with('success', $user->is_verified ? __('User verified successfully!') : __('User verification status removed.'));
        } else {
            return redirect()->back()->with('error', __('Permission denied'));
        }
    }
}
