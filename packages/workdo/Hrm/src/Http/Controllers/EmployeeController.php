<?php

namespace Workdo\Hrm\Http\Controllers;

use Workdo\Hrm\Models\Employee;
use Workdo\Hrm\Http\Requests\StoreEmployeeRequest;
use Workdo\Hrm\Http\Requests\UpdateEmployeeRequest;
use Illuminate\Routing\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\User;
use Workdo\Hrm\Models\Branch;
use Workdo\Hrm\Models\Department;
use Workdo\Hrm\Models\Designation;
use Workdo\Hrm\Models\EmployeeDocumentType;
use Workdo\Hrm\Models\EmployeeDocument;
use Workdo\Hrm\Models\Shift;
use Workdo\Hrm\Events\CreateEmployee;
use Workdo\Hrm\Events\DestroyEmployee;
use Workdo\Hrm\Events\UpdateEmployee;

class EmployeeController extends Controller
{
    private function checkEmployeeAccess(Employee $employee)
    {
        if(Auth::user()->can('manage-any-employees')) {
            return $employee->created_by == creatorId();
        } elseif(Auth::user()->can('manage-own-employees')) {
            return ($employee->creator_id == Auth::id() || $employee->user_id == Auth::id());
        }
        return false;
    }
    public function index()
    {
        if (Auth::user()->can('manage-employees')) {
            $employees = Employee::query()
                ->with(['user:id,name,avatar,is_disable', 'branch', 'department', 'designation', 'shift'])
                ->where(function ($q) {
                    if (Auth::user()->can('manage-any-employees')) {
                        $q->where('created_by', creatorId());
                    } elseif (Auth::user()->can('manage-own-employees')) {
                        $q->where('creator_id',Auth::id())->orWhere('user_id', Auth::id());
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                })
                ->when(request('employee_id'), function ($q) {
                    $q->where(function ($query) {
                        $query->where('employee_id', 'like', '%' . request('employee_id') . '%');
                        $query->orWhereHas('user', function($userQuery) {
                            $userQuery->where('name', 'like', '%' . request('employee_id') . '%');
                        });
                    });
                })
                ->when(request('branch_id') && request('branch_id') !== 'all', fn($q) => $q->where('branch_id', request('branch_id')))
                ->when(request('department_id') && request('department_id') !== 'all', fn($q) => $q->where('department_id', request('department_id')))
                ->when(request('employment_type') !== null && request('employment_type') !== '', fn($q) => $q->where('employment_type', request('employment_type')))
                ->when(request('gender') !== null && request('gender') !== '', fn($q) => $q->where('gender', request('gender')))
                ->when(request('sort'), fn($q) => $q->orderBy(request('sort'), request('direction', 'asc')), fn($q) => $q->latest())
                ->paginate(request('per_page', 10))
                ->withQueryString();

            return Inertia::render('Hrm/Employees/Index', [
                'employees' => $employees,
                'users' => User::emp()->where('created_by', creatorId())->select('id', 'name')->get(),
                'branches' => Branch::where('created_by', creatorId())->orderBy('priority', 'asc')->orderBy('id', 'desc')->select('id', 'branch_name')->get(),
                'departments' => Department::where('created_by', creatorId())->select('id', 'department_name', 'branch_id')->get(),
                'designations' => Designation::where('created_by', creatorId())->select('id', 'designation_name', 'branch_id', 'department_id')->get(),
                'shifts' => Shift::where('created_by', creatorId())->select('id', 'shift_name')->get(),
                'cpanel_domain' => company_setting('cpanel_domain', creatorId()),
                'cpanel_quota' => company_setting('cpanel_quota', creatorId()),
            ]);
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }

    public function create()
    {
        if (Auth::user()->can('create-employees')) {
            return Inertia::render('Hrm/Employees/Create', [
                'users' => User::emp()->where('created_by', creatorId())->whereNotIn('id', Employee::where('created_by', creatorId())->pluck('user_id'))->select('id', 'name', 'mobile_no')->get(),
                'roles' => \Spatie\Permission\Models\Role::where('created_by', creatorId())->pluck('label', 'id'),
                'branches' => Branch::where('created_by', creatorId())->orderBy('priority', 'asc')->orderBy('id', 'desc')->select('id', 'branch_name')->get(),
                'departments' => Department::where('created_by', creatorId())->select('id', 'department_name', 'branch_id')->get(),
                'designations' => Designation::where('created_by', creatorId())->select('id', 'designation_name', 'branch_id', 'department_id')->get(),
                'shifts' => Shift::where('created_by', creatorId())->select('id', 'shift_name')->get(),
                'documentTypes' => EmployeeDocumentType::where('created_by', creatorId())->select('id', 'document_name', 'is_required')->get(),
                'generatedEmployeeId' => Employee::generateEmployeeId(),
            ]);
        } else {
            return redirect()->route('hrm.employees.index')->with('error', __('Permission denied'));
        }
    }

    public function store(StoreEmployeeRequest $request)
    {
        if (Auth::user()->can('create-employees')) {
            $validated = $request->validated();
            $employee = new Employee();
            $employee->employee_id = $validated['employee_id'];
            $employee->date_of_birth = $validated['date_of_birth'];
            $employee->gender = $validated['gender'];
            $employee->shift = $validated['shift_id'];
            $employee->date_of_joining = $validated['date_of_joining'];
            $employee->employment_type = $validated['employment_type'];
            $employee->employment_status = $validated['employment_status'];
            $employee->probation_percentage = $validated['probation_percentage'] ?? null;
            $employee->probation_period = $validated['probation_period'] ?? null;
            $employee->work_mode = $validated['work_mode'];
            $employee->work_location_country = $validated['work_location_country'];
            $employee->address_line_1 = $validated['address_line_1'];
            $employee->address_line_2 = $validated['address_line_2'];
            $employee->city = $validated['city'];
            $employee->state = $validated['state'];
            $employee->country = $validated['country'];
            $employee->postal_code = $validated['postal_code'];
            $employee->emergency_contact_name = $validated['emergency_contact_name'];
            $employee->emergency_contact_relationship = $validated['emergency_contact_relationship'];
            $employee->emergency_contact_number = $validated['emergency_contact_number'];
            $employee->bank_name = $validated['bank_name'] ?? null;
            $employee->account_holder_name = $validated['account_holder_name'] ?? null;
            $employee->account_number = $validated['account_number'] ?? null;
            $employee->bank_identifier_code = $validated['bank_identifier_code'] ?? null;
            $employee->bank_branch = $validated['bank_branch'] ?? null;
            $employee->bank_country = $validated['bank_country'] ?? null;
            $employee->bank_notes = $validated['bank_notes'] ?? null;
            $employee->tax_payer_id = $validated['tax_payer_id'] ?? null;
            $employee->payment_method = $validated['payment_method'] ?? 'bank_transfer';
            $paymentDetails = $validated['payment_details'] ?? null;
            if (is_string($paymentDetails)) {
                $paymentDetails = json_decode($paymentDetails, true);
            }
            $employee->payment_details = $paymentDetails;
            $employee->basic_salary = $validated['basic_salary'];
            $employee->salary_type = $validated['salary_type'] ?? 'yearly';
            $employee->hours_per_day = $validated['hours_per_day'];
            $employee->days_per_week = $validated['days_per_week'];
            $employee->rate_per_hour = $validated['rate_per_hour'];
            $employee->user_id = $validated['user_id'];
            $employee->branch_id = $validated['branch_id'];
            $employee->department_id = $validated['department_id'];
            $employee->designation_id = $validated['designation_id'];

            $employee->creator_id = Auth::id();
            $employee->created_by = creatorId();
            $employee->save();

            // Store avatar if provided
            $user = User::find($employee->user_id);
            if ($user) {
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
                } elseif ($request->has('avatar') && is_string($request->avatar) && !empty($request->avatar) && $request->avatar !== 'null') {
                    $avatarPath = parse_url($request->avatar, PHP_URL_PATH);
                    if (strpos($avatarPath, 'avatars/') !== false) {
                        $fileName = 'avatars/' . basename($avatarPath);
                    } else {
                        $fileName = basename($avatarPath);
                    }
                    $user->avatar = $fileName;
                    $user->save();
                }
            }

            CreateEmployee::dispatch($request, $employee);

            // Store documents
            if ($request->has('documents')) {
                foreach ($request->input('documents', []) as $index => $document) {
                    if ($request->hasFile("documents.{$index}.file") && !empty($document['document_type_id'])) {
                        $file = $request->file("documents.{$index}.file");

                        $filename = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
                        $extension = $file->getClientOriginalExtension();
                        $fileNameToStore = $filename . '_' . time() . '_' . $index . '.' . $extension;

                        $upload = upload_file($request, "documents.{$index}.file", $fileNameToStore, 'employee_documents');

                        if (isset($upload['flag']) && $upload['flag'] == 1 && isset($upload['url'])) {
                            EmployeeDocument::create([
                                'user_id' => $employee->id,
                                'document_type_id' => $document['document_type_id'],
                                'file_path' => $upload['url'],
                                'creator_id' => Auth::id(),
                                'created_by' => creatorId(),
                            ]);
                        }
                    } elseif (!empty($document['file']) && !empty($document['document_type_id'])) {
                        EmployeeDocument::create([
                            'user_id' => $employee->id,
                            'document_type_id' => $document['document_type_id'],
                            'file_path' => $document['file'],
                            'creator_id' => Auth::id(),
                            'created_by' => creatorId(),
                        ]);
                    }
                }
            }

            return redirect()->route('hrm.employees.index')->with('success', __('The employee has been created successfully.'));
        } else {
            return redirect()->route('hrm.employees.index')->with('error', __('Permission denied'));
        }
    }

    public function edit(Employee $employee)
    {
        if (Auth::user()->can('edit-employees')) {
            if(!$this->checkEmployeeAccess($employee)) {
                return redirect()->route('hrm.employees.index')->with('error', __('Permission denied'));
            }
            $employee->load('user');
            $existingDocuments = EmployeeDocument::where('user_id', $employee->id)
                ->with('documentType')
                ->get()
                ->map(function ($doc) {
                    return [
                        'id' => $doc->id,
                        'document_type_id' => $doc->document_type_id,
                        'file_path' => $doc->file_path,
                        'document_name' => $doc->documentType->document_name ?? '',
                    ];
                });

            return Inertia::render('Hrm/Employees/Edit', [
                'employee' => $employee,
                'users' => User::emp()->where('created_by', creatorId())->select('id', 'name', 'mobile_no')->get(),
                'branches' => Branch::where('created_by', creatorId())->orderBy('priority', 'asc')->orderBy('id', 'desc')->select('id', 'branch_name')->get(),
                'departments' => Department::where('created_by', creatorId())->select('id', 'department_name', 'branch_id')->get(),
                'designations' => Designation::where('created_by', creatorId())->select('id', 'designation_name', 'branch_id', 'department_id')->get(),
                'shifts' => Shift::where('created_by', creatorId())->select('id', 'shift_name')->get(),
                'documentTypes' => EmployeeDocumentType::where('created_by', creatorId())->select('id', 'document_name', 'is_required')->get(),
                'existingDocuments' => $existingDocuments,
            ]);
        } else {
            return redirect()->route('hrm.employees.index')->with('error', __('Permission denied'));
        }
    }

    public function update(UpdateEmployeeRequest $request, Employee $employee)
    { 
        if (Auth::user()->can('edit-employees')) {
            $validated = $request->validated();
            $employee->date_of_birth = $validated['date_of_birth'];
            $employee->gender = $validated['gender'];
            $employee->shift = $validated['shift_id'];
            $employee->date_of_joining = $validated['date_of_joining'];
            $employee->employment_type = $validated['employment_type'];
            $employee->employment_status = $validated['employment_status'];
            $employee->probation_percentage = $validated['probation_percentage'] ?? null;
            $employee->probation_period = $validated['probation_period'] ?? null;
            $employee->work_mode = $validated['work_mode'];
            $employee->work_location_country = $validated['work_location_country'];
            $employee->address_line_1 = $validated['address_line_1'];
            $employee->address_line_2 = $validated['address_line_2'];
            $employee->city = $validated['city'];
            $employee->state = $validated['state'];
            $employee->country = $validated['country'];
            $employee->postal_code = $validated['postal_code'];
            $employee->emergency_contact_name = $validated['emergency_contact_name'];
            $employee->emergency_contact_relationship = $validated['emergency_contact_relationship'];
            $employee->emergency_contact_number = $validated['emergency_contact_number'];
            $employee->bank_name = $validated['bank_name'] ?? null;
            $employee->account_holder_name = $validated['account_holder_name'] ?? null;
            $employee->account_number = $validated['account_number'] ?? null;
            $employee->bank_identifier_code = $validated['bank_identifier_code'] ?? null;
            $employee->bank_branch = $validated['bank_branch'] ?? null;
            $employee->bank_country = $validated['bank_country'] ?? null;
            $employee->bank_notes = $validated['bank_notes'] ?? null;
            $employee->tax_payer_id = $validated['tax_payer_id'] ?? null;
            $employee->payment_method = $validated['payment_method'] ?? 'bank_transfer';
            $paymentDetails = $validated['payment_details'] ?? null;
            if (is_string($paymentDetails)) {
                $paymentDetails = json_decode($paymentDetails, true);
            }
            $employee->payment_details = $paymentDetails;
            $employee->basic_salary = $validated['basic_salary'];
            $employee->salary_type = $validated['salary_type'] ?? 'yearly';
            $employee->hours_per_day = $validated['hours_per_day'];
            $employee->days_per_week = $validated['days_per_week'];
            $employee->rate_per_hour = $validated['rate_per_hour'];
            $employee->branch_id = $validated['branch_id'];
            $employee->department_id = $validated['department_id'];
            $employee->designation_id = $validated['designation_id'];

            $employee->save();

            // Update avatar if provided
            $user = User::find($employee->user_id);
            if ($user) {
                if ($request->has('mobile_no')) {
                    $user->mobile_no = $request->input('mobile_no');
                    $user->save();
                }
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
                } elseif ($request->has('avatar') && is_string($request->avatar) && !empty($request->avatar) && $request->avatar !== 'null') {
                    $avatarPath = parse_url($request->avatar, PHP_URL_PATH);
                    if (strpos($avatarPath, 'avatars/') !== false) {
                        $fileName = 'avatars/' . basename($avatarPath);
                    } else {
                        $fileName = basename($avatarPath);
                    }
                    if ($user->avatar !== $fileName) {
                        $user->avatar = $fileName;
                        $user->save();
                    }
                }
            }

            UpdateEmployee::dispatch($request, $employee);

            // Handle document updates
            if ($request->has('documents')) {
                foreach ($request->input('documents', []) as $index => $document) {
                    if ($request->hasFile("documents.{$index}.file") && !empty($document['document_type_id'])) {
                        $file = $request->file("documents.{$index}.file");

                        $filename = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
                        $extension = $file->getClientOriginalExtension();
                        $fileNameToStore = $filename . '_' . time() . '_' . $index . '.' . $extension;

                        $upload = upload_file($request, "documents.{$index}.file", $fileNameToStore, 'employee_documents');

                        if (isset($upload['flag']) && $upload['flag'] == 1 && isset($upload['url'])) {
                            EmployeeDocument::create([
                                'user_id' => $employee->id,
                                'document_type_id' => $document['document_type_id'],
                                'file_path' => $upload['url'],
                                'creator_id' => Auth::id(),
                                'created_by' => creatorId(),
                            ]);
                        }
                    } elseif (!empty($document['file']) && !empty($document['document_type_id'])) {
                        EmployeeDocument::create([
                            'user_id' => $employee->id,
                            'document_type_id' => $document['document_type_id'],
                            'file_path' => $document['file'],
                            'creator_id' => Auth::id(),
                            'created_by' => creatorId(),
                        ]);
                    }
                }
            }

            return redirect()->route('hrm.employees.index')->with('success', __('The employee details are updated successfully.'));
        } else {
            return redirect()->route('hrm.employees.index')->with('error', __('Permission denied'));
        }
    }

    public function destroy(Employee $employee)
    {
        if (Auth::user()->can('delete-employees')) {
            DestroyEmployee::dispatch($employee);
            $employee->delete();

            return redirect()->back()->with('success', __('The employee has been deleted.'));
        } else {
            return redirect()->route('hrm.employees.index')->with('error', __('Permission denied'));
        }
    }

    public function show(Employee $employee)
    {
        if (Auth::user()->can('view-employees')) {
            if(!$this->checkEmployeeAccess($employee)) {
                return redirect()->route('hrm.employees.index')->with('error', __('Permission denied'));
            }
            $employee->load(['user:id,name,email,avatar', 'branch', 'department', 'designation', 'shift']);
            
            $documents = EmployeeDocument::where('user_id', $employee->id)
                ->with('documentType')
                ->get()
                ->map(function($doc) {
                    return [
                        'id' => $doc->id,
                        'document_type_id' => $doc->document_type_id,
                        'file_path' => $doc->file_path,
                        'document_name' => $doc->documentType->document_name ?? '',
                    ];
                });

            $issuedDocuments = \Workdo\Hrm\Models\IssuedDocument::where('employee_id', $employee->id)
                ->where('created_by', creatorId())
                ->latest()
                ->get();

            return Inertia::render('Hrm/Employees/Show', [
                'employee' => $employee,
                'documents' => $documents,
                'issuedDocuments' => $issuedDocuments,
            ]);
        } else {
            return redirect()->route('hrm.employees.index')->with('error', __('Permission denied'));
        }
    }

    public function deleteDocument($employeeId, EmployeeDocument $document)
    {
        if (Auth::user()->can('edit-employees')) {
            if ($document->user_id != $employeeId) {
                return redirect()->back()->with('error', __('Document not found'));
            }

            delete_file($document->file_path);
            $document->delete();

            return redirect()->back()->with('success', __('Document deleted successfully'));
        } else {
            return redirect()->back()->with('error', __('Permission denied'));
        }
    }

    public function verifyIndex()
    {
        return Inertia::render('Hrm/Employees/Verify', [
            'status' => session('status'),
            'error' => session('error'),
            'employee' => session('employee'),
        ]);
    }

    public function verifySearch(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|string',
        ]);

        $employee = Employee::with(['user', 'designation', 'department', 'branch'])
            ->where('employee_id', $request->employee_id)
            ->first();

        if ($employee) {
            $formattedEmployee = [
                'employee_id' => $employee->employee_id,
                'name' => $employee->user ? $employee->user->name : '',
                'designation' => $employee->designation ? $employee->designation->designation_name : '',
                'department' => $employee->department ? $employee->department->department_name : '',
                'branch' => $employee->branch ? $employee->branch->branch_name : '',
                'date_of_joining' => $employee->date_of_joining ? $employee->date_of_joining->format('d M Y') : '',
                'status' => 'Verified Active Employee',
            ];
            return redirect()->route('hrm.employee.verify.index')->with([
                'employee' => $formattedEmployee,
                'status' => 'success'
            ]);
        }

        return redirect()->route('hrm.employee.verify.index')->with('error', __('No employee found with this ID.'));
    }

    public function verifyShow($employeeId)
    {
        $employee = Employee::with(['user', 'designation', 'department', 'branch'])
            ->where('employee_id', $employeeId)
            ->first();

        if ($employee) {
            $formattedEmployee = [
                'employee_id' => $employee->employee_id,
                'name' => $employee->user ? $employee->user->name : '',
                'designation' => $employee->designation ? $employee->designation->designation_name : '',
                'department' => $employee->department ? $employee->department->department_name : '',
                'branch' => $employee->branch ? $employee->branch->branch_name : '',
                'date_of_joining' => $employee->date_of_joining ? $employee->date_of_joining->format('d M Y') : '',
                'status' => 'Verified Active Employee',
            ];
            return Inertia::render('Hrm/Employees/Verify', [
                'employee' => $formattedEmployee,
                'status' => 'success'
            ]);
        }

        return Inertia::render('Hrm/Employees/Verify', [
            'error' => __('No employee found with this ID.'),
        ]);
    }

    public function getAvatarBase64(Employee $employee)
    {
        $avatarPath = $employee->user ? $employee->user->avatar : null;
        if (!$avatarPath) {
            return response()->json(['base64' => '']);
        }

        $paths = [
            public_path($avatarPath),
            storage_path('app/public/' . $avatarPath),
            storage_path('app/' . $avatarPath),
            public_path('storage/' . $avatarPath),
        ];

        foreach ($paths as $path) {
            if (file_exists($path) && is_file($path)) {
                $type = pathinfo($path, PATHINFO_EXTENSION);
                $data = file_get_contents($path);
                $base64 = 'data:image/' . $type . ';base64,' . base64_encode($data);
                return response()->json(['base64' => $base64]);
            }
        }

        $urlToFetch = $avatarPath;
        if (!filter_var($avatarPath, FILTER_VALIDATE_URL)) {
            $prefix = getImageUrlPrefix();
            $urlToFetch = rtrim($prefix, '/') . '/' . ltrim($avatarPath, '/');
        }

        if (filter_var($urlToFetch, FILTER_VALIDATE_URL)) {
            try {
                $client = new \GuzzleHttp\Client(['verify' => false]);
                $response = $client->get($urlToFetch, ['timeout' => 5]);
                $contentType = $response->getHeaderLine('content-type') ?: 'image/jpeg';
                $body = $response->getBody()->getContents();
                $base64 = 'data:' . $contentType . ';base64,' . base64_encode($body);
                return response()->json(['base64' => $base64]);
            } catch (\Exception $e) {
                // fall through
            }
        }

        return response()->json(['base64' => '']);
    }

    public function getSealBase64()
    {
        $sealUrl = 'https://cdn.dynime.com/Dynime%20Logo/Seal/seal.png';
        try {
            $client = new \GuzzleHttp\Client();
            $response = $client->get($sealUrl, ['timeout' => 5]);
            $contentType = $response->getHeaderLine('content-type') ?: 'image/png';
            $body = $response->getBody()->getContents();
            $base64 = 'data:' . $contentType . ';base64,' . base64_encode($body);
            return response()->json(['base64' => $base64]);
        } catch (\Exception $e) {
            // Fallback to local files
            $fallbackPaths = [
                public_path('custom_seal.png'),
                public_path('seal_dynime.png'),
            ];
            foreach ($fallbackPaths as $path) {
                if (file_exists($path) && is_file($path)) {
                    $type = pathinfo($path, PATHINFO_EXTENSION);
                    $data = file_get_contents($path);
                    return response()->json(['base64' => 'data:image/' . $type . ';base64,' . base64_encode($data)]);
                }
            }
        }
        return response()->json(['base64' => '']);
    }

    public function sendCredentials($employeeId)
    {
        if (\Auth::user()->can('edit-employees')) {
            $employee = Employee::with('user')->find($employeeId);
            if (!$employee || !$employee->user) {
                return redirect()->back()->with('error', __('Employee user not found.'));
            }

            // Generate temporary password
            $password = \Str::random(10);
            $user = $employee->user;
            $user->password = \Hash::make($password);
            $user->save();

            // Set SMTP Config
            try {
                \App\Services\MailConfigService::setDynamicConfig(creatorId());
                
                \Mail::to($user->email)->send(new \App\Mail\SendCredentialsMail($user, $password));
                
                return redirect()->back()->with('success', __('Login credentials sent successfully to ') . $user->name);
            } catch (\Exception $e) {
                \Log::error('Send credentials failed: ' . $e->getMessage());
                return redirect()->back()->with('error', __('SMTP Configuration Error: ') . $e->getMessage());
            }
        } else {
            return redirect()->back()->with('error', __('Permission denied.'));
        }
    }

    public function createOfficialEmail(Request $request, $employeeId)
    {
        if (\Auth::user()->can('edit-employees')) {
            $employee = Employee::with('user')->find($employeeId);
            if (!$employee || !$employee->user) {
                return redirect()->back()->with('error', __('Employee not found.'));
            }

            $request->validate([
                'email_prefix' => 'required|string|alpha_dash|max:50',
                'password' => 'required|string|min:8',
                'quota' => 'nullable|integer|min:0',
            ]);

            $emailPrefix = $request->input('email_prefix');
            $password = $request->input('password');
            $quota = $request->input('quota') ?: 0;

            $domain = company_setting('cpanel_domain', creatorId());
            if (empty($domain)) {
                return redirect()->back()->with('error', __('cPanel Domain is not configured in settings.'));
            }

            $officialEmail = $emailPrefix . '@' . $domain;

            // Call cPanel API
            $response = \App\Services\CPanelEmailService::createEmail($emailPrefix, $password, $quota, creatorId());

            if ($response['success']) {
                // Update employee record
                $employee->official_email = $officialEmail;
                $employee->official_email_password = $password;
                $employee->save();

                // Send Email Notification to Employee's Personal Email
                try {
                    \App\Services\MailConfigService::setDynamicConfig(creatorId());
                    \Mail::to($employee->user->email)->send(new \App\Mail\SendOfficialEmailCredentialsMail($employee->user, $officialEmail, $password));
                } catch (\Exception $e) {
                    \Log::error('Send official email credentials failed: ' . $e->getMessage());
                    return redirect()->back()->with('success', __('Official email created successfully, but notification email failed to send.'));
                }

                return redirect()->back()->with('success', __('Official cPanel email account created successfully: ') . $officialEmail);
            } else {
                return redirect()->back()->with('error', $response['message']);
            }
        } else {
            return redirect()->back()->with('error', __('Permission denied.'));
        }
    }

    public function resendOfficialEmailCredentials($employeeId)
    {
        if (\Auth::user()->can('edit-employees')) {
            $employee = Employee::with('user')->find($employeeId);
            if (!$employee || !$employee->user) {
                return redirect()->back()->with('error', __('Employee not found.'));
            }

            if (empty($employee->official_email) || empty($employee->official_email_password)) {
                return redirect()->back()->with('error', __('Official email has not been created yet for this employee.'));
            }

            try {
                \App\Services\MailConfigService::setDynamicConfig(creatorId());
                \Mail::to($employee->user->email)->send(new \App\Mail\SendOfficialEmailCredentialsMail(
                    $employee->user,
                    $employee->official_email,
                    $employee->official_email_password
                ));

                return redirect()->back()->with('success', __('Official email credentials resent successfully to ') . $employee->user->name);
            } catch (\Exception $e) {
                \Log::error('Resend official email credentials failed: ' . $e->getMessage());
                return redirect()->back()->with('error', __('SMTP Configuration Error: ') . $e->getMessage());
            }
        } else {
            return redirect()->back()->with('error', __('Permission denied.'));
        }
    }
}

