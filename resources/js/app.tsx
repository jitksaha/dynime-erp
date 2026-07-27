import "./bootstrap";
import "../css/app.css";
import "../css/rtl.css";
import "./i18n";

import { createRoot } from "react-dom/client";
import { createInertiaApp, router } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { Suspense, Component, ErrorInfo, ReactNode } from "react";
import axios from "axios";

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class GlobalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    public state: ErrorBoundaryState = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Global React Render Error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
                    <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 border border-slate-200 dark:border-slate-700 text-center space-y-4">
                        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto text-xl font-bold">!</div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Application Error</h2>
                        <p className="text-xs text-rose-600 dark:text-rose-400 font-mono bg-slate-100 dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800 text-left overflow-auto max-h-44 break-words">
                            {this.state.error?.toString()}
                        </p>
                        <button
                            onClick={() => {
                                try {
                                    localStorage.clear();
                                    sessionStorage.clear();
                                } catch(e) {}
                                window.location.reload();
                            }}
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                        >
                            Reset Cache & Reload
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}


// Silent CSRF token refresh
const refreshToken = async () => {
    try {
        const response = await fetch(window.location.href, { method: 'GET' });
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const newToken = doc.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (newToken) {
            document.querySelector('meta[name="csrf-token"]')?.setAttribute('content', newToken);
            axios.defaults.headers.common['X-CSRF-TOKEN'] = newToken;
        }
    } catch (e) {}
};

router.on('before', (event) => {
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (!token) {
        refreshToken();
    }
});

router.on('error', async (event) => {
    const errors = event.detail.errors;
    if (errors && (errors[419] || errors['419'] || Object.values(errors).some(e => String(e).includes('419')))) {
        await refreshToken();
    }
});

// Global fetch interceptor
const originalFetch = window.fetch;
window.fetch = async (...args) => {
    const [url, options] = args;
    
    // Ensure fresh token before request
    if (options && options.method && options.method !== 'GET') {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (!token) {
            await refreshToken();
        }
        // Update token in headers
        const newToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (newToken && options.headers) {
            (options.headers as any)['X-CSRF-TOKEN'] = newToken;
        }
    }
    
    const response = await originalFetch(...args);
    
    // Fallback: retry on 419 error
    if (response.status === 419) {
        await refreshToken();
        if (options && options.headers) {
            const newToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (newToken) {
                (options.headers as any)['X-CSRF-TOKEN'] = newToken;
            }
        }
        return originalFetch(...args);
    }
    return response;
};

createInertiaApp({
    title: (title) => {
        const initialPage = JSON.parse(
            document.getElementById("app")?.dataset.page || "{}"
        );
        const pageProps = initialPage?.props ?? {};
        let customTitle;
        if (pageProps?.auth?.user?.type === "superadmin") {
            customTitle = pageProps?.adminAllSetting?.titleText;
        } else if (pageProps?.auth?.user?.type) {
            customTitle = pageProps?.companyAllSetting?.titleText;
        } else {
            customTitle = pageProps?.adminAllSetting?.titleText;
        }
        const appName = customTitle || import.meta.env.VITE_APP_NAME || "Laravel";
        return `${title} - ${appName}`;
    },
    resolve: (name) => {
        const allPages = {
            ...import.meta.glob('./pages/**/*.tsx'),
            ...import.meta.glob('../../packages/workdo/*/src/Resources/js/Pages/**/*.tsx')
        };

        // Try pages directory (lowercase p)
        const lowerPagePath = `./pages/${name}.tsx`;
        if (allPages[lowerPagePath]) {
            return allPages[lowerPagePath]();
        }

        // Try package pages
        const [packageName, ...pagePath] = name.split('/');
        const packagePagePath = `../../packages/workdo/${packageName}/src/Resources/js/Pages/${pagePath.join('/')}.tsx`;
        if (allPages[packagePagePath]) {
            return allPages[packagePagePath]();
        }

        // Case-insensitive fallback lookup
        const targetEnd = `/${name}.tsx`.toLowerCase();
        const foundKey = Object.keys(allPages).find(key => key.toLowerCase().endsWith(targetEnd));
        if (foundKey) {
            return allPages[foundKey]();
        }

        throw new Error(`Page not found: ${name}`);
    },
    setup({ el, App, props }) {
        // Make props globally available
        (window as any).page = props;
        const root = createRoot(el);

        root.render(
            <GlobalErrorBoundary>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="light"
                    enableSystem
                    disableTransitionOnChange
                >
                    <Suspense fallback={null}>
                        <App {...props} />
                    </Suspense>
                    <Toaster position="top-center" richColors />
                </ThemeProvider>
            </GlobalErrorBoundary>
        );
    },
    progress: {
        color: "#4B5563",
        delay: 500,
        showSpinner: false,
        includeCSS: true,
    },
});
