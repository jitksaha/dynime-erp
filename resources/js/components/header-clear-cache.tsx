import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { router } from '@inertiajs/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function HeaderClearCache() {
  const { t } = useTranslation();
  const [isClearing, setIsClearing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleClearCache = () => {
    if (isClearing) return;
    setIsClearing(true);

    try {
      // Clear browser local & session storage caches
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
      }
    } catch (e) {}

    router.post(
      route('settings.cache.clear'),
      {},
      {
        preserveScroll: false,
        onSuccess: () => {
          setIsClearing(false);
          setIsDone(true);
          setTimeout(() => {
            setIsDone(false);
            // Force hard reload with timestamp to bypass stale browser cache
            window.location.href = window.location.pathname + '?v=' + Date.now();
          }, 600);
        },
        onError: () => {
          setIsClearing(false);
          // Fallback force reload
          window.location.href = window.location.pathname + '?v=' + Date.now();
        },
      }
    );
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearCache}
            disabled={isClearing}
            className="h-8 px-2.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200/80 bg-white shadow-2xs rounded-lg transition-all"
          >
            {isDone ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <RotateCcw className={`h-3.5 w-3.5 text-indigo-600 ${isClearing ? 'animate-spin' : ''}`} />
            )}
            <span className="hidden sm:inline">
              {isClearing ? t('Clearing...') : isDone ? t('Cleared!') : t('Clear Cache')}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {t('Clear server view/config cache & hard refresh site')}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
