<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title ?? 'System Under Maintenance' }} - Dynime ERP</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
    </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
    <!-- Ambient Backdrop Gradient Glows -->
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

    <div class="max-w-md w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-7 shadow-2xl relative z-10 text-center space-y-5">
        <!-- Glowing Header Icon Badge -->
        <div class="mx-auto w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
        </div>

        <div>
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider mb-2">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                Maintenance Mode Active
            </span>
            <h1 class="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                {{ $title ?? 'System Under Maintenance' }}
            </h1>
            <p class="text-slate-400 text-xs mt-2.5 leading-relaxed max-w-sm mx-auto">
                {{ $message ?? 'We are currently conducting scheduled system maintenance. Public access is temporarily paused. Owner login and special bypass link holders can continue.' }}
            </p>
        </div>

        <!-- Info Notice -->
        <div class="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-left text-xs space-y-1.5">
            <div class="flex items-center justify-between text-slate-200 font-bold text-[11px]">
                <span>Access Policy</span>
                <span class="text-indigo-400 font-mono text-[10px]">Restricted</span>
            </div>
            <p class="text-slate-400 text-[11px] leading-relaxed">
                System Owners can log in as usual. Team members using a valid secret bypass link can access the platform without interruption.
            </p>
        </div>

        <!-- Actions Row -->
        <div class="pt-1 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <a href="/login" class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
                </svg>
                Owner Login Access
            </a>
            <button onclick="window.location.reload()" class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-all">
                Check Status
            </button>
        </div>

        <div class="text-[10px] text-slate-500 pt-2 border-t border-slate-800/80">
            &copy; {{ date('Y') }} Dynime ERP SAAS. All rights reserved.
        </div>
    </div>
</body>
</html>
