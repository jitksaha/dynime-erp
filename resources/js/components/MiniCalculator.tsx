import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Calculator, Delete } from 'lucide-react';

export default function MiniCalculator() {
    const { t } = useTranslation();
    const [expression, setExpression] = useState('');
    const [result, setResult] = useState('');
    const [justEvaluated, setJustEvaluated] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [focused, setFocused] = useState(false);

    const safeEval = (expr: string): string => {
        try {
            const sanitized = expr.replace(/[^0-9+\-*/().% ]/g, '');
            if (!sanitized) return 'Error';
            // eslint-disable-next-line no-new-func
            const res = new Function('return ' + sanitized)();
            if (!Number.isFinite(res)) return 'Error';
            // Show up to 10 sig figs, trim trailing zeros
            return parseFloat(res.toPrecision(10)).toString();
        } catch {
            return 'Error';
        }
    };

    const append = useCallback((val: string) => {
        setExpression(prev => {
            if (justEvaluated && /^[0-9.]$/.test(val)) {
                setJustEvaluated(false);
                setResult('');
                return val;
            }
            if (justEvaluated && /^[+\-*/%]$/.test(val)) {
                // Continue from result
                setJustEvaluated(false);
                return prev + val;
            }
            setJustEvaluated(false);
            return prev + val;
        });
    }, [justEvaluated]);

    const calculate = useCallback(() => {
        setExpression(prev => {
            const res = safeEval(prev);
            setResult(res);
            setJustEvaluated(res !== 'Error');
            return res === 'Error' ? prev : res;
        });
    }, []);

    const backspace = useCallback(() => {
        if (justEvaluated) {
            setExpression('');
            setResult('');
            setJustEvaluated(false);
            return;
        }
        setExpression(prev => prev.slice(0, -1));
    }, [justEvaluated]);

    const clear = useCallback(() => {
        setExpression('');
        setResult('');
        setJustEvaluated(false);
    }, []);

    // Keyboard handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!focused) return;
            // Don't steal focus from inputs on the page
            const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
            if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

            e.preventDefault();

            if (e.key >= '0' && e.key <= '9') append(e.key);
            else if (e.key === '.') append('.');
            else if (e.key === '+') append('+');
            else if (e.key === '-') append('-');
            else if (e.key === '*') append('*');
            else if (e.key === '/') append('/');
            else if (e.key === '%') append('%');
            else if (e.key === 'Enter' || e.key === '=') calculate();
            else if (e.key === 'Backspace') backspace();
            else if (e.key === 'Escape' || e.key === 'Delete') clear();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [focused, append, calculate, backspace, clear]);

    const displayExpr = expression || '0';
    const showResult = result && result !== expression;

    const opMap: Record<string, string> = { '÷': '/', '×': '*' };

    const rows = [
        ['7', '8', '9', '÷'],
        ['4', '5', '6', '×'],
        ['1', '2', '3', '-'],
        ['0', '.', '%', '+'],
    ];

    const btnClass = (btn: string) => {
        const isOp = ['÷', '×', '-', '+'].includes(btn);
        const isPct = btn === '%';
        const base = 'h-9 rounded text-sm font-medium border transition-all duration-100 active:scale-95 select-none';
        if (isOp) return `${base} bg-primary/10 hover:bg-primary/20 text-primary border-primary/20`;
        if (isPct) return `${base} bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-100`;
        return `${base} bg-background hover:bg-muted text-foreground border-border`;
    };

    return (
        <div
            ref={containerRef}
            tabIndex={0}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onClick={() => { containerRef.current?.focus(); }}
            className={[
                'bg-card border rounded-lg p-2.5 shadow-sm text-xs outline-none transition-all',
                'w-full max-w-[220px]',
                focused
                    ? 'ring-2 ring-primary/30 border-primary/40'
                    : 'ring-0 border-border hover:border-primary/20',
            ].join(' ')}
        >
            {/* Header */}
            <div className="flex items-center justify-between text-primary font-semibold border-b pb-1 mb-2">
                <div className="flex items-center gap-1.5">
                    <Calculator className="h-3.5 w-3.5" />
                    <span>{t('Calculator')}</span>
                </div>
                {focused && (
                    <span className="text-[9px] text-primary/60 font-normal">⌨ keyboard on</span>
                )}
            </div>

            {/* Display */}
            <div className="bg-muted/40 rounded border px-2.5 py-1.5 mb-2 min-h-[48px] flex flex-col items-end justify-end overflow-hidden">
                <div className={[
                    'truncate max-w-full text-right transition-all',
                    showResult ? 'text-[10px] text-muted-foreground' : 'text-sm font-semibold text-foreground',
                ].join(' ')}>
                    {displayExpr}
                </div>
                {showResult && (
                    <div className={[
                        'text-base font-bold',
                        justEvaluated ? 'text-green-600' : 'text-primary',
                    ].join(' ')}>
                        {result}
                    </div>
                )}
            </div>

            {/* C and DEL row */}
            <div className="grid grid-cols-2 gap-1 mb-1">
                <button
                    type="button"
                    onClick={clear}
                    className="h-9 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded border border-red-100 transition-all active:scale-95 text-sm select-none"
                >
                    C
                </button>
                <button
                    type="button"
                    onClick={backspace}
                    className="h-9 bg-muted hover:bg-muted/70 text-foreground rounded border border-border transition-all active:scale-95 text-xs flex items-center justify-center gap-1 select-none"
                >
                    <Delete className="h-3.5 w-3.5" />
                    DEL
                </button>
            </div>

            {/* Number + operator grid */}
            <div className="grid grid-cols-4 gap-1">
                {rows.map((row) =>
                    row.map((btn) => (
                        <button
                            key={btn}
                            type="button"
                            onClick={() => append(opMap[btn] ?? btn)}
                            className={btnClass(btn)}
                        >
                            {btn}
                        </button>
                    ))
                )}

                {/* Equals — full width */}
                <button
                    type="button"
                    onClick={calculate}
                    className="col-span-4 h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded text-sm transition-all active:scale-[0.99] select-none mt-0.5"
                >
                    =
                </button>
            </div>
        </div>
    );
}
