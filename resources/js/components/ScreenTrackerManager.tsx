import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Monitor, Camera, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface ScreenTrackerManagerProps {
  isClockedIn: boolean;
  attendanceId?: number | null;
}

export function ScreenTrackerManager({ isClockedIn, attendanceId }: ScreenTrackerManagerProps) {
  const { t } = useTranslation();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<'idle' | 'requesting' | 'active' | 'denied' | 'error'>('idle');
  const [lastCapturedAt, setLastCapturedAt] = useState<string | null>(null);
  const [capturedCount, setCapturedCount] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Request display media for full desktop capture
  const startScreenCapture = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      toast.error(t('Screen capture is not supported by your browser. Please use Chrome, Edge, or Firefox.'));
      setStatus('error');
      return;
    }

    try {
      setStatus('requesting');
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor', // Prefer entire monitor screen
        } as any,
        audio: false,
      });

      setStream(mediaStream);
      setStatus('active');
      toast.success(t('Screen duty tracking authorized. Full-device random snapshots active.'));

      // Attach video element
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }

      // Handle user stopping share manually from browser banner
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          setStream(null);
          setStatus('denied');
          toast.warning(t('Screen sharing stopped. Click "Re-authorize Screen" to resume duty tracking.'));
        };
      }
    } catch (err: any) {
      console.error('Screen capture permission error:', err);
      setStream(null);
      setStatus('denied');
      toast.error(t('Screen tracking permission denied. Upwork-style duty proof requires screen sharing.'));
    }
  }, [t]);

  // Stop screen stream
  const stopScreenCapture = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setStatus('idle');
  }, [stream]);

  // Capture frame from video stream & upload
  const takeSnapshot = useCallback(async () => {
    if (!stream || !videoRef.current || status !== 'active') return;

    try {
      const video = videoRef.current;
      if (!video.videoWidth || !video.videoHeight) return;

      // Prepare canvas
      let canvas = canvasRef.current;
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvasRef.current = canvas;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to compressed webp / jpeg base64
      const base64Data = canvas.toDataURL('image/jpeg', 0.75);

      // Send to server via background POST
      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      const response = await fetch(route('hrm.attendances.screenshots.store'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token || '',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          attendance_id: attendanceId || null,
          screenshot: base64Data,
          activity_percentage: 100,
        }),
      });

      const resData = await response.json();
      if (resData.success) {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastCapturedAt(timeStr);
        setCapturedCount((prev) => prev + 1);
      }
    } catch (e) {
      console.error('Failed to upload random duty screenshot:', e);
    }
  }, [stream, status, attendanceId]);

  // Handle Clock-In state changes
  useEffect(() => {
    if (isClockedIn) {
      if (status === 'idle') {
        startScreenCapture();
      }
    } else {
      if (status !== 'idle') {
        stopScreenCapture();
      }
    }
  }, [isClockedIn, status, startScreenCapture, stopScreenCapture]);

  // Schedule Random Snapshots (every 3 to 8 minutes)
  useEffect(() => {
    if (!isClockedIn || status !== 'active' || !stream) return;

    // Take initial snapshot 10 seconds after authorization
    const initialTimer = setTimeout(() => {
      takeSnapshot();
    }, 10000);

    const scheduleRandomSnapshot = () => {
      // Random interval between 3 mins (180,000 ms) and 8 mins (480,000 ms)
      const randomDelay = Math.floor(Math.random() * (480000 - 180000 + 1)) + 180000;
      timerRef.current = setTimeout(() => {
        takeSnapshot();
        scheduleRandomSnapshot(); // Recursively schedule next random snapshot
      }, randomDelay);
    };

    scheduleRandomSnapshot();

    return () => {
      clearTimeout(initialTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isClockedIn, status, stream, takeSnapshot]);

  if (!isClockedIn) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Hidden elements for video capture */}
      <video ref={videoRef} autoPlay playsInline muted className="hidden" />

      {/* Screen Monitor Status Pill */}
      {status === 'active' && (
        <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold flex items-center gap-1 text-slate-200">
            <Monitor className="w-3.5 h-3.5 text-emerald-400" />
            {t('Duty Tracker')}
          </span>
          {lastCapturedAt && (
            <span className="hidden lg:inline text-[11px] text-slate-400 border-l border-slate-700 pl-2">
              {t('Snap:')} <span className="text-emerald-300 font-bold">{lastCapturedAt}</span> ({capturedCount})
            </span>
          )}
          <button
            type="button"
            onClick={takeSnapshot}
            title={t('Take Instant Snapshot')}
            className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-emerald-400 transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {status === 'denied' && (
        <button
          type="button"
          onClick={startScreenCapture}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-600 rounded-lg text-xs font-bold hover:bg-amber-500/20 transition-all"
        >
          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
          <span>{t('Re-authorize Screen')}</span>
        </button>
      )}
    </div>
  );
}
