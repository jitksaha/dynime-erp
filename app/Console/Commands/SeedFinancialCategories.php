<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Workdo\Account\Models\RevenueCategories;
use Workdo\Account\Models\ExpenseCategories;
use App\Models\User;
use Illuminate\Support\Str;

class SeedFinancialCategories extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'account:seed-categories {--creator_id= : Creator/Company User ID}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Seed comprehensive Revenue and Expense/Loss Categories for Accounting System Setup.';

    public function handle()
    {
        $creatorId = $this->option('creator_id');

        if ($creatorId) {
            $creatorIds = [$creatorId];
        } else {
            $creatorIds = User::pluck('id')->toArray();
        }

        $this->info("Seeding financial categories for " . count($creatorIds) . " creator(s)...");

        foreach ($creatorIds as $cId) {
            self::seedForCreator($cId);
        }

        $this->info("Financial categories seeded successfully!");
        return 0;
    }

    public static function seedForCreator($creatorId)
    {
        $revenueCategoriesData = [
            'SaaS & Software' => [
                'SaaS Subscription Revenue',
                'Software License Revenue',
                'ERP Implementation Revenue',
                'Custom Software Development',
                'API & Integration Services',
                'White-label Software Revenue',
            ],
            'Web & Digital Services' => [
                'Website Design Revenue',
                'Website Development Revenue',
                'E-commerce Development',
                'UI/UX Design Services',
                'WordPress Development',
                'Shopify Development',
                'Website Maintenance Plans',
                'Website Migration Services',
                'Website Security Services',
            ],
            'Marketing & Growth' => [
                'SEO Services',
                'PPC / Google Ads Management',
                'Meta Ads Management',
                'Social Media Management',
                'Content Marketing',
                'Email Marketing',
                'Branding & Identity Design',
                'Marketing Consulting',
            ],
            'Business Consulting' => [
                'Business Consulting',
                'Digital Transformation Consulting',
                'Business Strategy Consulting',
                'AI Automation Consulting',
                'CRM Consulting',
                'Process Automation Services',
            ],
            'Business Formation' => [
                'USA Company Registration',
                'UK Company Registration',
                'Registered Agent Services',
                'EIN Application Services',
                'Business Compliance Services',
                'Business Address Services',
            ],
            'Financial & Payment Services' => [
                'Payment Gateway Setup',
                'Merchant Account Setup',
                'PayPal Setup',
                'Stripe Setup',
                'Banking Assistance',
                'International Payment Consulting',
            ],
            'Training' => [
                'Corporate Training',
                'AI Training',
                'Technical Workshops',
                'Online Courses',
                'Documentation Services',
            ],
            'Other Revenue' => [
                'Affiliate Commission',
                'Referral Commission',
                'Marketplace Commission',
                'Digital Product Sales',
                'Template Sales',
                'Hosting Reseller Revenue',
                'Domain Reseller Revenue',
                'Technical Support Plans',
                'Premium Support Contracts',
                'Annual Maintenance Contracts (AMC)',
                'Miscellaneous Income',
                'Interest Income',
                'Foreign Exchange Gain',
            ],
        ];

        $expenseCategoriesData = [
            'Cost of Sales (Direct Costs)' => [
                'Freelancer Payments',
                'Developer Costs',
                'Designer Costs',
                'Project Contractor Fees',
                'Software License (Project Specific)',
                'Domain Purchase Cost',
                'Hosting Purchase Cost',
                'Cloud Infrastructure',
                'Third-party API Costs',
                'Payment Gateway Charges',
                'Merchant Fees',
                'AI API Usage (OpenAI, Claude, Gemini)',
                'SMS Costs',
                'Email Sending Costs',
                'CDN Costs',
            ],
            'Payroll' => [
                'Salaries & Wages',
                'Director Salary',
                'Employee Benefits',
                'Bonuses',
                'Overtime',
                'Recruitment Costs',
                'HR Expenses',
                'Payroll Processing',
            ],
            'Marketing' => [
                'Facebook Advertising',
                'Google Advertising',
                'LinkedIn Advertising',
                'SEO Tools',
                'Email Marketing Tools',
                'Affiliate Commissions',
                'Sponsorship',
                'Event Marketing',
                'Printing & Promotional Materials',
            ],
            'Software & SaaS' => [
                'OpenAI',
                'Claude',
                'Gemini',
                'Slack',
                'Microsoft 365',
                'Google Workspace',
                'Zoom',
                'Notion',
                'Jira',
                'GitHub',
                'Canva',
                'Figma',
                'Adobe Creative Cloud',
                'Cloudflare',
                'Vercel',
                'Railway',
                'Hostinger',
                'Spaceship',
                'DigitalOcean',
                'AWS',
                'Azure',
                'Stripe Fees',
                'PayPal Fees',
            ],
            'Office & Administration' => [
                'Office Rent',
                'Utilities',
                'Internet',
                'Office Supplies',
                'Furniture',
                'Equipment',
                'Computer Purchases',
                'Mobile Phones',
                'Printing',
                'Courier & Shipping',
                'Postage',
            ],
            'Professional Services' => [
                'Legal Fees',
                'Accounting Fees',
                'Audit Fees',
                'Tax Consulting',
                'Compliance Fees',
                'Trademark Registration',
                'Patent Registration',
            ],
            'Travel' => [
                'Airfare',
                'Hotels',
                'Local Transportation',
                'Client Meetings',
                'Meals & Entertainment',
                'Visa Expenses',
            ],
            'Banking & Finance' => [
                'Bank Charges',
                'Currency Conversion Fees',
                'Loan Interest',
                'Merchant Charges',
                'Credit Card Charges',
            ],
            'Insurance' => [
                'Business Insurance',
                'Professional Liability Insurance',
                'Cyber Insurance',
                'Equipment Insurance',
            ],
            'Research & Development' => [
                'Product Development',
                'AI Research',
                'Prototype Development',
                'Testing Environment',
                'Innovation Projects',
            ],
            'IT Infrastructure' => [
                'Servers',
                'Cloud Storage',
                'Backup Services',
                'SSL Certificates',
                'Domain Renewals',
                'Monitoring Services',
                'Security Services',
                'VPN Services',
            ],
            'Taxes' => [
                'VAT/GST Paid',
                'Corporate Tax',
                'Payroll Tax',
                'Sales Tax',
                'Local Taxes',
            ],
            'Miscellaneous' => [
                'Donations',
                'Employee Welfare',
                'Training & Development',
                'Subscription Renewals',
                'Bad Debt Expense',
                'Depreciation',
                'Amortization',
                'Miscellaneous Expenses',
            ],
            'Other Income' => [
                'Interest Income',
                'Dividend Income',
                'Foreign Exchange Gain',
                'Asset Disposal Gain',
                'Refunds Received',
                'Government Grants',
            ],
            'Other Expenses & Losses' => [
                'Foreign Exchange Loss',
                'Penalties & Fines',
                'Bad Debts',
                'Asset Write-off',
                'Miscellaneous Losses',
            ],
        ];

        // Seed Revenue Categories
        $revIndex = 1;
        foreach ($revenueCategoriesData as $group => $items) {
            foreach ($items as $item) {
                $code = 'REV-' . strtoupper(Str::slug($group, '')) . '-' . str_pad((string)$revIndex, 3, '0', STR_PAD_LEFT);
                RevenueCategories::firstOrCreate([
                    'category_name' => $item,
                    'created_by' => $creatorId,
                ], [
                    'category_code' => $code,
                    'description' => $group,
                    'is_active' => '1',
                    'creator_id' => $creatorId,
                    'created_by' => $creatorId,
                ]);
                $revIndex++;
            }
        }

        // Seed Expense Categories
        $expIndex = 1;
        foreach ($expenseCategoriesData as $group => $items) {
            foreach ($items as $item) {
                $code = 'EXP-' . strtoupper(Str::slug($group, '')) . '-' . str_pad((string)$expIndex, 3, '0', STR_PAD_LEFT);
                ExpenseCategories::firstOrCreate([
                    'category_name' => $item,
                    'created_by' => $creatorId,
                ], [
                    'category_code' => $code,
                    'description' => $group,
                    'is_active' => '1',
                    'creator_id' => $creatorId,
                    'created_by' => $creatorId,
                ]);
                $expIndex++;
            }
        }
    }
}
