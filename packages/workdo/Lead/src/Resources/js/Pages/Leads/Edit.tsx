import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm, router } from "@inertiajs/react";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Label } from '@/components/ui/label';
import InputError from '@/components/ui/input-error';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PhoneInputComponent } from '@/components/ui/phone-input';
import { DatePicker } from '@/components/ui/date-picker';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { MultiSelectEnhanced } from '@/components/ui/multi-select-enhanced';
import { EditLeadProps, LeadFormData } from './types';
import { usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { formatDate } from '@/utils/helpers';
import { useFormFields } from '@/hooks/useFormFields';
import { Textarea } from '@/components/ui/textarea';
import { Trash2 } from 'lucide-react';
import axios from 'axios';

export default function EditLead({ lead, sources: propSources, products: propProducts, onSuccess }: EditLeadProps & { sources?: any, products?: any }) {
    const { users, pipelines, products } = usePage<any>().props;
    const [stages, setStages] = useState([]);
    const [sources, setSources] = useState(propSources || []);
    const [productOptions, setProductOptions] = useState(propProducts || []);

    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const [userSearch, setUserSearch] = useState('');

    const { t } = useTranslation();
    const { data, setData, put, processing, errors } = useForm<LeadFormData>({
        ...lead,
        user_id: lead.user_id?.toString() || '',
        pipeline_id: lead.pipeline_id?.toString() || '',
        stage_id: lead.stage_id?.toString() || '',
        sources: Array.isArray(lead.sources) ? lead.sources : (lead.sources ? lead.sources.split(',') : []),
        products: Array.isArray(lead.products) ? lead.products : (lead.products ? lead.products.split(',') : []),
        project_value: lead.project_value?.toString() || '',
    });

    const filteredUsers = users?.filter((u: any) => u.name.toLowerCase().includes(userSearch.toLowerCase())) || [];
    const selectedUser = users?.find((u: any) => String(u.id) === String(data.user_id));

    const nameAI = useFormFields('aiField', data, setData, errors, 'edit', 'name', 'Name', 'lead', 'lead');
    const subjectAI = useFormFields('aiField', data, setData, errors, 'edit', 'subject', 'Subject', 'lead', 'lead');
    const customFields = useFormFields('getCustomFields', { ...data, module: 'Lead', sub_module: 'Lead', id: lead.id }, setData, errors, 'edit', t);
    const [notesEditorKey, setNotesEditorKey] = useState(0);
    const notesAI = useFormFields('aiField', data, (field, value) => {
        setData(field, value);
        setNotesEditorKey(prev => prev + 1);
    }, errors, 'edit', 'notes', 'Notes', 'lead', 'lead');

    const [newNote, setNewNote] = useState('');
    const [isSavingNote, setIsSavingNote] = useState(false);
    const [notesList, setNotesList] = useState<any[]>([]);

    const fetchNotes = async () => {
        try {
            const res = await axios.get(route('lead.leads.get-notes', lead.id));
            setNotesList(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, [lead.id]);

    const handleAddNote = async () => {
        if (!newNote.trim()) return;
        setIsSavingNote(true);
        try {
            await axios.post(route('lead.leads.store-note', lead.id), { note: newNote });
            setNewNote('');
            fetchNotes();
        } catch (e) {
            console.error(e);
        } finally {
            setIsSavingNote(false);
        }
    };

    const handleDeleteNote = async (noteId: number) => {
        if (!confirm(t('Are you sure you want to delete this note?'))) return;
        try {
            await axios.delete(route('lead.leads.destroy-note', [lead.id, noteId]));
            fetchNotes();
        } catch (e) {
            console.error(e);
        }
    };



    useEffect(() => {
        if (data.pipeline_id) {
            // Fetch stages for selected pipeline
            fetch(route('lead.stages.by-pipeline', data.pipeline_id))
                .then(res => res.json())
                .then(data => setStages(data))
                .catch(() => setStages([]));
        }
    }, [data.pipeline_id]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        // Convert arrays to comma-separated strings for backend
        const submitData = {
            ...data,
            sources: Array.isArray(data.sources) ? (data.sources.length > 0 ? data.sources.join(',') : '') : data.sources,
            products: Array.isArray(data.products) ? (data.products.length > 0 ? data.products.join(',') : '') : data.products,
        };

        put(route('lead.leads.update', lead.id), {
            data: submitData,
            onSuccess: () => {
                onSuccess();
            }
        });
    };

    return (
        <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
                <DialogTitle>{t('Edit Lead')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <Label htmlFor="name">{t('Name')}</Label>
                            <Input
                                id="name"
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder={t('Enter Name')}
                                required
                            />
                            <InputError message={errors.name} />
                        </div>
                        {nameAI.map(field => <div key={field.id}>{field.component}</div>)}
                    </div>

                    <div>
                        <Label htmlFor="email">{t('Email')}</Label>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder={t('Enter Email')}
                        />
                        <InputError message={errors.email} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <Label htmlFor="subject" required>{t('Subject')}</Label>
                            <Input
                                id="subject"
                                type="text"
                                value={data.subject}
                                onChange={(e) => setData('subject', e.target.value)}
                                placeholder={t('Enter Subject')}
                                
                            />
                            <InputError message={errors.subject} />
                        </div>
                        {subjectAI.map(field => <div key={field.id}>{field.component}</div>)}
                    </div>

                    <div className="relative">
                        <Label htmlFor="user_id" required>{t('Lead Owner')}</Label>
                        <div 
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                        >
                            <span>{selectedUser ? selectedUser.name : t('Select Lead Owner')}</span>
                            <span className="text-muted-foreground text-xs">▼</span>
                        </div>
                        {isUserDropdownOpen && (
                            <>
                                <div 
                                    className="fixed inset-0 z-40 bg-transparent" 
                                    onClick={() => setIsUserDropdownOpen(false)}
                                />
                                <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-slate-200 bg-white p-1 text-slate-950 shadow-md">
                                    <div className="p-1">
                                        <Input
                                            type="text"
                                            placeholder={t('Search Lead Owner...')}
                                            value={userSearch}
                                            onChange={(e) => setUserSearch(e.target.value)}
                                            className="h-8 mb-1 bg-slate-50 border-slate-200"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                    <div className="space-y-0.5 max-h-48 overflow-y-auto">
                                        {filteredUsers.length > 0 ? (
                                            filteredUsers.map((item: any) => (
                                                <div
                                                    key={item.id}
                                                    className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-slate-100 hover:text-slate-900 ${String(item.id) === String(data.user_id) ? 'bg-slate-100 font-medium' : ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setData('user_id', item.id.toString());
                                                        setIsUserDropdownOpen(false);
                                                        setUserSearch('');
                                                    }}
                                                >
                                                    {item.name}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-2 text-xs text-muted-foreground text-center">
                                                {t('No options found')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                        <InputError message={errors.user_id} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <PhoneInputComponent
                            label={t('Phone No')}
                            value={data.phone}
                            onChange={(value) => setData('phone', value || '')}
                            error={errors.phone}
                        />
                    </div>

                    <div>
                        <Label>{t('Follow Up Date')}</Label>
                        <DatePicker
                            value={data.date}
                            onChange={(date) => setData('date', formatDate(date))}
                            placeholder={t('Select Follow Up Date')}
                        />
                        <InputError message={errors.date} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="project_value">{t('Project Value')}</Label>
                        <Input
                            id="project_value"
                            type="number"
                            step="0.01"
                            min="0"
                            value={data.project_value}
                            onChange={(e) => setData('project_value', e.target.value)}
                            placeholder={t('Enter Project Value')}
                        />
                        <InputError message={errors.project_value} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="pipeline_id">{t('Pipeline')}</Label>
                        <Select value={data.pipeline_id?.toString() || ''} onValueChange={(value) => setData('pipeline_id', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('Select Pipeline')} />
                            </SelectTrigger>
                            <SelectContent>
                                {pipelines?.map((item: any) => (
                                    <SelectItem key={item.id} value={item.id.toString()}>
                                        {item.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.pipeline_id} />
                    </div>

                    <div>
                        <Label htmlFor="stage_id">{t('Stage')}</Label>
                        <Select value={data.stage_id?.toString() || ''} onValueChange={(value) => setData('stage_id', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('Select Stage')} />
                            </SelectTrigger>
                            <SelectContent>
                                {stages?.map((item: any) => (
                                    <SelectItem key={item.id} value={item.id.toString()}>
                                        {item.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.stage_id} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="sources">{t('Sources')}</Label>
                        <MultiSelectEnhanced
                            options={Object.entries(sources).map(([id, name]) => ({
                                value: id,
                                label: name as string
                            }))}
                            value={Array.isArray(data.sources) ? data.sources : []}
                            onValueChange={(values) => setData('sources', values)}
                            placeholder={t('Select Sources')}
                            searchable={true}
                        />
                        <InputError message={errors.sources} />
                    </div>

                    <div>
                        <Label htmlFor="products">{t('Products')}</Label>
                        <MultiSelectEnhanced
                            options={Object.entries(productOptions).map(([id, name]) => ({
                                value: id,
                                label: name as string
                            }))}
                            value={Array.isArray(data.products) ? data.products : []}
                            onValueChange={(values) => setData('products', values)}
                            placeholder={t('Select Products')}
                            searchable={true}
                        />
                        <InputError message={errors.products} />
                    </div>
                </div>

                <div className="border-t pt-4 mt-6">
                    <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        📋 {t('Notes Log & History')}
                    </h3>
                    
                    {/* Add Note Form */}
                    <div className="space-y-2 mb-4 bg-slate-50 p-3 rounded-lg border">
                        <Label className="text-xs font-medium text-slate-600">{t('Add new note log')}</Label>
                        <Textarea
                            placeholder={t('Type a note here...')}
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            rows={3}
                            className="bg-white"
                        />
                        <div className="flex justify-end">
                            <Button 
                                type="button" 
                                size="sm" 
                                onClick={handleAddNote} 
                                disabled={isSavingNote || !newNote.trim()}
                            >
                                {isSavingNote ? t('Saving...') : t('Add Note')}
                            </Button>
                        </div>
                    </div>

                    {/* Notes List */}
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                        {notesList && notesList.length > 0 ? (
                            notesList.map((note: any) => (
                                <div key={note.id} className="bg-slate-50 p-3 rounded-lg border relative group">
                                    <div className="flex justify-between items-start mb-1.5">
                                        <span className="text-xs font-semibold text-slate-700 bg-slate-200 px-2 py-0.5 rounded-full">
                                            {note.creator?.name || t('System')}
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-mono">
                                            {new Date(note.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                                        {note.note}
                                    </p>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteNote(note.id)}
                                        className="absolute right-2 bottom-2 h-6 w-6 p-0 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-slate-400 text-center py-4 italic">
                                {t('No notes logged yet.')}
                            </p>
                        )}
                    </div>
                </div>

                {customFields.length > 0 && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {customFields.map((field) => (
                                <div key={field.id}>
                                    {field.component}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onSuccess}>
                        {t('Cancel')}
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {processing ? t('Updating...') : t('Update')}
                    </Button>
                </div>
            </form>
        </DialogContent>
    );
}
