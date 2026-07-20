import{j as r}from"./ui-DWAV2h0C.js";import{X as m,x as n}from"./app-ynvbWYMh.js";import{L as c,u as x}from"./useFlashMessages-DNqcYgA8.js";import{a as g,u as b,B as p}from"./use-favicon-JxOb-zgo.js";import{h}from"./helpers-BgAGGA5L.js";import{A as u}from"./application-logo-BQ4nWT1i.js";import{C as j}from"./cookie-consent-Dc5SKCI4.js";function y({children:t,title:s,description:o}){const{settings:a,getPrimaryColor:i}=g(),{adminAllSetting:d}=m().props;b();const l=a.themeMode==="dark"?a.logo_light||a.logo_dark:a.logo_dark||a.logo_light,e=i();return r.jsxs("div",{className:"min-h-screen bg-gray-50 relative overflow-hidden",children:[r.jsx("style",{children:`
                .bg-primary {
                    background-color: ${e} !important;
                    color: white !important;
                }
                .bg-primary:hover {
                    background-color: ${e}dd !important;
                }
                .border-primary {
                    border-color: ${e} !important;
                }
                .text-primary {
                    color: ${e} !important;
                }
                .dark .bg-primary {
                    background-color: ${e} !important;
                    color: white !important;
                }
                .dark .bg-primary:hover {
                    background-color: ${e}dd !important;
                }
            `}),r.jsxs("div",{className:"absolute inset-0",children:[r.jsx("div",{className:"absolute inset-0 bg-gradient-to-br from-slate-50 via-gray-50 to-stone-100 dark:from-slate-900 dark:via-slate-800 dark:to-stone-900"}),r.jsx("div",{className:"absolute inset-0 opacity-70 dark:opacity-30",style:{backgroundImage:`radial-gradient(circle at 30% 70%, ${e} 1px, transparent 1px)`,backgroundSize:"80px 80px"}})]}),r.jsx("div",{className:"absolute top-6 right-6 z-10 md:block hidden",children:r.jsx(c,{})}),r.jsx("div",{className:"flex items-center justify-center min-h-screen p-6",children:r.jsxs("div",{className:"w-full max-w-md",children:[r.jsx("div",{className:"text-center mb-8",children:r.jsx("div",{className:"relative lg:inline-block lg:px-6",children:r.jsx(n,{href:route("dashboard"),className:"inline-block max-w-[180px]",children:l?r.jsx("img",{src:h(l),alt:a.titleText||"Logo",className:"w-auto mx-auto"}):r.jsx(u,{className:"h-8 w-8 mx-auto text-primary"})})})}),r.jsxs("div",{className:"relative",children:[r.jsx("div",{className:"absolute -top-3 -left-3 w-6 h-6 border-l-2 border-t-2 rounded-tl-md",style:{borderColor:e}}),r.jsx("div",{className:"absolute -bottom-3 -right-3 w-6 h-6 border-r-2 border-b-2 rounded-br-md",style:{borderColor:e}}),r.jsxs("div",{className:"bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg lg:p-8 p-4 lg:pt-5 shadow-sm",children:[r.jsxs("div",{className:"text-center mb-4",children:[r.jsx("h1",{className:"text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-1.5",children:s}),r.jsx("div",{className:"w-12 h-px mx-auto mb-2.5",style:{backgroundColor:e}}),r.jsx("p",{className:"text-gray-700 dark:text-gray-300 text-sm",children:o})]}),t]})]}),r.jsx("div",{className:"text-center mt-6",children:r.jsx("div",{className:"inline-flex items-center space-x-2 bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-md px-4 py-2 border border-gray-200 dark:border-slate-700",children:r.jsx("p",{className:"text-sm text-gray-500 dark:text-gray-400",children:a.footerText||"© 2026 AccountGo. All rights reserved."})})})]})}),r.jsx(j,{settings:d||{}})]})}function $({children:t,title:s,description:o,...a}){return x(),r.jsx(p,{children:r.jsx(y,{title:s,description:o,...a,children:t})})}export{$ as A};
