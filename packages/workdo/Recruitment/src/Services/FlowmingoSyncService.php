<?php

namespace Workdo\Recruitment\Services;

use Workdo\Recruitment\Models\JobPosting;
use Workdo\Hrm\Models\Department;
use Workdo\Hrm\Models\Designation;
use Workdo\Hrm\Models\Branch;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class FlowmingoSyncService
{
    /**
     * Master list of comprehensive, fully-detailed official published positions.
     */
    public static function getMasterFlowmingoJobs(): array
    {
        return [
            [
                "code" => "FLOW-001",
                "title" => "Performance Marketer",
                "department" => "Marketing & Growth",
                "designation" => "Performance Marketer",
                "min_salary" => 4500,
                "max_salary" => 6000,
                "salary_rate" => "monthly",
                "skills" => "Performance Marketing, Google Ads, Meta Ads Manager, ROAS Optimization, Conversion Rate Optimization, Google Analytics 4, Retargeting Campaigns, B2B SaaS Growth",
                "description" => "<h3>About the Role</h3><p>Dynime is looking for an exceptional, data-driven <strong>Performance Marketer</strong> to lead and scale our global user acquisition engines. You will be responsible for planning, executing, and optimizing high-impact paid advertising campaigns across Google Ads, Meta (Facebook & Instagram), LinkedIn, and programmatic channels.</p><h3>Key Responsibilities</h3><ul><li>Architect, launch, and manage scalable paid acquisition campaigns across Google Search/Performance Max, Meta Ads, and LinkedIn Ads.</li><li>Continuously test ad copy, creatives, landing pages, and audience targeting to maximize conversion rates and optimize Customer Acquisition Cost (CAC).</li><li>Monitor daily, weekly, and monthly ROAS, LTV:CAC ratios, CPA, and pipeline attribution metrics using GA4, Triple Whale, and internal dashboards.</li><li>Collaborate with our creative design and content teams to produce high-converting video and static ad creatives.</li><li>Conduct in-depth keyword research, competitor analysis, and market trend assessments to identify new paid acquisition opportunities.</li><li>Manage substantial multi-channel advertising budgets with strict accountability to ROI targets.</li></ul>",
                "requirements" => "<h3>Qualifications & Experience</h3><ul><li>3+ years of proven track record in performance marketing, growth marketing, or media buying for high-growth SaaS or tech platforms.</li><li>Demonstrated experience profitably managing and scaling multi-thousand dollar monthly ad budgets.</li><li>Deep hands-on expertise with Google Ads, Meta Ads Manager, LinkedIn Campaign Manager, and Google Tag Manager.</li><li>Strong analytical mindset with proficiency in Google Analytics 4, Excel/Google Sheets modeling, and BI reporting tools.</li><li>Experience running systematic A/B and multivariate tests on landing pages and ad creatives.</li><li>Excellent English communication skills and ability to present data-driven strategic insights.</li></ul>",
                "benefits" => "<h3>What We Offer</h3><ul><li>Competitive monthly compensation with performance-based bonuses.</li><li>100% remote flexibility — work from anywhere in the world.</li><li>Comprehensive health and wellness benefits allowance.</li><li>Annual $1,500 personal learning and professional development stipend.</li><li>Modern equipment setup allowance for your home workspace.</li><li>Paid annual leave, sick leave, and global holiday calendar.</li></ul>",
                "apply_url" => "https://talent.flowmingo.ai/interview",
                "is_featured" => true,
            ],
            [
                "code" => "FLOW-002",
                "title" => "International Sales Executive (Remote)",
                "department" => "Sales & Business Development",
                "designation" => "International Sales Executive (Remote)",
                "min_salary" => 2200,
                "max_salary" => 3600,
                "salary_rate" => "monthly",
                "skills" => "B2B SaaS Sales, Outbound Prospecting, Discovery Calls, Contract Negotiation, CRM Management, Pipeline Velocity, Global Client Relations",
                "description" => "<h3>About the Role</h3><p>We are seeking an ambitious, results-driven <strong>International Sales Executive</strong> to spearhead our outbound sales and close high-value B2B SaaS contracts with enterprise and mid-market clients across North America, Europe, and Asia-Pacific.</p><h3>Key Responsibilities</h3><ul><li>Identify, prospect, and engage decision-makers (CEOs, CTOs, Operations Directors) across global target markets.</li><li>Conduct high-impact product demonstrations, consultative discovery calls, and presentations showcasing Dynime’s ERP and automation solutions.</li><li>Manage the entire sales cycle from initial contact to contract negotiation, objection handling, and deal closure.</li><li>Maintain accurate sales forecasting, deal pipeline data, and activity logs within our CRM system.</li><li>Collaborate with Customer Success and Product teams to ensure seamless client onboarding and handoffs.</li><li>Achieve and exceed monthly and quarterly sales revenue quotas.</li></ul>",
                "requirements" => "<h3>Qualifications & Experience</h3><ul><li>2+ years of successful track record in B2B SaaS sales, software enterprise sales, or international account executive roles.</li><li>Native or near-native English fluency (written and spoken) with exceptional communication and pitch skills.</li><li>Proven ability to navigate complex sales cycles and negotiate enterprise agreements.</li><li>Proficiency with modern sales stacks: CRM (HubSpot/Salesforce), LinkedIn Sales Navigator, Apollo.io, and Loom.</li><li>Self-motivated, proactive work ethic capable of driving revenue in a fully remote environment.</li></ul>",
                "benefits" => "<h3>What We Offer</h3><ul><li>Competitive base salary plus uncapped commission structure with lucrative accelerator tiers.</li><li>100% remote working freedom with flexible schedule alignment.</li><li>Extensive sales enablement training and executive mentorship.</li><li>Comprehensive health benefits and wellness support.</li><li>Generous paid time off and international paid holidays.</li></ul>",
                "apply_url" => "https://talent.flowmingo.ai/interview",
                "is_featured" => false,
            ],
            [
                "code" => "FLOW-003",
                "title" => "HR Executive (Recruitment & General HR)",
                "department" => "Human Resources",
                "designation" => "HR Executive (Recruitment & General HR)",
                "min_salary" => 1800,
                "max_salary" => 2800,
                "salary_rate" => "monthly",
                "skills" => "Talent Acquisition, Technical Recruitment, Employee Onboarding, HR Operations, Performance Management, People Culture, Remote HR Best Practices",
                "description" => "<h3>About the Role</h3><p>Dynime is scaling rapidly and we are looking for a dedicated <strong>HR Executive</strong> to oversee our talent acquisition operations, candidate interview pipelines, and global employee experience initiatives.</p><h3>Key Responsibilities</h3><ul><li>Manage the end-to-end recruitment lifecycle: job posting, candidate sourcing, initial screening, interview scheduling, and offer extensions.</li><li>Coordinate with department hiring managers to define role requirements, competency frameworks, and evaluation scorecards.</li><li>Lead employee onboarding and orientation programs to ensure new hires integrate seamlessly into our distributed team culture.</li><li>Administer HR operations including attendance, leave management, employee contracts, and compliance.</li><li>Facilitate employee engagement, quarterly performance reviews, team wellness initiatives, and culture activities.</li></ul>",
                "requirements" => "<h3>Qualifications & Experience</h3><ul><li>2+ years of experience in recruitment or general HR operations, preferably within technology companies or high-growth startups.</li><li>Strong understanding of modern recruitment platforms, ATS systems (e.g., Flowmingo, Workday), and LinkedIn Recruiter.</li><li>Excellent interpersonal and communication skills with a strong sense of empathy and professionalism.</li><li>Familiarity with remote workplace policies, labor compliance, and global hiring considerations.</li><li>High organizational skills with meticulous attention to detail.</li></ul>",
                "benefits" => "<h3>What We Offer</h3><ul><li>Competitive salary with annual performance incentives.</li><li>Flexible remote work arrangement.</li><li>Health coverage and wellness reimbursement.</li><li>Professional HR certification and course sponsorship budget.</li><li>Inclusive, forward-thinking global team culture.</li></ul>",
                "apply_url" => "https://talent.flowmingo.ai/interview",
                "is_featured" => false,
            ],
            [
                "code" => "FLOW-004",
                "title" => "Social Media & Brand Executive",
                "department" => "Marketing & Growth",
                "designation" => "Social Media & Brand Executive",
                "min_salary" => 2000,
                "max_salary" => 3200,
                "salary_rate" => "monthly",
                "skills" => "Social Media Strategy, Brand Storytelling, Community Management, Copywriting, Content Calendar, LinkedIn Marketing, Twitter/X Growth, Engagement Analytics",
                "description" => "<h3>About the Role</h3><p>We are seeking a creative, culturally-attuned <strong>Social Media & Brand Executive</strong> to build Dynime’s digital presence, tell our brand story, and cultivate an active community of business owners, founders, and tech leaders.</p><h3>Key Responsibilities</h3><ul><li>Formulate and execute organic social media growth strategies across LinkedIn, Twitter/X, YouTube, Instagram, and TikTok.</li><li>Craft compelling copywriting, thought leadership articles, product update teasers, and industry insights.</li><li>Engage actively with industry communities, influencers, and followers to foster brand loyalty and brand advocacy.</li><li>Collaborate with graphic designers and video editors to produce captivating visual assets.</li><li>Track social KPIs including reach, engagement rate, follower growth, and referral traffic to inform content direction.</li></ul>",
                "requirements" => "<h3>Qualifications & Experience</h3><ul><li>2+ years of proven experience managing corporate or B2B brand social media channels with verifiable growth achievements.</li><li>Exceptional English writing and copywriting skills with a witty, authoritative, yet approachable tone of voice.</li><li>Proficiency with social media management tools (Buffer, Hootsuite, Sprout Social) and design tools like Figma or Canva.</li><li>Deep understanding of platform algorithms, viral trends, and B2B SaaS positioning.</li></ul>",
                "benefits" => "<h3>What We Offer</h3><ul><li>Competitive compensation package with growth bonuses.</li><li>Full remote flexibility.</li><li>Access to leading creative AI tools and premium social platforms.</li><li>Paid time off, health insurance support, and annual team retreats.</li></ul>",
                "apply_url" => "https://talent.flowmingo.ai/interview",
                "is_featured" => false,
            ],
            [
                "code" => "FLOW-005",
                "title" => "Creative Content Creator / Video Editor",
                "department" => "Marketing & Growth",
                "designation" => "Creative Content Creator / Video Editor",
                "min_salary" => 2200,
                "max_salary" => 3500,
                "salary_rate" => "monthly",
                "skills" => "Video Editing, Adobe Premiere Pro, After Effects, Motion Graphics, Short-form Video (Reels/Shorts/TikTok), Product Demos, Creative Storytelling",
                "description" => "<h3>About the Role</h3><p>Dynime is looking for a talented <strong>Creative Content Creator & Video Editor</strong> to produce dynamic video content that educates, inspires, and converts audiences across our digital marketing channels.</p><h3>Key Responsibilities</h3><ul><li>Produce, edit, and optimize short-form and long-form video content for YouTube, LinkedIn, Instagram Reels, TikTok, and paid ad campaigns.</li><li>Create engaging product walkthroughs, tutorial videos, customer testimonial reels, and animated explainer snippets.</li><li>Integrate motion graphics, typography, sound design, and color grading to create premium-grade visual productions.</li><li>Collaborate with the growth marketing team to test different hooks, pacing, and visual storytelling formats for maximum retention and conversion.</li></ul>",
                "requirements" => "<h3>Qualifications & Experience</h3><ul><li>2+ years of professional video editing and motion graphics experience with a strong portfolio or showreel.</li><li>Expert proficiency in Adobe Creative Suite (Premiere Pro, After Effects, Photoshop, Illustrator) or DaVinci Resolve.</li><li>Strong understanding of sound design, pacing, typography, and visual engagement hooks.</li><li>Ability to translate complex SaaS and business automation concepts into clear, engaging visual stories.</li></ul>",
                "benefits" => "<h3>What We Offer</h3><ul><li>Competitive monthly compensation and high-performance bonuses.</li><li>Remote work with hardware and software subscription allowances.</li><li>Health coverage, learning stipends, and flexible hours.</li></ul>",
                "apply_url" => "https://talent.flowmingo.ai/interview",
                "is_featured" => false,
            ],
            [
                "code" => "FLOW-006",
                "title" => "Social Media & Brand Executive (US Team)",
                "department" => "Marketing & Growth",
                "designation" => "Social Media & Brand Executive (US Team)",
                "min_salary" => 2500,
                "max_salary" => 4000,
                "salary_rate" => "monthly",
                "skills" => "US Market Marketing, B2B Social Strategy, Executive Personal Branding, PR & Media Relations, Content Syndication, Viral Campaigns",
                "description" => "<h3>About the Role</h3><p>We are expanding our North American footprint and seeking a specialized <strong>Social Media & Brand Executive (US Team)</strong> aligned with US time zones to elevate Dynime’s presence in the US enterprise and startup ecosystem.</p><h3>Key Responsibilities</h3><ul><li>Lead US-centric social campaigns and brand positioning initiatives aligned with North American market trends.</li><li>Manage executive branding for Dynime founders on LinkedIn and industry podcasts.</li><li>Drive outreach to tech journalists, podcast hosts, and newsletter creators to secure organic PR and brand mentions.</li><li>Collaborate with US-based sales representatives to coordinate targeted account-based marketing (ABM) social campaigns.</li></ul>",
                "requirements" => "<h3>Qualifications & Experience</h3><ul><li>2+ years of experience in US B2B tech brand management or social marketing.</li><li>Native English proficiency with deep cultural context of the US business and software landscape.</li><li>Track record of building viral B2B discussions and building engaged founder communities.</li><li>Ability to work across Eastern or Pacific Standard Time working windows.</li></ul>",
                "benefits" => "<h3>What We Offer</h3><ul><li>Competitive US-aligned compensation.</li><li>Remote work environment.</li><li>Full healthcare reimbursement and career advancement opportunities.</li></ul>",
                "apply_url" => "https://talent.flowmingo.ai/interview",
                "is_featured" => false,
            ],
            [
                "code" => "FLOW-007",
                "title" => "CRM & Automation Specialist",
                "department" => "Operations & Technology",
                "designation" => "CRM & Automation Specialist",
                "min_salary" => 3000,
                "max_salary" => 4800,
                "salary_rate" => "monthly",
                "skills" => "CRM Architecture, HubSpot, Make.com, Zapier, Webhooks, API Integrations, Lead Routing, Workflow Automation, Data Hygiene",
                "description" => "<h3>About the Role</h3><p>Dynime is seeking a seasoned <strong>CRM & Automation Specialist</strong> to architect, maintain, and optimize our revenue operations, workflow automations, and data syncs across our entire tech stack.</p><h3>Key Responsibilities</h3><ul><li>Design, build, and maintain complex multi-step automations using Make.com, Zapier, n8n, and custom webhooks.</li><li>Manage our CRM infrastructure (HubSpot/Dynime CRM), ensuring accurate lead routing, lifecycle stage progression, and data hygiene.</li><li>Build automated email sequences, transactional alerts, and sales enablement notifications.</li><li>Troubleshoot integration failures, sync errors, and data discrepancies across marketing, sales, and billing platforms.</li><li>Create analytical dashboards tracking funnel velocity, conversion bottlenecks, and automation health.</li></ul>",
                "requirements" => "<h3>Qualifications & Experience</h3><ul><li>3+ years of hands-on experience in CRM administration (HubSpot/Salesforce) and RevOps automation tools.</li><li>Expertise with REST APIs, JSON payloads, Webhooks, and no-code/low-code iPaaS platforms.</li><li>Strong analytical mindset with high standards for data accuracy and system reliability.</li><li>Basic knowledge of SQL or JavaScript is a strong advantage.</li></ul>",
                "benefits" => "<h3>What We Offer</h3><ul><li>Attractive salary package with performance incentives.</li><li>100% remote work flexibility.</li><li>Access to state-of-the-art developer and automation tools.</li><li>Health coverage, learning stipend, and comprehensive PTO.</li></ul>",
                "apply_url" => "https://talent.flowmingo.ai/interview",
                "is_featured" => false,
            ],
            [
                "code" => "FLOW-008",
                "title" => "Operations & Project Manager",
                "department" => "Operations & Technology",
                "designation" => "Operations & Project Manager",
                "min_salary" => 3500,
                "max_salary" => 5500,
                "salary_rate" => "monthly",
                "skills" => "Agile Project Management, Scrum, Cross-Functional Leadership, Sprint Planning, Jira/ClickUp, KPI Tracking, Process Optimization",
                "description" => "<h3>About the Role</h3><p>We are looking for a rigorous, proactive <strong>Operations & Project Manager</strong> to coordinate cross-functional teams, streamline delivery pipelines, and drive operational excellence across our product and engineering initiatives.</p><h3>Key Responsibilities</h3><ul><li>Lead sprint planning, daily standups, backlog refinement, and retrospectives for multidisciplinary product teams.</li><li>Define project scopes, timelines, milestone deliverables, and resource allocations with clear KPI targets.</li><li>Identify operational bottlenecks, mitigate risks, and optimize internal standard operating procedures (SOPs).</li><li>Facilitate transparent communication between leadership, product managers, engineers, and customer-facing teams.</li><li>Track project health metrics and deliver executive status reports.</li></ul>",
                "requirements" => "<h3>Qualifications & Experience</h3><ul><li>3+ years of experience in project management or operations management within a SaaS or tech environment.</li><li>PMP, Scrum Master (CSM), or Agile certification is preferred.</li><li>Proficiency in modern project management tools (ClickUp, Jira, Linear, Notion).</li><li>Exceptional problem-solving, negotiation, and cross-team alignment capabilities.</li></ul>",
                "benefits" => "<h3>What We Offer</h3><ul><li>Competitive salary with leadership bonus structure.</li><li>Remote work flexibility.</li><li>Comprehensive health insurance, annual retreat, and wellness benefits.</li></ul>",
                "apply_url" => "https://talent.flowmingo.ai/interview",
                "is_featured" => false,
            ],
            [
                "code" => "FLOW-009",
                "title" => "Content & SEO Specialist",
                "department" => "Marketing & Growth",
                "designation" => "Content & SEO Specialist",
                "min_salary" => 2200,
                "max_salary" => 3600,
                "salary_rate" => "monthly",
                "skills" => "SEO Strategy, Technical SEO, Keyword Research, Long-form Content, Ahrefs, SEMrush, On-Page Optimization, Backlink Strategy",
                "description" => "<h3>About the Role</h3><p>Dynime is looking for an analytical <strong>Content & SEO Specialist</strong> to drive organic search dominance, keyword rankings, and high-converting inbound traffic for our enterprise software suite.</p><h3>Key Responsibilities</h3><ul><li>Conduct rigorous keyword research, topic clustering, and search intent mapping to build our content roadmap.</li><li>Write and edit authoritative, in-depth articles, case studies, whitepapers, and product guides optimized for search engines.</li><li>Execute technical SEO audits: Core Web Vitals, site architecture, schema markup, and internal linking structures.</li><li>Build and manage white-hat backlink acquisition and digital PR campaigns.</li><li>Monitor rankings, organic impressions, and organic conversions using Google Search Console, Ahrefs, and GA4.</li></ul>",
                "requirements" => "<h3>Qualifications & Experience</h3><ul><li>2+ years of dedicated SEO and content marketing experience for B2B SaaS or technology companies.</li><li>Proven track record of driving organic traffic and top 3 keyword rankings for competitive search queries.</li><li>Expertise with Ahrefs, SEMrush, Screaming Frog, SurferSEO, and WordPress/CMS platforms.</li><li>Flawless English writing skills with the ability to explain complex business software in an engaging manner.</li></ul>",
                "benefits" => "<h3>What We Offer</h3><ul><li>Competitive monthly compensation and organic milestone bonuses.</li><li>Remote work flexibility and flexible hours.</li><li>Professional development stipend and health benefits.</li></ul>",
                "apply_url" => "https://talent.flowmingo.ai/interview",
                "is_featured" => false,
            ],
            [
                "code" => "FLOW-010",
                "title" => "Regional Business Development Manager",
                "department" => "Sales & Business Development",
                "designation" => "Regional Business Development Manager",
                "min_salary" => 3500,
                "max_salary" => 5500,
                "salary_rate" => "monthly",
                "skills" => "Regional Sales Strategy, Enterprise Business Development, Channel Partnerships, High-Value Deal Negotiation, Revenue Growth",
                "description" => "<h3>About the Role</h3><p>We are seeking an experienced <strong>Regional Business Development Manager</strong> to lead market penetration, client partnerships, and strategic revenue growth in designated geographical regions.</p><h3>Key Responsibilities</h3><ul><li>Develop and execute strategic business development plans to capture market share in target regional markets.</li><li>Establish relationships with enterprise clients, ERP consulting agencies, and system integrators.</li><li>Conduct high-level commercial negotiations, custom proposal drafting, and executive pitching.</li><li>Represent Dynime at regional industry conferences, webinars, and partner events.</li><li>Achieve regional revenue targets and report market intelligence to the executive team.</li></ul>",
                "requirements" => "<h3>Qualifications & Experience</h3><ul><li>4+ years of proven business development or enterprise sales experience in B2B software/SaaS.</li><li>Strong existing network of enterprise contacts and reseller partnerships in target regions.</li><li>Demonstrated ability to close six-figure annual contract value (ACV) deals.</li><li>Outstanding commercial acumen, contract negotiation, and presentation skills.</li></ul>",
                "benefits" => "<h3>What We Offer</h3><ul><li>Substantial base salary plus lucrative regional revenue commission.</li><li>Flexible remote arrangement with travel expense account.</li><li>Executive wellness, health coverage, and leadership stock options.</li></ul>",
                "apply_url" => "https://talent.flowmingo.ai/interview",
                "is_featured" => false,
            ],
            [
                "code" => "FLOW-011",
                "title" => "Partnership & Outreach Executive",
                "department" => "Sales & Business Development",
                "designation" => "Partnership & Outreach Executive",
                "min_salary" => 2000,
                "max_salary" => 3200,
                "salary_rate" => "monthly",
                "skills" => "Strategic Partnerships, Cold Outreach, Affiliate Management, Co-Marketing, B2B Relationship Building, Pipeline Development",
                "description" => "<h3>About the Role</h3><p>Dynime is seeking an energetic <strong>Partnership & Outreach Executive</strong> to forge co-marketing agreements, affiliate programs, and strategic technology alliances that drive mutual user growth.</p><h3>Key Responsibilities</h3><ul><li>Identify, contact, and negotiate partnerships with complementary SaaS platforms, agencies, and industry influencers.</li><li>Coordinate joint webinars, co-branded eBooks, newsletter swaps, and integration directory listings.</li><li>Manage and scale our affiliate and referral partner program with active recruitment and enablement.</li><li>Track partner-sourced pipeline revenue and optimize partner tiering programs.</li></ul>",
                "requirements" => "<h3>Qualifications & Experience</h3><ul><li>2+ years of experience in B2B partnerships, business development outreach, or affiliate management.</li><li>Excellent relationship-building and persuasive outreach communication skills.</li><li>Familiarity with partner relationship management (PRM) tools and email outreach platforms.</li></ul>",
                "benefits" => "<h3>What We Offer</h3><ul><li>Competitive base salary and partner-deal commission bonus.</li><li>Remote work environment.</li><li>Health coverage, learning stipends, and flexible schedule.</li></ul>",
                "apply_url" => "https://talent.flowmingo.ai/interview",
                "is_featured" => false,
            ],
            [
                "code" => "FLOW-012",
                "title" => "Sales Development Representative (SDR) / Lead Generation Executive",
                "department" => "Sales & Business Development",
                "designation" => "Sales Development Representative (SDR)",
                "min_salary" => 1600,
                "max_salary" => 2600,
                "salary_rate" => "monthly",
                "skills" => "Lead Generation, Cold Emailing, Cold Calling, Apollo.io, LinkedIn Sales Navigator, Qualification Calls, Pipeline Creation",
                "description" => "<h3>About the Role</h3><p>We are looking for a tenacious, highly organized <strong>Sales Development Representative (SDR)</strong> to fuel our sales engine by identifying qualified enterprise leads and booking discovery meetings for Account Executives.</p><h3>Key Responsibilities</h3><ul><li>Execute targeted multi-channel outbound prospecting campaigns (Email, LinkedIn, Phone, Video).</li><li>Qualify inbound marketing leads based on budget, authority, need, and timeline (BANT framework).</li><li>Book qualified sales meetings and discovery calls for senior Account Executives.</li><li>Maintain high outbound activity volume and rigorous CRM data accuracy.</li></ul>",
                "requirements" => "<h3>Qualifications & Experience</h3><ul><li>1-2 years of experience as an SDR or Lead Generation specialist in B2B tech/SaaS.</li><li>Strong verbal and written English communication with natural phone presence.</li><li>Proficiency with Apollo.io, ZoomInfo, Sales Navigator, and CRM systems.</li><li>High resilience, curiosity, and competitive drive to exceed monthly meeting quotas.</li></ul>",
                "benefits" => "<h3>What We Offer</h3><ul><li>Competitive base salary plus generous per-meeting and revenue-closed bonuses.</li><li>Clear fast-track promotion path to Account Executive (AE) role within 9-12 months.</li><li>Remote work flexibility, training stipend, and health insurance.</li></ul>",
                "apply_url" => "https://talent.flowmingo.ai/interview",
                "is_featured" => false,
            ],
            [
                "code" => "FLOW-013",
                "title" => "Growth & Revenue Lead",
                "department" => "Marketing & Growth",
                "designation" => "Growth & Revenue Lead",
                "min_salary" => 6000,
                "max_salary" => 9500,
                "salary_rate" => "monthly",
                "skills" => "Growth Engineering, Full-Funnel Optimization, Revenue Operations, Product-Led Growth (PLG), Data Analytics, Executive Leadership",
                "description" => "<h3>About the Role</h3><p>We are seeking a visionary <strong>Growth & Revenue Lead</strong> to take ownership of Dynime’s entire growth strategy across acquisition, activation, retention, referral, and revenue expansion.</p><h3>Key Responsibilities</h3><ul><li>Lead cross-functional growth experiments combining product, marketing, data, and sales capabilities.</li><li>Optimize our user onboarding funnel, free-trial-to-paid conversion rates, and net revenue retention (NRR).</li><li>Manage growth marketing budgets and oversee performance media, SEO, lifecycle marketing, and brand teams.</li><li>Present growth models, unit economics, and pipeline forecasts to the executive leadership team.</li></ul>",
                "requirements" => "<h3>Qualifications & Experience</h3><ul><li>5+ years of growth leadership experience at a fast-growing B2B SaaS company.</li><li>Proven track record of scaling Annual Recurring Revenue (ARR) from early stage to multi-millions.</li><li>Deep understanding of product-led growth (PLG) mechanics, viral loops, and churn reduction.</li><li>Mastery of data analytics, Amplitude/Mixpanel, and financial growth modeling.</li></ul>",
                "benefits" => "<h3>What We Offer</h3><ul><li>Executive-tier compensation package with significant equity/stock options.</li><li>Full remote flexibility with executive travel stipend.</li><li>Comprehensive premium health coverage and unlimited PTO policy.</li></ul>",
                "apply_url" => "https://talent.flowmingo.ai/interview",
                "is_featured" => true,
            ],
            [
                "code" => "FLOW-014",
                "title" => "Business Development Executive",
                "department" => "Sales & Business Development",
                "designation" => "Business Development Executive",
                "min_salary" => 2000,
                "max_salary" => 3400,
                "salary_rate" => "monthly",
                "skills" => "Business Development, Commercial Sales, Client Presentations, Lead Qualification, Solution Selling, CRM Management",
                "description" => "<h3>About the Role</h3><p>Dynime is looking for a proactive <strong>Business Development Executive</strong> to expand our customer portfolio, nurture inbound relationships, and close commercial software subscription deals.</p><h3>Key Responsibilities</h3><ul><li>Engage with incoming leads, understand business workflow challenges, and demonstrate Dynime product solutions.</li><li>Prepare commercial proposals, software license agreements, and onboarding timelines.</li><li>Collaborate with customer success representatives to ensure high retention and expansion opportunities.</li><li>Maintain sales pipeline activity and report progress against monthly quota targets.</li></ul>",
                "requirements" => "<h3>Qualifications & Experience</h3><ul><li>2+ years of experience in B2B software sales or business development.</li><li>Excellent communication, consultative pitching, and active listening abilities.</li><li>Track record of consistently meeting or exceeding quarterly revenue targets.</li></ul>",
                "benefits" => "<h3>What We Offer</h3><ul><li>Competitive base salary plus attractive commission.</li><li>100% remote work setup.</li><li>Comprehensive healthcare benefits, PTO, and training allowances.</li></ul>",
                "apply_url" => "https://talent.flowmingo.ai/interview",
                "is_featured" => false,
            ],
            [
                "code" => "FLOW-015",
                "title" => "Marketing Growth Business Partner",
                "department" => "Marketing & Growth",
                "designation" => "Marketing Growth Business Partner",
                "min_salary" => 4500,
                "max_salary" => 6800,
                "salary_rate" => "monthly",
                "skills" => "Strategic Marketing, Cross-Functional Growth, Product Marketing, Campaign Strategy, Go-To-Market (GTM), Brand Positioning",
                "description" => "<h3>About the Role</h3><p>We are seeking a strategic <strong>Marketing Growth Business Partner</strong> to work directly with business units, formulating go-to-market strategies, campaign execution plans, and customer acquisition roadmaps.</p><h3>Key Responsibilities</h3><ul><li>Serve as the dedicated marketing strategist for key product lines and strategic expansion initiatives.</li><li>Align marketing campaign schedules with product launch roadmaps and sales revenue targets.</li><li>Analyze customer feedback, competitive positioning, and market trends to refine our value proposition.</li><li>Coordinate multi-channel campaigns with media buyers, copywriters, and creative designers.</li></ul>",
                "requirements" => "<h3>Qualifications & Experience</h3><ul><li>4+ years of strategic marketing, product marketing, or growth consulting experience in B2B tech.</li><li>Strong leadership and cross-functional project management capabilities.</li><li>Deep analytical competence with a solid track record of driving revenue growth.</li></ul>",
                "benefits" => "<h3>What We Offer</h3><ul><li>Competitive senior compensation package with performance bonuses.</li><li>Remote working environment.</li><li>Comprehensive health benefits, learning budget, and generous PTO.</li></ul>",
                "apply_url" => "https://talent.flowmingo.ai/interview",
                "is_featured" => true,
            ],
            [
                "code" => "FLOW-016",
                "title" => "Growth Product Intern/Fresher",
                "department" => "Marketing & Growth",
                "designation" => "Growth Product Intern/Fresher",
                "min_salary" => 1500,
                "max_salary" => 2500,
                "salary_rate" => "monthly",
                "skills" => "Product Research, User Onboarding, Growth Experiments, Data Analysis, Wireframing, Fast Learner, Communication",
                "description" => "<h3>About the Role</h3><p>Are you an ambitious aspiring product or growth professional eager to learn from industry leaders? Dynime is offering an intensive, high-impact <strong>Growth Product Internship</strong> with mentorship, real project ownership, and strong potential for full-time conversion.</p><h3>Key Responsibilities</h3><ul><li>Assist product managers in conducting user research, competitive benchmarking, and funnel teardowns.</li><li>Analyze user behavior data to identify friction points in the sign-up and onboarding flows.</li><li>Help design, execute, and monitor growth experiments and feature adoption campaigns.</li><li>Draft user guides, feature release notes, and product documentation.</li><li>Participate in sprint planning and daily standups with our engineering and growth teams.</li></ul>",
                "requirements" => "<h3>Qualifications & Experience</h3><ul><li>Recent graduate or final-year student in Computer Science, Business, Marketing, or related fields.</li><li>Passion for SaaS products, AI technologies, and product-led growth.</li><li>Quick learner with strong analytical, problem-solving, and communication skills.</li><li>Familiarity with tools like Figma, Google Analytics, Notion, or Excel is a plus.</li><li>Self-driven mindset with enthusiasm for taking ownership of tasks in a fast-paced environment.</li></ul>",
                "benefits" => "<h3>What We Offer</h3><ul><li>Competitive paid monthly stipend with fast-track opportunity for full-time employment upon completion.</li><li>Direct 1-on-1 mentorship from seasoned Growth and Product executives.</li><li>100% remote flexibility with modern tooling access.</li><li>Certificate of completion, LinkedIn recommendations, and career acceleration.</li></ul>",
                "apply_url" => "https://talent.flowmingo.ai/interview",
                "is_featured" => true,
            ],
        ];
    }

    /**
     * Ingest or update a job posting in the database.
     */
    public static function ingestJob(array $data, $createdBy = null): JobPosting
    {
        if (!$createdBy) {
            $company = User::where("type", "company")->first() ?? User::first();
            $createdBy = $company ? $company->id : 1;
        }

        $branch = Branch::where("created_by", $createdBy)->first()
            ?: Branch::firstOrCreate(["branch_name" => "Headquarters", "created_by" => $createdBy]);
        $branchId = $branch->id;

        // Department
        $deptName = $data["department"] ?? "General";
        $dept = Department::firstOrCreate(
            ["department_name" => $deptName, "created_by" => $createdBy],
            ["branch_id" => $branchId]
        );

        // Designation
        $desigName = $data["designation"] ?? $data["title"];
        $desig = Designation::firstOrCreate(
            ["designation_name" => $desigName, "created_by" => $createdBy],
            ["department_id" => $dept->id, "branch_id" => $branchId]
        );

        $code = $data["code"] ?? ("FLOW-" . strtoupper(Str::random(6)));

        return JobPosting::updateOrCreate(
            ["code" => $code],
            [
                "title" => $data["title"],
                "slug" => \Illuminate\Support\Str::slug($data["title"]),
                "code" => $code,
                "posting_code" => $code,
                "department_id" => $dept->id,
                "designation_id" => $desig->id,
                "branch_id" => $branchId,
                "min_salary" => $data["min_salary"] ?? 0,
                "max_salary" => $data["max_salary"] ?? 0,
                "salary_rate" => $data["salary_rate"] ?? "monthly",
                "description" => $data["description"] ?? "",
                "requirements" => $data["requirements"] ?? "",
                "skills" => $data["skills"] ?? null,
                "benefits" => $data["benefits"] ?? "",
                "job_application" => "custom",
                "application_url" => $data["apply_url"] ?? ($data["application_url"] ?? null),
                "posting_source" => "flowmingo_api",
                "is_published" => isset($data["is_published"]) ? (bool)$data["is_published"] : true,
                "is_hiring" => isset($data["is_hiring"]) ? (bool)$data["is_hiring"] : true,
                "is_featured" => isset($data["is_featured"]) ? (bool)$data["is_featured"] : false,
                "publish_date" => now()->format("Y-m-d"),
                "application_deadline" => now()->addMonth()->format("Y-m-d"),
                "created_by" => $createdBy,
                "creator_id" => $createdBy,
            ]
        );
    }

    /**
     * Synchronize all master jobs into database.
     */
    public static function syncAllJobs(): int
    {
        $company = User::where("type", "company")->first() ?? User::first();
        $createdBy = $company ? $company->id : 1;

        $jobs = self::getMasterFlowmingoJobs();
        $count = 0;

        foreach ($jobs as $jobData) {
            self::ingestJob($jobData, $createdBy);
            $count++;
        }

        return $count;
    }

    /**
     * Fetch active interview sets/jobs directly from Flowmingo official API.
     */
    public static function syncFromFlowmingoOfficialApi($apiKey = null): array
    {
        $company = User::where("type", "company")->first() ?? User::first();
        $createdBy = $company ? $company->id : 1;

        $apiKey = $apiKey 
            ?: config("services.flowmingo.api_key") 
            ?: \Workdo\Recruitment\Models\RecruitmentSetting::where("created_by", $createdBy)->where("key", "flowmingo_api_key")->value("value");

        if (!$apiKey) {
            $count = self::syncAllJobs();
            return [
                "success" => true,
                "count" => $count,
                "message" => "Synced master jobs with full specifications. Enter your Flowmingo API Key to pull live positions directly from Flowmingo API.",
            ];
        }

        try {
            $response = \Illuminate\Support\Facades\Http::withHeaders([
                "Authorization" => "Bearer " . $apiKey,
                "x-api-key" => $apiKey,
                "Accept" => "application/json",
            ])->timeout(15)->get("https://apis.flowmingo.ai/company/integration/interview/set/v1");

            if ($response->successful()) {
                $data = $response->json();
                $sets = $data["data"] ?? $data["sets"] ?? $data["items"] ?? (is_array($data) ? $data : []);
                $synced = 0;

                foreach ($sets as $index => $set) {
                    $jobData = [
                        "code" => "FLOW-" . str_pad($index + 1, 3, "0", STR_PAD_LEFT),
                        "title" => $set["title"] ?? $set["name"] ?? ("Position " . ($index + 1)),
                        "department" => $set["department"] ?? "Marketing & Growth",
                        "designation" => $set["designation"] ?? $set["title"] ?? "Specialist",
                        "min_salary" => $set["min_salary"] ?? $set["salary_min"] ?? 0,
                        "max_salary" => $set["max_salary"] ?? $set["salary_max"] ?? 0,
                        "salary_rate" => $set["salary_rate"] ?? "monthly",
                        "description" => $set["description"] ?? $set["instructions"] ?? "",
                        "requirements" => $set["requirements"] ?? "",
                        "skills" => is_array($set["skills"] ?? null) ? implode(", ", $set["skills"]) : ($set["skills"] ?? null),
                        "benefits" => $set["benefits"] ?? "",
                        "apply_url" => $set["apply_url"] ?? $set["interview_url"] ?? $set["url"] ?? ("https://talent.flowmingo.ai/interview?set=" . ($set["id"] ?? $set["set_id"] ?? "")),
                        "is_published" => true,
                        "is_hiring" => true,
                    ];
                    self::ingestJob($jobData, $createdBy);
                    $synced++;
                }

                return [
                    "success" => true,
                    "count" => $synced,
                    "message" => "Successfully synced {$synced} live positions directly from Flowmingo API!",
                ];
            } else {
                $count = self::syncAllJobs();
                return [
                    "success" => false,
                    "count" => $count,
                    "message" => "Flowmingo API responded with status " . $response->status() . ". Master cache synced.",
                ];
            }
        } catch (\Exception $e) {
            \Log::error("Flowmingo API sync error: " . $e->getMessage());
            $count = self::syncAllJobs();
            return [
                "success" => false,
                "count" => $count,
                "message" => "Flowmingo API connection error: " . $e->getMessage(),
            ];
        }
    }
}
