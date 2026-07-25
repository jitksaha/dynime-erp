import{j as a}from"./ui-DWAV2h0C.js";import{X as c,x as m}from"./app-DALoM6c1.js";import{L as x,u as p}from"./useFlashMessages-DTq8lHuh.js";import{a as b,u as g,B as u}from"./use-favicon-US2F2AX7.js";import{h}from"./helpers-6ds6Jv9m.js";import{C as y}from"./cookie-consent-DRfWAS9R.js";function f({children:t,title:s,description:o}){const{settings:e,getPrimaryColor:l}=b(),{adminAllSetting:n}=c().props;g();const i="https://cdn.dynime.com/Dynime%20Logo/LOGO%20PNG/logo%20SVG/dynime-logo.svg",d=e.themeMode==="dark"?e.logo_light||i:e.logo_dark||e.logo_light||i,r=l();return a.jsxs("div",{className:"min-h-screen bg-gray-50 dark:bg-slate-950 relative overflow-hidden",children:[a.jsx("style",{children:`
                @keyframes float-orb-1 {
                    0%, 100% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -40px) scale(1.08); }
                    66% { transform: translate(-25px, 20px) scale(0.95); }
                }
                @keyframes float-orb-2 {
                    0%, 100% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(-35px, 35px) scale(1.1); }
                    66% { transform: translate(25px, -20px) scale(0.92); }
                }
                @keyframes grid-pulse {
                    0%, 100% { opacity: 0.35; transform: scale(1); }
                    50% { opacity: 0.65; transform: scale(1.02); }
                }
                .animate-orb-1 {
                    animation: float-orb-1 14s ease-in-out infinite;
                }
                .animate-orb-2 {
                    animation: float-orb-2 18s ease-in-out infinite;
                }
                .animate-grid {
                    animation: grid-pulse 8s ease-in-out infinite;
                }
                .bg-primary {
                    background-color: ${r} !important;
                    color: white !important;
                }
                .bg-primary:hover {
                    background-color: ${r}dd !important;
                }
                .border-primary {
                    border-color: ${r} !important;
                }
                .text-primary {
                    color: ${r} !important;
                }
                .dark .bg-primary {
                    background-color: ${r} !important;
                    color: white !important;
                }
                .dark .bg-primary:hover {
                    background-color: ${r}dd !important;
                }
            `}),a.jsxs("div",{className:"absolute inset-0 overflow-hidden pointer-events-none",children:[a.jsx("div",{className:"absolute inset-0 bg-gradient-to-br from-slate-50 via-indigo-50/40 to-purple-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950"}),a.jsx("div",{className:"absolute -top-24 -left-24 w-[450px] h-[450px] rounded-full blur-3xl opacity-60 dark:opacity-40 animate-orb-1",style:{background:`radial-gradient(circle, ${r} 0%, rgba(99, 102, 241, 0) 70%)`}}),a.jsx("div",{className:"absolute -bottom-24 -right-24 w-[500px] h-[500px] rounded-full blur-3xl opacity-50 dark:opacity-30 animate-orb-2",style:{background:"radial-gradient(circle, #8b5cf6 0%, rgba(139, 92, 246, 0) 70%)"}}),a.jsx("div",{className:"absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-25 dark:opacity-20 animate-orb-1",style:{background:"radial-gradient(circle, #ec4899 0%, rgba(236, 72, 153, 0) 70%)"}}),a.jsx("div",{className:"absolute inset-0 opacity-40 dark:opacity-20 animate-grid",style:{backgroundImage:`radial-gradient(circle at 50% 50%, ${r} 1.5px, transparent 1.5px)`,backgroundSize:"40px 40px"}})]}),a.jsx("div",{className:"absolute top-6 right-6 z-10 md:block hidden",children:a.jsx(x,{})}),a.jsx("div",{className:"flex items-center justify-center min-h-screen p-6 relative z-10",children:a.jsxs("div",{className:"w-full max-w-md",children:[a.jsx("div",{className:"text-center mb-8",children:a.jsx("div",{className:"relative inline-block lg:px-6",children:a.jsx(m,{href:route("dashboard"),className:"inline-block max-w-[200px] transition-transform hover:scale-105",children:a.jsx("img",{src:h(d),alt:e.titleText||"Dynime",className:"h-10 w-auto mx-auto object-contain drop-shadow-sm"})})})}),a.jsxs("div",{className:"relative",children:[a.jsx("div",{className:"absolute -top-3 -left-3 w-6 h-6 border-l-2 border-t-2 rounded-tl-md",style:{borderColor:r}}),a.jsx("div",{className:"absolute -bottom-3 -right-3 w-6 h-6 border-r-2 border-b-2 rounded-br-md",style:{borderColor:r}}),a.jsxs("div",{className:"bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg lg:p-8 p-4 lg:pt-5 shadow-sm",children:[a.jsxs("div",{className:"text-center mb-4",children:[a.jsx("h1",{className:"text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-1.5",children:s}),a.jsx("div",{className:"w-12 h-px mx-auto mb-2.5",style:{backgroundColor:r}}),a.jsx("p",{className:"text-gray-700 dark:text-gray-300 text-sm",children:o})]}),t]})]}),a.jsx("div",{className:"text-center mt-6",children:a.jsx("div",{className:"inline-flex items-center space-x-2 bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-md px-4 py-2 border border-gray-200 dark:border-slate-700",children:a.jsx("p",{className:"text-sm text-gray-500 dark:text-gray-400",children:e.footerText||"© 2026 AccountGo. All rights reserved."})})})]})}),a.jsx(y,{settings:n||{}})]})}function $({children:t,title:s,description:o,...e}){return p(),a.jsx(u,{children:a.jsx(f,{title:s,description:o,...e,children:t})})}export{$ as A};
