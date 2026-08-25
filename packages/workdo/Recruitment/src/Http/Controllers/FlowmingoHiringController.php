<?php

namespace Workdo\Recruitment\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;

use Workdo\Recruitment\Models\FlowmingoJob;

class FlowmingoHiringController extends Controller
{
    /**
     * Display a listing of Flowmingo ATS synced jobs.
     */
    public function index(Request $request)
    {
        if (\Auth::user()->can('manage-job-postings') || \Auth::user()->type === 'company' || \Auth::user()->type === 'superadmin') {
            $jobs = FlowmingoJob::latest()->get();

            // Seed initial sample positions if table is empty
            if ($jobs->isEmpty()) {
                $this->seedInitialJobs();
                $jobs = FlowmingoJob::latest()->get();
            }

            $stats = [
                'total' => $jobs->count(),
                'active' => $jobs->where('status', 'open')->count(),
                'closed' => $jobs->where('status', 'closed')->count(),
                'departments' => $jobs->pluck('department')->filter()->unique()->count(),
            ];

            return Inertia::render('Recruitment/HiringFlowmingo/Index', [
                'jobs' => $jobs,
                'stats' => $stats,
            ]);
        }

        return redirect()->back()->with('error', __('Permission denied.'));
    }

    /**
     * Trigger synchronization with Flowmingo ATS service.
     */
    public function sync(Request $request)
    {
        try {
            $apiKey = $request->input('api_key');
            if ($apiKey) {
                $userId = \Auth::id() ?? 1;
                \Workdo\Recruitment\Models\RecruitmentSetting::updateOrCreate(
                    ['created_by' => $userId, 'key' => 'flowmingo_api_key'],
                    ['value' => $apiKey]
                );
            }

            $result = \Workdo\Recruitment\Services\FlowmingoSyncService::syncFromFlowmingoOfficialApi($apiKey);
            $msg = $result['message'] ?? __('Flowmingo ATS jobs synchronized successfully!');

            if (!empty($result['success'])) {
                return redirect()->back()->with('success', $msg);
            } else {
                return redirect()->back()->with('warning', $msg);
            }
        } catch (\Exception $e) {
            return redirect()->back()->with('error', __('Failed to sync jobs: ') . $e->getMessage());
        }
    }

    /**
     * Webhook/API endpoint for Flowmingo ATS to automatically push new or updated jobs.
     */
    public function webhookIngest(Request $request)
    {
        try {
            $data = $request->all();
            if (empty($data['title'])) {
                return response()->json(['success' => false, 'message' => 'Job title is required'], 422);
            }
            $job = \Workdo\Recruitment\Services\FlowmingoSyncService::ingestJob($data);
            return response()->json([
                'success' => true,
                'message' => 'Job successfully ingested into Dynime ERP Careers',
                'job_id' => $job->id,
                'code' => $job->code,
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Store a newly created Flowmingo ATS job posting.
     */
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'department' => 'nullable|string|max:255',
            'employment_type' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'salary_min' => 'nullable|numeric',
            'salary_max' => 'nullable|numeric',
            'salary_currency' => 'nullable|string|max:10',
            'status' => 'required|string|in:open,closed',
            'description' => 'nullable|string',
        ]);

        $slug = Str::slug($request->title) . '-' . Str::random(5);
        $flowmingoJobId = 'FLM-' . strtoupper(Str::random(8));

        FlowmingoJob::create([
            'created_by' => Auth::id(),
            'flowmingo_job_id' => $flowmingoJobId,
            'slug' => $slug,
            'title' => $request->title,
            'department' => $request->department ?? 'Engineering',
            'employment_type' => $request->employment_type ?? 'Full-time',
            'location' => $request->location ?? 'Remote / On-site',
            'salary_min' => $request->salary_min,
            'salary_max' => $request->salary_max,
            'salary_currency' => $request->salary_currency ?? 'USD',
            'salary_period' => 'year',
            'salary_range' => ($request->salary_min && $request->salary_max) 
                ? ($request->salary_currency ?? 'USD') . ' ' . number_format($request->salary_min) . ' – ' . number_format($request->salary_max) 
                : 'Negotiable',
            'description' => $request->description,
            'responsibilities' => $request->responsibilities ? explode("\n", $request->responsibilities) : ['Deliver high-quality software solutions', 'Collaborate with cross-functional teams'],
            'requirements' => $request->requirements ? explode("\n", $request->requirements) : ['Relevant industry experience', 'Strong problem solving skills'],
            'benefits' => ['Competitive Salary', 'Flexible Remote Work', 'Health & Dental Insurance'],
            'remote' => $request->remote ?? true,
            'featured' => $request->featured ?? false,
            'status' => $request->status,
            'published_at' => now(),
        ]);

        return redirect()->back()->with('success', __('Job position created and published to Flowmingo ATS successfully!'));
    }

    /**
     * Update an existing Flowmingo job position.
     */
    public function update(Request $request, $id)
    {
        $job = FlowmingoJob::findOrFail($id);

        $request->validate([
            'title' => 'required|string|max:255',
            'status' => 'required|string|in:open,closed',
        ]);

        $job->update([
            'title' => $request->title,
            'department' => $request->department ?? $job->department,
            'employment_type' => $request->employment_type ?? $job->employment_type,
            'location' => $request->location ?? $job->location,
            'salary_min' => $request->salary_min ?? $job->salary_min,
            'salary_max' => $request->salary_max ?? $job->salary_max,
            'salary_currency' => $request->salary_currency ?? $job->salary_currency,
            'status' => $request->status,
            'description' => $request->description ?? $job->description,
            'featured' => $request->has('featured') ? (bool)$request->featured : $job->featured,
            'remote' => $request->has('remote') ? (bool)$request->remote : $job->remote,
        ]);

        return redirect()->back()->with('success', __('Position updated successfully!'));
    }

    /**
     * Remove the specified job position.
     */
    public function destroy($id)
    {
        $job = FlowmingoJob::findOrFail($id);
        $job->delete();

        return redirect()->back()->with('success', __('Job position deleted successfully.'));
    }

    /**
     * Public API endpoint for public dynime.com website jobs sync.
     */
    public function publicApiList(Request $request)
    {
        $query = FlowmingoJob::where('status', 'open');

        if ($request->filled('search')) {
            $s = strtolower($request->search);
            $query->where(function($q) use ($s) {
                $q->whereRaw('LOWER(title) LIKE ?', ["%{$s}%"])
                  ->orWhereRaw('LOWER(department) LIKE ?', ["%{$s}%"])
                  ->orWhereRaw('LOWER(location) LIKE ?', ["%{$s}%"]);
            });
        }

        $jobs = $query->latest()->get();

        return response()->json([
            'data' => $jobs,
            'meta' => [
                'total' => $jobs->count(),
                'current_page' => 1,
                'last_page' => 1,
            ]
        ]);
    }

    /**
     * Public API endpoint for single job detail by slug.
     */
    public function publicApiShow($slug)
    {
        $job = FlowmingoJob::where('slug', $slug)->firstOrFail();
        return response()->json($job);
    }

    /**
     * Seed initial sample Flowmingo jobs if empty.
     */
    private function seedInitialJobs()
    {
        $samples = [
            [
                'flowmingo_job_id' => 'FLM-SR-FULLSTACK',
                'slug' => 'senior-full-stack-developer',
                'title' => 'Senior Full Stack Developer (Laravel & React)',
                'department' => 'Engineering',
                'employment_type' => 'Full-time',
                'location' => 'Remote',
                'salary_min' => 45000,
                'salary_max' => 75000,
                'salary_currency' => 'USD',
                'salary_period' => 'year',
                'salary_range' => 'USD 45,000 – 75,000 / year',
                'description' => 'We are seeking an experienced Senior Full Stack Developer to build and scale modern SaaS enterprise products using Laravel, Inertia, and React.',
                'responsibilities' => [
                    'Architect scalable web applications using Laravel and Inertia React',
                    'Optimize database queries and background job processing queues',
                    'Integrate third-party REST APIs and payment gateways'
                ],
                'requirements' => [
                    '5+ years experience in PHP / Laravel and modern React.js',
                    'Solid understanding of MySQL/PostgreSQL schema design',
                    'Experience with REST APIs, Inertia.js, and Tailwind CSS'
                ],
                'benefits' => ['Competitive Salary', 'Full Remote Work', 'Performance Bonuses', 'Health Insurance'],
                'remote' => true,
                'featured' => true,
                'status' => 'open',
                'published_at' => now(),
            ],
            [
                'flowmingo_job_id' => 'FLM-UI-UX-LEAD',
                'slug' => 'lead-product-ui-ux-designer',
                'title' => 'Lead Product UI/UX Designer',
                'department' => 'Design',
                'employment_type' => 'Full-time',
                'location' => 'Hybrid / Dhaka',
                'salary_min' => 35000,
                'salary_max' => 55000,
                'salary_currency' => 'USD',
                'salary_period' => 'year',
                'salary_range' => 'USD 35,000 – 55,000 / year',
                'description' => 'Join our product design team to craft beautiful, intuitive, and modern user interfaces for SaaS ERP software.',
                'responsibilities' => [
                    'Design intuitive wireframes, interactive prototypes, and polished design systems',
                    'Conduct user research and usability testing',
                    'Collaborate closely with frontend engineers'
                ],
                'requirements' => [
                    '3+ years experience designing complex SaaS products in Figma',
                    'Strong design portfolio showing web app design and design systems'
                ],
                'benefits' => ['Flexible Hours', 'Learning Allowance', 'Health Insurance'],
                'remote' => true,
                'featured' => false,
                'status' => 'open',
                'published_at' => now(),
            ],
            [
                'flowmingo_job_id' => 'FLM-HR-RECRUITER',
                'slug' => 'talent-acquisition-specialist',
                'title' => 'Talent Acquisition & HR Specialist',
                'department' => 'Human Resources',
                'employment_type' => 'Full-time',
                'location' => 'Dhaka Office',
                'salary_min' => 25000,
                'salary_max' => 40000,
                'salary_currency' => 'USD',
                'salary_period' => 'year',
                'salary_range' => 'USD 25,000 – 40,000 / year',
                'description' => 'Manage end-to-end recruitment pipelines, candidate assessments, and onboarding using Flowmingo ATS.',
                'responsibilities' => [
                    'Source, screen, and interview top talent across engineering and design',
                    'Manage onboarding workflows and offer letters'
                ],
                'requirements' => [
                    '2+ years tech recruiting experience',
                    'Excellent communication skills'
                ],
                'benefits' => ['Annual Bonus', 'Medical Insurance'],
                'remote' => false,
                'featured' => false,
                'status' => 'open',
                'published_at' => now(),
            ]
        ];

        foreach ($samples as $sample) {
            FlowmingoJob::updateOrCreate(
                ['flowmingo_job_id' => $sample['flowmingo_job_id']],
                $sample
            );
        }
    }
}
