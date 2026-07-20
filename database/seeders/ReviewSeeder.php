<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Review;

class ReviewSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $reviews = [
            [
                'name' => 'Sarah Chen',
                'position' => 'CEO',
                'business_name' => 'TechFlow',
                'rating' => 5,
                'review' => 'Dynime transformed our entire digital presence. Revenue increased 340% within 6 months of launching our new platform.',
                'status' => 'approved',
                'is_featured' => true,
            ],
            [
                'name' => 'Marcus Johnson',
                'position' => 'Founder',
                'business_name' => 'GreenLeaf',
                'rating' => 5,
                'review' => 'The e-commerce solution they built handles 10K+ orders daily without breaking a sweat. Truly enterprise-grade work.',
                'status' => 'approved',
                'is_featured' => true,
            ],
            [
                'name' => 'Elena Rodriguez',
                'position' => 'CMO',
                'business_name' => 'StyleVault',
                'rating' => 5,
                'review' => 'Their marketing strategy and SEO work doubled our organic traffic. The ROI speaks for itself.',
                'status' => 'approved',
                'is_featured' => true,
            ],
            [
                'name' => 'David Park',
                'position' => 'CTO',
                'business_name' => 'DataSync',
                'rating' => 5,
                'review' => 'Clean architecture, excellent documentation, and a team that truly understands scalability. Highly recommend.',
                'status' => 'approved',
                'is_featured' => true,
            ],
            [
                'name' => 'Amina Okafor',
                'position' => 'CEO',
                'business_name' => 'NovaBrand',
                'rating' => 5,
                'review' => 'From brand strategy to Facebook Ads, Dynime helped us go from zero to 50K followers in just 3 months.',
                'status' => 'approved',
                'is_featured' => true,
            ],
            [
                'name' => 'James Wright',
                'position' => 'Founder',
                'business_name' => 'CloudBase',
                'rating' => 5,
                'review' => 'They set up our US LLC, payment gateways, and website in under 2 weeks. Incredible speed and professionalism.',
                'status' => 'approved',
                'is_featured' => true,
            ],
            [
                'name' => 'Sophia Lee',
                'position' => 'Director',
                'business_name' => 'PixelCraft',
                'rating' => 5,
                'review' => 'The UI/UX redesign they delivered increased our conversion rate by 180%. Worth every penny.',
                'status' => 'approved',
                'is_featured' => true,
            ],
            [
                'name' => 'Rahul Mehta',
                'position' => 'COO',
                'business_name' => 'FastShip',
                'rating' => 5,
                'review' => 'Our Shopify store went from 2s load time to under 0.8s. Page speed optimization was a game changer.',
                'status' => 'approved',
                'is_featured' => true,
            ],
            [
                'name' => 'Lisa Tanaka',
                'position' => 'VP',
                'business_name' => 'BrightEdge',
                'rating' => 5,
                'review' => 'Dynime\'s SEO strategies got us to page 1 for 15+ competitive keywords within 4 months.',
                'status' => 'approved',
                'is_featured' => true,
            ],
            [
                'name' => 'Carlos Diaz',
                'position' => 'Founder',
                'business_name' => 'Vendora',
                'rating' => 5,
                'review' => 'Their WooCommerce solution is rock solid. We process thousands of transactions daily without a hitch.',
                'status' => 'approved',
                'is_featured' => true,
            ],
            [
                'name' => 'Nina Petrova',
                'position' => 'CMO',
                'business_name' => 'UrbanStyle',
                'rating' => 5,
                'review' => 'The Google Ads campaigns they manage consistently deliver 5x ROAS. Exceptional paid media team.',
                'status' => 'approved',
                'is_featured' => true,
            ],
            [
                'name' => 'Tom Harris',
                'position' => 'CTO',
                'business_name' => 'ScaleUp',
                'rating' => 5,
                'review' => 'Migrated our entire platform with zero downtime. Their technical expertise is truly next level.',
                'status' => 'approved',
                'is_featured' => true,
            ],
            [
                'name' => 'Tanvir H.',
                'position' => 'CTO',
                'business_name' => 'BD-commerce co.',
                'rating' => 5,
                'review' => 'We replaced three SaaS gateways with one self-hosted PayOSS deploy. Saved 4% on every transaction.',
                'status' => 'approved',
                'is_featured' => true,
            ],
            [
                'name' => 'Nusrat K.',
                'position' => 'Founder',
                'business_name' => 'freelance studio',
                'rating' => 5,
                'review' => 'Personal bKash automation alone is worth it. Reconciliation went from hours to seconds.',
                'status' => 'approved',
                'is_featured' => true,
            ],
            [
                'name' => 'Rakib A.',
                'position' => 'Eng lead',
                'business_name' => 'logistics SaaS',
                'rating' => 5,
                'review' => 'Forking PayOSS let us white-label a gateway for our marketplace in two weeks.',
                'status' => 'approved',
                'is_featured' => true,
            ],
        ];

        foreach ($reviews as $reviewData) {
            Review::firstOrCreate(
                ['name' => $reviewData['name'], 'business_name' => $reviewData['business_name']],
                $reviewData
            );
        }
    }
}
