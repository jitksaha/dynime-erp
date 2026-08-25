import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { router } from '@inertiajs/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Globe, Clock, CheckCircle2, Search, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface MasterCountryShift {
    id: number;
    country_name: string;
    iso_code: string;
    working_days: string[];
    office_start_time: string;
    office_end_time: string;
    break_duration_mins: number;
    weekly_working_hours: number;
    primary_timezone: string;
    available_timezones: string[];
    dst_supported: boolean;
    version: number;
}

interface ImportCountryShiftModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    masterCountryShifts: MasterCountryShift[];
}

export default function ImportCountryShiftModal({ open, onOpenChange, masterCountryShifts = [] }: ImportCountryShiftModalProps) {
    const { t } = useTranslation();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMaster, setSelectedMaster] = useState<MasterCountryShift | null>(null);
    const [shiftName, setShiftName] = useState('');
    const [selectedTimezone, setSelectedTimezone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const filteredMasters = masterCountryShifts.filter(item =>
        item.country_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.iso_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.primary_timezone.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        if (selectedMaster) {
            setShiftName(`${selectedMaster.country_name} Standard`);
            setSelectedTimezone(selectedMaster.primary_timezone || 'UTC');
        }
    }, [selectedMaster]);

    const handleSelectCountry = (master: MasterCountryShift) => {
        setSelectedMaster(master);
        setShiftName(`${master.country_name} Standard`);
        setSelectedTimezone(master.primary_timezone || 'UTC');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMaster) {
            toast.error(t('Please select a country standard shift first.'));
            return;
        }

        setIsSubmitting(true);
        router.post(route('hrm.shifts.import-country'), {
            master_country_shift_id: selectedMaster.id,
            shift_name: shiftName,
            timezone: selectedTimezone,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSubmitting(false);
                onOpenChange(false);
                setSelectedMaster(null);
                setSearchQuery('');
                toast.success(t('Country Standard Shift imported successfully!'));
            },
            onError: () => {
                setIsSubmitting(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    };

    const formatTime12h = (timeStr: string) => {
        try {
            const parts = timeStr.split(':');
            let hrs = parseInt(parts[0], 10);
            const mins = parts[1] || '00';
            const ampm = hrs >= 12 ? 'PM' : 'AM';
            hrs = hrs % 12 || 12;
            return `${hrs.toString().padStart(2, '0')}:${mins} ${ampm}`;
        } catch (e) {
            return timeStr;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[460px] p-2.5 overflow-hidden rounded-2xl border border-slate-200 shadow-xl bg-white">
                {/* Title Box with Rounded Corners (Border Radius) */}
                <div className="bg-indigo-600 text-white px-3.5 py-2.5 rounded-xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center text-white shrink-0">
                            <Globe className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <DialogTitle className="text-xs font-bold text-white tracking-tight">
                                    {t('Import Country Standard Shift')}
                                </DialogTitle>
                                <Badge className="bg-white/20 text-white font-semibold text-[9px] px-1.5 py-0 border-0 rounded-md">
                                    195+ Countries
                                </Badge>
                            </div>
                            <DialogDescription className="text-[10.5px] text-indigo-100 mt-0.5">
                                {t('Select standard schedule to pre-fill working hours & timezone.')}
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                <div className="pt-1 px-1 pb-1 space-y-2">
                    {/* Step 1: Search & Full Country List */}
                    {!selectedMaster ? (
                        <div className="space-y-2">
                            <div className="relative">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                                <Input
                                    type="text"
                                    placeholder={t('Search country or code (e.g. US, BD, CA, UK)...')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8 text-xs rounded-lg border-slate-200 h-8"
                                />
                            </div>

                            {/* Full Height Country List Container */}
                            <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1">
                                {filteredMasters.map((master) => (
                                    <button
                                        key={master.id}
                                        type="button"
                                        onClick={() => handleSelectCountry(master)}
                                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-100 hover:border-indigo-300 bg-slate-50/70 hover:bg-indigo-50/40 text-left transition-all group flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="w-6 h-6 rounded bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                                                {master.iso_code}
                                            </span>
                                            <div className="truncate">
                                                <span className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 truncate block">
                                                    {master.country_name}
                                                </span>
                                                <span className="text-[9.5px] text-slate-500 block truncate">
                                                    {master.working_days ? master.working_days.join(', ') : 'Mon-Fri'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <div className="text-right">
                                                <span className="font-mono text-[11px] font-semibold text-slate-800 block">
                                                    {formatTime12h(master.office_start_time)} – {formatTime12h(master.office_end_time)}
                                                </span>
                                                <span className="text-[9px] font-medium text-indigo-600 block">
                                                    {master.weekly_working_hours}h/wk · v{master.version}
                                                </span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Step 2: Configure & Custom Name (Compact Form) */
                        <form onSubmit={handleSubmit} className="space-y-2.5 pt-1">
                            {/* Selected Country Card */}
                            <div className="p-2 rounded-xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                        {selectedMaster.iso_code}
                                    </span>
                                    <div>
                                        <h5 className="font-bold text-xs text-indigo-950">{selectedMaster.country_name} Standard</h5>
                                        <p className="text-[10.5px] text-indigo-700 font-mono">
                                            {formatTime12h(selectedMaster.office_start_time)} – {formatTime12h(selectedMaster.office_end_time)} ({selectedMaster.weekly_working_hours}h/wk)
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedMaster(null)}
                                    className="text-[11px] font-bold text-indigo-600 hover:bg-indigo-100 h-6 px-2"
                                >
                                    {t('Change')}
                                </Button>
                            </div>

                            {/* Shift Name Input */}
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-800">{t('Company Shift Name')}</Label>
                                <Input
                                    type="text"
                                    value={shiftName}
                                    onChange={(e) => setShiftName(e.target.value)}
                                    placeholder={t('E.g. USA Customer Support')}
                                    required
                                    className="text-xs rounded-lg h-8"
                                />
                            </div>

                            {/* Reference Timezone Selection */}
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-800">{t('Reference Time Zone')}</Label>
                                {selectedMaster.available_timezones && selectedMaster.available_timezones.length > 1 ? (
                                    <select
                                        value={selectedTimezone}
                                        onChange={(e) => setSelectedTimezone(e.target.value)}
                                        className="w-full px-2.5 py-1 text-xs font-semibold text-slate-900 bg-white border border-indigo-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 h-8"
                                    >
                                        {selectedMaster.available_timezones.map((tz) => (
                                            <option key={tz} value={tz}>{tz}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <Input
                                        type="text"
                                        readOnly
                                        value={selectedTimezone}
                                        className="text-xs font-mono bg-slate-50 text-slate-700 rounded-lg h-8"
                                    />
                                )}
                            </div>

                            <DialogFooter className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    className="text-xs font-semibold px-3 py-1 rounded-lg border-slate-200 h-7"
                                >
                                    {t('Cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-1 rounded-lg shadow-sm flex items-center gap-1.5 h-7"
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    {isSubmitting ? t('Importing...') : t('Import Shift')}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
