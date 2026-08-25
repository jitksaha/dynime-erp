import React from "react";
import { usePage } from "@inertiajs/react";

// SVG Icons for clean rendering
const FacebookIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
);

const InstagramIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
);

const LinkedinIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
    </svg>
);

const WhatsAppIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
    </svg>
);

const PhoneCallIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
    </svg>
);

const MailIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <rect width="20" height="16" x="2" y="4" rx="2"></rect>
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
    </svg>
);

export default function FrontendFooter() {
    const { props } = usePage();
    const settings = props.settings as any;
    const userSlug = props.userSlug as string;
    const companyAllSetting = props.companyAllSetting as any;
    const logoUrl = companyAllSetting?.logo || "/logo.png";

    return (
        <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
                    {/* Column 1: Company Branding & Socials */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <img src="https://careers.dynime.com/storage/media/KVhzkR7rCJFuzFxBU8ljBqFb2PItfQM5i3omxMNF.png" alt="Dynime Logo" className="h-8 w-auto brightness-0 invert opacity-90" />
                            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-md">CAREERS</span>
                        </div>
                        <p className="text-slate-400 text-xs leading-relaxed">
                            Join Dynime LLC in building next-generation enterprise OS & SaaS solutions. We empower talent across tech, sales, and global operations.
                        </p>
                        
                        {/* Social Media Section */}
                        <div className="space-y-2 pt-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-semibold text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-full">
                                    /thedynime
                                </span>
                            </div>
                            <div className="flex items-center gap-2 pt-0.5">
                                {/* Facebook */}
                                <a
                                    href="https://facebook.com/thedynime"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-200"
                                    title="Facebook: /thedynime"
                                >
                                    <FacebookIcon className="w-4 h-4" />
                                </a>
                                {/* Instagram */}
                                <a
                                    href="https://instagram.com/thedynime"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-200"
                                    title="Instagram: /thedynime"
                                >
                                    <InstagramIcon className="w-4 h-4" />
                                </a>
                                {/* LinkedIn */}
                                <a
                                    href="https://linkedin.com/company/thedynime"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-200"
                                    title="LinkedIn: /thedynime"
                                >
                                    <LinkedinIcon className="w-4 h-4" />
                                </a>
                                {/* WhatsApp */}
                                <a
                                    href="https://wa.me/16468840271"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-200"
                                    title="WhatsApp: /thedynime (+16468840271)"
                                >
                                    <WhatsAppIcon className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Quick Links */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Navigation</h4>
                        <ul className="space-y-2 text-xs">
                            <li>
                                <a 
                                    href={userSlug ? `/${userSlug}` : "/"} 
                                    className="text-slate-400 hover:text-white transition-colors"
                                >
                                    All Job Openings
                                </a>
                            </li>
                            <li>
                                <a 
                                    href="https://dynime.com" 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="text-slate-400 hover:text-white transition-colors"
                                >
                                    Company Website
                                </a>
                            </li>
                            <li>
                                <a 
                                    href="https://careers.dynime.com" 
                                    className="text-slate-400 hover:text-white transition-colors"
                                >
                                    Career Portal Home
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Column 3: Categories & Roles */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Featured Departments</h4>
                        <ul className="space-y-2 text-xs text-slate-400">
                            <li className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                International Sales & Marketing
                            </li>
                            <li className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                Software & Product Engineering
                            </li>
                            <li className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                HR, Talent & People Ops
                            </li>
                            <li className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                Finance & Accounting
                            </li>
                        </ul>
                    </div>

                    {/* Column 4: Contact & Enquiries */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Careers Contact</h4>
                        <p className="text-xs text-slate-400">
                            Have questions regarding an open role or your application status? Get in touch with our recruitment team.
                        </p>
                        
                        <div className="space-y-2 pt-1 text-xs">
                            {/* Email 1: hrm@dynime.com */}
                            <div className="flex items-center gap-2 text-slate-300">
                                <MailIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                <span className="text-slate-400">HRM:</span>
                                <a href="mailto:hrm@dynime.com" className="font-mono text-slate-200 hover:text-white hover:underline transition-colors">
                                    hrm@dynime.com
                                </a>
                            </div>
                            
                            {/* Email 2: mail.dynime@gmail.com */}
                            <div className="flex items-center gap-2 text-slate-300">
                                <MailIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                <span className="text-slate-400">Email:</span>
                                <a href="mailto:mail.dynime@gmail.com" className="font-mono text-slate-200 hover:text-white hover:underline transition-colors">
                                    mail.dynime@gmail.com
                                </a>
                            </div>

                            {/* Phone / Call & WhatsApp */}
                            <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2">
                                <span className="font-mono text-slate-200 text-xs font-medium">
                                    +16468840271
                                </span>
                                <div className="flex items-center gap-1.5">
                                    {/* Call Icon Link */}
                                    <a
                                        href="tel:+16468840271"
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 transition-all text-xs font-medium"
                                        title="Call +16468840271"
                                    >
                                        <PhoneCallIcon className="w-3.5 h-3.5 text-blue-400" />
                                        <span>Call</span>
                                    </a>

                                    {/* WhatsApp Icon Link */}
                                    <a
                                        href="https://wa.me/16468840271"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 transition-all text-xs font-medium"
                                        title="WhatsApp +16468840271"
                                    >
                                        <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>WhatsApp</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Copyright Bar */}
                <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                    <p>
                        {companyAllSetting?.footer_text || settings?.footer?.footer_text || `© ${new Date().getFullYear()} Dynime LLC. All rights reserved.`}
                    </p>
                    <div className="flex items-center space-x-4 text-slate-400 text-xs">
                        <span className="hover:text-slate-200 transition-colors cursor-pointer">Privacy Policy</span>
                        <span>•</span>
                        <span className="hover:text-slate-200 transition-colors cursor-pointer">Terms of Service</span>
                        <span>•</span>
                        <span className="hover:text-slate-200 transition-colors cursor-pointer">Cookie Policy</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
