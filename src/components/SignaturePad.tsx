import React, { useRef, useState, useEffect } from 'react';
import { Eraser, RotateCcw, PenTool, CheckCircle2 } from 'lucide-react';

interface SignaturePadProps {
  label: string;
  signeeName: string;
  roleBadge: string;
  onSaveSignature: (dataUrl: string) => void;
  presetSampleType?: 'doctor' | 'patient';
  initialDataUrl?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  label,
  signeeName,
  roleBadge,
  onSaveSignature,
  presetSampleType,
  initialDataUrl,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high resolution display
    canvas.width = 440;
    canvas.height = 140;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = presetSampleType === 'doctor' ? '#1e40af' : '#0f766e'; // Indigo/blue vs Emerald

    if (initialDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasDrawn(true);
      };
      img.src = initialDataUrl;
    }
  }, [initialDataUrl, presetSampleType]);

  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-10), imageData]);
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    saveCanvasState();
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onSaveSignature(canvas.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    saveCanvasState();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onSaveSignature('');
  };

  const undo = () => {
    const canvas = canvasRef.current;
    if (!canvas || history.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    ctx.putImageData(previous, 0, 0);
    onSaveSignature(canvas.toDataURL('image/png'));
  };

  // Helper for automated or fast testing
  const drawAutographSample = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    saveCanvasState();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = presetSampleType === 'doctor' ? '#1d4ed8' : '#0d9488';

    if (presetSampleType === 'doctor') {
      // Elegant clinical script loop
      ctx.moveTo(30, 80);
      ctx.bezierCurveTo(60, 20, 90, 110, 140, 50);
      ctx.bezierCurveTo(180, 20, 210, 110, 260, 45);
      ctx.bezierCurveTo(290, 80, 340, 30, 390, 70);
      ctx.moveTo(80, 105);
      ctx.lineTo(360, 95);
    } else {
      // Patient cursive signature
      ctx.moveTo(40, 75);
      ctx.quadraticCurveTo(80, 30, 130, 65);
      ctx.quadraticCurveTo(170, 95, 220, 55);
      ctx.quadraticCurveTo(280, 25, 340, 60);
      ctx.lineTo(380, 65);
    }
    ctx.stroke();
    setHasDrawn(true);
    onSaveSignature(canvas.toDataURL('image/png'));
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <PenTool className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            {label}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {roleBadge}
          </span>
        </div>
        <div className="text-slate-500 text-[11px] font-mono">
          {signeeName}
        </div>
      </div>

      <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 overflow-hidden shadow-inner group">
        <canvas
          ref={canvasRef}
          aria-label={`Digital signature pad for ${signeeName}`}
          className="w-full h-[120px] touch-none cursor-crosshair block"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {/* Signature Baseline Indicator */}
        <div className="absolute bottom-6 left-6 right-6 border-b border-slate-200 dark:border-slate-800 pointer-events-none flex justify-between items-center text-[10px] text-slate-400 font-mono">
          <span>Sign here with stylus, finger, or cursor</span>
          <span className="opacity-70">✕ Signer verification baseline</span>
        </div>

        {hasDrawn && (
          <div className="absolute top-2 right-2 flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            Signature Recorded
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-1 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clearCanvas}
            aria-label="Clear signature"
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors"
          >
            <Eraser className="w-3.5 h-3.5" />
            Clear
          </button>
          {history.length > 0 && (
            <button
              type="button"
              onClick={undo}
              aria-label="Undo stroke"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Undo
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={drawAutographSample}
          className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          Use auto-sign sample
        </button>
      </div>
    </div>
  );
};
