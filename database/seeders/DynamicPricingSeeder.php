<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DynamicPricingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Copy Service Pricing from dynime_prod
        try {
            $liveServicePricings = DB::connection('mysql')
                ->table('dynime_prod.service_pricing')
                ->get();

            foreach ($liveServicePricings as $row) {
                DB::table('service_pricings')->updateOrInsert(
                    ['service_slug' => $row->service_slug],
                    [
                        'service_title' => $row->service_title,
                        'is_enabled' => $row->is_enabled,
                        'tiers' => $row->tiers,
                        'quote_settings' => $row->quote_settings,
                        'created_at' => $row->created_at ?? now(),
                        'updated_at' => $row->updated_at ?? now(),
                    ]
                );
            }
            $this->command->info("Successfully seeded service_pricings from dynime_prod.");
        } catch (\Exception $e) {
            $this->command->error("Failed to seed service_pricings from dynime_prod: " . $e->getMessage());
        }

        // 2. Manually Seed the 4 eCommerce services that are missing from dynime_prod
        $ecomServices = [
            [
                'service_slug' => 'shopify-ecommerce',
                'service_title' => 'Shopify Ecommerce',
                'is_enabled' => true,
                'tiers' => [
                    [
                        'id' => 's1',
                        'name' => 'Starter',
                        'description' => 'Custom storefront design & store build with standard features',
                        'price_usd' => 499,
                        'period' => 'one-time',
                        'cta_type' => 'fixed',
                        'cta_label' => 'Choose Starter',
                        'highlighted' => false,
                        'features' => [
                            'Complete Shopify store build & setup',
                            'Premium conversion theme customized to your brand',
                            'Up to 50 products imported & collections mapped',
                            'Standard integrations (reviews, upsells, cart triggers)',
                            'Payment gateways (Stripe/PayPal) & shipping setup',
                            'Basic training and launch support'
                        ]
                    ],
                    [
                        'id' => 's2',
                        'name' => 'Basic',
                        'description' => 'Advanced store build with theme custom code & migration',
                        'price_usd' => 999,
                        'period' => 'one-time',
                        'cta_type' => 'fixed',
                        'cta_label' => 'Choose Basic',
                        'highlighted' => false,
                        'features' => [
                            'Everything in Starter',
                            'Up to 150 products',
                            'Custom Shopify theme tweaks (Liquid adjustments)',
                            'SEO-friendly platform migration (retains search ranks)',
                            'Advanced apps setup (abandoned carts, custom discounts)',
                            '2 rounds of theme revisions'
                        ]
                    ],
                    [
                        'id' => 's3',
                        'name' => 'Professional',
                        'description' => 'Custom storefront + private app development',
                        'price_usd' => 1899,
                        'period' => 'one-time + 30-day support',
                        'cta_type' => 'fixed',
                        'cta_label' => 'Choose Professional',
                        'highlighted' => true,
                        'features' => [
                            'Everything in Basic',
                            'Up to 500 products',
                            'Custom Private Shopify App development for custom business logic',
                            'Full multi-currency & language localization setup',
                            'Advanced page speed tuning (PageSpeed score 90+)',
                            '30 days post-launch support'
                        ]
                    ],
                    [
                        'id' => 's4',
                        'name' => 'Premium',
                        'description' => 'Enterprise store with ERP, POS, and recurring checkouts',
                        'price_usd' => 2999,
                        'period' => 'one-time + 90-day care',
                        'cta_type' => 'fixed',
                        'cta_label' => 'Choose Premium',
                        'highlighted' => false,
                        'features' => [
                            'Everything in Professional',
                            'ERP, inventory, or physical POS systems sync integration',
                            'Recurring subscriptions setup (Recharge / Bold)',
                            'A/B testing tools setup for product pages',
                            '90 days post-launch developer care',
                            'Priority support SLA'
                        ]
                    ],
                    [
                        'id' => 's5',
                        'name' => 'Custom Quote',
                        'description' => 'Headless Shopify, multi-store layouts, or customized setups',
                        'price_usd' => null,
                        'period' => 'one-time',
                        'cta_type' => 'quote',
                        'cta_label' => 'Get Custom Quote',
                        'highlighted' => false,
                        'features' => [
                            'Everything in Premium',
                            'Headless Shopify architecture (Hydrogen / Next.js)',
                            'Multi-store international setup',
                            'Custom app backend API hosting setup',
                            'Dedicated e-commerce strategist',
                            '24/7 emergency support contract'
                        ]
                    ]
                ],
                'quote_settings' => [
                    'enable_contact' => true,
                    'enable_modal' => true,
                    'enable_whatsapp' => false,
                    'whatsapp_number' => '',
                    'quote_message' => 'Tell us about your project and we will send a tailored quote within 24 hours.'
                ]
            ],
            [
                'service_slug' => 'wordpress-ecommerce',
                'service_title' => 'WordPress Ecommerce',
                'is_enabled' => true,
                'tiers' => [
                    [
                        'id' => 'w1',
                        'name' => 'Starter',
                        'description' => 'Simple e-commerce setup on WordPress',
                        'price_usd' => 399,
                        'period' => 'one-time',
                        'cta_type' => 'fixed',
                        'cta_label' => 'Choose Starter',
                        'highlighted' => false,
                        'features' => [
                            'WooCommerce, EDD, or Surecart installation & configuration',
                            'Up to 25 products with basic variants',
                            'Standard payment gateways (Stripe & PayPal) configured',
                            'Mobile-responsive storefront layout',
                            'Basic sitemap & SEO setup'
                        ]
                    ],
                    [
                        'id' => 'w2',
                        'name' => 'Basic',
                        'description' => 'Bespoke storefront templates with advanced filters',
                        'price_usd' => 799,
                        'period' => 'one-time',
                        'cta_type' => 'fixed',
                        'cta_label' => 'Choose Basic',
                        'highlighted' => false,
                        'features' => [
                            'Everything in Starter',
                            'Up to 100 products',
                            'Custom theme templates coded to match your identity',
                            'Advanced product search, filters, and comparisons',
                            'Abandoned cart recoveries & coupon setups',
                            '2 rounds of reviews'
                        ]
                    ],
                    [
                        'id' => 'w3',
                        'name' => 'Professional',
                        'description' => 'Headless checkout or custom license generators',
                        'price_usd' => 1499,
                        'period' => 'one-time + 30-day support',
                        'cta_type' => 'fixed',
                        'cta_label' => 'Choose Professional',
                        'highlighted' => true,
                        'features' => [
                            'Everything in Basic',
                            'Up to 300 products',
                            'Surecart customized checkouts OR EDD license key generator',
                            'Custom customer user portals with download locks',
                            'Speed tuning & database indexing (sub-3s load)',
                            '30 days post-launch support'
                        ]
                    ],
                    [
                        'id' => 'w4',
                        'name' => 'Premium',
                        'description' => 'Enterprise WP store with third-party CRM sync',
                        'price_usd' => 2499,
                        'period' => 'one-time + 90-day care',
                        'cta_type' => 'fixed',
                        'cta_label' => 'Choose Premium',
                        'highlighted' => false,
                        'features' => [
                            'Everything in Professional',
                            'API connection to Zoho CRM, ERP, or accounting systems',
                            'Multilingual translation integration (WPML / Polylang)',
                            'Malware shield & security hardening',
                            '90 days post-launch care and backups'
                        ]
                    ],
                    [
                        'id' => 'w5',
                        'name' => 'Custom Quote',
                        'description' => 'Multi-vendor marketplaces, wholesale, or custom plugins',
                        'price_usd' => null,
                        'period' => 'one-time',
                        'cta_type' => 'quote',
                        'cta_label' => 'Get Custom Quote',
                        'highlighted' => false,
                        'features' => [
                            'Everything in Premium',
                            'Multi-vendor marketplace (Dokan / WCFM)',
                            'B2B wholesale dynamic pricing modules',
                            'Custom WooCommerce plugin development',
                            'Dedicated project developer'
                        ]
                    ]
                ],
                'quote_settings' => [
                    'enable_contact' => true,
                    'enable_modal' => true,
                    'enable_whatsapp' => false,
                    'whatsapp_number' => '',
                    'quote_message' => 'Tell us about your project and we will send a tailored quote within 24 hours.'
                ]
            ],
            [
                'service_slug' => 'nodejs-mern-ecommerce',
                'service_title' => 'Nodejs / MERN Ecommerce',
                'is_enabled' => true,
                'tiers' => [
                    [
                        'id' => 'n1',
                        'name' => 'Starter',
                        'description' => 'Headless MERN storefront with core e-commerce API',
                        'price_usd' => 1199,
                        'period' => 'one-time',
                        'cta_type' => 'fixed',
                        'cta_label' => 'Choose Starter',
                        'highlighted' => false,
                        'features' => [
                            'Headless React storefront with Next.js',
                            'Node.js & NestJS backend API services',
                            'Core product catalog database schema (MongoDB/Postgres)',
                            'Standard customer auth (JWT + email/Google)',
                            'Basic admin panel for products'
                        ]
                    ],
                    [
                        'id' => 'n2',
                        'name' => 'Basic',
                        'description' => 'Production-ready headless MERN store with full checkouts',
                        'price_usd' => 2299,
                        'period' => 'one-time',
                        'cta_type' => 'fixed',
                        'cta_label' => 'Choose Basic',
                        'highlighted' => false,
                        'features' => [
                            'Everything in Starter',
                            'Full Stripe custom checkout integration with webhooks',
                            'Advanced product variants, categories, and inventory models',
                            'Email triggers and background invoice generators',
                            'Elasticsearch / Algolia instant product search',
                            '30 days support'
                        ]
                    ],
                    [
                        'id' => 'n3',
                        'name' => 'Professional',
                        'description' => 'Best value — High-scaling headless store with CI/CD',
                        'price_usd' => 3499,
                        'period' => 'one-time + 30-day support',
                        'cta_type' => 'fixed',
                        'cta_label' => 'Choose Professional',
                        'highlighted' => true,
                        'features' => [
                            'Everything in Basic',
                            'Next.js Incremental Static Regeneration (ISR) (sub-1s loads)',
                            'Custom discount engine & voucher structures',
                            'Automated tests (Unit + Integration) & CI/CD pipeline',
                            'Admin portal dashboard with reports and charts',
                            '30 days support'
                        ]
                    ],
                    [
                        'id' => 'n4',
                        'name' => 'Premium',
                        'description' => 'Omnichannel / Multi-tenant store architecture',
                        'price_usd' => 5499,
                        'period' => 'one-time + 90-day care',
                        'cta_type' => 'fixed',
                        'cta_label' => 'Choose Premium',
                        'highlighted' => false,
                        'features' => [
                            'Everything in Professional',
                            'Omnichannel API (serve web, iOS, Android from same backend)',
                            'Multi-tenant database isolation or vendor backend',
                            'Docker containerization & serverless scaling setups',
                            '90 days post-launch support and logs tracking'
                        ]
                    ],
                    [
                        'id' => 'n5',
                        'name' => 'Custom Quote',
                        'description' => 'Enterprise multi-region e-commerce networks',
                        'price_usd' => null,
                        'period' => 'one-time',
                        'cta_type' => 'quote',
                        'cta_label' => 'Get Custom Quote',
                        'highlighted' => false,
                        'features' => [
                            'Everything in Premium',
                            'Multi-region deployment and local caches',
                            'Tailored admin dashboard with Elasticsearch logs analytics',
                            'Custom ERP/SAP sync connections',
                            'Dedicated senior backend developer'
                        ]
                    ]
                ],
                'quote_settings' => [
                    'enable_contact' => true,
                    'enable_modal' => true,
                    'enable_whatsapp' => false,
                    'whatsapp_number' => '',
                    'quote_message' => 'Tell us about your project and we will send a tailored quote within 24 hours.'
                ]
            ],
            [
                'service_slug' => 'laravel-ecommerce',
                'service_title' => 'Laravel Ecommerce',
                'is_enabled' => true,
                'tiers' => [
                    [
                        'id' => 'l1',
                        'name' => 'Starter',
                        'description' => 'Besopke Laravel store with Blade frontend & Filament admin',
                        'price_usd' => 899,
                        'period' => 'one-time',
                        'cta_type' => 'fixed',
                        'cta_label' => 'Choose Starter',
                        'highlighted' => false,
                        'features' => [
                            'Laravel e-commerce backend built with clean models',
                            'Filament admin panel setup (catalog, orders, customers)',
                            'Stripe or PayPal checkout integration',
                            'Standard relational database layout (MySQL)',
                            'Basic cache tuning'
                        ]
                    ],
                    [
                        'id' => 'l2',
                        'name' => 'Basic',
                        'description' => 'Laravel Livewire/Alpine storefront with background queues',
                        'price_usd' => 1799,
                        'period' => 'one-time',
                        'cta_type' => 'fixed',
                        'cta_label' => 'Choose Basic',
                        'highlighted' => false,
                        'features' => [
                            'Everything in Starter',
                            'Dynamic Livewire/Alpine.js reactive storefront',
                            'Laravel background queues for emails, syncs, and logs',
                            'Custom discount coupons & dynamic pricing rules',
                            'Advanced shipping fees calculator API integration',
                            '30 days support'
                        ]
                    ],
                    [
                        'id' => 'l3',
                        'name' => 'Professional',
                        'description' => 'High-security custom Laravel store with advanced modules',
                        'price_usd' => 2799,
                        'period' => 'one-time + 30-day support',
                        'cta_type' => 'fixed',
                        'cta_label' => 'Choose Professional',
                        'highlighted' => true,
                        'features' => [
                            'Everything in Basic',
                            'Bespoke security hardening & SQL protection tests',
                            'Filament dashboard customized with charts and analytics',
                            'API connection for CRM or inventory updates',
                            'Full SEO dynamic schema generators',
                            '30 days support'
                        ]
                    ],
                    [
                        'id' => 'l4',
                        'name' => 'Premium',
                        'description' => 'Laravel headless store with separate frontend',
                        'price_usd' => 4499,
                        'period' => 'one-time + 90-day care',
                        'cta_type' => 'fixed',
                        'cta_label' => 'Choose Premium',
                        'highlighted' => false,
                        'features' => [
                            'Everything in Professional',
                            'Laravel API backend with separate Next.js or React frontend',
                            'Multi-warehouse inventory management configurations',
                            'Load testing & performance tuning (caching grids)',
                            '90 days post-launch developer care'
                        ]
                    ],
                    [
                        'id' => 'l5',
                        'name' => 'Custom Quote',
                        'description' => 'Custom e-commerce platforms or ERP systems',
                        'price_usd' => null,
                        'period' => 'one-time',
                        'cta_type' => 'quote',
                        'cta_label' => 'Get Custom Quote',
                        'highlighted' => false,
                        'features' => [
                            'Everything in Premium',
                            'Full ERP / legacy database integration mapping',
                            'Bespoke multi-currency & tax calculators',
                            'Dedicated project lead developer',
                            'SLA-backed support contracts'
                        ]
                    ]
                ],
                'quote_settings' => [
                    'enable_contact' => true,
                    'enable_modal' => true,
                    'enable_whatsapp' => false,
                    'whatsapp_number' => '',
                    'quote_message' => 'Tell us about your project and we will send a tailored quote within 24 hours.'
                ]
            ]
        ];

        foreach ($ecomServices as $service) {
            DB::table('service_pricings')->updateOrInsert(
                ['service_slug' => $service['service_slug']],
                [
                    'service_title' => $service['service_title'],
                    'is_enabled' => $service['is_enabled'],
                    'tiers' => json_encode($service['tiers']),
                    'quote_settings' => json_encode($service['quote_settings']),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
        $this->command->info("Successfully seeded eCommerce services.");

        // 3. Copy USA State Pricing
        try {
            $liveStatePricings = DB::connection('mysql')
                ->table('dynime_prod.usa_state_pricing')
                ->get();

            foreach ($liveStatePricings as $row) {
                DB::table('usa_state_pricings')->updateOrInsert(
                    ['abbr' => $row->abbr],
                    [
                        'state' => $row->state,
                        'llc_formation' => $row->llc_formation,
                        'corp_formation' => $row->corp_formation,
                        'llc_annual' => $row->llc_annual,
                        'llc_annual_label' => $row->llc_annual_label,
                        'corp_annual' => $row->corp_annual,
                        'corp_annual_label' => $row->corp_annual_label,
                        'llc_renewal' => $row->llc_renewal,
                        'corp_renewal' => $row->corp_renewal,
                        'state_tax_note' => $row->state_tax_note,
                        'franchise_tax' => $row->franchise_tax,
                        'notes' => $row->notes,
                        'sort_order' => $row->sort_order,
                        'is_active' => $row->is_active,
                        'created_at' => $row->created_at ?? now(),
                        'updated_at' => $row->updated_at ?? now(),
                    ]
                );
            }
            $this->command->info("Successfully seeded usa_state_pricings from dynime_prod.");
        } catch (\Exception $e) {
            $this->command->error("Failed to seed usa_state_pricings: " . $e->getMessage());
        }
    }
}
