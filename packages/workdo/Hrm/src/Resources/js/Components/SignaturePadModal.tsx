import React, { useRef, useState, useEffect } from 'react';
import { X, Eraser, Check, PenTool } from 'lucide-react';

interface SignaturePadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (signatureDataUrl: string) => void;
}

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
    isOpen,
    onClose,
    onSave,
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);

    useEffect(() => {
        if (isOpen && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.strokeStyle = '#0F172A'; // Slate 900
                ctx.lineWidth = 2.5;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                clearCanvas();
            }
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        setIsDrawing(true);
        setHasDrawn(true);

        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        ctx.beginPath();
        ctx.moveTo(clientX - rect.left, clientY - rect.top);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        ctx.lineTo(clientX - rect.left, clientY - rect.top);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas || !hasDrawn) return;
        const dataUrl = canvas.toDataURL('image/png');
        onSave(dataUrl);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 relative">
                {/* Header */}
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                            <PenTool className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-slate-900 text-lg">Digital Signature</h3>
                            <p className="text-xs text-slate-500 font-medium">Draw your signature below using mouse or touch</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Canvas Container */}
                <div className="my-4 relative bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl overflow-hidden touch-none">
                    <canvas
                        ref={canvasRef}
                        width={460}
                        height={180}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-[180px] cursor-crosshair"
                    />
                    {!hasDrawn && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-semibold">
                            Sign here...
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-2">
                    <button
                        type="button"
                        onClick={clearCanvas}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                    >
                        <Eraser className="w-4 h-4" />
                        Clear Signature
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={!hasDrawn}
                            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-all ${
                                hasDrawn
                                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
                                    : 'bg-slate-300 cursor-not-allowed'
                            }`}
                        >
                            <Check className="w-4 h-4" />
                            Attach Signature
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
