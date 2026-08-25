import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Monitor, Calendar, Clock, Trash2, ExternalLink, Maximize2, ShieldCheck, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface ScreenshotItem {
  id: number;
  attendance_id: number;
  employee_id: number;
  image_path: string;
  captured_at: string;
  activity_percentage: number;
  status: string;
}

interface AttendanceScreenshotGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceId: number | null;
  employeeName?: string;
  attendanceDate?: string;
  canDelete?: boolean;
}

export function AttendanceScreenshotGalleryModal({
  isOpen,
  onClose,
  attendanceId,
  employeeName = 'Employee',
  attendanceDate = '',
  canDelete = true,
}: AttendanceScreenshotGalleryModalProps) {
  const { t } = useTranslation();
  const [screenshots, setScreenshots] = useState<ScreenshotItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ScreenshotItem | null>(null);

  useEffect(() => {
    if (!isOpen || !attendanceId) return;

    setLoading(true);
    fetch(route('hrm.attendances.screenshots.index', { attendance: attendanceId }))
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setScreenshots(data.screenshots || []);
        }
      })
      .catch((err) => console.error('Failed to load screenshots:', err))
      .finally(() => setLoading(false));
  }, [isOpen, attendanceId]);

  const handleDelete = async (id: number) => {
    if (!confirm(t('Are you sure you want to delete this duty screenshot proof?'))) return;

    try {
      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      const response = await fetch(route('hrm.attendances.screenshots.destroy', { screenshot: id }), {
        method: 'DELETE',
        headers: {
          'X-CSRF-TOKEN': token || '',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json',
        },
      });

      const resData = await response.json();
      if (resData.success) {
        toast.success(t('Screenshot deleted successfully.'));
        setScreenshots((prev) => prev.filter((s) => s.id !== id));
        if (selectedImage?.id === id) setSelectedImage(null);
      }
    } catch (err) {
      console.error(err);
      toast.error(t('Failed to delete screenshot.'));
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <DialogHeader className="pb-4 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  {t('Duty Desktop Screenshots')}
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {screenshots.length} {t('Captured')}
                  </span>
                </DialogTitle>
                <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                  <span>{employeeName}</span>
                  {attendanceDate && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {attendanceDate}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Main Gallery View */}
          <div className="flex-1 overflow-y-auto pt-4 pr-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="text-xs font-medium">{t('Loading duty screen snapshots...')}</p>
              </div>
            ) : screenshots.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 gap-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                <Monitor className="w-12 h-12 stroke-[1.5] text-slate-300 dark:text-slate-600" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('No Desktop Screenshots Found')}</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    {t('No random desktop screenshots were captured or uploaded for this clock-in session yet.')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {screenshots.map((snap) => {
                  const captureTime = snap.captured_at
                    ? new Date(snap.captured_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '-';

                  return (
                    <div
                      key={snap.id}
                      className="group relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      {/* Image Thumbnail */}
                      <div className="relative aspect-video bg-slate-950 overflow-hidden cursor-pointer" onClick={() => setSelectedImage(snap)}>
                        <img
                          src={snap.image_path}
                          alt="Duty Snapshot"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            className="p-2 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedImage(snap);
                            }}
                          >
                            <Maximize2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Info Footer */}
                      <div className="p-3 flex items-center justify-between text-xs text-slate-300 bg-slate-900">
                        <div className="flex items-center gap-1.5 font-mono">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="font-semibold text-slate-200">{captureTime}</span>
                        </div>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(snap.id)}
                            className="text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors"
                            title={t('Delete Snapshot')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox High-Res Zoom Modal */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-6xl p-3 bg-slate-950 text-white border border-slate-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 text-xs">
              <span className="font-bold text-slate-200 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-emerald-400" />
                {employeeName} — {t('Full Screen Snapshot')} ({new Date(selectedImage.captured_at).toLocaleString()})
              </span>
              <a
                href={selectedImage.image_path}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                <span>{t('Open Full Size')}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <div className="p-2 flex items-center justify-center bg-black/80 rounded-xl overflow-hidden">
              <img
                src={selectedImage.image_path}
                alt="Full resolution desktop snapshot"
                className="max-h-[80vh] w-auto object-contain rounded"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
